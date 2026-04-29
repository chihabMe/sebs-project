import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { resetPassword } from '../api/auth';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast-provider';
import { passwordRules, validateStrongPassword } from '../utils/passwordPolicy';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      showToast(response.message || 'Password reset successfully.', 'success');
      navigate('/login');
    },
    onError: (err: Error) => setError(err.message || 'Could not reset password.'),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is missing.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const passwordFailures = validateStrongPassword(password);
    if (passwordFailures.length > 0) {
      setError(`Password is too weak: ${passwordFailures.join(', ')}`);
      return;
    }

    mutation.mutate({ token, password });
  };

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
            <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Choose new password</h2>
            <p className="text-on-surface-variant text-sm font-medium">Use a strong password that meets all rules below.</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={submit}>
            <PasswordInput
              id="password"
              label="New Password"
              value={password}
              onChange={setPassword}
              placeholder="New password"
            />
            <PasswordInput
              id="confirm-password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
            />

            <div className="grid gap-2 rounded-2xl bg-surface-container-high/60 p-4 text-xs text-on-surface-variant sm:grid-cols-2">
              {passwordRules.map((rule) => {
                const missing = validateStrongPassword(password).includes(rule);
                return (
                  <span key={rule} className={missing ? '' : 'font-bold text-primary'}>
                    {missing ? '-' : '[x]'} {rule}
                  </span>
                );
              })}
            </div>

            <Button type="submit" disabled={mutation.isPending || !token} className="w-full">
              {mutation.isPending ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[0.75rem] font-bold text-on-surface uppercase tracking-widest block ml-1" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-5 h-5" />
        <input
          className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium"
          id={id}
          placeholder={placeholder}
          type="password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
