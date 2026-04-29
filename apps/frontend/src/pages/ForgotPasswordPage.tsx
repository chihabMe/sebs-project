import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import { Button } from '../components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => setSubmitted(true),
    onError: () => setSubmitted(true),
  });

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#faf4ff]/80 backdrop-blur-xl flex justify-center items-center px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Eventify logo" className="w-9 h-9 rounded-xl" />
          <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">Eventify</h1>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pt-28 pb-12">
        <div className="w-full max-w-md bg-surface-container-low rounded-xl p-8 md:p-10 shadow-[0_20px_40px_rgba(50,41,79,0.06)]">
          <header className="mb-8">
            <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Reset password</h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Enter your email and we will send a password reset link if the account exists.
            </p>
          </header>

          {submitted ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 text-sm font-medium text-on-surface-variant">
                If an account exists for that email, a password reset link has been sent.
              </div>
              <Link to="/login">
                <Button className="w-full">Back to login</Button>
              </Link>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ email });
              }}
            >
              <div className="space-y-2">
                <label className="text-[0.75rem] font-bold text-on-surface uppercase tracking-widest block ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-5 h-5" />
                  <input
                    className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium"
                    id="email"
                    placeholder="name@domain.com"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
