#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../media/nextjs_radar_icon_128.svg');
  
  try {
    // Read SVG file
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Remove animations for static PNG (VS Code doesn't support animated icons)
    svgContent = svgContent.replace(/<animate[^>]*>.*?<\/animate>/g, '');
    svgContent = svgContent.replace(/<animateTransform[^>]*\/>/g, '');
    svgContent = svgContent.replace(/dur="[^"]*"/g, '');
    svgContent = svgContent.replace(/repeatCount="[^"]*"/g, '');
    
    const svgBuffer = Buffer.from(svgContent);
    
    // VS Code Extension Icon Requirements:
    // - Minimum 128x128px PNG format
    // - High quality for marketplace display
    
    // Main extension icon (128x128px - exact VS Code requirement)
    const mainIconPath = path.join(__dirname, '../media/nextjs_radar_icon_128.png');
    await sharp(svgBuffer)
      .resize(128, 128, {
        kernel: sharp.kernel.lanczos3,  // High-quality resampling
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent background
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        adaptiveFiltering: true
      })
      .toFile(mainIconPath);
      
    console.log(`✅ VS Code Extension Icon (128x128): ${mainIconPath}`);
    
    // Alternative main icon (for package.json compatibility)
    const altIconPath = path.join(__dirname, '../media/nextjs_radar_icon.png');
    await sharp(svgBuffer)
      .resize(128, 128, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        adaptiveFiltering: true
      })
      .toFile(altIconPath);
      
    console.log(`✅ Alternative Icon (128x128): ${altIconPath}`);
    
    // Get file sizes for verification
    const mainStat = fs.statSync(mainIconPath);
    const altStat = fs.statSync(altIconPath);
    
    console.log(`📏 Main icon size: ${(mainStat.size / 1024).toFixed(1)}KB`);
    console.log(`📏 Alt icon size: ${(altStat.size / 1024).toFixed(1)}KB`);
    console.log(`✅ Icons meet VS Code marketplace requirements (128x128px PNG)`);
    
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error);
    process.exit(1);
  }
}

// Verify VS Code icon requirements
function verifyIconRequirements() {
  console.log('🔍 VS Code Extension Icon Requirements:');
  console.log('   • Format: PNG (SVG not supported)');
  console.log('   • Size: Minimum 128x128px');
  console.log('   • Quality: High quality for marketplace display');
  console.log('   • Background: Transparent or solid');
  console.log('');
}

verifyIconRequirements();
convertSvgToPng();