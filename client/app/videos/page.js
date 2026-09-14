'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { videoService } from '../../services/videos';
import styles from './videos.module.css';

function formatCount(value = 0) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  return `${value}`;
}

function AutoPlayReel({ video, styles }) {
  const videoRef = useRef(null);
  const audioGraphRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    const media = videoRef.current;
    if (!media) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Browsers only permit automatic playback when a video starts muted.
        // The sound control below lets viewers opt in without interruption.
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    }, { threshold: 0.7 });

    observer.observe(media);
    return () => {
      observer.disconnect();
      audioGraphRef.current?.context?.close?.();
    };
  }, []);

  const enableSound = () => {
    const media = videoRef.current;
    if (!media) return;
    media.muted = false;
    setMuted(false);
    media.play().catch(() => {});
  };

  const getAudioGraph = () => {
    if (audioGraphRef.current) return audioGraphRef.current;
    const media = videoRef.current;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!media || !AudioContext) return null;

    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(media);
      const gain = context.createGain();
      source.connect(gain).connect(context.destination);
      audioGraphRef.current = { context, gain };
      return audioGraphRef.current;
    } catch {
      return null;
    }
  };

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    const media = videoRef.current;
    if (!media) return;

    // 100% is the file's normal volume. 101–200% uses a safe Web Audio gain
    // node when the browser permits it, which helps quieter uploads.
    const graph = nextVolume > 100 ? getAudioGraph() : audioGraphRef.current;
    if (graph) {
      graph.gain.gain.value = Math.max(1, nextVolume / 100);
      graph.context.resume().catch(() => {});
    }
    media.volume = Math.min(nextVolume / 100, 1);
    media.muted = nextVolume === 0;
    setMuted(media.muted);
    setVolume(nextVolume);
    if (nextVolume > 0) media.play().catch(() => {});
  };

  return (
    <>
      <video
        ref={videoRef}
        className={styles.media}
        src={video.url}
        poster={video.thumbnail || undefined}
        controls
        muted={muted}
        playsInline
        loop
        preload="metadata"
        onVolumeChange={(event) => {
          const media = event.currentTarget;
          setMuted(media.muted || media.volume === 0);
          if (!audioGraphRef.current) setVolume(Math.round(media.volume * 100));
        }}
      />
      {muted ? <button type="button" className={styles.soundButton} onClick={enableSound}>Sound on</button> : null}
      <label className={styles.volumeControl}>
        <span>Volume</span>
        <input type="range" min="0" max="200" step="5" value={volume} onChange={handleVolumeChange} aria-label="Video volume" />
        <output>{volume}%</output>
      </label>
    </>
  );
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
              <AutoPlayReel video={video} styles={styles} />
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
            {uploadPreview ? <video className={styles.uploadPreview} src={uploadPreview} controls playsInline /> : null}
            <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Video title" maxLength={120} required />
            <textarea value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} placeholder="Add a description" maxLength={500} rows={3} />
            <button type="submit" className={styles.publishButton} disabled={uploading}>{uploading ? 'Uploading...' : 'Publish video'}</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
