'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchService } from '../../services/search';

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
                    <div key={user._id} className="searchResultItem">
                      <strong>{user.username}</strong>
                      <p>{user.bio || user.country || 'No bio available'}</p>
                    </div>
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
