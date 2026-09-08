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
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

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

  const handleShare = async (videoId) => {
    const shareUrl = `${window.location.origin}/videos?video=${videoId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setError('Video link copied.');
      window.setTimeout(() => setError(''), 1800);
    } catch {
      setError('Unable to copy video link.');
    }
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file.');
      event.target.value = '';
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('Videos must be 200 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleUploadVideo = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      setError('Choose a video before publishing.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('video', uploadFile);
      payload.append('title', uploadTitle.trim() || 'Youtogram video');
      payload.append('description', uploadDescription.trim());
      const response = await videoService.upload(payload);
      setVideos((current) => [response.data, ...current]);
      setShowUpload(false);
      setUploadFile(null);
      setUploadPreview('');
      setUploadTitle('');
      setUploadDescription('');
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to publish video.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <h1>Reels</h1>
        <button type="button" className={styles.postVideoButton} onClick={() => setShowUpload(true)}>+ Post video</button>
        <button type="button" className={styles.sidebarItemActive}>For you</button>
        <button type="button" className={styles.sidebarItem} onClick={() => router.push('/feed')}>Following</button>
        <button type="button" className={styles.sidebarItem} onClick={() => router.push('/profile')}>Profile</button>
      </aside>

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
                  <button type="button" className={styles.likeButton} onClick={() => handleLike(video._id)} title="Like" aria-label="Like video">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9.4a2 2 0 0 0 1.9-1.4l2.1-6.5A2 2 0 0 0 18.5 9H14l.7-3.4A2.2 2.2 0 0 0 12.5 3L7 10v10Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  </button>
                  <span>{formatCount(video.likes?.length || 0)}</span>
                  <button type="button" onClick={() => setError('Comments are available on the video post.')} title="Comments" aria-label="Comments">Chat</button>
                  <span>{formatCount(video.comments?.length || 0)}</span>
                  <button type="button" onClick={() => handleShare(video._id)} title="Share" aria-label="Share video">Share</button>
                </aside>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {showUpload ? (
        <div className={styles.uploadOverlay} role="dialog" aria-modal="true" aria-labelledby="post-video-title">
          <form className={styles.uploadModal} onSubmit={handleUploadVideo}>
            <header className={styles.uploadHeader}>
              <h2 id="post-video-title">Post video</h2>
              <button type="button" onClick={() => setShowUpload(false)} aria-label="Close video upload">×</button>
            </header>
            <label className={styles.videoPicker}>
              <span>{uploadFile ? uploadFile.name : 'Choose a video from your device'}</span>
              <input type="file" accept="video/*" onChange={handleVideoFileChange} />
            </label>
            {uploadPreview ? <video className={styles.uploadPreview} src={uploadPreview} controls muted playsInline /> : null}
            <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Video title" maxLength={120} required />
            <textarea value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} placeholder="Add a description" maxLength={500} rows={3} />
            <button type="submit" className={styles.publishButton} disabled={uploading}>{uploading ? 'Uploading...' : 'Publish video'}</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
