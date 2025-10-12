export async function onRequest(context: any) {
  const { params, env } = context;
  const fid = parseInt(params.fid);
  
  if (!env.NEYNAR_API_KEY) {
    return new Response(JSON.stringify({ error: 'NEYNAR_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': env.NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfp: user.pfp_url,
      followerCount: user.follower_count,
      followingCount: user.following_count,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}