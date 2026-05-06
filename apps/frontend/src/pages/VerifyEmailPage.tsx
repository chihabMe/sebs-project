import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { handleApiError } from '../utils/errorHandler';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (tokenToVerify: string) => {
      const response = await api.post('/auth/verify-email', { token: tokenToVerify });
      return response.data;
    },
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message || 'Email verified successfully! You can now sign in.');
    },
    onError: (err) => {
      setStatus('error');
      setMessage(handleApiError(err).message || 'Verification failed. The link might be invalid or expired.');
    }
  });

  useEffect(() => {
    if (token && status === 'idle') {
      setStatus('loading');
      verifyMutation.mutate(token);
    }
  }, [token, status, verifyMutation]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl p-8 shadow-[0_20px_40px_rgba(50,41,79,0.06)] text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
        
        <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-6">Email Verification</h2>
        
        {!token && (
          <div className="text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-primary">mail</span>
            <p className="text-lg font-medium mb-2">Please verify your email.</p>
            <p className="text-sm">We've sent a verification link to your email address. You need to verify your account before you can sign in.</p>
          </div>
        )}

        {token && status === 'loading' && (
          <div className="text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin text-5xl mb-4 text-primary">sync</span>
            <p className="text-lg font-medium">Verifying your email...</p>
          </div>
        )}

        {token && status === 'success' && (
          <div className="text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-green-500">check_circle</span>
            <p className="text-green-600 font-medium mb-6 text-lg">{message}</p>
            <Link 
              to="/login"
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {token && status === 'error' && (
          <div className="text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-error">error</span>
            <p className="text-error font-medium">{message}</p>
          </div>
        )}

        {(!token || status === 'error') && (
          <div className="mt-8 pt-6 border-t border-outline/20">
            <Link to="/login" className="text-primary hover:underline font-bold text-sm">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
