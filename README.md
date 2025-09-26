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
