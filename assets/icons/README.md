# Nilaa Player App Icons

This directory contains all the custom icons for the Nilaa Player desktop application, designed to work across all platforms and screen sizes.

## 🎨 Icon Design

The icon features a modern video player design with:

- **Main Element**: Play button triangle in a circular frame
- **Theme**: Film strip decorative elements
- **Colors**: Indigo gradient (#4F46E5 to #1E1B4B) with white play button
- **Style**: Modern, professional, and scalable

## 📁 Directory Structure

```
assets/icons/
├── icon.svg                    # Master SVG source file
├── icon.png                    # Main PNG icon (512x512)
├── icon.icns                   # macOS icon bundle
├── icon.ico                    # Windows icon file
├── icon.iconset/               # macOS iconset source folder
│   ├── icon_16x16.png
│   ├── icon_16x16@2x.png
│   ├── icon_32x32.png
│   ├── icon_32x32@2x.png
│   ├── icon_128x128.png
│   ├── icon_128x128@2x.png
│   ├── icon_256x256.png
│   ├── icon_256x256@2x.png
│   ├── icon_512x512.png
│   └── icon_512x512@2x.png
├── mac/                        # macOS PNG icons
├── windows/                    # Windows PNG icons
├── linux/                      # Linux PNG icons
└── web/                        # Web/PWA icons
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── favicon-96x96.png
    ├── android-chrome-192x192.png
    ├── android-chrome-512x512.png
    └── apple-touch-icon.png
```

## 🔧 Generated Sizes

### macOS (.icns)

- 16x16, 32x32 (16@2x), 32x32, 64x64 (32@2x)
- 128x128, 256x256 (128@2x), 256x256, 512x512 (256@2x)
- 512x512, 1024x1024 (512@2x)

### Windows (.ico)

- 16x16, 24x24, 32x32, 48x48, 64x64, 96x96, 128x128, 256x256, 512x512

### Linux (.png)

- 16x16, 24x24, 32x32, 48x48, 64x64, 96x96, 128x128, 256x256, 512x512

### Web/PWA

- Favicon: 16x16, 32x32, 96x96
- Apple Touch Icon: 180x180
- Android Chrome: 192x192, 512x512

## 🚀 Usage

### Regenerating Icons

To regenerate all icons from the master SVG:

```bash
npm run generate-icons
```

This command will:

1. Generate PNG files in all required sizes
2. Create Windows ICO file
3. Create macOS ICNS file
4. Copy web icons to public directory

### Manual Generation

If you need to generate icons manually:

```bash
# Generate all PNG sizes
node scripts/generate-icons.js

# Generate Windows ICO
node scripts/generate-ico.js

# Generate macOS ICNS (macOS only)
iconutil -c icns assets/icons/icon.iconset
```

## 📱 Platform Integration

### Electron Configuration

The icons are configured in `forge.config.ts`:

```typescript
packagerConfig: {
  icon: 'assets/icons/icon', // Auto-selects .icns/.ico/.png
  name: 'Video Player',
  executableName: 'video-player',
}
```

### Web Integration

Web icons are referenced in `index.html`:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

## 🎯 Best Practices

### Editing the Icon

1. **Always edit the master SVG** (`icon.svg`) for any design changes
2. **Maintain scalability** - ensure the design works at 16x16 pixels
3. **Test at multiple sizes** - verify readability at all target sizes
4. **Keep consistent branding** - maintain the video player theme

### Adding New Sizes

1. Update the `iconSizes` object in `scripts/generate-icons.js`
2. Run `npm run generate-icons`
3. Update platform configurations if needed

### Platform-Specific Notes

- **macOS**: Uses .icns format with retina (@2x) variants
- **Windows**: Uses .ico format with multiple embedded sizes
- **Linux**: Uses .png format, typically 256x256 for desktop files
- **Web**: Uses multiple formats for different contexts (favicon, PWA, etc.)

## 🔍 Troubleshooting

### Icon Not Updating

1. Clear the `out/` directory: `rm -rf out`
2. Rebuild the application: `npm run package`
3. For development, restart the app: `npm start`

### macOS Icon Issues

- Ensure iconutil is available (comes with Xcode Command Line Tools)
- Clear icon cache: `sudo find /private/var/folders/ -name com.apple.dock.iconcache -exec rm {} \;`
- Restart Dock: `killall Dock`

### Windows Icon Issues

- Ensure all required sizes are present in the ICO file
- Check that the ICO file is properly formatted
- Clear Windows icon cache if needed

## 📋 Dependencies

- **sharp**: High-performance image processing
- **to-ico**: Windows ICO file generation
- **iconutil**: macOS ICNS generation (macOS only)

Install dependencies:

```bash
npm install --save-dev sharp @types/sharp to-ico
```

## 🎨 Design Guidelines

When modifying the icon design:

1. **Maintain aspect ratio**: Keep the design square (1:1)
2. **Use vector graphics**: SVG ensures crisp rendering at all sizes
3. **Consider contrast**: Ensure visibility on light and dark backgrounds
4. **Test readability**: Verify the icon is recognizable at 16x16 pixels
5. **Follow platform conventions**: Respect each OS's design language

## 📄 License

The icon design is part of the Nilaa Player application and follows the same license terms.
