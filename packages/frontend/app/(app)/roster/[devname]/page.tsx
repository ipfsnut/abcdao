import DeveloperProfileClient from './client';

export async function generateStaticParams() {
  try {
    // Try to fetch users to generate static routes
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app'}/api/users-commits`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      return users.slice(0, 20).map((user: any) => ({
        devname: user.profile?.githubUsername || user.profile?.farcasterUsername || user.id
      })).filter((param: any) => param.devname);
    }
  } catch (error) {
    console.warn('Failed to fetch users for static generation:', error);
  }
  
  // Fallback - return empty array to allow build to continue
  return [];
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ devname: string }> }) {
  const { devname } = await params;
  return <DeveloperProfileClient devname={devname} />;
}