import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { LoginInput, ApiResponse, AuthResponse } from '@sebs/shared';
import { ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
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
      if (data.data?.user.role !== 'ADMIN') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }
      
      // Set the user data in the cache immediately
      queryClient.setQueryData(['auth-user'], data.data?.user);
      navigate('/admin');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Invalid administrator credentials.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate(formData);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-error-container selection:text-on-error-container">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-center items-center px-6 py-8 border-b border-primary/5">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-2xl">shield_person</span>
          </div>
          <h1 className="text-xl font-black text-on-surface font-headline tracking-tighter uppercase">Admin Core</h1>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#3e0000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 shadow-[0_32px_64px_rgba(62,0,0,0.12)] border border-primary/5">
            <header className="mb-10 text-center">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/10">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black font-headline text-on-surface tracking-tighter uppercase mb-2">Central Node</h2>
              <p className="text-outline text-xs font-bold uppercase tracking-widest opacity-60">Authorization Required</p>
            </header>

            {error && (
              <div className="mb-8 p-4 bg-error/10 text-error rounded-2xl text-xs font-bold border border-error/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] block ml-1 opacity-60" htmlFor="email">Admin ID</label>
                <input 
                  className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-outline/30 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-bold" 
                  id="email" 
                  placeholder="admin@domain.com" 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] block ml-1 opacity-60" htmlFor="password">Security Key</label>
                <input 
                  className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 text-on-surface placeholder:text-outline/30 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-bold" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button 
                className="w-full bg-primary text-on-primary font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50" 
                type="submit"
                disabled={loginMutation.isPending}
              >
                <span>{loginMutation.isPending ? 'Verifying...' : 'Authorize Access'}</span>
                {!loginMutation.isPending && <span className="material-symbols-outlined text-xl">key</span>}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-outline text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors">
              Return to Standard Portal
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center mt-auto">
        <div className="text-[10px] font-black text-outline/40 uppercase tracking-[0.3em]">
          Secure Archive Node • SEBS v2.0
        </div>
      </footer>
    </div>
  );
}
