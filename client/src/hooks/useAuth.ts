import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login', { username, password }, { withCredentials: true });
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (username: string, password: string, confirmPassword: string) => {
    const res = await axios.post(
      '/api/auth/signup',
      { username, password, confirmPassword },
      { withCredentials: true }
    );
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me', { withCredentials: true });
      setUser(res.data.user);
    } catch {
      // silent
    }
  };

  return { user, isLoading, login, signup, logout, refreshUser };
}
