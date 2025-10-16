// Screenshot generation script
// Run: npm install puppeteer
// Then: node generate-screenshots.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotDir = './packages/frontend/public/screenshots';
const baseUrl = 'http://localhost:3004';

const pages = [
  { name: 'home', url: '/', description: 'Main dashboard with staking and swap' },
  { name: 'docs', url: '/docs', description: 'Documentation page' },
  { name: 'whitepaper', url: '/whitepaper', description: 'Whitepaper page' },
  { name: 'staking', url: '/staking', description: 'Staking interface' },
  { name: 'supply', url: '/supply', description: 'Token supply dashboard' },
];

async function generateScreenshots() {
  // Create screenshots directory
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();

  console.log('🔥 Generating screenshots...');

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing: ${pageInfo.name}`);
      
      await page.goto(`${baseUrl}${pageInfo.url}`, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      // Wait a bit for any animations
      await page.waitForTimeout(2000);

      // Full page screenshot
      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-full.png`),
        fullPage: true
      });

      // Viewport screenshot (for cards/previews)
      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-preview.png`),
        fullPage: false
      });

      console.log(`✅ ${pageInfo.name} screenshots saved`);
    } catch (error) {
      console.error(`❌ Failed to capture ${pageInfo.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('🎉 Screenshot generation complete!');
  console.log(`📁 Screenshots saved to: ${screenshotDir}`);
}

if (require.main === module) {
  generateScreenshots().catch(console.error);
}

module.exports = { generateScreenshots };