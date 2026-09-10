'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '../../../services/auth';
import { postService } from '../../../services/posts';
import PostCard from '../../../components/PostCard';

function initials(name = 'Youtogram User') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'Y';
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [activePhoto, setActivePhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params?.id) return undefined;
    let active = true;

    const loadProfile = async () => {
      try {
        const [viewerResponse, profileResponse, postsResponse] = await Promise.all([
          authService.me(), authService.getUserProfile(params.id), postService.byUser(params.id)
        ]);
        if (!active) return;
        if (String(viewerResponse.data?._id) === String(params.id)) {
          router.replace('/profile');
          return;
        }
        setViewer(viewerResponse.data);
        setProfile(profileResponse.data);
        setPosts(postsResponse.data?.items || []);
      } catch (loadError) {
        if (!active) return;
        if (loadError.message === 'Invalid token' || loadError.message === 'Authorization token required') {
          localStorage.removeItem('youtogram_token');
          router.replace('/');
          return;
        }
        setError(loadError.message || 'Unable to load this profile.');
      }
    };

    loadProfile();
    return () => { active = false; };
  }, [params?.id, router]);

  const photos = useMemo(() => posts.flatMap((post) =>
    (post.media || []).filter((media) => media.type === 'image' && media.url).map((media) => ({ ...media, post }))
  ), [posts]);

  const handleFollow = async () => {
    if (!profile || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = profile.isFollowing
        ? await authService.unfollowUser(profile._id)
        : await authService.followUser(profile._id);
      setProfile((current) => ({ ...current, isFollowing: !current.isFollowing, followerCount: response.data.followerCount }));
    } catch (followError) {
      setError(followError.message || 'Unable to update follow status.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile || busy) return;
    setBusy(true);
    setError('');
    try {
      await authService.sendFriendRequest(profile._id);
      setProfile((current) => ({ ...current, isFriend: true, friendCount: (current.friendCount || 0) + 1 }));
    } catch (friendError) {
      setError(friendError.message || 'Unable to add this friend.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await postService.toggleLike(postId);
      setPosts((items) => items.map((post) => post._id === postId ? response.data : post));
    } catch (likeError) {
      setError(likeError.message || 'Unable to update this reaction.');
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const response = await postService.addComment(postId, { text });
      setPosts((items) => items.map((post) => post._id === postId ? response.data : post));
    } catch (commentError) {
      setError(commentError.message || 'Unable to add your comment.');
    }
  };

  const handleShare = async (postId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${postId}`);
    } catch {
      setError('Unable to copy the post link.');
    }
  };

  if (!profile) return <main className="profilePlaceholder"><p>{error || 'Loading profile...'}</p></main>;

  const joinedDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <main className="profilePage profileAccountPage profileFacebookPage">
      <section className="profileHeroCard profileFacebookHero">
        <div className="profileCoverPhoto">
          {profile.coverPhoto ? <img src={profile.coverPhoto} alt={`${profile.username}'s profile cover`} /> : <div className="profileCoverFallback" aria-hidden="true" />}
        </div>
        <div className="profileFacebookIdentity">
          <div className="profileAvatarShell profileFacebookAvatarShell"><div className="profileAvatarPreview profileAvatarCircle">{profile.avatar ? <img src={profile.avatar} alt={`${profile.username}'s avatar`} /> : initials(profile.username)}</div></div>
          <div className="profileFacebookTitle">
            <div><div className="profileNameRow"><h1>{profile.username}</h1></div><p className="profileConnectionLine">{profile.followerCount} followers · {profile.friendCount} friends</p></div>
            <div className="profileHeroActions profilePublicActions">
              <button type="button" className={`profilePrimaryButton ${profile.isFollowing ? 'profileFollowingButton' : ''}`} disabled={busy} onClick={handleFollow}>{profile.isFollowing ? 'Following' : 'Follow'}</button>
              <button type="button" className="profileSecondaryButton" disabled={busy || profile.isFriend} onClick={handleAddFriend}>{profile.isFriend ? 'Friends' : 'Add friend'}</button>
            </div>
          </div>
        </div>
        <div className="profileHeroTabs" role="tablist" aria-label="Profile sections">
          {['posts', 'photos', 'about'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`profileTabButton ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}
        </div>
      </section>

      {error ? <p className="profileErrorBanner" role="alert">{error}</p> : null}
      <section className="profileContentGrid profileFacebookContent">
        <aside className="profileSideRail">
          <section className="profileCompactCard profileIntroCard"><h2>Intro</h2><p className="profileBioText">{profile.bio || 'No bio added yet.'}</p><div className="profileIntroRows">{profile.location ? <span>Lives in {profile.location}</span> : null}{profile.country ? <span>From {profile.country}</span> : null}{profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">Visit website</a> : null}<span>Joined {joinedDate}</span></div></section>
          <section className="profileCompactCard"><h2>Community</h2><div className="profileCommunityStats"><span><strong>{profile.followerCount}</strong> Followers</span><span><strong>{profile.followingCount}</strong> Following</span><span><strong>{profile.friendCount}</strong> Friends</span></div></section>
        </aside>
        <section className="profileMainColumn">
          {activeTab === 'posts' ? (posts.length ? <div className="profilePostsStack">{posts.map((post) => <PostCard key={post._id} post={post} currentUserId={viewer?._id} onToggleLike={handleToggleLike} onAddComment={handleAddComment} onShare={handleShare} />)}</div> : <section className="profileCompactCard profileEmptyState"><h2>No posts yet</h2><p>{profile.username} has not shared a post yet.</p></section>) : null}
          {activeTab === 'photos' ? <section className="profileCompactCard"><div className="profilePanelHeader"><div><h2>Photos</h2><p>Photos shared by {profile.username}.</p></div><span className="profilePhotoCount">{photos.length} photos</span></div>{photos.length ? <div className="profilePhotoGrid">{photos.map((photo, index) => <button type="button" key={`${photo.url}-${index}`} onClick={() => setActivePhoto(photo)}><img src={photo.url} alt={photo.post.text || `${profile.username}'s photo`} /></button>)}</div> : <div className="profileEmptyState"><p>No photos have been shared yet.</p></div>}</section> : null}
          {activeTab === 'about' ? <section className="profileCompactCard profileAboutCard"><div className="profilePanelHeader"><div><h2>About</h2><p>Profile details shared by {profile.username}.</p></div></div><div className="profileAboutGrid"><div><span>Bio</span><strong>{profile.bio || 'Not added yet'}</strong></div><div><span>Location</span><strong>{profile.location || profile.country || 'Not added yet'}</strong></div><div><span>Website</span>{profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : <strong>Not added yet</strong>}</div><div><span>Joined</span><strong>{joinedDate}</strong></div></div></section> : null}
        </section>
      </section>
      {activePhoto ? <div className="profilePhotoLightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setActivePhoto(null)}><button type="button" className="profilePhotoLightboxClose" onClick={() => setActivePhoto(null)} aria-label="Close photo">×</button><img src={activePhoto.url} alt={activePhoto.post.text || `${profile.username}'s photo`} onClick={(event) => event.stopPropagation()} /></div> : null}
    </main>
  );
}
