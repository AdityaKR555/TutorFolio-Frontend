import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { adminApi, saveSession, errorText } from './api';
import './admin.css';
export default function AdminLogin({ initialChallenge }) {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(initialChallenge || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (challenge) {
        const { data } = await adminApi.post('/admin/auth/verify-otp', { challengeId: challenge.challengeId, otp });
        saveSession(data); navigate('/admin', { replace: true });
      } else {
        const { data } = await adminApi.post('/admin/auth/login', { email, password });
        setChallenge(data); setPassword('');
      }
    } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  return <div className="sa sa-login"><div className="sa-login-story"><Link to="/" className="sa-brand">tutorfolio<span>PLATFORM</span></Link><div><span className="sa-eyebrow">ADMINISTRATION</span><h1>One platform.<br/>A clear overview.</h1><p>Manage the services behind every teaching portfolio.</p></div><small>Platform administration · Authorized access only</small></div><main className="sa-login-panel"><ShieldCheck size={30}/><span className="sa-eyebrow">SECURE ACCESS</span><h2>{challenge ? 'Check your inbox.' : 'Welcome back.'}</h2><p>{challenge ? 'Enter the six-digit verification code sent to your admin email. Codes expire after five minutes.' : 'Sign in with your platform administrator account.'}</p><form onSubmit={submit}>{challenge ? <label>Verification code<input autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value)} /></label> : <><label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label></>}{error && <p className="sa-alert" role="alert">{error}</p>}<button className="sa-primary" disabled={busy}>{busy ? 'Please wait…' : challenge ? 'Verify and continue' : 'Continue'}<ArrowRight size={16}/></button></form>{challenge ? <button className="sa-text" disabled={busy} onClick={()=>{setChallenge(null);setOtp('');setError('');}}>Start again / request a new code</button> : <Link className="sa-text" to="/login">Back to tutor login</Link>}<small>Password + email verification protects every session.</small></main></div>;
}
