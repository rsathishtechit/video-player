const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const iconSizes = {
  // macOS sizes
  mac: [
    { size: 16, name: "icon_16x16.png" },
    { size: 32, name: "icon_16x16@2x.png" },
    { size: 32, name: "icon_32x32.png" },
    { size: 64, name: "icon_32x32@2x.png" },
    { size: 128, name: "icon_128x128.png" },
    { size: 256, name: "icon_128x128@2x.png" },
    { size: 256, name: "icon_256x256.png" },
    { size: 512, name: "icon_256x256@2x.png" },
    { size: 512, name: "icon_512x512.png" },
    { size: 1024, name: "icon_512x512@2x.png" },
  ],

  // Windows sizes
  windows: [
    { size: 16, name: "icon_16.png" },
    { size: 24, name: "icon_24.png" },
    { size: 32, name: "icon_32.png" },
    { size: 48, name: "icon_48.png" },
    { size: 64, name: "icon_64.png" },
    { size: 96, name: "icon_96.png" },
    { size: 128, name: "icon_128.png" },
    { size: 256, name: "icon_256.png" },
    { size: 512, name: "icon_512.png" },
  ],

  // Linux sizes
  linux: [
    { size: 16, name: "16x16.png" },
    { size: 24, name: "24x24.png" },
    { size: 32, name: "32x32.png" },
    { size: 48, name: "48x48.png" },
    { size: 64, name: "64x64.png" },
    { size: 96, name: "96x96.png" },
    { size: 128, name: "128x128.png" },
    { size: 256, name: "256x256.png" },
    { size: 512, name: "512x512.png" },
  ],

  // Web/Favicon sizes
  web: [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 96, name: "favicon-96x96.png" },
    { size: 192, name: "android-chrome-192x192.png" },
    { size: 512, name: "android-chrome-512x512.png" },
    { size: 180, name: "apple-touch-icon.png" },
  ],
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function generateIcons() {
  const svgPath = path.join(__dirname, "../assets/icons/icon.svg");
  const baseOutputDir = path.join(__dirname, "../assets/icons");

  console.log("🎨 Starting icon generation...");

  try {
    // Read the SVG file
    const svgBuffer = await fs.readFile(svgPath);

    // Generate icons for each platform
    for (const [platform, sizes] of Object.entries(iconSizes)) {
      console.log(`📱 Generating ${platform} icons...`);

      const platformDir = path.join(baseOutputDir, platform);
      await ensureDirectoryExists(platformDir);

      for (const { size, name } of sizes) {
        const outputPath = path.join(platformDir, name);

        await sharp(svgBuffer)
          .resize(size, size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png({
            quality: 100,
            compressionLevel: 9,
          })
          .toFile(outputPath);

        console.log(`  ✅ Generated ${name} (${size}x${size})`);
      }
    }

    // Generate ICO file for Windows
    console.log("🪟 Generating Windows ICO file...");
    const icoSizes = [16, 24, 32, 48, 64, 96, 128, 256];
    const icoBuffers = [];

    for (const size of icoSizes) {
      const buffer = await sharp(svgBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      icoBuffers.push(buffer);
    }

    // For now, we'll create the largest PNG as the main icon
    // ICO creation requires additional libraries, so we'll use PNG for cross-platform compatibility
    await sharp(svgBuffer)
      .resize(256, 256, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(path.join(baseOutputDir, "icon.png"));

    // Generate ICNS file structure for macOS (we'll create the iconset folder)
    console.log("🍎 Generating macOS iconset...");
    const iconsetDir = path.join(baseOutputDir, "icon.iconset");
    await ensureDirectoryExists(iconsetDir);

    for (const { size, name } of iconSizes.mac) {
      const outputPath = path.join(iconsetDir, name);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);
    }

    console.log("✨ Icon generation completed successfully!");
    console.log("\n📁 Generated files:");
    console.log("  • assets/icons/mac/ - macOS PNG icons");
    console.log("  • assets/icons/windows/ - Windows PNG icons");
    console.log("  • assets/icons/linux/ - Linux PNG icons");
    console.log("  • assets/icons/web/ - Web/favicon icons");
    console.log("  • assets/icons/icon.iconset/ - macOS iconset folder");
    console.log("  • assets/icons/icon.png - Main icon file");
    console.log("\n💡 Next steps:");
    console.log(
      '  • Run "iconutil -c icns assets/icons/icon.iconset" to create .icns file (macOS only)'
    );
    console.log("  • Update forge.config.ts to use the new icons");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
