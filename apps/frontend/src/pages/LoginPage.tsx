import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { LoginInput, ApiResponse, AuthResponse } from '@sebs/shared';
import { handleApiError } from '../utils/errorHandler';

const adminAppUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Set the user data in the cache immediately
      const user = data.data?.user;
      queryClient.setQueryData(['auth-user'], user);
      
      if (user?.role === 'ADMIN') {
        window.location.assign(adminAppUrl);
      } else if (user?.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err: unknown) => {
      const apiError = handleApiError(err);
      console.error('Login request failed', {
        message: apiError.message,
        code: apiError.code,
        errorId: apiError.errorId,
        details: apiError.details,
      });
      setError(apiError.message || 'Invalid email or password.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate(formData);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#faf4ff]/80 backdrop-blur-xl flex justify-center items-center px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
          <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">Indigo Pulse</h1>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px]"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-secondary-container/10 blur-[80px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-surface-container-low rounded-xl p-8 md:p-12 shadow-[0_20px_40px_rgba(50,41,79,0.06)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <header className="mb-10">
                <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant text-sm font-medium">Access your curated event dashboard.</p>
              </header>

              {error && (
                <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[0.75rem] font-bold text-on-surface uppercase tracking-widest block ml-1" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">mail</span>
                    <input 
                      className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium" 
                      id="email" 
                      placeholder="name@domain.com" 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[0.75rem] font-bold text-on-surface uppercase tracking-widest block" htmlFor="password">Password</label>
                    <Link to="#" className="text-[0.75rem] font-bold text-primary hover:underline transition-all">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">lock</span>
                    <input 
                      className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium" 
                      id="password" 
                      placeholder="••••••••" 
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <button 
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70" 
                  type="submit"
                  disabled={loginMutation.isPending}
                >
                  <span>{loginMutation.isPending ? 'Signing In...' : 'Sign In'}</span>
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-on-surface-variant text-sm font-medium">
              Don't have an account? 
              <Link to="/register" className="text-primary font-bold hover:underline ml-1">Register</Link>
            </p>
            <p className="mt-3 text-xs text-on-surface-variant/70">
              Administrators should use the dedicated admin portal.
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 px-6 mt-auto flex flex-col md:flex-row justify-center items-center gap-6">
        <div className="text-[0.75rem] text-on-surface-variant/60 font-medium tracking-wide">
          © 2026 Indigo Pulse. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
