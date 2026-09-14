import './globals.css';
import Script from 'next/script';
import AppFrame from '../components/AppFrame';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.youtogram.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'YOUTOGRAM',
    template: '%s | YOUTOGRAM'
  },
  applicationName: 'YOUTOGRAM',
  description: 'YOUTOGRAM is a video-first social platform for people, culture, and opportunity.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/youtogram.jpg?v=20260910', type: 'image/jpeg', sizes: '1080x1080' }],
    shortcut: [{ url: '/youtogram.jpg?v=20260910', type: 'image/jpeg' }],
    apple: [{ url: '/youtogram.jpg?v=20260910', type: 'image/jpeg', sizes: '1080x1080' }]
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'YOUTOGRAM',
    title: 'YOUTOGRAM',
    description: 'A video-first social platform for people, culture, and opportunity.',
    images: [{ url: '/youtogram.jpg?v=20260910', width: 1080, height: 1080, alt: 'YOUTOGRAM logo' }]
  },
  twitter: {
    card: 'summary',
    title: 'YOUTOGRAM',
    description: 'A video-first social platform for people, culture, and opportunity.',
    images: ['/youtogram.jpg?v=20260910']
  }
};

export const viewport = {
  themeColor: '#17d8ff'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2974467767462928"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script
          id="youtogram-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'YOUTOGRAM',
              alternateName: 'Youtogram',
              url: siteUrl,
              logo: `${siteUrl}/youtogram.jpg?v=20260910`
            })
          }}
        />
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
