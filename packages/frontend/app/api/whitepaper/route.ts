import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Path to whitepaper in the root of the project (go up from frontend to project root)
    const whitepaperPath = join(process.cwd(), '../../WHITEPAPER.md');
    const whitepaperContent = readFileSync(whitepaperPath, 'utf-8');
    
    return new NextResponse(whitepaperContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error reading whitepaper:', error);
    
    // Fallback content if file can't be read
    const fallbackContent = `# ABC DAO WHITEPAPER
## Error Loading Content

The whitepaper could not be loaded. Please check the file path or contact support.

**Expected location**: \`WHITEPAPER.md\` in project root.`;
    
    return new NextResponse(fallbackContent, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}