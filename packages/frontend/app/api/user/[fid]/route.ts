import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/neynar';

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    const user = await getUser(fid);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfp: user.pfp,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}