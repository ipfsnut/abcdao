import DeveloperProfileClient from './client';

export async function generateStaticParams(): Promise<{ devname: string }[]> {
  // For static export with dynamic routes, we need to return a list of valid params
  // Include all verified developers from our current roster
  return [
    { devname: 'epicdylan' },
    { devname: 'indefatigable' },
    { devname: 'kompreni' },
    { devname: 'braza1' },
    { devname: 'leovido.eth' },
    { devname: 'ds8' },
    { devname: 'dd8' },
    // Test users for development
    { devname: 'test' },
    { devname: 'admin' },
    { devname: 'demo' }
  ];
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ devname: string }> }) {
  const { devname } = await params;
  return <DeveloperProfileClient devname={devname} />;
}