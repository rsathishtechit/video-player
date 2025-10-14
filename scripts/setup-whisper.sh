#!/bin/bash

# Whisper.cpp Installation Script for Nilaa Player
# Supports macOS and Linux

set -e

echo "🎙️  Whisper.cpp Installation for Nilaa Player"
echo "=============================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"
echo ""

# Check if whisper is already installed
if command -v whisper &> /dev/null; then
    echo "✅ whisper.cpp is already installed!"
    whisper --version
    echo ""
    echo "You're ready to generate subtitles!"
    exit 0
fi

echo "whisper.cpp not found. Installing..."
echo ""

# macOS Installation
if [ "$MACHINE" = "Mac" ]; then
    echo "🍺 Checking for Homebrew..."
    
    if command -v brew &> /dev/null; then
        echo "✅ Homebrew found"
        echo ""
        echo "Installing whisper.cpp via Homebrew..."
        brew install whisper-cpp
        
        echo ""
        echo "✅ Installation complete!"
        echo ""
        echo "Testing installation..."
        whisper --version
        
        echo ""
        echo "🎉 Success! You can now generate subtitles in Nilaa Player."
        exit 0
    else
        echo "❌ Homebrew not found."
        echo ""
        echo "Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo ""
        echo "Or install whisper.cpp manually from:"
        echo "  https://github.com/ggerganov/whisper.cpp"
        exit 1
    fi
fi

# Linux Installation
if [ "$MACHINE" = "Linux" ]; then
    echo "🐧 Linux detected"
    echo ""
    echo "Installing dependencies..."
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        echo "Using apt-get..."
        sudo apt-get update
        sudo apt-get install -y build-essential git
    elif command -v dnf &> /dev/null; then
        echo "Using dnf..."
        sudo dnf install -y gcc-c++ git make
    elif command -v yum &> /dev/null; then
        echo "Using yum..."
        sudo yum install -y gcc-c++ git make
    elif command -v pacman &> /dev/null; then
        echo "Using pacman..."
        sudo pacman -Sy --noconfirm base-devel git
    else
        echo "❌ Unsupported package manager"
        echo "Please install build-essential/gcc-c++ and git manually"
        exit 1
    fi
    
    echo ""
    echo "Cloning whisper.cpp..."
    INSTALL_DIR="$HOME/.local/whisper.cpp"
    
    if [ -d "$INSTALL_DIR" ]; then
        echo "Removing old installation..."
        rm -rf "$INSTALL_DIR"
    fi
    
    git clone https://github.com/ggerganov/whisper.cpp.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    echo ""
    echo "Building whisper.cpp..."
    make
    
    echo ""
    echo "Adding to PATH..."
    
    # Add to .bashrc or .zshrc
    SHELL_RC=""
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_RC="$HOME/.bashrc"
    fi
    
    if [ -n "$SHELL_RC" ]; then
        if ! grep -q "whisper.cpp" "$SHELL_RC"; then
            echo "" >> "$SHELL_RC"
            echo "# Whisper.cpp" >> "$SHELL_RC"
            echo "export PATH=\"\$PATH:$INSTALL_DIR\"" >> "$SHELL_RC"
            echo "Added to $SHELL_RC"
        fi
    fi
    
    # Also add to current session
    export PATH="$PATH:$INSTALL_DIR"
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "Testing installation..."
    "$INSTALL_DIR/whisper" --version || echo "Whisper installed at: $INSTALL_DIR/whisper"
    
    echo ""
    echo "🎉 Success!"
    echo ""
    echo "⚠️  IMPORTANT: Restart your terminal or run:"
    echo "  source $SHELL_RC"
    echo ""
    echo "Then restart Nilaa Player to use subtitle generation."
    exit 0
fi

# Unknown OS
echo "❌ Unsupported operating system: ${MACHINE}"
echo ""
echo "Please install whisper.cpp manually from:"
echo "  https://github.com/ggerganov/whisper.cpp"
exit 1

