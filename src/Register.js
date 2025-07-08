import { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const ADMIN_SECRET = 'ADMIN2024'; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      const role = adminCode === ADMIN_SECRET ? 'admin' : 'user';
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role
      });
      setSuccess('Registration successful. Please check your email to verify your account.');
      setEmail('');
      setPassword('');
      setAdminCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Registration successful. You are now signed in.');
    } catch (err) {
      setError('Google sign-up failed.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'none', position: 'relative' }}>
      <div className="login-card" style={{ background: 'rgba(255,255,255,0.55)', padding: 48, borderRadius: 28, boxShadow: '0 8px 32px 0 rgba(106,142,251,0.13)', width: 380, border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="App Logo" style={{ width: 64, height: 64, marginBottom: 18, filter: 'drop-shadow(0 2px 8px #6e8efb55)' }} />
        <h2 style={{ marginBottom: 10, textAlign: 'center', fontWeight: 800, color: '#6e8efb', fontSize: 28, letterSpacing: 1.2 }}>Register</h2>
        <div style={{ marginBottom: 22, color: '#888', fontSize: 16, textAlign: 'center', fontWeight: 500 }}>
          Create your account to access the Service Desk.
        </div>
        <button onClick={handleGoogleSignUp} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#fff', color: '#175873', fontWeight: 700, fontSize: 16, border: '1px solid #c8d8e4', cursor: 'pointer', marginBottom: 18, boxShadow: '0 2px 8px #c8d8e422', transition: 'background 0.2s, color 0.2s', outline: 'none' }}>Sign up with Google</button>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 16, padding: 12, borderRadius: 12, border: '1.5px solid #e3eafe', fontSize: 17, background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 16, padding: 12, borderRadius: 12, border: '1.5px solid #e3eafe', fontSize: 17, background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8, padding: 12, borderRadius: 12, border: '1.5px solid #e3eafe', fontSize: 17, background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
          />
          <input
            type="text"
            placeholder="Admin Code (optional)"
            value={adminCode}
            onChange={e => setAdminCode(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 12, borderRadius: 12, border: '1.5px solid #e3eafe', fontSize: 17, background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px #6e8efb11', transition: 'border 0.2s, box-shadow 0.2s' }}
          />
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
            Use code <b>ADMIN2024</b> to register as an admin.
          </div>
          <PasswordStrengthMeter password={password} />
          <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
            <input type="checkbox" id="acceptTerms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} required style={{ marginRight: 8 }} />
            <label htmlFor="acceptTerms" style={{ fontSize: 14, color: '#555' }}>
              I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2b6777', textDecoration: 'underline' }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2b6777', textDecoration: 'underline' }}>Privacy Policy</a>
            </label>
          </div>
          <button type="submit" disabled={!acceptTerms || !name || !email || !password || loading} style={{ width: '100%', padding: 14, borderRadius: 999, background: 'linear-gradient(90deg, #6e8efb 60%, #a777e3 100%)', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', cursor: acceptTerms && name && email && password && !loading ? 'pointer' : 'not-allowed', marginBottom: 8, opacity: acceptTerms && name && email && password && !loading ? 1 : 0.6 }}> {loading ? 'Registering...' : 'Register'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ color: '#888' }}>Already have an account? </span>
          <Link to="/login" style={{ color: '#2b6777', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
        </div>
        {error && <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#2b6777', marginTop: 16, textAlign: 'center' }}>{success}</div>}
      </div>
    </div>
  );
}

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

export default Register; 