import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside style={{ padding: '1rem', borderRight: '1px solid #ddd', minWidth: '180px' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li><Link href="/feed">Feed</Link></li>
        <li><Link href="/messages">Messages</Link></li>
        <li><Link href="/videos">Videos</Link></li>
        <li><Link href="/live">Live</Link></li>
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/profile">Profile</Link></li>
      </ul>
    </aside>
  );
}
