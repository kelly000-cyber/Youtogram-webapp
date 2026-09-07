'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '../services/auth';

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="navSvgIcon">
      {children}
    </svg>
  );
}

const navItems = [
  {
    label: 'Home',
    href: '/feed',
    icon: (
      <Icon>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </Icon>
    )
  },
  {
    label: 'Videos',
    href: '/videos',
    icon: (
      <Icon>
        <rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m10 9 5 3-5 3z" fill="currentColor" />
      </Icon>
    )
  },
  {
    label: 'Groups',
    href: '/groups',
    icon: (
      <Icon>
        <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.5" cy="10.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 19c.8-2.5 2.9-4 5.5-4s4.7 1.5 5.5 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </Icon>
    )
  },
  {
    label: 'Live',
    href: '/live',
    icon: (
      <Icon>
        <path d="M12 4.5c4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8-7.8-3.5-7.8-7.8 3.5-7.8 7.8-7.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 8.5 15 12l-4.5 3.5V8.5Z" fill="currentColor" />
      </Icon>
    )
  },
  {
    label: 'Games',
    href: '/games',
    icon: (
      <Icon>
        <path d="M7 8h10a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4l-2 2-2-2H7a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 12h3M9.5 10.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="11" r="1" fill="currentColor" />
        <circle cx="18" cy="13" r="1" fill="currentColor" />
      </Icon>
    )
  }
];

const actionItems = [
  {
    label: 'Friends',
    href: '/friends',
    icon: (
      <Icon>
        <circle cx="8" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 18c.7-2.2 2.6-3.5 4.8-3.5S12.4 15.8 13 18M13.2 18c.5-1.8 2-2.8 3.8-2.8 1.7 0 3.2 1 3.7 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </Icon>
    )
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: (
      <Icon>
        <path d="M5 6.5h14a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H12l-4 3v-3H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </Icon>
    )
  },
  {
    label: 'Alerts',
    href: '/feed',
    icon: (
      <Icon>
        <path d="M12 5a4 4 0 0 1 4 4v2.8c0 .8.3 1.6.9 2.2l1.1 1.1H6l1.1-1.1c.6-.6.9-1.4.9-2.2V9a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </Icon>
    )
  }
];

function getInitials(name = 'YT') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'YT';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) return;

    authService.me().then((response) => setProfile(response.data)).catch(() => {
      localStorage.removeItem('youtogram_token');
    });
  }, []);

  return (
    <nav className="navbar appTopbar">
      <div className="topbarLeft">
        <Link
          href="/feed"
          className="brandCircle"
          aria-label="Youtogram home"
          onClick={(event) => {
            if (pathname === '/feed') {
              event.preventDefault();
              window.dispatchEvent(new Event('youtogram:refreshFeed'));
            }
          }}
        >
          <img src="/youtogram-logo.jpg" alt="Youtogram logo" className="brandIcon" />
        </Link>
        <form className="topbarSearch" onSubmit={(event) => {
          event.preventDefault();
          const trimmed = query.trim();
          if (!trimmed) return;
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Youtogram"
            aria-label="Search Youtogram"
          />
        </form>
      </div>

      <div className="topbarCenter">
        {navItems.map((item) => (
          <button
            key={item.href}
            type="button"
            className={`topbarNavButton ${pathname === item.href ? 'activeTopbarNav' : ''}`}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="topbarRight">
        {actionItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="topbarIconButton"
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}

        <button type="button" className="topbarProfileChip" onClick={() => router.push('/profile')} aria-label="Profile" title="Profile">
          <span className="topbarProfileAvatar">
            {profile?.avatar ? <img src={profile.avatar} alt="Profile avatar" className="topbarProfileAvatarImage" /> : getInitials(profile?.username || 'YT')}
          </span>
          <span className="topbarProfileDropdownIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="navSvgIcon">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
    </nav>
  );
}
