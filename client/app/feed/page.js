'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard';
import { authService } from '../../services/auth';
import { postService } from '../../services/posts';

const shortcuts = [
  { label: 'Friends', href: '/friends', detail: 'See your people' },
  { label: 'Memories', href: '/memories', detail: 'On this day' },
  { label: 'Saved', href: '/saved', detail: 'Bookmarks' },
  { label: 'Groups', href: '/groups', detail: 'Community spaces' },
  { label: 'Videos', href: '/videos', detail: 'Watch and share' }
];

const composerDefaults = {
  text: '',
  mediaFile: null,
  mediaPreview: '',
  mediaType: 'image',
  isStory: false
};

export default function FeedPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [activeStory, setActiveStory] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState('');
  const [sharedPostId, setSharedPostId] = useState('');
  const [composer, setComposer] = useState(composerDefaults);
  const mediaInputRef = useRef(null);

  const handleComposerAction = (action) => {
    setComposer((current) => {
      switch (action) {
        case 'live':
          return { ...current, mediaType: 'video', isStory: false };
        case 'photo':
          return { ...current, mediaType: 'image', isStory: false };
        case 'feeling':
          return {
            ...current,
            isStory: false,
            mediaUrl: '',
            text: current.text || 'Feeling grateful and sharing some updates.'
          };
        case 'story':
          return { ...current, isStory: true };
        default:
          return current;
      }
    });
  };

  const loadFeed = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [profileResult, feedResult, storiesResult] = await Promise.allSettled([
        authService.me(),
        postService.feed('limit=20'),
        postService.stories()
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value.data);
      } else {
        const message = profileResult.reason?.message || 'Invalid token';
        // If the token is invalid or missing, avoid immediately removing the
        // token and redirecting during the feed load (this causes a visible
        // flash/redirect). Instead, surface a session-expired notice and let
        // the user explicitly log out so we don't trigger a redirect loop.
        if (message === 'Invalid token' || message === 'Authorization token required') {
          setAuthExpired(true);
          setError('Session expired. Please log in again.');
        } else {
          setError(message || 'Unable to load your profile.');
        }
      }

      if (feedResult.status === 'fulfilled') {
        setPosts(feedResult.value.data.items || []);
      } else if (!refresh) {
        setPosts([]);
        setError(feedResult.reason?.message || 'Unable to load your feed right now.');
      }

      if (storiesResult.status === 'fulfilled') {
        setStories(Array.isArray(storiesResult.value.data) ? storiesResult.value.data : []);
      } else {
        setStories([]);
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your feed right now.');
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    loadFeed();

    const refreshListener = () => {
      loadFeed(true);
    };

    window.addEventListener('youtogram:refreshFeed', refreshListener);
    return () => {
      window.removeEventListener('youtogram:refreshFeed', refreshListener);
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    setSharedPostId(params.get('post') || '');
  }, []);

  useEffect(() => {
    if (!sharedPostId || !posts.length) return;

    const node = document.getElementById(`feed-post-${sharedPostId}`);
    if (!node) return;

    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedPostId(sharedPostId);

    const timeout = window.setTimeout(() => {
      setHighlightedPostId('');
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [posts, sharedPostId]);

  const handleComposerChange = (event) => {
    const { name, value, type, checked } = event.target;
    setComposer((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please choose an image or video file.');
      event.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Media files must be 100 MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');
    setComposer((current) => ({
      ...current,
      mediaFile: file,
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      mediaPreview: URL.createObjectURL(file)
    }));
  };

  const handleCreateStory = () => {
    setComposer((current) => ({ ...current, isStory: true }));
    window.requestAnimationFrame(() => mediaInputRef.current?.click());
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (!composer.text.trim() && !composer.mediaFile) {
        setError('Add some text or choose a photo/video before posting.');
        return;
      }

      if (composer.isStory && !composer.mediaFile) {
        setError('Choose a photo or video before sharing your story.');
        return;
      }

      const payload = new FormData();
      payload.append('text', composer.text);
      payload.append('isStory', String(composer.isStory));
      if (composer.mediaFile) payload.append('media', composer.mediaFile);

      const response = await postService.create(payload);

      if (composer.isStory) {
        setStories((current) => [response.data, ...current]);
        setActiveStory(response.data);
      } else {
        setPosts((current) => [response.data, ...current]);
      }

      setComposer(composerDefaults);
    } catch (postError) {
      setError(postError.message || 'Unable to create post.');
    }
  };

  const updatePostInState = (updatedPost) => {
    setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await postService.toggleLike(postId);
      updatePostInState(response.data);
    } catch (actionError) {
      setError(actionError.message || 'Unable to update reaction.');
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!text || !text.trim()) return;

    try {
      const response = await postService.addComment(postId, { text: text.trim() });
      updatePostInState(response.data);
    } catch (actionError) {
      setError(actionError.message || 'Unable to add comment.');
    }
  };

  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/feed?post=${postId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied to clipboard.');
    } catch {
      setShareMessage('Copy failed.');
    }

    window.setTimeout(() => setShareMessage(''), 1800);
  };

  const handleForceLogout = () => {
    authService.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('youtogram_token');
    }
    router.replace('/');
  };

  return (
    <main className="facebookHomePage">
      <div className="facebookHomeLayout">
        <aside className="facebookLeftRail">
          <section className="facebookPanel facebookProfileCard">
            <div className="facebookProfileMini">
              <img src={profile?.avatar || '/youtogram.jpg'} alt={profile?.username || 'Profile'} />
              <div>
                <strong>{profile?.username || 'Youtogram'}</strong>
                <span>{profile?.country || 'Social feed'}</span>
              </div>
            </div>
          </section>

          <section className="facebookPanel facebookShortcutPanel">
            {shortcuts.map((item) => (
              <button key={item.href} type="button" className="facebookShortcutRow" onClick={() => router.push(item.href)}>
                <span className="facebookShortcutBadge">{item.label.charAt(0)}</span>
                <span className="facebookShortcutText">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </button>
            ))}
          </section>
        </aside>

        <section className="facebookCenterColumn">
          {refreshing ? (
            <div className="facebookInlineStatus">
              <span className="facebookSpinner" />
              Refreshing feed...
            </div>
          ) : null}

          {error ? (
            authExpired ? (
              <div className="facebookBanner facebookBannerError">
                <span>{error}</span>
                <button type="button" className="facebookBannerAction" onClick={handleForceLogout}>
                  Log out
                </button>
              </div>
            ) : (
              <p className="facebookBanner facebookBannerError">{error}</p>
            )
          ) : null}
          {shareMessage ? <p className="facebookBanner facebookBannerInfo">{shareMessage}</p> : null}

          <section className="facebookStoriesPanel facebookPanel">
            <div className="facebookSectionHeader">
              <strong>Stories</strong>
            </div>
            <div className="facebookStoriesRow">
              <button type="button" className="facebookStoryCard facebookStoryCreateCard" onClick={handleCreateStory}>
                <span>+ Create story</span>
              </button>
              {stories.length ? (
                stories.map((story) => (
                  <button key={story._id} type="button" className="facebookStoryCard" onClick={() => setActiveStory(story)}>
                    {story.media?.[0]?.url ? (
                      story.media[0].type === 'video' ? (
                        <video src={story.media[0].url} muted playsInline />
                      ) : (
                        <img src={story.media[0].url} alt={story.author?.username || 'Story'} />
                      )
                    ) : (
                      <span className="facebookStoryTextPreview">{story.text || 'Story'}</span>
                    )}
                    <span>{story.author?.username || 'Story'}</span>
                  </button>
                ))
              ) : (
                <div className="facebookStoryCard facebookStoryEmpty">
                  <span>No stories yet. Add one to share a moment on top of the feed.</span>
                </div>
              )}
            </div>
          </section>

          <section className="facebookComposerCard facebookPanel">
            <form onSubmit={handleCreatePost} className="facebookComposerForm">
              <div className="facebookComposerTop">
                <img src={profile?.avatar || '/youtogram.jpg'} alt={profile?.username || 'Profile'} className="facebookComposerAvatar" />
                <textarea
                  name="text"
                  value={composer.text}
                  onChange={handleComposerChange}
                  placeholder={`What's on your mind${profile?.username ? `, ${profile.username}` : ''}?`}
                  rows={3}
                />
              </div>
              <div className="facebookComposerQuickActions">
                <button type="button" className={`facebookComposerQuickAction ${composer.mediaType === 'video' && !composer.isStory ? 'facebookComposerQuickActionActive' : ''}`} onClick={() => handleComposerAction('live')}>
                  Live video
                </button>
                <button type="button" className={`facebookComposerQuickAction ${composer.mediaType === 'image' && !composer.isStory ? 'facebookComposerQuickActionActive' : ''}`} onClick={() => handleComposerAction('photo')}>
                  Photo / video
                </button>
                <button type="button" className={`facebookComposerQuickAction ${composer.text && !composer.isStory ? 'facebookComposerQuickActionActive' : ''}`} onClick={() => handleComposerAction('feeling')}>
                  Feeling / activity
                </button>
                <button type="button" className={`facebookComposerQuickAction ${composer.isStory ? 'facebookComposerQuickActionActive' : ''}`} onClick={() => handleComposerAction('story')}>
                  Add to story
                </button>
              </div>
              <div className="facebookComposerActions">
                <label className="facebookMediaPicker">
                  <span>{composer.mediaFile ? `Selected: ${composer.mediaFile.name}` : 'Choose photo or video'}</span>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" onChange={handleMediaChange} aria-label="Choose photo or video" />
                </label>
                <label className="facebookStoryToggle">
                  <input type="checkbox" name="isStory" checked={composer.isStory} onChange={handleComposerChange} />
                  <span>Add to story</span>
                </label>
                <button type="submit" className="facebookPostButton">
                  {composer.isStory ? 'Share story' : 'Post'}
                </button>
              </div>
              {composer.mediaPreview ? (
                <div className="facebookComposerPreview">
                  {composer.mediaType === 'video' ? (
                    <video src={composer.mediaPreview} controls muted playsInline />
                  ) : (
                    <img src={composer.mediaPreview} alt="Selected upload preview" />
                  )}
                </div>
              ) : null}
            </form>
          </section>

          {loading ? (
            <section className="facebookFeedStack">
              <div className="facebookPanel facebookStateCard">
                <p>Loading your feed...</p>
              </div>
              <div className="facebookPanel facebookStateCard facebookStateCardSkeleton" />
              <div className="facebookPanel facebookStateCard facebookStateCardSkeleton" />
            </section>
          ) : posts.length ? (
            <section className="facebookFeedStack">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={profile?._id}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                  onShare={handleShare}
                  highlighted={highlightedPostId === post._id}
                />
              ))}
            </section>
          ) : (
            <div className="facebookPanel facebookStateCard">
              <p>No posts yet. Add friends, follow people, or make your first post.</p>
            </div>
          )}
        </section>

        <aside className="facebookRightRail">
          <section className="facebookPanel facebookGroupChatsCard">
            <div className="facebookSectionHeader">
              <strong>Group chats</strong>
            </div>
            <button type="button" className="facebookCreateGroupButton" onClick={() => router.push('/messages')}>
              <span aria-hidden="true">+</span>
              <strong>Create group chat</strong>
            </button>
          </section>

            <section className="facebookPanel facebookSponsoredCard">
              <div className="facebookSectionHeader">
                <strong>Sponsored</strong>
              </div>
              <p>Promote your page or event to keep your feed active and visible with smart social reach.</p>
            </section>

          <section className="facebookPanel facebookBirthdayCard">
            <div className="facebookSectionHeader">
              <strong>Birthday</strong>
            </div>
            <p>Celebrate the people in your network and keep the feed feeling alive.</p>
          </section>
        </aside>
      </div>

      {activeStory ? (
        <div className="storyViewerOverlay" role="dialog" aria-modal="true">
          <article className="storyViewerCard facebookStoryViewerCard">
            <header className="storyViewerHeader">
              <div className="reelAuthorRow">
                <img src={activeStory.author?.avatar || '/youtogram.jpg'} alt={activeStory.author?.username || 'Story'} className="reelAvatar" />
                <div className="reelAuthorText">
                  <strong>{activeStory.author?.username || 'Youtogram user'}</strong>
                  <span>Story</span>
                </div>
              </div>
              <button type="button" className="storyViewerClose" onClick={() => setActiveStory(null)} aria-label="Close story">
                Close
              </button>
            </header>

            <div className="storyViewerMedia">
              {activeStory.media?.[0]?.url ? (
                activeStory.media[0].type === 'video' ? (
                  <video src={activeStory.media[0].url} controls autoPlay playsInline />
                ) : (
                  <img src={activeStory.media[0].url} alt="Story media" />
                )
              ) : (
                <div className="storyViewerTextOnly">{activeStory.text || 'Story'}</div>
              )}
            </div>

            {activeStory.text ? <p className="storyViewerCaption">{activeStory.text}</p> : null}
          </article>
        </div>
      ) : null}
    </main>
  );
}
