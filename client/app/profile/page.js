'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { postService } from '../../services/posts';
import PostCard from '../../components/PostCard';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_AVATAR_BYTES = 850 * 1024;
const MAX_COVER_BYTES = 1200 * 1024;

function initials(name = 'Youtogram User') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'Y';
}

function makeProfileForm(profile) {
  return {
    email: profile.email || '', phone: profile.phone || '', country: profile.country || '', location: profile.location || '',
    website: profile.website || '', bio: profile.bio || '', avatar: profile.avatar || '', coverPhoto: profile.coverPhoto || ''
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ email: '', phone: '', country: '', location: '', website: '', bio: '', avatar: '', coverPhoto: '' });
  const [profilePosts, setProfilePosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const selectedTheme = window.localStorage.getItem('youtogram_theme') || 'dark';
    setTheme(selectedTheme);
    document.body.classList.toggle('light-theme', selectedTheme === 'light');
    document.documentElement.classList.toggle('light-theme', selectedTheme === 'light');
  }, []);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const [profileResponse, postsResponse] = await Promise.all([authService.me(), postService.mine()]);
        if (!active) return;
        setProfile(profileResponse.data);
        setForm(makeProfileForm(profileResponse.data));
        setProfilePosts(postsResponse.data?.items || []);
      } catch (loadError) {
        if (!active) return;
        if (loadError.message === 'Invalid token' || loadError.message === 'Authorization token required') {
          localStorage.removeItem('youtogram_token');
          router.replace('/');
          return;
        }
        setError(loadError.message || 'Unable to load your profile.');
      }
    };

    loadProfile();
    return () => { active = false; };
  }, [router]);

  const photos = useMemo(() => profilePosts.flatMap((post) =>
    (post.media || []).filter((media) => media.type === 'image' && media.url).map((media) => ({ ...media, post }))
  ), [profilePosts]);

  const handleThemeChange = (mode) => {
    setTheme(mode);
    document.body.classList.toggle('light-theme', mode === 'light');
    document.documentElement.classList.toggle('light-theme', mode === 'light');
    window.localStorage.setItem('youtogram_theme', mode);
    window.dispatchEvent(new CustomEvent('youtogram:themeChange', { detail: { theme: mode } }));
  };

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleImageChange = (event, field, maxBytes, setFileName, label) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      setError(`${label} must be ${Math.floor(maxBytes / 1024)} KB or smaller.`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, [field]: String(reader.result || '') }));
      setFileName(file.name);
      setError('');
    };
    reader.onerror = () => setError('Unable to read that image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.updateProfile({
        ...form,
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined
      });
      setProfile(response.data);
      setForm(makeProfileForm(response.data));
      setMessage('Your profile changes are live.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (updateError) {
      setError(updateError.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await postService.toggleLike(postId);
      setProfilePosts((items) => items.map((post) => post._id === postId ? response.data : post));
    } catch (likeError) {
      setError(likeError.message || 'Unable to update this reaction.');
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const response = await postService.addComment(postId, { text });
      setProfilePosts((items) => items.map((post) => post._id === postId ? response.data : post));
    } catch (commentError) {
      setError(commentError.message || 'Unable to add your comment.');
    }
  };

  const handleShare = async (postId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${postId}`);
      setMessage('Post link copied to your clipboard.');
    } catch {
      setError('Unable to copy the post link.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.sessionStorage.clear();
    localStorage.removeItem('youtogram_token');
    router.replace('/');
  };

  if (!profile) return <main className="profilePlaceholder"><p>{error || 'Loading profile...'}</p></main>;

  const joinedDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently';
  const coverPhoto = form.coverPhoto || profile.coverPhoto;
  const avatar = form.avatar || profile.avatar;

  return (
    <main className="profilePage profileAccountPage profileFacebookPage">
      <section className="profileHeroCard profileFacebookHero">
        <div className="profileCoverPhoto">
          {coverPhoto ? <img src={coverPhoto} alt="Your profile cover" /> : <div className="profileCoverFallback" aria-hidden="true" />}
          <label className="profilePhotoAction profileCoverAction">
            <input type="file" accept={IMAGE_TYPES} onChange={(event) => handleImageChange(event, 'coverPhoto', MAX_COVER_BYTES, setCoverFileName, 'Cover photo')} />
            <span>Change cover</span>
          </label>
        </div>

        <div className="profileFacebookIdentity">
          <div className="profileAvatarShell profileFacebookAvatarShell">
            <div className="profileAvatarPreview profileAvatarCircle">{avatar ? <img src={avatar} alt="Profile avatar" /> : initials(profile.username)}</div>
            <label className="profileAvatarEditButton" title="Change profile picture">
              <input type="file" accept={IMAGE_TYPES} onChange={(event) => handleImageChange(event, 'avatar', MAX_AVATAR_BYTES, setAvatarFileName, 'Profile picture')} />
              <span aria-hidden="true">+</span><span className="srOnly">Change profile picture</span>
            </label>
          </div>
          <div className="profileFacebookTitle">
            <div>
              <div className="profileNameRow"><h1>{profile.username || 'Your profile'}</h1>{profile.verified ? <span className="profileVerifiedMark" title="Verified account">✓</span> : null}</div>
              <p className="profileConnectionLine">{profile.followerCount ?? 0} followers · {(profile.friends || []).length} friends</p>
            </div>
            <div className="profileHeroActions">
              <button type="button" className="profilePrimaryButton" onClick={() => document.getElementById('profile-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Edit profile</button>
              <button type="button" className="profileSecondaryButton" onClick={() => router.push('/feed')}>Create post</button>
            </div>
          </div>
        </div>

        <div className="profileHeroTabs" role="tablist" aria-label="Profile sections">
          {['posts', 'photos', 'about'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`profileTabButton ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}
        </div>
      </section>

      {message ? <p className="profileSuccessBanner" role="status">{message}</p> : null}
      {error ? <p className="profileErrorBanner" role="alert">{error}</p> : null}

      <section className="profileContentGrid profileFacebookContent">
        <aside className="profileSideRail">
          <section className="profileCompactCard profileIntroCard">
            <h2>Intro</h2>
            <p className="profileBioText">{profile.bio || 'Add a bio so your community can get to know you.'}</p>
            <div className="profileIntroRows">
              {profile.location ? <span>Lives in {profile.location}</span> : null}
              {profile.country ? <span>From {profile.country}</span> : null}
              {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">Visit website</a> : null}
              <span>Joined {joinedDate}</span>
            </div>
            <button type="button" className="profileIntroEditButton" onClick={() => document.getElementById('profile-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Edit details</button>
          </section>

          <section className="profileCompactCard">
            <h2>Community</h2>
            <div className="profileCommunityStats"><span><strong>{profile.followerCount ?? 0}</strong> Followers</span><span><strong>{(profile.following || []).length}</strong> Following</span><span><strong>{(profile.friends || []).length}</strong> Friends</span></div>
          </section>

          <section className="profileCompactCard profileThemeCard">
            <span>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</span>
            <button type="button" className="profileThemeButton" onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</button>
          </section>
        </aside>

        <section className="profileMainColumn">
          {activeTab === 'posts' ? <>
            <section className="profileCompactCard profilePostPrompt"><div className="profilePostPromptAvatar">{avatar ? <img src={avatar} alt="" /> : initials(profile.username)}</div><button type="button" onClick={() => router.push('/feed')}>What&apos;s on your mind, {profile.username}?</button></section>
            {profilePosts.length ? <div className="profilePostsStack">{profilePosts.map((post) => <PostCard key={post._id} post={post} currentUserId={profile._id} onToggleLike={handleToggleLike} onAddComment={handleAddComment} onShare={handleShare} />)}</div> : <section className="profileCompactCard profileEmptyState"><h2>No posts yet</h2><p>Share your first update, photo, or video with your community.</p><button type="button" className="profilePrimaryButton" onClick={() => router.push('/feed')}>Create a post</button></section>}
          </> : null}

          {activeTab === 'photos' ? <section className="profileCompactCard">
            <div className="profilePanelHeader"><div><h2>Photos</h2><p>Photos you have shared in your posts.</p></div><span className="profilePhotoCount">{photos.length} photos</span></div>
            {photos.length ? <div className="profilePhotoGrid">{photos.map((photo, index) => <button type="button" key={`${photo.url}-${index}`} onClick={() => setActivePhoto(photo)}><img src={photo.url} alt={photo.post.text || 'Profile photo'} /></button>)}</div> : <div className="profileEmptyState"><p>Your shared photos will appear here.</p><button type="button" className="profilePrimaryButton" onClick={() => router.push('/feed')}>Share a photo</button></div>}
          </section> : null}

          {activeTab === 'about' ? <section className="profileCompactCard profileAboutCard">
            <div className="profilePanelHeader"><div><h2>About</h2><p>Manage the details your community sees.</p></div></div>
            <div className="profileAboutGrid"><div><span>Bio</span><strong>{profile.bio || 'Not added yet'}</strong></div><div><span>Location</span><strong>{profile.location || profile.country || 'Not added yet'}</strong></div><div><span>Website</span>{profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : <strong>Not added yet</strong>}</div><div><span>Joined</span><strong>{joinedDate}</strong></div></div>
          </section> : null}

          <section className="profileEditPanel profileCompactCard" id="profile-edit-panel">
            <div className="profilePanelHeader"><div><h2>Customize your profile</h2><p>Update your photos and details in one place.</p></div><span className="profileBadge">{profile.verified ? 'Verified' : 'Youtogram member'}</span></div>
            <form className="profileForm" onSubmit={handleSubmit}>
              <div className="profileField"><label>Email address</label><input name="email" type="email" value={form.email} onChange={handleChange} required /></div>
              <div className="profileField"><label>Phone number</label><input name="phone" type="tel" value={form.phone} onChange={handleChange} required /></div>
              <div className="profileField"><label>Country</label><input name="country" value={form.country} onChange={handleChange} placeholder="Country" /></div>
              <div className="profileField"><label>Current city</label><input name="location" value={form.location} onChange={handleChange} placeholder="City, region" maxLength={80} /></div>
              <div className="profileField profileFieldFull"><label>Website</label><input name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://yourwebsite.com" /></div>
              <div className="profileField profileFieldFull"><label>Bio</label><textarea name="bio" value={form.bio} onChange={handleChange} rows={4} maxLength={280} placeholder="Tell people a little about yourself." /><small className="profileNote">{form.bio.length}/280</small></div>
              <div className="profileField"><label>Profile picture</label><small className="profileNote">{avatarFileName || 'JPG, PNG, WebP, or GIF up to 850 KB.'}</small></div>
              <div className="profileField"><label>Cover photo</label><small className="profileNote">{coverFileName || 'JPG, PNG, WebP, or GIF up to 1.2 MB.'}</small></div>
              <div className="profileField"><label>Current password</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Only needed for email, phone, or password changes" /></div>
              <div className="profileField"><label>New password</label><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Leave blank to keep current password" /></div>
              <div className="profileFormFooter profileFieldFull"><button type="submit" className="submitButton" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button><button type="button" className="profileSecondaryButton" onClick={handleLogout}>Sign out</button></div>
            </form>
          </section>
        </section>
      </section>

      {activePhoto ? <div className="profilePhotoLightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setActivePhoto(null)}><button type="button" className="profilePhotoLightboxClose" onClick={() => setActivePhoto(null)} aria-label="Close photo">×</button><img src={activePhoto.url} alt={activePhoto.post.text || 'Profile photo'} onClick={(event) => event.stopPropagation()} /></div> : null}
    </main>
  );
}
