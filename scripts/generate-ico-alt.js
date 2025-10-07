const pngToIco = require("png-to-ico").default || require("png-to-ico");
const fs = require("fs").promises;
const path = require("path");

async function generateIcoAlt() {
  console.log("🪟 Generating Windows ICO file (alternative method)...");

  try {
    const iconsDir = path.join(__dirname, "../assets/icons/windows");
    const outputPath = path.join(__dirname, "../assets/icons/icon.ico");

    // Read PNG files for ICO conversion - use standard Windows sizes
    const sizes = [16, 24, 32, 48, 64, 96, 128]; // Standard Windows ICO sizes
    const pngBuffers = [];

    for (const size of sizes) {
      const pngPath = path.join(iconsDir, `icon_${size}.png`);
      try {
        const buffer = await fs.readFile(pngPath);
        pngBuffers.push(buffer);
        console.log(`  ✅ Added ${size}x${size} to ICO`);
      } catch (error) {
        console.warn(`  ⚠️  Could not find ${size}x${size} icon, skipping`);
      }
    }

    if (pngBuffers.length === 0) {
      throw new Error("No valid icon files found for ICO generation");
    }

    // Generate ICO file using png-to-ico
    const icoBuffer = await pngToIco(pngBuffers);
    await fs.writeFile(outputPath, icoBuffer);

    console.log(
      `✅ Generated icon.ico successfully with ${pngBuffers.length} sizes using png-to-ico!`
    );
  } catch (error) {
    console.error("❌ Error generating ICO file:", error);
    process.exit(1);
  }
}

generateIcoAlt();
