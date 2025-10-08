import { NeynarAPIClient } from '@neynar/nodejs-sdk';

if (!process.env.NEYNAR_API_KEY) {
  throw new Error('NEYNAR_API_KEY is not set in environment variables');
}

export const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY || ''
});

export async function getUser(fid: number) {
  try {
    const result = await neynarClient.fetchBulkUsers({ fids: [fid] });
    return result.users[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function verifyUser(messageBytes: string) {
  try {
    const result = await neynarClient.validateFrameAction({
      messageBytesInHex: messageBytes,
      castReactionContext: false,
      followContext: false,
      signerContext: false,
    });
    return result;
  } catch (error) {
    console.error('Error verifying user:', error);
    return null;
  }
}