import './globals.css';
import Script from 'next/script';
import AppFrame from '../components/AppFrame';

export const metadata = {
  title: 'Youtogram',
  description: 'Video-first social media platform',
  icons: {
    icon: '/youtogram-logo.jpg'
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
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
