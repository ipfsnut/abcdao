'use client';

import { useState, useEffect } from 'react';

interface BlogPost {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  formattedDate: string;
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a CORS proxy to fetch the RSS feed
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const rssUrl = encodeURIComponent('https://api.paragraph.com/blogs/rss/@epicdylan.eth');
        
        const response = await fetch(`${proxyUrl}${rssUrl}`);
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        
        const data = await response.json();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        
        const items = xmlDoc.querySelectorAll('item');
        const blogPosts: BlogPost[] = Array.from(items).slice(0, 3).map(item => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          
          // Format the date
          const date = new Date(pubDate);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          return {
            title,
            description,
            link,
            pubDate,
            formattedDate
          };
        });
        
        setPosts(blogPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold text-green-400 matrix-glow font-mono">
            {'>'} Loading Blog Posts...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-green-400 matrix-glow mb-4 font-mono">
          {'>'} Latest from Dylan&apos;s Blog
        </h2>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
          <p className="text-red-400 font-mono text-sm">
            ❌ {error}
          </p>
          <a
            href="https://paragraph.com/@epicdylan.eth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 font-mono text-sm underline mt-2 inline-block"
          >
            Read directly on Paragraph →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-400 matrix-glow font-mono">
          {'>'} Latest from Dylan&apos;s Blog
        </h2>
        <a
          href="https://paragraph.com/@epicdylan.eth"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors"
        >
          View All →
        </a>
      </div>
      
      <div className="space-y-4">
        {posts.map((post, index) => (
          <article 
            key={index}
            className="bg-green-950/10 border border-green-900/30 rounded-lg p-4 hover:border-green-700/50 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-green-400 font-mono text-sm mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-green-600 font-mono text-xs mb-3 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <time className="text-green-700 font-mono text-xs">
                    {post.formattedDate}
                  </time>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-950/30 hover:bg-green-900/40 border border-green-900/50 hover:border-green-700/50 
                             text-green-400 hover:text-green-300 px-3 py-1 rounded font-mono text-xs
                             transition-all duration-200 matrix-button"
                  >
                    Read →
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-green-900/30 text-center">
        <p className="text-green-600 font-mono text-xs mb-2">
          Thoughts on Web3, AI, philosophy, and building in public
        </p>
        <a
          href="https://paragraph.com/@epicdylan.eth"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                   text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm
                   transition-all duration-200 matrix-button"
        >
          📝 Follow on Paragraph
        </a>
      </div>
    </div>
  );
}