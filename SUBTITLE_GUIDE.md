# Whisper Subtitle Generation Guide

## Overview

This video player now includes **offline automatic subtitle generation** using OpenAI's Whisper model via whisper.cpp. Generate accurate subtitles for any video in your library without an internet connection!

## Features

- 🎯 **Offline Processing** - No internet required once set up
- 🚀 **Multiple Model Options** - Choose from tiny to large models based on accuracy needs
- 📝 **VTT/SRT Format** - Industry-standard subtitle formats
- 💾 **Persistent Storage** - Subtitles saved and automatically loaded
- 🎬 **Seamless Integration** - Native subtitle tracks in video player

## Prerequisites

### 1. Install whisper.cpp

You need to install whisper.cpp on your system. Choose your platform:

#### macOS (via Homebrew)

```bash
brew install whisper-cpp
```

#### macOS/Linux (from source)

```bash
# Clone the repository
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

# Build
make

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$PATH:/path/to/whisper.cpp"
```

#### Verify Installation

```bash
whisper --version
```

If this command works, you're ready to go!

### 2. FFmpeg (Already Required)

FFmpeg is already required for video metadata extraction in this app. If you haven't installed it:

```bash
# macOS
brew install ffmpeg

# Linux (Debian/Ubuntu)
sudo apt-get install ffmpeg

# Linux (Fedora)
sudo dnf install ffmpeg
```

## How to Use

### Generating Subtitles

1. **Open a video** in the video player
2. **Click "Generate Subtitles"** button in the header (📝 icon)
3. **Choose a model**:
   - **Tiny** (75 MB) - Fastest, lowest accuracy - Good for quick testing
   - **Base** (142 MB) - Fast, good accuracy - **Recommended for most uses**
   - **Small** (466 MB) - Better accuracy, slower
   - **Medium** (1.5 GB) - High accuracy, quite slow
   - **Large** (2.9 GB) - Best accuracy, very slow

4. **Click "Generate"** and wait for the process to complete

### Generation Process

The subtitle generation happens in 3 stages:

1. **Extracting Audio** (30% of progress)
   - Extracts audio from video to WAV format
   - Optimized for Whisper (16kHz, mono)

2. **Transcribing** (60% of progress)
   - Runs Whisper model on the audio
   - This is the longest step
   - First time will download the model (~75MB-2.9GB depending on model)

3. **Finalizing** (10% of progress)
   - Saves subtitles in VTT format
   - Updates database

### Using Subtitles

Once generated, subtitles are automatically:

- ✅ Loaded when you play the video
- ✅ Available in the video player's subtitle menu (CC button)
- ✅ Saved permanently until deleted

### Managing Subtitles

- **View Status**: Look for the blue "📝 Subtitles" badge when subtitles exist
- **Delete**: Click the 🗑️ button next to the subtitle badge
- **Regenerate**: Delete existing subtitles and generate new ones with a different model

## Model Selection Guide

| Model  | Size   | Speed     | Accuracy | Use Case                       |
| ------ | ------ | --------- | -------- | ------------------------------ |
| Tiny   | 75 MB  | Very Fast | Basic    | Quick previews, testing        |
| Base   | 142 MB | Fast      | Good     | Most educational videos        |
| Small  | 466 MB | Moderate  | Better   | Important content, clear audio |
| Medium | 1.5 GB | Slow      | High     | Professional content, lectures |
| Large  | 2.9 GB | Very Slow | Best     | Critical accuracy, poor audio  |

### Recommendations

- **Start with Base** - Best balance of speed and accuracy
- **Use Small/Medium** - For important lectures or courses
- **Use Tiny** - For quick testing or when speed is critical
- **Avoid Large** - Unless you specifically need the highest accuracy (takes 10x longer than base)

## Performance Expectations

Generation times vary based on:

- Video length
- Model size
- CPU performance

Approximate times (per hour of video):

| Model  | M1 Mac     | Intel i7   | Notes                           |
| ------ | ---------- | ---------- | ------------------------------- |
| Tiny   | 2-3 min    | 5-7 min    | Real-time or faster             |
| Base   | 5-7 min    | 10-15 min  | **Recommended**                 |
| Small  | 15-20 min  | 30-40 min  | Good quality/time balance       |
| Medium | 40-60 min  | 90-120 min | High accuracy needed            |
| Large  | 90-120 min | 3-4 hours  | Only for critical transcription |

## Storage Locations

### Subtitles

Stored in: `~/Library/Application Support/nilaa-player/subtitles/`

Format: `{videoId}_{videoFileName}.vtt`

### Models

Downloaded to: `~/Library/Application Support/nilaa-player/whisper-models/`

Models are downloaded once and reused for all videos.

### Temporary Files

Audio extraction uses: `~/Library/Application Support/nilaa-player/temp/`

Cleaned up automatically after generation.

## Troubleshooting

### "Whisper.cpp not installed" Error

**Problem**: The app can't find whisper.cpp

**Solutions**:

1. Install whisper.cpp (see Prerequisites)
2. Make sure it's in your PATH:
   ```bash
   which whisper
   ```
3. Restart the app after installation

### Model Download Fails

**Problem**: Model won't download

**Solutions**:

1. Check your internet connection
2. Manually download model:
   ```bash
   cd ~/Library/Application\ Support/nilaa-player/whisper-models/
   curl -L -o ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
   ```

### Subtitle Generation Fails

**Problem**: Generation starts but fails

**Check**:

1. Video file is not corrupted
2. Video has an audio track
3. Enough disk space (temp audio file + subtitle file)
4. Check console logs (View > Toggle Developer Tools)

### Subtitles Don't Load

**Problem**: Generated but not showing

**Solutions**:

1. Reload the video (select another video, then come back)
2. Check subtitle file exists:
   ```bash
   ls -la ~/Library/Application\ Support/nilaa-player/subtitles/
   ```
3. Enable subtitles in video player (CC button)

### Generation is Too Slow

**Solutions**:

1. Use a smaller model (tiny or base)
2. Close other applications
3. Wait for completion - you can continue watching other videos

## Technical Details

### Audio Processing

- **Format**: 16-bit PCM WAV
- **Sample Rate**: 16 kHz (Whisper's native rate)
- **Channels**: Mono
- **Extraction**: Uses FFmpeg

### Subtitle Format

- **Primary**: WebVTT (.vtt)
- **Fallback**: SubRip (.srt) - auto-converted to VTT
- **Encoding**: UTF-8

### Whisper Models

- **Source**: [Hugging Face - ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp)
- **Format**: GGML binary format
- **Quantization**: Default quantization (no customization yet)

## Frequently Asked Questions

### Q: Can I use this offline?

**A**: Yes! After installing whisper.cpp and downloading a model once, everything works offline.

### Q: Does this send my videos anywhere?

**A**: No. All processing happens locally on your computer. Your videos never leave your machine.

### Q: Can I generate subtitles for all videos at once?

**A**: Not yet. This is a planned feature. Currently, generate them one at a time.

### Q: What languages are supported?

**A**: Currently set to auto-detect. Whisper supports 99 languages. Multi-language support UI coming soon.

### Q: Can I edit the generated subtitles?

**A**: The subtitle files are standard VTT format. You can edit them with any text editor:

```bash
open ~/Library/Application\ Support/nilaa-player/subtitles/
```

### Q: Do subtitles sync with video?

**A**: Yes, Whisper generates accurate timestamps. If sync is off, try regenerating with a larger model.

## Future Enhancements

Planned features:

- [ ] Batch subtitle generation
- [ ] Language selection UI
- [ ] Custom subtitle editing within app
- [ ] Export subtitles
- [ ] Translation to other languages
- [ ] Subtitle search/jump to timestamp
- [ ] GPU acceleration support

## Support

Having issues? Check:

1. This guide's Troubleshooting section
2. Console logs (View > Toggle Developer Tools)
3. [whisper.cpp GitHub Issues](https://github.com/ggerganov/whisper.cpp/issues)

## Credits

- **OpenAI Whisper** - The amazing speech recognition model
- **whisper.cpp** - High-performance C++ implementation by Georgi Gerganov
- **FFmpeg** - Audio extraction

---

**Enjoy automatic subtitles for all your educational content! 🎉**
