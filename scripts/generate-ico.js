const toIco = require("to-ico");
const fs = require("fs").promises;
const path = require("path");

async function generateIco() {
  console.log("🪟 Generating Windows ICO file...");

  try {
    const iconsDir = path.join(__dirname, "../assets/icons/windows");
    const outputPath = path.join(__dirname, "../assets/icons/icon.ico");

    // Read PNG files for ICO conversion
    const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
    const buffers = [];

    for (const size of sizes) {
      const pngPath = path.join(iconsDir, `icon_${size}.png`);
      const buffer = await fs.readFile(pngPath);
      buffers.push(buffer);
    }

    // Generate ICO file
    const icoBuffer = await toIco(buffers);
    await fs.writeFile(outputPath, icoBuffer);

    console.log("✅ Generated icon.ico successfully!");
  } catch (error) {
    console.error("❌ Error generating ICO file:", error);
    process.exit(1);
  }
}

generateIco();
