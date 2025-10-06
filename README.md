# Video Player Desktop App

A desktop video player application built with Electron, React, and TypeScript for course management and progress tracking.

## Features

- **Folder Selection**: Select course folders and automatically scan for video files
- **Course Management**: Create, view, and delete courses with video collections
- **Progress Tracking**: Track video watching progress with automatic saving
- **Video Player**: Built-in video player with progress persistence
- **Database Storage**: SQLite database for storing courses, videos, and progress data

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Desktop Framework**: Electron Forge with Vite
- **Database**: SQLite3 with better-sqlite3
- **Video Player**: HTML5 Video with custom controls
- **UI**: Tailwind CSS
- **File Operations**: Node.js fs/promises

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Building for Production

```bash
npm run make
```

## Releases

This project uses GitHub Actions to automatically build and publish executables for multiple platforms when you create a git tag.

### Creating a Release

1. **Tag your release**: Create and push a version tag (must start with 'v'):

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Automatic Build**: GitHub Actions will automatically:
   - Build executables for macOS (Intel & Apple Silicon), Windows, and Linux
   - Create a GitHub release with all platform binaries
   - Upload artifacts with proper naming conventions

### Supported Platforms

The automated release process builds for:

- **macOS**:
  - Intel (x64): `video-player-darwin-x64.zip`
  - Apple Silicon (arm64): `video-player-darwin-arm64.zip`
- **Windows**:
  - 64-bit: `video-player-win32-x64.exe`
- **Linux**:
  - Debian/Ubuntu: `video-player-linux-x64.deb`
  - Red Hat/Fedora: `video-player-linux-x64.rpm`

### Manual Building

To build for a specific platform locally:

```bash
# macOS (current platform)
npm run make

# Cross-platform builds (requires appropriate setup)
npm run make -- --platform=win32 --arch=x64
npm run make -- --platform=linux --arch=x64
```

## Usage

1. **Add a Course**: Click "Select Folder" to choose a folder containing video files
2. **Enter Course Name**: Provide a name for your course
3. **Create Course**: Click "Create Course" to scan the folder and add all video files
4. **View Courses**: Browse your courses with progress tracking
5. **Watch Videos**: Click on a course to view videos and track your progress

## Supported Video Formats

- MP4 (.mp4)
- AVI (.avi)
- MKV (.mkv)
- WebM (.webm)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)
- M4V (.m4v)

## Database Schema

The application uses SQLite with the following tables:

- `courses`: Course information and folder paths
- `videos`: Video file details and metadata
- `video_progress`: Progress tracking for each video

## Development

The project follows a clean architecture with:

- `src/main/`: Electron main process
- `src/renderer/`: React frontend
- `src/database/`: Database schema and operations
- `src/components/`: React UI components

## License

MIT
