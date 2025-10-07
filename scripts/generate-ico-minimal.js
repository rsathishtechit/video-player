const pngToIco = require("png-to-ico").default || require("png-to-ico");
const fs = require("fs").promises;
const path = require("path");

async function generateMinimalIco() {
  console.log("🪟 Generating minimal Windows ICO file...");

  try {
    const iconsDir = path.join(__dirname, "../assets/icons/windows");
    const outputPath = path.join(__dirname, "../assets/icons/icon.ico");

    // Use only the most essential Windows ICO sizes
    const sizes = [16, 32, 48]; // Minimal set for maximum compatibility
    const pngBuffers = [];

    for (const size of sizes) {
      const pngPath = path.join(iconsDir, `icon_${size}.png`);
      try {
        const buffer = await fs.readFile(pngPath);
        pngBuffers.push(buffer);
        console.log(`  ✅ Added ${size}x${size} to minimal ICO`);
      } catch (error) {
        console.warn(`  ⚠️  Could not find ${size}x${size} icon, skipping`);
      }
    }

    if (pngBuffers.length === 0) {
      throw new Error("No valid icon files found for ICO generation");
    }

    // Generate minimal ICO file
    const icoBuffer = await pngToIco(pngBuffers);
    await fs.writeFile(outputPath, icoBuffer);

    console.log(`✅ Generated minimal icon.ico successfully with ${pngBuffers.length} sizes!`);
  } catch (error) {
    console.error("❌ Error generating minimal ICO file:", error);
    process.exit(1);
  }
}

generateMinimalIco();
