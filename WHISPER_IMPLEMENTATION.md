# Whisper Subtitle Integration - Implementation Summary

## What Was Implemented

A complete offline subtitle generation system using OpenAI Whisper via whisper.cpp, fully integrated into your video player.

## Quick Start

### 1. Install Whisper.cpp

```bash
# Run the setup script
./scripts/setup-whisper.sh

# Or install manually on macOS
brew install whisper-cpp
```

### 2. Start the App

```bash
pnpm start
```

### 3. Generate Subtitles

1. Open any video
2. Click "Generate Subtitles" button (📝)
3. Choose a model (recommend: base)
4. Wait for generation to complete
5. Subtitles automatically load!

## Technical Architecture

### Backend Components

#### 1. Subtitle Service (`src/utils/subtitleService.ts`)

- **Audio Extraction**: Uses FFmpeg to extract 16kHz mono WAV
- **Whisper Integration**: Runs whisper.cpp binary via child_process
- **Model Management**: Downloads and caches Whisper models
- **Format Handling**: Generates VTT/SRT subtitle files
- **Progress Tracking**: Real-time progress updates during generation

#### 2. Database Schema Updates (`src/database/schema.ts`)

Extended `Video` interface:

```typescript
{
  subtitlePath?: string;      // Path to .vtt file
  hasSubtitles?: boolean;      // Quick check flag
  subtitleLanguage?: string;   // Language code
}
```

#### 3. IPC Handlers (`src/main.ts`)

New Electron IPC channels:

- `generate-subtitles` - Start subtitle generation
- `has-subtitles` - Check if video has subtitles
- `get-subtitle-path` - Get path to subtitle file
- `delete-subtitles` - Remove subtitle files
- `get-available-whisper-models` - List available models
- `get-whisper-model-info` - Get model details
- `check-whisper-availability` - Verify whisper.cpp installation
- `download-whisper-model` - Download model files
- `subtitle-generation-progress` - Progress event stream

### Frontend Components

#### 1. Video Player UI Updates (`src/components/ModernVideoPlayer.tsx`)

**New State Management**:

- Subtitle path tracking
- Generation progress monitoring
- Model selection
- Whisper availability checking

**New UI Elements**:

- **Generate Subtitles Button**: Opens model selection modal
- **Subtitle Status Badge**: Shows when subtitles exist
- **Delete Button**: Removes generated subtitles
- **Progress Notification**: Real-time generation progress
- **Model Selection Modal**: Choose between 5 Whisper models

**Video Integration**:

- Automatic subtitle track loading
- Native browser subtitle rendering
- Subtitle persistence across sessions

#### 2. Preload Script (`src/preload.ts`)

Exposed new API methods:

```typescript
interface ElectronAPI {
  generateSubtitles(videoId, options): Promise<Result>;
  hasSubtitles(videoId): Promise<boolean>;
  getSubtitlePath(videoId): Promise<string | null>;
  deleteSubtitles(videoId): Promise<void>;
  getAvailableWhisperModels(): Promise<string[]>;
  getWhisperModelInfo(model): Promise<ModelInfo>;
  checkWhisperAvailability(): Promise<boolean>;
  downloadWhisperModel(model): Promise<Result>;
  onSubtitleGenerationProgress(callback): UnsubscribeFn;
}
```

## File Structure

```
src/
├── utils/
│   └── subtitleService.ts         # Core subtitle generation logic
├── database/
│   ├── schema.ts                  # Extended with subtitle fields
│   └── jsonDatabase.ts            # Subtitle CRUD operations
├── components/
│   └── ModernVideoPlayer.tsx      # UI integration
├── main.ts                        # IPC handlers & service init
└── preload.ts                     # API exposure

scripts/
└── setup-whisper.sh               # Installation helper

docs/
├── SUBTITLE_GUIDE.md              # User documentation
└── WHISPER_IMPLEMENTATION.md      # This file
```

## Data Flow

### Subtitle Generation Flow

```
User clicks "Generate Subtitles"
         ↓
Model Selection Modal
         ↓
IPC: generate-subtitles
         ↓
Main Process: SubtitleService.generateSubtitles()
         ↓
1. Extract audio (FFmpeg)
   → Progress: "Extracting..." 0-30%
         ↓
2. Run Whisper transcription
   → Progress: "Transcribing..." 30-90%
   → (Downloads model on first use)
         ↓
3. Save VTT file
   → Progress: "Finalizing..." 90-100%
         ↓
4. Update database
         ↓
5. Send completion event
         ↓
Renderer: Load subtitle track
         ↓
Video player shows subtitles
```

### Progress Updates

```
Main Process                Renderer Process
     |                           |
     |---subtitle-progress------>|
     |      { status, % }        |
     |                           |
     |                      Update UI
     |                      Progress bar
```

## Storage Locations

### macOS/Linux

```
~/Library/Application Support/nilaa-player/
├── subtitles/                    # Generated subtitle files
│   └── {videoId}_{name}.vtt
├── whisper-models/               # Downloaded Whisper models
│   ├── ggml-tiny.bin
│   ├── ggml-base.bin
│   └── ...
└── temp/                         # Temporary audio files
    └── {videoId}_audio.wav       (auto-cleaned)
```

### Windows

```
%APPDATA%/nilaa-player/
├── subtitles/
├── whisper-models/
└── temp/
```

## Whisper Models

| Model  | Size   | Memory  | Speed | Accuracy |
| ------ | ------ | ------- | ----- | -------- |
| tiny   | 75 MB  | ~390 MB | 32x   | Basic    |
| base   | 142 MB | ~500 MB | 16x   | Good     |
| small  | 466 MB | ~1.0 GB | 6x    | Better   |
| medium | 1.5 GB | ~2.6 GB | 2x    | High     |
| large  | 2.9 GB | ~4.7 GB | 1x    | Best     |

Speed is relative to real-time (e.g., 32x = 32 times faster than video length)

## Dependencies Added

```json
{
  "dependencies": {
    "whisper-node": "^1.1.1", // Whisper bindings (not used directly)
    "fluent-ffmpeg": "^2.1.3", // Audio extraction
    "@types/fluent-ffmpeg": "^2.1.27"
  }
}
```

**Note**: We use whisper.cpp binary directly rather than Node bindings for better performance and control.

## Features Implemented

### Core Features

- ✅ Offline subtitle generation
- ✅ Multiple Whisper model support (tiny, base, small, medium, large)
- ✅ Real-time progress tracking
- ✅ Automatic audio extraction
- ✅ VTT/SRT format support
- ✅ Persistent subtitle storage
- ✅ Database integration
- ✅ Automatic subtitle loading
- ✅ Subtitle deletion
- ✅ Model download management

### UI Features

- ✅ Generate subtitles button
- ✅ Model selection modal
- ✅ Progress notification
- ✅ Subtitle status indicator
- ✅ Delete subtitle option
- ✅ Whisper availability check
- ✅ Native video subtitle display

### Advanced Features

- ✅ Progress streaming from main to renderer
- ✅ Temporary file cleanup
- ✅ Error handling and user feedback
- ✅ Model caching
- ✅ Subtitle path resolution
- ✅ Cross-platform support

## Future Enhancements

### Planned

- [ ] Batch subtitle generation (all videos in a course)
- [ ] Language selection UI (currently auto-detect)
- [ ] In-app subtitle editor
- [ ] Subtitle export functionality
- [ ] Translation to other languages
- [ ] Subtitle search (jump to keyword in video)
- [ ] GPU acceleration (CUDA/Metal)
- [ ] Background generation queue
- [ ] Subtitle quality rating
- [ ] Speaker diarization (identify different speakers)

### Possible

- [ ] Custom vocabulary/spelling correction
- [ ] Subtitle styling options
- [ ] Automatic punctuation enhancement
- [ ] Integration with subtitle timing tools
- [ ] Cloud backup of subtitles
- [ ] Subtitle sharing between users

## Performance Optimization

### Current Optimizations

1. **Audio Extraction**: 16kHz mono WAV (Whisper's native format)
2. **Throttled Saves**: Database updates throttled to reduce I/O
3. **Async Processing**: Non-blocking subtitle generation
4. **Stream Processing**: Progress updates via IPC events
5. **Model Caching**: Models downloaded once, reused forever
6. **Temp File Cleanup**: Automatic cleanup after generation

### Potential Optimizations

- Parallel generation for multiple videos
- WebAssembly Whisper (no binary dependency)
- Incremental generation (stream subtitles as they're generated)
- GPU acceleration (Metal on macOS, CUDA on Windows/Linux)
- Compression of audio extraction
- Model quantization options

## Error Handling

### Handled Errors

- Whisper.cpp not installed
- Model download failures
- Audio extraction failures
- Insufficient disk space
- Corrupted video files
- No audio track in video
- Whisper transcription errors
- File permission errors

### User Feedback

- Clear error messages
- Installation instructions
- Troubleshooting guide
- Progress indication
- Success confirmations

## Testing Checklist

### Manual Testing

- [ ] Install whisper.cpp and verify detection
- [ ] Generate subtitles with different models
- [ ] Verify subtitle display in player
- [ ] Test progress updates during generation
- [ ] Delete subtitles and regenerate
- [ ] Test with videos of different lengths
- [ ] Test with videos in different formats
- [ ] Test error handling (no whisper.cpp)
- [ ] Test model download
- [ ] Test with no internet (after model download)

### Edge Cases

- [ ] Very short videos (<10 seconds)
- [ ] Very long videos (>2 hours)
- [ ] Videos without audio
- [ ] Videos with multiple audio tracks
- [ ] Foreign language videos
- [ ] Videos with background music
- [ ] Low-quality audio
- [ ] Special characters in video name
- [ ] Incomplete downloads
- [ ] Cancelled generations

## Security Considerations

### Current Security

- ✅ No network calls during generation (after model download)
- ✅ Local processing only
- ✅ Sandboxed file access
- ✅ Input validation on IPC calls
- ✅ Safe file path handling
- ✅ No eval() or code execution

### Additional Considerations

- Model download from trusted source (Hugging Face)
- Subprocess execution limited to whisper binary
- File permissions properly managed
- No sensitive data in subtitle files
- Temporary files securely deleted

## Known Limitations

1. **Requires whisper.cpp**: Users must install separately
2. **No GPU acceleration**: CPU-only currently
3. **Single video at a time**: No batch processing yet
4. **Auto language detection**: Can't manually specify language yet
5. **English-centric**: Best results with English, though supports 99 languages
6. **File size**: Large models require significant disk space
7. **Memory usage**: Large models need 4-5GB RAM
8. **No editing**: Can't edit subtitles in-app (must use external editor)

## Troubleshooting Tips

### Common Issues

**Subtitles not showing**:

- Check browser console for errors
- Verify subtitle file exists in storage directory
- Ensure video player has CC enabled
- Try reloading the video

**Generation fails**:

- Check whisper.cpp installation: `whisper --version`
- Verify FFmpeg is installed: `ffmpeg -version`
- Check disk space
- Review console logs
- Try smaller model

**Slow generation**:

- Use smaller model (tiny or base)
- Close other applications
- Upgrade hardware
- Consider GPU acceleration (future)

## Documentation

- **User Guide**: `SUBTITLE_GUIDE.md` - Complete user documentation
- **Setup Script**: `scripts/setup-whisper.sh` - Automated installation
- **This Document**: `WHISPER_IMPLEMENTATION.md` - Technical details

## Credits & Resources

- **OpenAI Whisper**: https://github.com/openai/whisper
- **whisper.cpp**: https://github.com/ggerganov/whisper.cpp
- **Whisper Model Hub**: https://huggingface.co/ggerganov/whisper.cpp
- **FFmpeg**: https://ffmpeg.org/
- **WebVTT Spec**: https://www.w3.org/TR/webvtt1/

## License

This implementation follows the project's license. Whisper.cpp is MIT licensed.

---

**Implementation Complete! 🎉**

Your video player now has offline, automatic subtitle generation powered by OpenAI Whisper!
