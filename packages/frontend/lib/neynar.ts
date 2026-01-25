import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Only initialize client if API key is available (skip during build)
export const neynarClient = process.env.NEYNAR_API_KEY 
  ? new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY
    })
  : null;

export async function getUser(fid: number) {
  if (!neynarClient) {
    throw new Error('NEYNAR_API_KEY is not set in environment variables');
  }
  
  try {
    const result = await neynarClient.fetchBulkUsers({ fids: [fid] });
    return result.users[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function verifyUser(messageBytes: string) {
  if (!neynarClient) {
    throw new Error('NEYNAR_API_KEY is not set in environment variables');
  }

  try {
    // @ts-expect-error - SDK method may vary between versions
    const result = await neynarClient.validateFrameAction?.({
      messageBytesInHex: messageBytes,
      castReactionContext: false,
      followContext: false,
      signerContext: false,
    });
    return result || null;
  } catch (error) {
    console.error('Error verifying user:', error);
    return null;
  }
}