import type { Metadata } from "next";

const baseUrl = "https://abc.epicdylan.com";

export function generatePageMetadata({
  title,
  description,
  path = "",
  image = "/og-image.png"
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = path ? `${title} | ABC DAO` : title;
  const url = `${baseUrl}${path}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "ABC DAO",
      type: "website",
      images: [
        {
          url: `${baseUrl}${image}`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${baseUrl}${image}`],
      creator: "@epicdylan",
      site: "@abc_dao",
    },
  };
}