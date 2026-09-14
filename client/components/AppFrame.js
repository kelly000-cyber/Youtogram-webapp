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

    // Lightweight global action feedback: it confirms clicks immediately
    // without blocking navigation or waiting for a network request.
    const actionFeedback = (event) => {
      const target = event.target?.closest?.('button, a, [role=button]');
      if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
      target.classList.remove('actionExecuting');
      void target.offsetWidth;
      target.classList.add('actionExecuting');
      window.setTimeout(() => target.classList.remove('actionExecuting'), 620);
    };
    document.addEventListener('click', actionFeedback, { passive: true });

    return () => {
      window.removeEventListener('youtogram:themeChange', handleThemeChange);
      document.removeEventListener('click', actionFeedback);
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
