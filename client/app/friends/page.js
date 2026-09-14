'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';

const sidebarItems = [
  { label: 'Home', active: true },
  { label: 'Friend requests' },
  { label: 'Suggestions' },
  { label: 'All friends' },
  { label: 'Birthdays' },
  { label: 'Custom lists' }
];

function getInitials(name = 'YT') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'YT';
}

export default function FriendsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    const loadPage = async () => {
      setLoading(true);
      setError('');

      try {
        const [profileResponse, usersResponse] = await Promise.all([
          authService.me(),
          authService.users()
        ]);

        setProfile(profileResponse.data);
        setSuggestions((usersResponse.data || []).filter((user) => !user.isFriend));
      } catch (loadError) {
        setError(loadError.message || 'Unable to load friends page.');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const visibleSuggestions = useMemo(() => {
    return suggestions
      .filter((item) => item._id !== profile?._id)
      .sort((a, b) => Number(b.sameCountry) - Number(a.sameCountry));
  }, [suggestions, profile]);

  const handleAddFriend = async (userId) => {
    try {
      await authService.sendFriendRequest(userId);
      setSuggestions((current) =>
        current.map((item) => (item._id === userId ? { ...item, isFriend: true } : item))
      );
    } catch (requestError) {
      setError(requestError.message || 'Unable to add friend.');
    }
  };

  const handleToggleFollow = async (user) => {
    try {
      const response = user.isFollowing
        ? await authService.unfollowUser(user._id)
        : await authService.followUser(user._id);

      setSuggestions((current) =>
        current.map((item) =>
          item._id === user._id
            ? { ...item, isFollowing: !item.isFollowing, followerCount: response.data.followerCount }
            : item
        )
      );
    } catch (followError) {
      setError(followError.message || 'Unable to update follow state.');
    }
  };

  const handleRemoveCard = (userId) => {
    setSuggestions((current) => current.filter((item) => item._id !== userId));
  };

  return (
    <main className="friendsPage">
      <aside className="friendsSidebar">
        <div className="friendsSidebarHeader">
          <div>
            <h1>Friends</h1>
            <p>{profile?.username || 'Youtogram'}</p>
          </div>
          <button type="button" className="friendsCircleButton" aria-label="Settings">
            Settings
          </button>
        </div>

        <nav className="friendsSidebarNav">
          {sidebarItems.map((item) => (
            <button key={item.label} type="button" className={`friendsNavItem ${item.active ? 'activeFriendsNavItem' : ''}`}>
              <span className="friendsNavIcon">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
              <span className="friendsNavArrow">{'>'}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="friendsMain">
        <div className="friendsMainHeader">
          <div>
            <h2>People you may know</h2>
            <p>{profile?.country ? `${profile.country} first, then the wider app` : 'Users from your Youtogram database'}</p>
          </div>
          <button type="button" className="friendsSeeAllButton">
            See all
          </button>
        </div>

        {error ? <p className="feedErrorBanner">{error}</p> : null}

        {loading ? (
          <div className="simplePageCard">
            <p>Loading friend suggestions...</p>
          </div>
        ) : visibleSuggestions.length ? (
          <div className="friendCardGrid">
            {visibleSuggestions.map((user) => (
              <article key={user._id} className="friendCard">
                <div className="friendCardMedia">
                  {user.avatar ? (
                    <img src={user.avatar} alt={`${user.username} avatar`} className="friendCardImage" />
                  ) : (
                    <div className="friendCardImage friendCardFallback">{getInitials(user.username)}</div>
                  )}
                </div>

                <div className="friendCardBody">
                  <h3>{user.username}</h3>
                  <p>{user.country || 'Youtogram'} {user.sameCountry ? '- near you' : ''}</p>
                  <p>{user.mutualFriends} mutual friend{user.mutualFriends === 1 ? '' : 's'}</p>
                  <div className="friendStatusRow">
                    <span>{user.followerCount ?? 0} followers</span>
                    {user.isFollowedBy ? <span className="friendBadge">Follows you</span> : null}
                  </div>
                  <div className="friendActions">
                    <button type="button" className="friendPrimaryButton" disabled={user.isFriend} onClick={() => handleAddFriend(user._id)}>
                      {user.isFriend ? 'Friends' : 'Add friend'}
                    </button>
                    <button type="button" className={`friendSecondaryButton ${user.isFollowing ? 'followingButton' : ''}`} onClick={() => handleToggleFollow(user)}>
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <button type="button" className="friendSecondaryButton" onClick={() => handleRemoveCard(user._id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
