/**
 * Root Page - Static redirect to home (compatible with static export)
 */

import Head from 'next/head';

export default function RootPage() {
  return (
    <html>
      <Head>
        <meta httpEquiv="refresh" content="0; URL=/home" />
        <script dangerouslySetInnerHTML={{
          __html: `window.location.replace('/home');`
        }} />
      </Head>
      <body>
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#10B981',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>🚀</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ABC DAO
            </h2>
            <p style={{ color: '#059669' }}>
              Redirecting to dashboard...
            </p>
            <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#047857' }}>
              If you are not redirected automatically, 
              <a href="/home" style={{ color: '#10B981', textDecoration: 'underline' }}>click here</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}