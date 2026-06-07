'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ email: '', phone: '', country: '', bio: '', avatar: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const selectedTheme = window.localStorage.getItem('youtogram_theme') || 'dark';
    setTheme(selectedTheme);
    document.body.classList.toggle('light-theme', selectedTheme === 'light');
    document.documentElement.classList.toggle('light-theme', selectedTheme === 'light');
  }, []);

  useEffect(() => {
    authService.me()
      .then((response) => {
        const profileData = response.data;
        setProfile(profileData);
        setForm({
          email: profileData.email || '',
          phone: profileData.phone || '',
          country: profileData.country || '',
          bio: profileData.bio || '',
          avatar: profileData.avatar || ''
        });
      })
      .catch((loadError) => {
        if (loadError.message === 'Invalid token' || loadError.message === 'Authorization token required') {
          localStorage.removeItem('youtogram_token');
          router.replace('/');
          return;
        }

        setError(loadError.message || 'Unable to load profile.');
      });
  }, [router]);

  const handleThemeChange = (mode) => {
    setTheme(mode);
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('light-theme', mode === 'light');
      document.documentElement.classList.toggle('light-theme', mode === 'light');
      window.localStorage.setItem('youtogram_theme', mode);
      window.dispatchEvent(new CustomEvent('youtogram:themeChange', { detail: { theme: mode } }));
    }
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.updateProfile({
        email: form.email,
        phone: form.phone,
        country: form.country,
        bio: form.bio,
        avatar: form.avatar,
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined
      });
      setProfile(response.data);
      setMessage('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (updateError) {
      setError(updateError.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePurchaseVerified = async () => {
    setError('');
    setMessage('');
    if (!profile) return;
    if ((profile.points || 0) < 1000) {
      setError('You need at least 1000 points to purchase verification.');
      return;
    }

    try {
      // Try calling dedicated purchase endpoint first
      try {
        const response = await authService.purchaseVerification();
        setProfile(response.data);
        setMessage('Verification purchased. Congratulations!');
        return;
      } catch (purchaseErr) {
        // Fallback: mark verified via profile update and deduct points locally
      }

      const patched = await authService.updateProfile({ verified: true });
      // optimistic local deduction of points if backend didn't handle it
      const updated = { ...patched.data, points: (patched.data.points ?? profile.points) - 1000 };
      setProfile(updated);
      setMessage('Verification purchased (fallback).');
    } catch (err) {
      setError(err.message || 'Unable to complete verification purchase.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
      window.localStorage.removeItem('youtogram_token');
      window.history.replaceState(null, '', '/');
      window.history.pushState(null, '', '/');
      window.addEventListener('popstate', () => {
        if (!localStorage.getItem('youtogram_token')) {
          window.location.replace('/');
        }
      });
    }
    router.replace('/');
  };

  const updatePasswordWarning = newPassword ? 'You will need current password to save your new password.' : '';

  return (
    <main className="profilePage profileAccountPage">
      {profile ? (
        <>
          <section className="profileHeroCard">
            <div className="profileHeroTop">
              <div className="profileAvatarShell">
                <div className="profileAvatarPreview profileAvatarCircle">
                  {profile.avatar ? <img src={profile.avatar} alt="Profile avatar" /> : profile.username?.slice(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="profileHeroMeta">
                <div className="profileHeroTitleRow">
                  <div>
                    <p className="profileTag">Personal profile</p>
                    <h1>{profile.username || 'Your profile'}</h1>
                    <p className="profileHandle">@{(profile.username || 'youtogram user').toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                  <div className="themeSwitcher">
                    <span>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</span>
                    <button
                      type="button"
                      className="profileThemeButton"
                      onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    </button>
                  </div>
                </div>

                <p className="profileBioText profileBioHero">{profile.bio || 'Share a short bio to make your profile feel complete.'}</p>

                <div className="profileHeroStats">
                  <div>
                    <strong>{profile.points ?? 0}</strong>
                    <span>Points</span>
                  </div>
                  <div>
                    <strong>{profile.followerCount ?? 0}</strong>
                    <span>Followers</span>
                  </div>
                  <div>
                    <strong>{(profile.following || []).length}</strong>
                    <span>Following</span>
                  </div>
                  <div>
                    <strong>{(profile.friends || []).length}</strong>
                    <span>Friends</span>
                  </div>
                </div>

                <div className="profileHeroActions">
                  <button type="button" className="profilePrimaryButton" onClick={() => document.getElementById('profile-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    Edit profile
                  </button>
                  <button type="button" className="profileSecondaryButton" onClick={() => router.push('/feed')}>
                    Back to feed
                  </button>
                  <button type="button" className="profileDangerButton" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="profileDangerButtonIcon">
                      <path d="M16 17l5-5-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            <div className="profileHeroTabs">
              <button type="button" className="profileTabButton active">Posts</button>
              <button type="button" className="profileTabButton">Saved</button>
              <button type="button" className="profileTabButton">Tagged</button>
            </div>
          </section>

          <section className="profileContentGrid">
            <aside className="profileSideRail">
              <div className="profileCompactCard">
                <div className="profileInfoBlock">
                  <div>
                    <strong>Role</strong>
                    <span>{profile.role || 'user'}</span>
                  </div>
                  <div>
                    <strong>Country</strong>
                    <span>{profile.country || 'Not set'}</span>
                  </div>
                  <div>
                    <strong>Joined</strong>
                    <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="profileCompactCard">
                <h2>Bio</h2>
                <p className="profileBioText">{profile.bio || 'No bio added yet.'}</p>
              </div>
            </aside>

            <section className="profileEditPanel profileCompactCard" id="profile-edit-panel">
              <div className="profilePanelHeader">
                <div>
                  <h2>Edit profile</h2>
                  <p>Keep the important stuff current without losing the clean profile layout.</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className="profileBadge">{profile.verified ? 'Verified' : 'Not verified'}</span>
                  {profile.verified ? null : (
                    <button type="button" className="profilePrimaryButton" onClick={handlePurchaseVerified}>
                      Purchase verification (1000 pts)
                    </button>
                  )}
                </div>
              </div>

              {message ? <p className="profileSuccessBanner">{message}</p> : null}
              {error ? <p className="profileErrorBanner">{error}</p> : null}

              <form className="profileForm" onSubmit={handleSubmit}>
                <div className="profileField">
                  <label>Email address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="profileField">
                  <label>Phone number</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                </div>
                <div className="profileField">
                  <label>Country</label>
                  <input name="country" type="text" value={form.country} onChange={handleChange} placeholder="Country" />
                </div>
                <div className="profileField">
                  <label>Avatar URL</label>
                  <input name="avatar" type="url" value={form.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />
                </div>
                <div className="profileField profileFieldFull">
                  <label>Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell people what you do."></textarea>
                </div>
                <div className="profileField">
                  <label>Current password</label>
                  <input name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Required for secure updates" />
                </div>
                <div className="profileField">
                  <label>New password</label>
                  <input name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Leave empty to keep existing password" />
                  {updatePasswordWarning ? <small className="profileNote">{updatePasswordWarning}</small> : null}
                </div>
                <div className="profileFormFooter profileFieldFull">
                  <button type="submit" className="submitButton" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="profileSecondaryButton" onClick={() => router.push('/feed')}>Return to feed</button>
                </div>
              </form>
            </section>
          </section>
        </>
      ) : (
        <div className="profilePlaceholder">
          <p>Loading profile...</p>
        </div>
      )}
    </main>
  );
}
