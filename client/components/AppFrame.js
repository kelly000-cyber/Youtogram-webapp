'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function AppFrame({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/';
  const isFeedPage = pathname === '/feed';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const applyTheme = (mode) => {
      const isLight = mode === 'light';
      document.body.classList.toggle('light-theme', isLight);
      document.documentElement.classList.toggle('light-theme', isLight);
      document.body.classList.toggle('facebook-home', isFeedPage);
      document.documentElement.classList.toggle('facebook-home', isFeedPage);
    };

    applyTheme(window.localStorage.getItem('youtogram_theme') || 'dark');

    const handleThemeChange = (event) => {
      applyTheme(event.detail?.theme || window.localStorage.getItem('youtogram_theme') || 'dark');
    };

    window.addEventListener('youtogram:themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('youtogram:themeChange', handleThemeChange);
    };
  }, [isFeedPage]);

  return (
    <>
      {!isAuthPage ? <Navbar /> : null}
      <div className={isAuthPage ? 'authShell' : isFeedPage ? 'facebookShell' : 'appShell'}>{children}</div>
      {!isAuthPage && !isFeedPage ? <footer className="appFooter">Youtogram</footer> : null}
    </>
  );
}
