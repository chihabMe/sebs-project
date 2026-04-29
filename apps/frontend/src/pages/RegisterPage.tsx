import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { RegisterInput, ApiResponse, AuthResponse } from '@sebs/shared';
import { handleApiError } from '../utils/errorHandler';
import { passwordRules, validateStrongPassword } from '../utils/passwordPolicy';

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<'USER' | 'ORGANIZER'>('USER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth-user'], data.data?.user);
      if (data.data?.user.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err: unknown) => {
      const apiError = handleApiError(err);
      console.error('Registration request failed', {
        message: apiError.message,
        code: apiError.code,
        errorId: apiError.errorId,
        details: apiError.details,
      });
      setError(apiError.message || 'Registration failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordFailures = validateStrongPassword(formData.password);
    if (passwordFailures.length > 0) {
      setError(`Password is too weak: ${passwordFailures.join(', ')}`);
      return;
    }
    registerMutation.mutate({
      ...formData,
      role,
    });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden bg-surface-container-lowest rounded-xl shadow-none">
        {/* Left Side: Visual/Editorial Energy */}
        <section className="hidden md:flex md:col-span-5 relative bg-primary overflow-hidden min-h-[600px]">
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" 
            alt="Dynamic event atmosphere"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPrKPvw0DXmC-g9HRI5RfeTdbLJj1TKHtqr77eJ6ZMvHcxvtjBEd_B7MdffpmvwRC3vX2_aODFp3hNN4Uebbn7HFpgGtwaflS7Q8StupxesEKPokn3eaSC1eXhlCT53Uf2b8wjKVqMAg7ko_ks8tbm9q4fz2Ont-YD5FzFjVsIo_uQt0MElYvuFzAXrnKPNcpIrZWHEehZMmt9cK5QVJAIq44eX7MciRIdonO1NKsy0NolHF4sLkUD4A44Q8DZNTwskScNk2DiMAA" 
          />
          <div className="relative z-10 p-12 flex flex-col justify-between h-full">
            <div>
              <h1 className="text-on-primary text-4xl font-extrabold tracking-tighter leading-none mb-4">
                Indigo<br/>Pulse
              </h1>
              <div className="w-12 h-1 bg-secondary rounded-full"></div>
            </div>
            <div className="space-y-6">
              <p className="text-on-primary text-2xl font-headline tracking-tight leading-tight">
                Join the pulse of the city's most kinetic curation.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-on-primary/80 font-label text-xs uppercase tracking-widest">Live Registration Active</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary opacity-20 blur-3xl rounded-full translate-x-10 translate-y-10"></div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="col-span-1 md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <header className="mb-10">
              <h2 className="text-on-surface text-3xl font-bold tracking-tight mb-2">Create Account</h2>
              <p className="text-on-surface-variant text-sm">Sign up to SEBS and start curating your experience.</p>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Role Toggle */}
              <div className="space-y-3">
                <label className="text-on-surface-variant font-label text-xs uppercase tracking-widest font-semibold">I am an</label>
                <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-xl gap-1">
                  <button 
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                      role === 'USER' 
                        ? 'bg-surface-container-lowest text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-lowest/50'
                    }`}
                  >
                    Attendee
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('ORGANIZER')}
                    className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                      role === 'ORGANIZER' 
                        ? 'bg-surface-container-lowest text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-lowest/50'
                    }`}
                  >
                    Organizer
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name Field */}
                <div className="group">
                  <label className="block text-on-surface-variant font-label text-xs uppercase tracking-widest mb-2 font-semibold" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">person</span>
                    <input 
                      className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                      id="name" 
                      placeholder="Alex Rivera" 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-on-surface-variant font-label text-xs uppercase tracking-widest mb-2 font-semibold" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                    <input 
                      className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                      id="email" 
                      placeholder="alex@editorial.com" 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label className="block text-on-surface-variant font-label text-xs uppercase tracking-widest mb-2 font-semibold" htmlFor="password">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                    <input 
                      className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                      id="password" 
                      placeholder="••••••••" 
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 grid gap-1 rounded-xl bg-surface-container-high/60 p-3 text-xs text-on-surface-variant sm:grid-cols-2">
                    {passwordRules.map((rule) => {
                      const missing = validateStrongPassword(formData.password).includes(rule);
                      return (
                        <span key={rule} className={missing ? '' : 'font-bold text-primary'}>
                          {missing ? '-' : '[x]'} {rule}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button 
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all disabled:opacity-70" 
                type="submit"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="pt-8 text-center border-t border-outline-variant/10">
                <p className="text-on-surface-variant text-sm">
                  Already have an account? 
                  <Link to="/login" className="text-primary font-bold hover:underline ml-1">Login here</Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full py-6 flex flex-col items-center justify-center gap-2 px-4 pointer-events-none">
        <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40">
          © 2026 INDIGO PULSE. KINETIC CURATION FOR LIVE EVENTS.
        </p>
      </footer>
    </div>
  );
}
