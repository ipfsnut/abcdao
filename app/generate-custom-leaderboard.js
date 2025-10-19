import { createCanvas, loadImage, registerFont } from 'canvas';
import { initializeDatabase, getPool } from './src/services/database.js';
import fs from 'fs/promises';
import path from 'path';

async function generateCustomLeaderboard() {
  console.log('🎨 Generating custom leaderboard image...\n');
  
  await initializeDatabase();
  const pool = getPool();
  
  // Get top 10 developers
  const leaderboard = await pool.query(`
    SELECT 
      u.farcaster_username,
      u.github_username,
      u.total_commits,
      u.total_rewards_earned,
      u.last_commit_at,
      CASE 
        WHEN u.last_commit_at >= NOW() - INTERVAL '7 days' THEN true
        ELSE false
      END as active_this_week
    FROM users u
    WHERE u.github_username IS NOT NULL
    ORDER BY u.total_commits DESC, u.total_rewards_earned DESC
    LIMIT 10
  `);
  
  // Canvas setup
  const width = 800;
  const height = 1000;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Matrix-style border
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  
  // Title
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 32px Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 ABC DAO LEADERBOARD', width / 2, 60);
  
  // Date
  ctx.fillStyle = '#16a34a';
  ctx.font = '16px Monaco, monospace';
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  ctx.fillText(date, width / 2, 90);
  
  // Column headers
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 18px Monaco, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('RANK', 50, 140);
  ctx.fillText('DEVELOPER', 150, 140);
  ctx.fillText('COMMITS', 450, 140);
  ctx.fillText('REWARDS', 570, 140);
  ctx.fillText('STATUS', 700, 140);
  
  // Separator line
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 155);
  ctx.lineTo(width - 40, 155);
  ctx.stroke();
  
  // Leaderboard entries
  const startY = 185;
  const rowHeight = 70;
  
  leaderboard.rows.forEach((dev, index) => {
    const y = startY + (index * rowHeight);
    const rank = index + 1;
    
    // Rank styling based on position
    let rankColor = '#22c55e';
    let rankSymbol = `#${rank}`;
    
    if (rank === 1) { rankColor = '#ffd700'; rankSymbol = '🥇'; }
    else if (rank === 2) { rankColor = '#c0c0c0'; rankSymbol = '🥈'; }
    else if (rank === 3) { rankColor = '#cd7f32'; rankSymbol = '🥉'; }
    
    // Rank
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 24px Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rankSymbol, 75, y);
    
    // Developer name
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px Monaco, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`@${dev.farcaster_username}`, 150, y - 10);
    
    ctx.fillStyle = '#16a34a';
    ctx.font = '14px Monaco, monospace';
    ctx.fillText(`github.com/${dev.github_username}`, 150, y + 10);
    
    // Commits
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 20px Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dev.total_commits.toString(), 485, y);
    
    // Rewards (format as M/K)
    const rewards = parseFloat(dev.total_rewards_earned);
    let rewardText = '0';
    if (rewards >= 1000000) {
      rewardText = `${(rewards / 1000000).toFixed(1)}M`;
    } else if (rewards >= 1000) {
      rewardText = `${(rewards / 1000).toFixed(1)}K`;
    } else {
      rewardText = rewards.toString();
    }
    
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rewardText, 605, y);
    
    // Status
    const statusText = dev.active_this_week ? '🟢 ACTIVE' : '⚪ IDLE';
    const statusColor = dev.active_this_week ? '#22c55e' : '#6b7280';
    
    ctx.fillStyle = statusColor;
    ctx.font = '14px Monaco, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(statusText, 700, y);
    
    // Separator line
    if (index < leaderboard.rows.length - 1) {
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, y + 25);
      ctx.lineTo(width - 40, y + 25);
      ctx.stroke();
    }
  });
  
  // Footer
  ctx.fillStyle = '#16a34a';
  ctx.font = '12px Monaco, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ABC DAO - Ship code. Earn rewards. Build the future.', width / 2, height - 30);
  
  // Save image
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `leaderboard-${timestamp}.png`;
  const filepath = path.join('./snapshots', filename);
  
  await fs.mkdir('./snapshots', { recursive: true });
  
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(filepath, buffer);
  
  console.log(`🎨 Custom leaderboard saved: ${filepath}`);
  console.log(`📊 Featured ${leaderboard.rows.length} developers`);
  
  return { filepath, leaderboard: leaderboard.rows };
}

export { generateCustomLeaderboard };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCustomLeaderboard()
    .then(result => {
      console.log(`✅ Leaderboard generation complete!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}