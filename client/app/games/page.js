'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { gameService } from '../../services/games';

const defaultGameForm = {
  title: '',
  category: 'Arcade',
  iframeUrl: '',
  description: ''
};

export default function GamesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [activeGameId, setActiveGameId] = useState('');
  const [form, setForm] = useState(defaultGameForm);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    Promise.all([authService.me(), gameService.list(), gameService.history()])
      .then(([profileResponse, gamesResponse, historyResponse]) => {
        setProfile(profileResponse.data);
        const nextGames = gamesResponse.data || [];
        setGames(nextGames);
        setActiveGameId(nextGames[0]?._id || '');
        setHistory(historyResponse.data || []);
      })
      .catch((loadError) => {
        if (loadError.message === 'Invalid token' || loadError.message === 'Authorization token required') {
          localStorage.removeItem('youtogram_token');
          router.replace('/');
          return;
        }
        setError(loadError.message || 'Unable to load games.');
      });
  }, [router]);

  useEffect(() => {
    const savedVisibility = typeof window !== 'undefined' ? window.localStorage.getItem('gamesAdVisible') : null;
    if (savedVisibility === 'false') {
      setShowAd(false);
      return;
    }

    if (typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // ignore if already pushed
      }
    }
  }, []);

  const activeGame = useMemo(
    () => games.find((game) => game._id === activeGameId) || games[0],
    [activeGameId, games]
  );

  const handleFormChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handlePostGame = async (event) => {
    event.preventDefault();
    setPosting(true);
    setError('');

    try {
      const response = await gameService.create(form);
      setGames((current) => [response.data, ...current]);
      setActiveGameId(response.data._id);
      setForm(defaultGameForm);
    } catch (saveError) {
      setError(saveError.message || 'Unable to post game.');
    } finally {
      setPosting(false);
    }
  };

  // Quick-add helper for known embed (admin only)
  const quickAddFeatured = async () => {
    if (!profile || profile.role !== 'admin') return;
    const payload = {
      title: 'Bubble Pop Legend',
      category: 'Arcade',
      iframeUrl: 'https://html5.gamedistribution.com/fd5ae555f42e4dac872819ed9125616c/?gd_sdk_referrer_url=https://www.example.com/games/{game-path}',
      description: 'Bubble Pop Legend - match 3 bubble popping game.'
    };

    setPosting(true);
    setError('');

    try {
      const response = await gameService.create(payload);
      setGames((current) => [response.data, ...current]);
      setActiveGameId(response.data._id);
      setForm(defaultGameForm);
      // auto-enter play mode: create session and show player
      try {
        await gameService.createSession({ gameId: response.data._id, title: response.data.title, durationSeconds: 60, score: 0 });
        setIsPlaying(true);
      } catch (_) {
        setIsPlaying(false);
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to post game.');
    } finally {
      setPosting(false);
    }
  };

  // Quick-add for GameDistribution embed provided by user
  const quickAddGameDistribution = async () => {
    if (!profile || profile.role !== 'admin') return;
    const payload = {
      title: 'Featured GD Game',
      category: 'Arcade',
      iframeUrl: 'https://html5.gamedistribution.com/b23deb025996424da64cf8f8cf986fd8/?gd_sdk_referrer_url=https://www.example.com/games/{game-path}',
      description: 'Imported GameDistribution embed.'
    };

    setPosting(true);
    setError('');

    try {
      const response = await gameService.create(payload);
      setGames((current) => [response.data, ...current]);
      setActiveGameId(response.data._id);
      setForm(defaultGameForm);
      // try to create session and auto-play; if blocked, open in new tab as fallback
      try {
        await gameService.createSession({ gameId: response.data._id, title: response.data.title, durationSeconds: 60, score: 0 });
        // If host appears blocked, the handleLaunch will open it; set playing to true to render iframe logic
        setIsPlaying(true);
      } catch (_) {
        setIsPlaying(false);
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to post game.');
    } finally {
      setPosting(false);
    }
  };

  const handleLaunch = async () => {
    if (!activeGame) return;

    setSaving(true);
    setError('');

    try {
      const response = await gameService.createSession({
        gameId: activeGame._id,
        title: activeGame.title,
        durationSeconds: 60,
        score: 0
      });

      setHistory((current) => [response.data, ...current]);
      // Enter play mode after session is created
      setIsPlaying(true);
      // Attempt to open in new tab if the target looks like our site or otherwise blocked
      try {
        const parsed = new URL(activeGame.iframeUrl || '', typeof window !== 'undefined' ? window.location.href : undefined);
        const host = typeof window !== 'undefined' ? window.location.host : '';
        if (parsed.host === host || parsed.hostname.includes('youtogram')) {
          // window.open is allowed here because this was triggered by a user action (Launch)
          window.open(activeGame.iframeUrl, '_blank');
        }
      } catch (e) {
        // ignore
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to save game session.');
    } finally {
      setSaving(false);
    }
  };

  const hideAd = () => {
    setShowAd(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gamesAdVisible', 'false');
    }
  };

  const revealAd = () => {
    setShowAd(true);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('gamesAdVisible');
      if (window.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          // ignore if already pushed
        }
      }
    }
  };

  return (
    <main className="gamesPage pageWithCornerAd">
      {showAd ? (
        <div className="pageCornerAd pageCornerAdGames gamesAdContainer">
          <div className="gamesAdHeader">
            <span>Sponsored</span>
            <button type="button" className="adDismissButton" onClick={hideAd}>
              Hide ad
            </button>
          </div>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-2974467767462928"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div className="gamesAdStub">
          <button type="button" className="adRevealButton" onClick={revealAd}>
            Show sponsored content
          </button>
        </div>
      )}
      <aside className="gamesSidebar">
        <div className="gamesSidebarHeader">
          <h1>Games</h1>
          <p>Paste iframe-ready game links and publish them for users to play inside Youtogram.</p>
        </div>

        {profile ? (
          <div className="gamesProfileSummary">
            <p>
              <strong>{profile.username}</strong>
              {profile.role === 'admin' ? <span className="verifiedBadge" title="Admin verified"> ✓</span> : null}
            </p>
            <p>Points: {profile.points ?? 0}</p>
            <p>Followers: {profile.followerCount ?? 0}</p>
          </div>
        ) : null}

        {profile?.role === 'admin' ? (
          <form className="gamePostForm" onSubmit={handlePostGame}>
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="Game title" required />
            <input name="category" value={form.category} onChange={handleFormChange} placeholder="Category" required />
            <input name="iframeUrl" value={form.iframeUrl} onChange={handleFormChange} placeholder="https://game-link.com/embed" required />
            <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Short description" rows={3} />
            <div style={{display: 'flex', gap: 8}}>
              <button type="submit" disabled={posting}>{posting ? 'Posting...' : 'Post game'}</button>
              <button type="button" onClick={quickAddFeatured} disabled={posting} className="quickAddButton" title="Add Bubble Pop Legend">Add Bubble Pop Legend</button>
              <button type="button" onClick={quickAddGameDistribution} disabled={posting} className="quickAddButton" title="Add GameDistribution featured game">Add Featured GD Game</button>
            </div>
          </form>
        ) : (
          <div className="gamePostNotice">
            <p>Only admins can post new games. You can still play available games and track your points.</p>
          </div>
        )}

        {games.length ? (
        <div className="gameCatalogList">
          {games.map((game) => (
            <button
              key={game._id}
              type="button"
              className={`gameCatalogCard ${game._id === activeGameId ? 'activeGameCatalogCard' : ''}`}
              onClick={() => {
                setActiveGameId(game._id);
                setIsPlaying(false);
              }}
            >
              <strong>{game.title}</strong>
              <span>{game.category}</span>
              <p>{game.description}</p>
            </button>
          ))}
        </div>
        ) : null}

        <div className="gameHistoryPanel">
          <strong>Recent sessions</strong>
          {history.length ? history.slice(0, 5).map((session) => (
            <div key={session._id} className="gameHistoryRow">
              <span>{session.title}</span>
              <small>{session.durationSeconds}s</small>
            </div>
          )) : <p>No game sessions yet.</p>}
        </div>
      </aside>

      <section className="gamesMain">
        <div className="gamesPlayerHeader">
          <div>
            <h2>{activeGame?.title || 'Game Player'}</h2>
            <p>{activeGame?.description || 'Post a game link to begin.'}</p>
          </div>
          <button type="button" className="gamesLaunchButton" onClick={handleLaunch} disabled={saving || !activeGame}>
            {saving ? 'Saving...' : 'Launch game'}
          </button>
        </div>

        {error ? <p className="feedErrorBanner">{error}</p> : null}

        <div className="gameEmbedShell">
          {activeGame?.iframeUrl ? (
            isPlaying ? (
              <div className="gamePlayWrapper">
                <div className="gamePlayHeader">
                  <strong>{activeGame.title}</strong>
                  <div className="gamePlayControls">
                    <button type="button" onClick={() => setIsPlaying(false)} className="gameExitButton">Exit</button>
                  </div>
                </div>
                {
                  // Prevent loading the app's own pages or Youtogram inside the iframe.
                  // If the iframe URL points to our host or contains 'youtogram', we
                  // show an empty browser and a warning instead of embedding the site chrome.
                }
                {(function renderGameIframe() {
                  try {
                    const src = activeGame.iframeUrl || '';
                    if (!src) {
                      return (
                        <iframe
                          title="empty-game-frame"
                          src="about:blank"
                          className="gameEmbedFrame"
                          loading="lazy"
                        />
                      );
                    }

                    const parsed = new URL(src, typeof window !== 'undefined' ? window.location.href : src);
                    const host = typeof window !== 'undefined' ? window.location.host : '';
                    if (parsed.host === host || parsed.hostname.includes('youtogram')) {
                      return (
                        <div className="gameEmbedBlocked">
                          <p>This game URL appears to load the Youtogram site. Provide a direct embed URL for the game (iframe/embed link).</p>
                          <iframe title="empty-game-frame" src="about:blank" className="gameEmbedFrame" loading="lazy" />
                          <div className="gameBlockedActions">
                            <button type="button" onClick={() => window.open(activeGame.iframeUrl, '_blank')}>Open in new tab</button>
                            <button type="button" onClick={() => setIsPlaying(false)}>Close</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <iframe
                        key={src}
                        src={src}
                        title={activeGame.title}
                        className="gameEmbedFrame"
                        allow="fullscreen; autoplay; gamepad; gyroscope; accelerometer"
                        loading="lazy"
                      />
                    );
                  } catch (e) {
                    return (
                      <iframe
                        title="empty-game-frame"
                        src="about:blank"
                        className="gameEmbedFrame"
                        loading="lazy"
                      />
                    );
                  }
                })()}
              </div>
            ) : (
              <div className="gameEmbedEmpty">
                <p>Ready to play: <strong>{activeGame.title}</strong></p>
                <p>{activeGame.description}</p>
                <button type="button" className="gamesLaunchButton" onClick={handleLaunch} disabled={saving || !activeGame}>
                  {saving ? 'Saving...' : 'Launch game'}
                </button>
              </div>
            )
          ) : (
            <div className="gameEmbedEmpty">
              <p>No games posted yet.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
