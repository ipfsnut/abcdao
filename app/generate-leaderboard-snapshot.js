import puppeteer from 'puppeteer';
import { initializeDatabase, getPool } from './src/services/database.js';
import fs from 'fs/promises';
import path from 'path';

async function generateLeaderboardSnapshot() {
  console.log('📸 Generating nightly leaderboard snapshot...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to roster page
    const rosterUrl = 'https://abcdao-production.up.railway.app/roster?sort=commits&limit=10';
    console.log(`📍 Navigating to: ${rosterUrl}`);
    
    await page.goto(rosterUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="developer-list"]', { timeout: 10000 });
    
    // Add some custom styling for the snapshot
    await page.addStyleTag({
      content: `
        body { background: #000 !important; }
        .matrix-glow { text-shadow: 0 0 10px #22c55e !important; }
        
        /* Add leaderboard styling */
        .leaderboard-snapshot {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 20px;
          z-index: 9999;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .leaderboard-title {
          color: #22c55e;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
          text-shadow: 0 0 10px #22c55e;
        }
        
        .leaderboard-date {
          color: #16a34a;
          font-size: 14px;
          text-align: center;
          margin-bottom: 20px;
        }
      `
    });
    
    // Inject leaderboard overlay
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.className = 'leaderboard-snapshot';
      overlay.innerHTML = \`
        <div class="leaderboard-title">🏆 ABC DAO Daily Leaderboard</div>
        <div class="leaderboard-date">\${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
      \`;
      document.body.appendChild(overlay);
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = \`leaderboard-snapshot-\${timestamp}.png\`;
    const filepath = path.join('./snapshots', filename);
    
    // Ensure snapshots directory exists
    await fs.mkdir('./snapshots', { recursive: true });
    
    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    console.log(\`📸 Screenshot saved: \${filepath}\`);
    
    // Optional: Upload to cloud storage or post to social
    return filepath;
    
  } catch (error) {
    console.error('❌ Error generating snapshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Can be run via cron job
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  generateLeaderboardSnapshot()
    .then(filepath => {
      console.log(\`✅ Nightly snapshot complete: \${filepath}\`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Snapshot failed:', error);
      process.exit(1);
    });
}

export { generateLeaderboardSnapshot };