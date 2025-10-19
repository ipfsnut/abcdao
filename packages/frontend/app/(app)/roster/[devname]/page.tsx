import DeveloperProfileClient from './client';

export async function generateStaticParams(): Promise<{ devname: string }[]> {
  // For static export with dynamic routes, we need to return a list of valid params
  // Since this is a user profile page, we'll provide a few common test cases
  // and rely on client-side routing for other users
  return [
    { devname: 'test' },
    { devname: 'admin' },
    { devname: 'demo' },
    { devname: 'epicdylan' }
  ];
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ devname: string }> }) {
  const { devname } = await params;
  return <DeveloperProfileClient devname={devname} />;
}