'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth';
import { countries, getCountry } from '../data/countries';

const defaultForm = { username: '', email: '', phone: '', password: '', country: 'Nigeria' };
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;

function isStrongPassword(value) {
  return passwordRule.test(value || '');
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const submitAfterAccept = useRef(false);
  const selectedCountry = getCountry(form.country);

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (token) {
      router.replace('/feed');
      return;
    }

    const blockNav = () => {
      window.history.pushState(null, '', window.location.href);
    };

    blockNav();
    window.addEventListener('popstate', blockNav);
    window.addEventListener('beforeunload', blockNav);

    return () => {
      window.removeEventListener('popstate', blockNav);
      window.removeEventListener('beforeunload', blockNav);
    };
  }, [router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    document.body.style.overflow = showTerms ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [showTerms]);

  const handleModalAccept = () => {
    setAcceptedTerms(true);
    setShowTerms(false);

    if (submitAfterAccept.current) {
      submitAfterAccept.current = false;
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (mode === 'register' && !isStrongPassword(form.password)) {
      setMessage('Password must be at least 10 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setShowTerms(true);
      submitAfterAccept.current = true;
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const data = await authService.login({ identifier: form.email, password: form.password });
        localStorage.setItem('youtogram_token', data.data.token);
        router.push('/feed');
      } else {
        const phoneNumber = form.phone.trim().startsWith(selectedCountry.dialCode)
          ? form.phone.trim()
          : `${selectedCountry.dialCode}${form.phone.trim().replace(/^0+/, '')}`;
        const payload = {
          username: form.username,
          email: form.email,
          phone: phoneNumber,
          phoneCountryCode: selectedCountry.dialCode,
          password: form.password,
          country: form.country
        };
        await authService.register(payload);
        const data = await authService.login({ identifier: form.email, password: form.password });
        localStorage.setItem('youtogram_token', data.data.token);
        router.push('/feed');
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="authBrandPane">
          <div className="brandHeader">
            <img src="/youtogram-logo.jpg" alt="Youtogram logo" className="brandIconLarge" />
            <div>
              <h1>Youtogram</h1>
              <p className="brandTagline">Connect.Share.Earn</p>
            </div>
          </div>

          <div className="authPreviewPanel" aria-hidden="true">
            <div className="authPreviewVideo">
              <span />
            </div>
            <div className="authPreviewLines">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="authCard">
          <div className="authCardHeader">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Log in with your email or mobile number.' : 'Choose your country so your mobile number matches your location.'}</p>
          </div>

          <div className="authToggle">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Log In
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Create Account
            </button>
          </div>

          <form ref={formRef} className="authForm" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label>
                  Username
                  <input name="username" value={form.username} onChange={handleChange} required />
                </label>
                <label>
                  Country
                  <select name="country" value={form.country} onChange={handleChange} required>
                    {countries.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              {mode === 'login' ? 'Email address or mobile number' : 'Email address'}
              <input name="email" type={mode === 'login' ? 'text' : 'email'} value={form.email} onChange={handleChange} required />
            </label>
            {mode === 'register' && (
              <label>
                Mobile number
                <div className="phoneInputGroup">
                  <span>{selectedCountry.dialCode}</span>
                  <input name="phone" type="tel" inputMode="tel" value={form.phone} onChange={handleChange} placeholder="8012345678" required />
                </div>
              </label>
            )}
            <label>
              Password
              <div className="passwordInputGroup">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={mode === 'register' ? 10 : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  aria-describedby={mode === 'register' ? 'password-rules' : undefined}
                />
                <button
                  type="button"
                  className="passwordToggleButton"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="passwordToggleIcon">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10.5 10.7a2.5 2.5 0 0 0 3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M6.2 6.8C4 8.3 2.4 10 1.5 12c2.1 4.5 6 7 10.5 7 1 0 1.9-.1 2.8-.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <>
                        <path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {mode === 'register' ? (
                <small id="password-rules" className="passwordRulesNote">
                  Use 10 or more characters with 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.
                </small>
              ) : null}
            </label>
            <div className="authTerms">
              <p className="termsNote">
                By clicking {mode === 'login' ? 'Log in' : 'Create account'}, you agree to review and accept the Terms of Service and Privacy Policy.
              </p>
            </div>
            {showTerms && (
              <div className="termsModalOverlay" role="dialog" aria-modal="true">
                <div className="termsModal">
                  <div className="termsModalHeader">
                    <h3>Youtogram Terms of Service & Privacy Policy</h3>
                    <p>Review and accept these terms to continue.</p>
                  </div>
                  <div className="termsModalContent">
                    <p>Welcome to Youtogram. By accessing or using our platform, you agree to these Terms.</p>
                    <p>Use of the Platform: You may create, share, and engage with content only for lawful purposes. Do not post illegal, harmful, misleading content, engage in fraud, impersonation, or scams, violate intellectual property rights, or harass others.</p>
                    <p>User Accounts: You are responsible for your account and activity. Keep your login details secure. We may suspend or terminate accounts that violate our rules.</p>
                    <p>Content Ownership: You retain ownership of content you post, but by posting you grant Youtogram a license to display and distribute your content on the platform.</p>
                    <p>Content Moderation: We reserve the right to remove content that violates our policies and suspend or ban users when necessary.</p>
                    <p>Limitation of Liability: Youtogram is provided “as is.” We are not responsible for user-generated content, loss of data, or damages from using the platform.</p>
                    <h4>Privacy Policy</h4>
                    <p>Your privacy matters. We may collect name, email, profile details, content, usage data, and device/log information.</p>
                    <p>How We Use Your Information: We use your data to provide and improve services, personalize your experience, communicate with you, and keep the platform safe.</p>
                    <p>Sharing of Information: We do not sell your personal data. We may share data with service providers, if required by law, or to prevent fraud or harm.</p>
                    <p>Data Security: We take reasonable steps to protect your data, but no system is 100% secure.</p>
                    <p>Your Rights: You can access or update your information, request account deletion, and opt out of communications.</p>
                    <p>Cookies: We may use cookies to improve user experience and track usage.</p>
                    <p>Changes to Policy: We may update this policy. Continued use means you accept the updates.</p>
                  </div>
                  <button type="button" className="termsModalButton" onClick={handleModalAccept}>
                    Accept Terms of Service
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="submitButton">
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
            {message && <p className="authMessage">{message}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
