'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { postService } from '../../services/posts';

const sidebarItems = [
  { label: 'Your feed', active: true },
  { label: 'Discover' },
  { label: 'Your groups' }
];

const joinedGroups = [
  { name: 'Nigerian Software Developers', status: 'Last active 14 minutes ago' },
  { name: 'Youtogram Creator Circle', status: 'Last active 1 hour ago' },
  { name: 'Programming and Coding', status: 'Last active 2 hours ago' }
];

function getInitials(name = 'YG') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'YG';
}

export default function GroupsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    Promise.all([
      authService.me(),
      postService.feed('limit=8')
    ])
      .then(([profileResponse, feedResponse]) => {
        setProfile(profileResponse.data);
        setPosts(feedResponse.data.items || []);
      })
      .catch((loadError) => setError(loadError.message || 'Unable to load group activity.'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="groupsPage">
      <aside className="groupsSidebar">
        <div className="groupsSidebarHeader">
          <h1>Groups</h1>
          <button type="button" className="friendsCircleButton" aria-label="Settings">
            Settings
          </button>
        </div>

        <div className="groupsSearchBox">
          <input type="text" placeholder="Search groups" aria-label="Search groups" />
        </div>

        <nav className="groupsSidebarNav">
          {sidebarItems.map((item) => (
            <button key={item.label} type="button" className={`groupsNavItem ${item.active ? 'activeGroupsNavItem' : ''}`}>
              <span className="groupsNavIcon">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="groupsCreateButton">
          + Create new group
        </button>

        <section className="groupsJoinedSection">
          <div className="groupsJoinedHeader">
            <h2>Groups you've joined</h2>
            <button type="button" className="friendsSeeAllButton">See all</button>
          </div>

          <div className="groupsJoinedList">
            {joinedGroups.map((group) => (
              <article key={group.name} className="groupsJoinedItem">
                <div className="groupsJoinedThumb">{getInitials(group.name)}</div>
                <div>
                  <strong>{group.name}</strong>
                  <p>{group.status}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <section className="groupsMain">
        <div className="groupsMainHeader">
          <h2>Recent activity</h2>
        </div>

        {error ? <p className="feedErrorBanner">{error}</p> : null}

        {loading ? (
          <div className="simplePageCard">
            <p>Loading group activity...</p>
          </div>
        ) : profile?.friends?.length ? (
          <div className="groupsActivityList">
            {posts.map((post) => (
              <article key={post._id} className="groupsActivityCard">
                <header className="groupsActivityHeader">
                  <div className="groupsActivityAuthor">
                    <div className="groupsJoinedThumb smallThumb">{getInitials(post.author?.username || 'YG')}</div>
                    <div>
                      <strong>{post.author?.username || 'Youtogram User'}</strong>
                      <p>Top contributor | Group activity</p>
                    </div>
                  </div>
                  <button type="button" className="ghostIconButton">...</button>
                </header>

                {post.media?.[0]?.url ? (
                  <img src={post.media[0].url} alt="Group activity" className="groupsActivityImage" />
                ) : (
                  <div className="groupsActivityPlaceholder">{post.text || 'Youtogram group activity'}</div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="simplePageCard">
            <p>No group activity yet. Add friends first so your groups area has people and posts to show.</p>
          </div>
        )}
      </section>
    </main>
  );
}
