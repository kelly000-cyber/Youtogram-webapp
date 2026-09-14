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
  mediaFiles: [],
  mediaPreview: '',
  mediaType: 'image',
  isStory: false
};

const captionLimit = 280;
const emotionOptions = [
  ['funny', '😂 Funny'],
  ['romantic', '❤️ Romantic'],
  ['emotional', '😢 Emotional'],
  ['relaxing', '😌 Relaxing'],
  ['exciting', '🔥 Exciting'],
  ['motivational', '💪 Motivational'],
  ['educational', '🎓 Educational'],
  ['entertainment', '🎵 Entertainment']
];


const normalizeStories = (items = []) => Array.from(new Map(items.filter(Boolean).map((story) => [story._id, story])).values())
  .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

export default function FeedPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState('');
  const [sharedPostId, setSharedPostId] = useState('');
  const [sharePostId, setSharePostId] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [shareComment, setShareComment] = useState('');
  const [composer, setComposer] = useState(composerDefaults);
  const [emotionTags, setEmotionTags] = useState([]);
  const mediaInputRef = useRef(null);
  const storyTouchStartRef = useRef(null);
  const storiesRowRef = useRef(null);
  const [storiesHasMore, setStoriesHasMore] = useState(false);
  const [storiesLoadingMore, setStoriesLoadingMore] = useState(false);
  const [storiesOverflow, setStoriesOverflow] = useState(false);
  const [showEmotionTags, setShowEmotionTags] = useState(false);

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
        postService.stories('limit=60&page=1')
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
        const storyPayload = storiesResult.value.data || {};
        const storyItems = Array.isArray(storyPayload) ? storyPayload : (storyPayload.items || []);
        setStories(normalizeStories(storyItems));
        setStoriesHasMore(Boolean(storyPayload.hasMore));
      } else {
        setStories([]);
        setStoriesHasMore(false);
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

  const loadMoreStories = async () => {
    if (storiesLoadingMore || !storiesHasMore) return;
    setStoriesLoadingMore(true);
    try {
      const response = await postService.stories(`limit=60&page=${Math.floor(stories.length / 60) + 1}`);
      const payload = response.data || {};
      const items = Array.isArray(payload) ? payload : (payload.items || []);
      setStories((current) => normalizeStories([...current, ...items]));
      setStoriesHasMore(Boolean(payload.hasMore));
    } catch (storyError) {
      setError(storyError.message || 'Unable to load more stories.');
    } finally {
      setStoriesLoadingMore(false);
    }
  };

  useEffect(() => {
    const row = storiesRowRef.current;
    if (!row) return undefined;
    const updateOverflow = () => setStoriesOverflow(row.scrollWidth > row.clientWidth + 4);
    const onScroll = () => {
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 360) loadMoreStories();
    };
    updateOverflow();
    row.addEventListener('scroll', onScroll, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOverflow) : null;
    observer?.observe(row);
    window.addEventListener('resize', updateOverflow, { passive: true });
    return () => {
      row.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, [stories.length, storiesHasMore, storiesLoadingMore]);

  const scrollStories = (direction) => {
    storiesRowRef.current?.scrollBy({ left: direction * Math.max(220, storiesRowRef.current.clientWidth * 0.72), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeStory) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveStory(null);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        const index = stories.findIndex((story) => story._id === activeStory._id);
        if (index > 0) setActiveStory(stories[index - 1]);
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        const index = stories.findIndex((story) => story._id === activeStory._id);
        if (index >= 0 && index < stories.length - 1) setActiveStory(stories[index + 1]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeStory, stories]);

  const handleComposerChange = (event) => {
    const { name, value, type, checked } = event.target;
    setComposer((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : name === 'text' ? value.slice(0, captionLimit) : value
    }));
  };

  const addCaptionEmoji = (emoji) => {
    setComposer((current) => ({
      ...current,
      text: `${current.text}${emoji}`.slice(0, captionLimit)
    }));
  };

  const toggleEmotionTag = (tag) => {
    setEmotionTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 3));
  };

  const handleMediaChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const invalid = selected.find((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'));
    if (invalid) {
      setError('Please choose image or video files only.');
      event.target.value = '';
      return;
    }

    const oversized = selected.find((file) => file.size > 100 * 1024 * 1024);
    if (oversized) {
      setError('Each media file must be 100 MB or smaller.');
      event.target.value = '';
      return;
    }

    const files = composer.isStory ? selected : selected.slice(0, 1);
    const preview = URL.createObjectURL(files[0]);
    setError('');
    setComposer((current) => ({
      ...current,
      mediaFile: files[0],
      mediaFiles: files,
      mediaType: files[0].type.startsWith('video/') ? 'video' : 'image',
      mediaPreview: preview
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
      const storyFiles = composer.mediaFiles?.length ? composer.mediaFiles : (composer.mediaFile ? [composer.mediaFile] : []);
      if (!composer.text.trim() && !storyFiles.length) {
        setError('Add some text or choose a photo/video before posting.');
        return;
      }

      if (composer.isStory && !storyFiles.length) {
        setError('Choose one or more photos/videos before sharing your stories.');
        return;
      }

      if (composer.isStory) {
        // Upload a handful at a time so a large story batch is much faster than
        // sequential uploads, without opening hundreds of connections at once.
        const createdStories = [];
        for (let start = 0; start < storyFiles.length; start += 5) {
          const batch = storyFiles.slice(start, start + 5);
          const responses = await Promise.all(batch.map((file) => {
            const payload = new FormData();
            payload.append('text', composer.text);
            payload.append('isStory', 'true');
            emotionTags.forEach((tag) => payload.append('emotionTags', tag));
            payload.append('media', file);
            return postService.create(payload);
          }));
          createdStories.push(...responses.map((response) => response.data));
        }
        setStories((current) => normalizeStories([...createdStories, ...current]));
        setActiveStory(createdStories[0]);
      } else {
        const payload = new FormData();
        payload.append('text', composer.text);
        payload.append('isStory', 'false');
        emotionTags.forEach((tag) => payload.append('emotionTags', tag));
        if (composer.mediaFile) payload.append('media', composer.mediaFile);
        const response = await postService.create(payload);
        setPosts((current) => [response.data, ...current]);
      }

      setComposer(composerDefaults);
      setEmotionTags([]);
      setShowEmotionTags(false);
    } catch (postError) {
      setError(postError.message || 'Unable to create post.');
    }
  };

  const updatePostInState = (updatedPost) => {
    setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleToggleLike = async (postId) => {
    try {
      const currentPost = posts.find((post) => post._id === postId);
      const wasLiked = currentPost?.likes?.some((like) => String(like) === String(profile?._id));
      const response = await postService.toggleLike(postId);
      updatePostInState(response.data);
      if (!wasLiked) postService.trackInterest(postId, 'like').catch(() => {});
    } catch (actionError) {
      setError(actionError.message || 'Unable to update reaction.');
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!text || !text.trim()) return;

    try {
      const response = await postService.addComment(postId, { text: text.trim() });
      updatePostInState(response.data);
      postService.trackInterest(postId, 'comment').catch(() => {});
    } catch (actionError) {
      setError(actionError.message || 'Unable to add comment.');
    }
  };

  const handleShare = (postId) => {
    postService.trackInterest(postId, 'share').catch(() => {});
    setSharePostId(postId);
    setShareNote('');
    setShareComment('');
  };

  const getShareUrl = (postId) => `${window.location.origin}/feed?post=${postId}`;

  const handleShareAction = async (destination) => {
    const shareUrl = getShareUrl(sharePostId);

    if (destination === 'messenger') {
      setSharePostId('');
      router.push('/messages');
      return;
    }

    if (destination === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareComment ? `${shareComment} ${shareUrl}` : shareUrl)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (destination === 'story') {
      setSharePostId('');
      setComposer((current) => ({ ...current, isStory: true, text: shareComment || current.text }));
      setShareNote('Story mode is ready. Choose media and share it from the composer.');
      return;
    }

    try {
      if (destination === 'native' && navigator.share) {
        await navigator.share({ title: 'Youtogram post', text: shareComment, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
      setShareNote(destination === 'native' ? 'Share sheet opened.' : 'Link copied to clipboard.');
    } catch {
      setShareNote('Sharing was cancelled.');
    }
  };

  const handleShareNow = async () => {
    if (shareComment.trim()) {
      setShareNote('Your message is ready to share.');
    }
    await handleShareAction('native');
  };

  const sharedPost = posts.find((post) => post._id === sharePostId);

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

          <section className="facebookComposerCard facebookPanel">
            <form onSubmit={handleCreatePost} className="facebookComposerForm">
              <div className="facebookComposerTop">
                <img src={profile?.avatar || '/youtogram.jpg'} alt={profile?.username || 'Profile'} className="facebookComposerAvatar" />
                <div className="facebookCaptionField">
                  <textarea
                    id="post-caption"
                    name="text"
                    value={composer.text}
                    onChange={handleComposerChange}
                    placeholder={`Add a caption${profile?.username ? `, ${profile.username}` : ''}...`}
                    maxLength={captionLimit}
                    rows={3}
                  />
                  <div className="facebookCaptionTools">
                    <div className="facebookEmojiChoices" aria-label="Add emoji to caption">
                      {['✨', '😂', '❤️', '🔥', '🙌'].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => addCaptionEmoji(emoji)} aria-label={`Add ${emoji}`}>{emoji}</button>
                      ))}
                    </div>
                    <span>{composer.text.length}/{captionLimit}</span>
                  </div>
                </div>
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
              <button type="button" className="emotionToggleButton" onClick={() => setShowEmotionTags((visible) => !visible)}>
                {emotionTags.length ? `${emotionTags.length} topics selected` : 'Add a feeling or topic'}
              </button>
              {showEmotionTags ? <div className="emotionTagPicker" aria-label="Choose post topics">
                <div>
                  {emotionOptions.map(([tag, label]) => (
                    <button key={tag} type="button" className={emotionTags.includes(tag) ? 'emotionTagActive' : ''} onClick={() => toggleEmotionTag(tag)}>{label}</button>
                  ))}
                </div>
              </div> : null}
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
                    <video src={composer.mediaPreview} controls playsInline />
                  ) : (
                    <img src={composer.mediaPreview} alt="Selected upload preview" />
                  )}
                  {composer.text ? <span className="facebookComposerCaptionOverlay">{composer.text}</span> : null}
                  {composer.isStory && composer.mediaFiles?.length > 1 ? <span className="facebookComposerMediaCount">{composer.mediaFiles.length} stories selected</span> : null}
                </div>
              ) : null}
            </form>
          </section>

          <section className="facebookStoriesPanel facebookPanel" aria-labelledby="stories-heading">
            <div className="facebookStoriesHeader">
              <div>
                <strong id="stories-heading">Stories</strong>
                <span>{stories.length ? `${stories.length} active ${stories.length === 1 ? 'story' : 'stories'}` : 'Share a moment'}</span>
              </div>
              <button type="button" className="facebookStoriesSeeAll" onClick={handleCreateStory}>Create</button>
            </div>
            <div className="facebookStoriesViewport">
              {storiesOverflow ? <button type="button" className="facebookStoriesRailButton facebookStoriesRailPrev" onClick={() => scrollStories(-1)} aria-label="Scroll stories left">‹</button> : null}
              <div className="facebookStoriesRow" ref={storiesRowRef}>
                <button type="button" className="facebookStoryCard facebookStoryCreateCard" onClick={handleCreateStory} aria-label="Create a new story">
                  <span className="facebookStoryCreatePlus">+</span>
                  <span className="facebookStoryCreateLabel">Create story</span>
                </button>
                {stories.length ? stories.map((story) => (
                  <button key={story._id} type="button" className="facebookStoryCard" onClick={() => setActiveStory(story)}>
                    {story.media?.[0]?.url ? (
                      story.media[0].type === 'video'
                        ? <video src={story.media[0].url} muted playsInline preload="metadata" />
                        : <img src={story.media[0].url} alt={story.author?.username || 'Story'} loading="lazy" />
                    ) : (
                      <span className="facebookStoryTextPreview">{story.text || 'Story'}</span>
                    )}
                    <span className="facebookStoryAuthor">{story.author?.username || 'Story'}</span>
                  </button>
                )) : (
                  <div className="facebookStoryEmptyState">
                    <strong>No stories yet</strong>
                    <span>Be the first to share a moment.</span>
                  </div>
                )}
                {storiesLoadingMore ? <div className="facebookStoryLoadingCard" aria-label="Loading more stories"><span className="actionSpinner" /> Loading</div> : null}
              </div>
              {storiesOverflow ? <button type="button" className="facebookStoriesRailButton facebookStoriesRailNext" onClick={() => scrollStories(1)} aria-label="Scroll stories right">›</button> : null}
            </div>
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

      {activeStory ? (() => {
        const storyIndex = stories.findIndex((story) => story._id === activeStory._id);
        const hasPrevious = storyIndex > 0;
        const hasNext = storyIndex >= 0 && storyIndex < stories.length - 1;
        const moveStory = (direction) => {
          const nextIndex = storyIndex + direction;
          if (nextIndex >= 0 && nextIndex < stories.length) setActiveStory(stories[nextIndex]);
          else if (direction > 0 && storiesHasMore) loadMoreStories();
        };
        return (
          <div
            className="storyViewerOverlay"
            role="dialog"
            aria-modal="true"
            onClick={(event) => { if (event.target === event.currentTarget) setActiveStory(null); }}
            onTouchStart={(event) => { storyTouchStartRef.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              const start = storyTouchStartRef.current;
              const end = event.changedTouches[0]?.clientX;
              storyTouchStartRef.current = null;
              if (start == null || end == null || Math.abs(end - start) < 45) return;
              const direction = end < start ? 1 : -1;
              const nextIndex = storyIndex + direction;
              if (nextIndex >= 0 && nextIndex < stories.length) setActiveStory(stories[nextIndex]);
              else if (direction > 0 && storiesHasMore) loadMoreStories();
            }}
          >
            <button type="button" className="storyViewerNav storyViewerPrev" onClick={() => moveStory(-1)} disabled={!hasPrevious} aria-label="Previous story">‹</button>
            <article className="storyViewerCard facebookStoryViewerCard">
              <div className="storyViewerProgress" aria-hidden="true">
                {stories.map((story, index) => <span key={story._id} className={index === storyIndex ? 'active' : index < storyIndex ? 'seen' : ''} />)}
              </div>
              <header className="storyViewerHeader">
                <div className="reelAuthorRow">
                  <img src={activeStory.author?.avatar || '/youtogram.jpg'} alt={activeStory.author?.username || 'Story'} className="reelAvatar" />
                  <div className="reelAuthorText">
                    <strong>{activeStory.author?.username || 'Youtogram user'}</strong>
                    <span>{storyIndex + 1} of {stories.length} · Story</span>
                  </div>
                </div>
                <button type="button" className="storyViewerClose" onClick={() => setActiveStory(null)} aria-label="Close story">×</button>
              </header>

              <div className="storyViewerMedia">
                {activeStory.media?.[0]?.url ? (
                  activeStory.media[0].type === 'video' ? (
                    <video key={activeStory._id} src={activeStory.media[0].url} controls autoPlay playsInline />
                  ) : (
                    <img key={activeStory._id} src={activeStory.media[0].url} alt="Story media" />
                  )
                ) : (
                  <div className="storyViewerTextOnly">{activeStory.text || 'Story'}</div>
                )}
              </div>

              {activeStory.text ? <p className="storyViewerCaption">{activeStory.text}</p> : null}
            </article>
            <button type="button" className="storyViewerNav storyViewerNext" onClick={() => moveStory(1)} disabled={!hasNext && !storiesHasMore} aria-label="Next story">›</button>
          </div>
        );
      })() : null}

      {sharedPost ? (
        <div className="shareModalOverlay" role="dialog" aria-modal="true" aria-labelledby="share-post-title">
          <section className="shareModal">
            <header className="shareModalHeader">
              <h2 id="share-post-title">Share</h2>
              <button type="button" className="shareModalClose" onClick={() => setSharePostId('')} aria-label="Close share dialog">×</button>
            </header>
            <div className="shareModalBody">
              <p className="sharePrivacyNotice">Links you share are unique to you and may be used to improve suggestions and ads that you see. <strong>Learn more</strong></p>
              <div className="shareProfileRow">
                <img src={profile?.avatar || '/youtogram.jpg'} alt={profile?.username || 'Profile'} />
                <div><strong>{profile?.username || 'Youtogram User'}</strong><span>Feed · Friends</span></div>
              </div>
              <textarea value={shareComment} onChange={(event) => setShareComment(event.target.value)} placeholder="Say something about this..." aria-label="Say something about this" />
              <button type="button" className="shareNowButton" onClick={handleShareNow}>Share now</button>
              {shareNote ? <p className="shareModalNote">{shareNote}</p> : null}
            </div>
            <div className="shareDestinations">
              <h3>Share to</h3>
              <div className="shareDestinationGrid">
                <button type="button" onClick={() => handleShareAction('messenger')}><span>↗</span><strong>Messenger</strong></button>
                <button type="button" onClick={() => handleShareAction('whatsapp')}><span>◔</span><strong>WhatsApp</strong></button>
                <button type="button" onClick={() => handleShareAction('story')}><span>▣</span><strong>Your story</strong></button>
                <button type="button" onClick={() => handleShareAction('copy')}><span>↗</span><strong>Copy link</strong></button>
                <button type="button" onClick={() => { setSharePostId(''); router.push('/friends'); }}><span>●</span><strong>Friend&apos;s profile</strong></button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
