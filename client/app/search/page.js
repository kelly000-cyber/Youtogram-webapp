'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchService } from '../../services/search';
import { authService } from '../../services/auth';

function initials(name = 'Youtogram User') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'Y';
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchTerm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let cancelled = false;

    const loadSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setResults({ users: [], posts: [] });
        setError('Enter at least 2 characters to search Youtogram.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await searchService.globalSearch(searchTerm, 20);
        if (!cancelled) {
          setResults(response.data || { users: [], posts: [] });
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Search failed. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSearch();

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const handleToggleFollow = async (event, user) => {
    event.stopPropagation();
    try {
      const response = user.isFollowing
        ? await authService.unfollowUser(user._id)
        : await authService.followUser(user._id);
      setResults((current) => ({
        ...current,
        users: current.users.map((item) => item._id === user._id
          ? { ...item, isFollowing: !item.isFollowing, followerCount: response.data.followerCount }
          : item)
      }));
    } catch (followError) {
      setError(followError.message || 'Unable to update follow status.');
    }
  };

  return (
    <main className="searchPage">
      <section className="searchPageShell">
        <header className="searchPageHeader">
          <div>
            <p className="searchEyebrow">Search</p>
            <h1>Youtogram search</h1>
            <p>Search posts and users across the platform with keywords, phrases, or usernames.</p>
          </div>
          <div className="searchToolbar">
            <button
              type="button"
              className="submitButton"
              onClick={() => router.push(`/search?q=${encodeURIComponent(searchTerm)}`)}
              disabled={!searchTerm}
            >
              Refresh results
            </button>
          </div>
        </header>

        {loading ? <p className="searchStateText">Searching for "{searchTerm}"...</p> : null}
        {error ? <p className="searchErrorBanner">{error}</p> : null}

        {!loading && !error && searchTerm ? (
          <section className="searchResultsGrid">
            <article className="searchResultsCard">
              <div className="searchResultsHeader">
                <h2>Users</h2>
                <span>{results.users.length}</span>
              </div>
              {results.users.length ? (
                <div className="searchResultList">
                  {results.users.map((user) => (
                    <article key={user._id} className="searchResultItem searchUserResult">
                      <button type="button" className="searchUserIdentity" onClick={() => router.push(`/profile/${user._id}`)} aria-label={`View ${user.username}'s profile`}>
                        <span className="searchUserAvatar">{user.avatar ? <img src={user.avatar} alt="" /> : initials(user.username)}</span>
                        <span><strong>{user.username}</strong><small>{user.followerCount ?? 0} followers{user.isFriend ? ' · Friends' : ''}</small><p>{user.bio || user.country || 'View profile'}</p></span>
                      </button>
                      <button type="button" className={`searchFollowButton ${user.isFollowing ? 'searchFollowingButton' : ''}`} onClick={(event) => handleToggleFollow(event, user)}>
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="searchEmptyState">No users found for "{searchTerm}".</p>
              )}
            </article>

            <article className="searchResultsCard">
              <div className="searchResultsHeader">
                <h2>Posts</h2>
                <span>{results.posts.length}</span>
              </div>
              {results.posts.length ? (
                <div className="searchResultList">
                  {results.posts.map((post) => (
                    <div key={post._id} className="searchResultItem">
                      <strong>{post.author?.username || 'Unknown author'}</strong>
                      <p>{post.text || 'Post content not available'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="searchEmptyState">No posts found for "{searchTerm}".</p>
              )}
            </article>
          </section>
        ) : null}

        {!loading && !error && !searchTerm ? (
          <section className="searchStateCard">
            <p>Enter at least 2 characters to search Youtogram.</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="searchPage"><section className="searchPageShell"><p className="searchStateText">Loading search...</p></section></main>}>
      <SearchContent />
    </Suspense>
  );
}
