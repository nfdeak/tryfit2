import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiUrl } from '../lib/api';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Check if Google OAuth is configured before redirecting
      const res = await fetch(apiUrl('/api/auth/google/check'), { credentials: 'include' });
      const data = await res.json();
      if (data.configured) {
        window.location.href = apiUrl('/api/auth/google');
      } else {
        setError('Google Sign-In is not configured. Please use credentials to sign in.');
      }
    } catch {
      setError('Google Sign-In is not available. Please use credentials to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-accent-fill rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary tracking-tight">Diet Plan</h1>
          <p className="font-display text-accent text-xl font-semibold">& Tracker</p>
          <p className="text-secondary text-sm mt-2 font-sans">Personalised AI-powered meal planning</p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-surface hover:bg-elevated text-primary font-medium py-3.5 rounded-xl font-sans text-base transition-all active:scale-95 border border-border mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-dimmed text-xs font-sans uppercase">or sign in with credentials</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5 font-sans">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-border text-primary rounded-xl px-4 py-3 font-sans text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 placeholder-dimmed transition-colors"
              placeholder="harshit"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5 font-sans">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-border text-primary rounded-xl px-4 py-3 font-sans text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 placeholder-dimmed transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl font-sans">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 active:scale-95 text-white font-semibold py-3.5 rounded-[14px] font-sans text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-dimmed text-xs mt-8 font-sans">AI-powered nutrition planning</p>
      </div>
    </div>
  );
}
