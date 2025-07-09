import { useState, useRef, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaGoogle, FaEye, FaEyeSlash, FaGithub, FaApple, FaMicrosoft } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

function PasswordStrengthMeter({ password }) {
  const getStrength = pwd => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Weak', color: '#e57373', width: '33%' };
    if (pwd.match(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/)) return { label: 'Strong', color: '#43a047', width: '100%' };
    if (pwd.length >= 6) return { label: 'Medium', color: '#ffd600', width: '66%' };
    return { label: 'Weak', color: '#e57373', width: '33%' };
  };
  const { label, color, width } = getStrength(password);
  return (
    <div style={{ height: 8, background: '#eee', borderRadius: 6, marginTop: 4, marginBottom: 2, width: '100%' }}>
      <div style={{ height: 8, borderRadius: 6, width, background: color, transition: 'width 0.3s, background 0.3s' }} />
      <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [userObj, setUserObj] = useState(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const cardRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : 'user';
        setRole(userRole);
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userRole = userDoc.exists() ? userDoc.data().role : 'user';
      setRole(userRole);
      if (!userCredential.user.emailVerified) {
        setUnverified(true);
        setUserObj(userCredential.user);
        setError('Email not verified. Please check your inbox.');
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (userObj) {
      try {
        await sendEmailVerification(userObj);
        toast.success('Verification email sent.');
      } catch {
        toast.error('Failed to send verification email.');
      }
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Password reset email sent.');
      setResetMode(false);
      setResetEmail('');
    } catch {
      toast.error('Failed to send password reset email.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!result.user.emailVerified && result.user.providerData[0].providerId === 'password') {
        toast.error('Please verify your email.');
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      navigate('/dashboard');
      toast.success('Logged in with Google');
    } catch {
      toast.error('Google sign-in failed.');
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  if (currentUser && role) {
    // Already logged in, redirecting
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'none', position: 'relative' }}>
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '6px solid #e3eafe', borderTop: '6px solid #6e8efb', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <div ref={cardRef} className="login-card" style={{
        background: highContrast ? '#222' : 'rgba(255,255,255,0.55)',
        color: highContrast ? '#fff' : undefined,
        padding: 48,
        borderRadius: 28,
        boxShadow: '0 8px 32px 0 rgba(106,142,251,0.13)',
        width: 380,
        backdropFilter: 'blur(18px)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s, background 0.2s, color 0.2s',
        animation: shake ? 'shake 0.6s' : 'none'
      }} role="form" aria-label="Login form">
        <button
          onClick={() => setHighContrast(v => !v)}
          aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
          style={{
            alignSelf: 'flex-end',
            marginBottom: 8,
            background: highContrast ? '#ffd600' : '#e3eafe',
            color: highContrast ? '#222' : '#6e8efb',
            border: 'none',
            borderRadius: 8,
            padding: '6px 16px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 1px 4px #6e8efb22',
            transition: 'background 0.2s, color 0.2s',
            outline: 'none',
          }}
          tabIndex={0}
        >
          {highContrast ? 'Standard Mode' : 'High Contrast'}
        </button>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="App Logo" style={{ width: 64, height: 64, marginBottom: 18, filter: 'drop-shadow(0 2px 8px #6e8efb55)' }} />
        <h2 style={{ marginBottom: 10, textAlign: 'center', fontWeight: 800, color: highContrast ? '#ffd600' : '#6e8efb', fontSize: 28, letterSpacing: 1.2 }}>Login</h2>
        <div style={{ marginBottom: 22, color: highContrast ? '#ffd600' : '#888', fontSize: 16, textAlign: 'center', fontWeight: 500 }}>
          Welcome back! Sign in to access your Service Desk.
        </div>
        {resetMode ? (
          <form onSubmit={handleReset} style={{ width: '100%' }} aria-label="Password reset form">
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              aria-label="Email address for password reset"
              style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 12, border: highContrast ? '1.5px solid #ffd600' : '1.5px solid #e3eafe', fontSize: 17, background: highContrast ? '#111' : 'rgba(255,255,255,0.95)', color: highContrast ? '#fff' : undefined, boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
              onFocus={e => e.target.style.border='1.5px solid #6e8efb'}
              onBlur={e => e.target.style.border=highContrast ? '1.5px solid #ffd600' : '1.5px solid #e3eafe'}
              tabIndex={0}
            />
            <button type="submit" aria-label="Send password reset email" style={{ width: '100%', padding: 14, borderRadius: 999, background: highContrast ? '#ffd600' : 'linear-gradient(90deg, #6e8efb 60%, #a777e3 100%)', color: highContrast ? '#222' : '#fff', fontWeight: 700, fontSize: 17, border: 'none', cursor: 'pointer', marginBottom: 10, boxShadow: '0 2px 8px #6e8efb22', transition: 'background 0.2s', outline: 'none' }} tabIndex={0}>Send Reset Email</button>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button type="button" onClick={() => setResetMode(false)} aria-label="Back to login" style={{ background: 'none', color: highContrast ? '#ffd600' : '#6e8efb', border: 'none', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 15, outline: 'none' }} tabIndex={0}>Back to Login</button>
            </div>
          </form>
        ) : (
          <>
            <button
              className="google-signin-btn"
              aria-label="Sign in with Google"
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: '8px',
                background: '#fff',
                color: '#175873',
                fontWeight: 700,
                fontSize: '16px',
                border: '1px solid #c8d8e4',
                cursor: 'pointer',
                marginBottom: '18px',
                boxShadow: '0 2px 8px #c8d8e422',
                transition: 'background 0.2s, color 0.2s',
                outline: 'none',
              }}
            >
              Sign in with Google
            </button>
            <form onSubmit={handleSubmit} style={{ width: '100%' }} aria-label="Login form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                aria-label="Email address"
                style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 12, border: highContrast ? '1.5px solid #ffd600' : '1.5px solid #e3eafe', fontSize: 17, background: highContrast ? '#111' : 'rgba(255,255,255,0.95)', color: highContrast ? '#fff' : undefined, boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
                onFocus={e => e.target.style.border='1.5px solid #6e8efb'}
                onBlur={e => e.target.style.border=highContrast ? '1.5px solid #ffd600' : '1.5px solid #e3eafe'}
                tabIndex={0}
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  aria-label="Password"
                  style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 12, border: highContrast ? '1.5px solid #ffd600' : '1.5px solid #e3eafe', fontSize: 17, background: highContrast ? '#111' : 'rgba(255,255,255,0.95)', color: highContrast ? '#fff' : undefined, boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
                />
                <span
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 16, top: 14, cursor: 'pointer', color: highContrast ? '#ffd600' : '#888', fontSize: 20 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  role="button"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: highContrast ? '#ffd600' : '#6e8efb', width: 18, height: 18 }} />
                <label htmlFor="rememberMe" style={{ fontSize: 15, color: highContrast ? '#ffd600' : '#555', margin: 0, cursor: 'pointer' }}>Remember Me</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <input type="checkbox" id="acceptTerms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ accentColor: highContrast ? '#ffd600' : '#6e8efb', width: 18, height: 18 }} required />
                <label htmlFor="acceptTerms" style={{ fontSize: 15, color: highContrast ? '#ffd600' : '#555', margin: 0, cursor: 'pointer' }}>
                  I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2b6777', textDecoration: 'underline' }}>Terms and Conditions</a>
                </label>
              </div>
              <button type="submit" style={{ width: '100%', padding: 14, borderRadius: 999, background: 'linear-gradient(90deg, #6e8efb 60%, #a777e3 100%)', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', cursor: acceptTerms && !loading ? 'pointer' : 'not-allowed', marginBottom: 8, opacity: acceptTerms && !loading ? 1 : 0.6 }} disabled={!acceptTerms || loading}> {loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ color: '#888' }}>Don't have an account? </span>
              <Link to="/register" style={{ color: '#2b6777', textDecoration: 'none', fontWeight: 500 }}>Register</Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => setResetMode(true)} style={{ background: 'none', border: 'none', color: highContrast ? '#ffd600' : '#2b6777', textDecoration: 'underline', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Forgot Password?</button>
            </div>
            {error && <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>{error}</div>}
            {unverified && (
              <div style={{ color: '#e57373', marginTop: 16, textAlign: 'center' }}>
                Email not verified. <button onClick={handleResend} style={{ color: '#2b6777', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Resend Verification</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Login; 