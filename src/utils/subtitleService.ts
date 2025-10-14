import path from "node:path";
import fs from "fs/promises";
import { existsSync } from "fs";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export interface SubtitleGenerationProgress {
  videoId: number;
  status: "extracting" | "transcribing" | "completed" | "error";
  progress: number;
  message: string;
  subtitlePath?: string;
  error?: string;
}

export interface WhisperOptions {
  model?: "tiny" | "base" | "small" | "medium" | "large";
  language?: string;
  modelPath?: string;
}

export class SubtitleService {
  private subtitlesDir: string;
  private tempDir: string;
  private whisperModelPath: string;
  private whisperExecutable: string;

  constructor(userDataPath: string) {
    this.subtitlesDir = path.join(userDataPath, "subtitles");
    this.tempDir = path.join(userDataPath, "temp");
    this.whisperModelPath = path.join(userDataPath, "whisper-models");

    // whisper.cpp binary path - will be downloaded by whisper-node
    this.whisperExecutable = "whisper"; // Will use system whisper or whisper from whisper-node
  }

  async initialize(): Promise<void> {
    // Create necessary directories
    await fs.mkdir(this.subtitlesDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.whisperModelPath, { recursive: true });
  }

  /**
   * Extract audio from video file
   */
  private async extractAudio(
    videoPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(outputPath)
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .format("wav")
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 100));
          }
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  }

  /**
   * Check if whisper.cpp is available
   */
  async checkWhisperAvailability(): Promise<boolean> {
    try {
      await execAsync("whisper --version");
      return true;
    } catch (error) {
      console.warn("Whisper.cpp not found in system PATH");
      return false;
    }
  }

  /**
   * Download whisper model if not exists
   */
  async downloadModel(modelName: string = "base"): Promise<string> {
    const modelFile = `ggml-${modelName}.bin`;
    const modelPath = path.join(this.whisperModelPath, modelFile);

    if (existsSync(modelPath)) {
      console.log(`Model ${modelName} already exists at ${modelPath}`);
      return modelPath;
    }

    console.log(`Downloading whisper model: ${modelName}`);

    // Download from Hugging Face
    const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${modelFile}`;

    try {
      // Use curl or wget to download the model
      const downloadCommand = `curl -L -o "${modelPath}" "${modelUrl}"`;
      await execAsync(downloadCommand);
      console.log(`Model downloaded successfully: ${modelPath}`);
      return modelPath;
    } catch (error) {
      console.error("Error downloading model:", error);
      throw new Error(`Failed to download whisper model: ${modelName}`);
    }
  }

  /**
   * Run whisper.cpp to generate subtitles
   */
  private async runWhisper(
    audioPath: string,
    outputPath: string,
    options: WhisperOptions = {}
  ): Promise<string> {
    const modelName = options.model || "base";
    const language = options.language || "auto";

    // Ensure model is downloaded
    const modelPath =
      options.modelPath || (await this.downloadModel(modelName));

    const outputDir = path.dirname(outputPath);
    const outputName = path.basename(outputPath, path.extname(outputPath));

    // Check if we have whisper.cpp installed
    const hasWhisper = await this.checkWhisperAvailability();

    if (!hasWhisper) {
      throw new Error(
        "Whisper.cpp is not installed. Please install whisper.cpp from https://github.com/ggerganov/whisper.cpp"
      );
    }

    // Run whisper.cpp
    // Output formats: txt, json, srt, vtt
    const languageParam = language !== "auto" ? `-l ${language}` : "";
    const command = `whisper -m "${modelPath}" -f "${audioPath}" -of "${outputName}" -od "${outputDir}" -osrt -ovtt ${languageParam}`;

    console.log(`Running whisper command: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      console.log("Whisper stdout:", stdout);
      if (stderr) {
        console.log("Whisper stderr:", stderr);
      }

      // Whisper.cpp generates .srt and .vtt files automatically
      const vttPath = `${outputPath}.vtt`;
      const srtPath = `${outputPath}.srt`;

      // Prefer VTT format for web video players
      if (existsSync(vttPath)) {
        return vttPath;
      } else if (existsSync(srtPath)) {
        // Convert SRT to VTT if needed
        return this.convertSrtToVtt(srtPath, vttPath);
      } else {
        throw new Error("Whisper did not generate subtitle files");
      }
    } catch (error) {
      console.error("Error running whisper:", error);
      throw error;
    }
  }

  /**
   * Convert SRT to VTT format
   */
  private async convertSrtToVtt(
    srtPath: string,
    vttPath: string
  ): Promise<string> {
    const srtContent = await fs.readFile(srtPath, "utf-8");
    const vttContent = "WEBVTT\n\n" + srtContent.replace(/,/g, ".");
    await fs.writeFile(vttPath, vttContent);
    return vttPath;
  }

  /**
   * Generate subtitles for a video
   */
  async generateSubtitles(
    videoId: number,
    videoPath: string,
    options: WhisperOptions = {},
    onProgress?: (progress: SubtitleGenerationProgress) => void
  ): Promise<string> {
    const videoFileName = path.basename(videoPath, path.extname(videoPath));
    const audioPath = path.join(this.tempDir, `${videoId}_audio.wav`);
    const subtitlePath = path.join(
      this.subtitlesDir,
      `${videoId}_${videoFileName}`
    );

    try {
      // Step 1: Extract audio
      if (onProgress) {
        onProgress({
          videoId,
          status: "extracting",
          progress: 0,
          message: "Extracting audio from video...",
        });
      }

      await this.extractAudio(videoPath, audioPath, (extractProgress) => {
        if (onProgress) {
          onProgress({
            videoId,
            status: "extracting",
            progress: extractProgress * 0.3, // Audio extraction is 30% of total
            message: `Extracting audio... ${extractProgress.toFixed(0)}%`,
          });
        }
      });

      // Step 2: Transcribe with whisper
      if (onProgress) {
        onProgress({
          videoId,
          status: "transcribing",
          progress: 30,
          message: "Transcribing audio with Whisper...",
        });
      }

      const finalSubtitlePath = await this.runWhisper(
        audioPath,
        subtitlePath,
        options
      );

      // Step 3: Complete
      if (onProgress) {
        onProgress({
          videoId,
          status: "completed",
          progress: 100,
          message: "Subtitles generated successfully!",
          subtitlePath: finalSubtitlePath,
        });
      }

      // Clean up temp audio file
      try {
        await fs.unlink(audioPath);
      } catch (err) {
        console.warn("Failed to delete temp audio file:", err);
      }

      return finalSubtitlePath;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (onProgress) {
        onProgress({
          videoId,
          status: "error",
          progress: 0,
          message: "Failed to generate subtitles",
          error: errorMessage,
        });
      }

      // Clean up on error
      try {
        if (existsSync(audioPath)) {
          await fs.unlink(audioPath);
        }
      } catch (err) {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Check if subtitles exist for a video
   */
  async hasSubtitles(videoId: number): Promise<boolean> {
    const files = await fs.readdir(this.subtitlesDir);
    return files.some((file) => file.startsWith(`${videoId}_`));
  }

  /**
   * Get subtitle path for a video
   */
  async getSubtitlePath(videoId: number): Promise<string | null> {
    const files = await fs.readdir(this.subtitlesDir);
    const subtitleFile = files.find(
      (file) =>
        file.startsWith(`${videoId}_`) &&
        (file.endsWith(".vtt") || file.endsWith(".srt"))
    );

    if (subtitleFile) {
      return path.join(this.subtitlesDir, subtitleFile);
    }

    return null;
  }

  /**
   * Delete subtitles for a video
   */
  async deleteSubtitles(videoId: number): Promise<void> {
    const files = await fs.readdir(this.subtitlesDir);
    const subtitleFiles = files.filter((file) =>
      file.startsWith(`${videoId}_`)
    );

    for (const file of subtitleFiles) {
      await fs.unlink(path.join(this.subtitlesDir, file));
    }
  }

  /**
   * Get available whisper models
   */
  getAvailableModels(): string[] {
    return ["tiny", "base", "small", "medium", "large"];
  }

  /**
   * Get model info
   */
  getModelInfo(modelName: string): {
    name: string;
    size: string;
    description: string;
  } {
    const models: Record<
      string,
      { name: string; size: string; description: string }
    > = {
      tiny: {
        name: "tiny",
        size: "75 MB",
        description: "Fastest, lowest accuracy",
      },
      base: {
        name: "base",
        size: "142 MB",
        description: "Fast, good for most use cases",
      },
      small: {
        name: "small",
        size: "466 MB",
        description: "Better accuracy, slower",
      },
      medium: {
        name: "medium",
        size: "1.5 GB",
        description: "High accuracy, slow",
      },
      large: {
        name: "large",
        size: "2.9 GB",
        description: "Best accuracy, very slow",
      },
    };

    return models[modelName] || models.base;
  }
}
