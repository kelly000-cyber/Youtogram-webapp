'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { videoService } from '../../services/videos';
import styles from './videos.module.css';

function formatCount(value = 0) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  return `${value}`;
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    videoService.list('limit=30')
      .then((response) => setVideos(response.data.items || []))
      .catch((loadError) => {
        const message = loadError?.message || '';
        if (message === 'Invalid token' || message === 'Authorization token required') {
          setAuthExpired(true);
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }

        setError(message || 'Unable to load videos.');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleForceLogout = () => {
    // clear and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('youtogram_token');
    }
    router.replace('/');
  };

  const handleLike = async (videoId) => {
    try {
      const response = await videoService.like(videoId);
      setVideos((current) => current.map((video) => (video._id === videoId ? response.data : video)));
    } catch (likeError) {
      setError(likeError.message || 'Unable to like video.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Videos</p>
          <h1>Short-form reel feed</h1>
          <p className={styles.copy}>This layout is built to feel closer to TikTok: tall cards, strong media focus, and quick action buttons.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => router.push('/feed')}>Back to feed</button>
      </section>

      {error ? (
        authExpired ? (
          <div className="feedErrorBanner reelBanner">
            <span>{error}</span>
            <button type="button" onClick={handleForceLogout} className="bannerAction">Log out</button>
          </div>
        ) : (
          <p className="feedErrorBanner reelBanner">{error}</p>
        )
      ) : null}
      {loading ? <div className="reelFeedStateCard"><p>Loading videos...</p></div> : null}

      {!loading && videos.length ? (
        <section className={styles.stack}>
          {videos.map((video) => (
            <article key={video._id} className={styles.card}>
              <video
                className={styles.media}
                src={video.url}
                poster={video.thumbnail || undefined}
                controls
                playsInline
                loop
              />
              <div className={styles.overlay}>
                <div className={styles.meta}>
                  <strong>@{video.author?.username || 'youtogram'}</strong>
                  <h2>{video.title || 'Youtogram video'}</h2>
                  {video.description ? <p>{video.description}</p> : null}
                </div>
                <aside className={styles.actions}>
                  <button type="button" onClick={() => handleLike(video._id)} title="Like">Like</button>
                  <span>{formatCount(video.likes?.length || 0)}</span>
                  <button type="button" title="Comments">Chat</button>
                  <span>{formatCount(video.comments?.length || 0)}</span>
                  <button type="button" title="Share">Share</button>
                </aside>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
