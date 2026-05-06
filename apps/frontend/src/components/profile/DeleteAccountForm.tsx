import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteProfile } from '../../api/auth';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast-provider';

export default function DeleteAccountForm() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteProfile(password),
    onSuccess: () => {
      queryClient.setQueryData(['auth-user'], null);
      showToast('Account deleted successfully.', 'success');
      navigate('/');
    },
    onError: (err: Error) => {
      const message = err.message || 'Could not delete account.';
      setError(message);
      showToast(message, 'error');
    },
  });

  const handleDelete = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (confirmation !== 'DELETE') {
      setError('Type DELETE to confirm account removal.');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleDelete} className="space-y-4 rounded-3xl border border-error/20 bg-error/5 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-error">Danger zone</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-on-surface">Delete account</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          This permanently deletes your user profile, bookings, and reviews. This action cannot be undone.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-bold text-error">{error}</div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-outline">Current password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 text-on-surface focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-outline">Type DELETE to confirm</label>
        <input
          type="text"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 text-on-surface focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
          required
        />
      </div>

      <Button type="submit" variant="destructive" disabled={mutation.isPending || !password.trim()}>
        {mutation.isPending ? 'Deleting...' : 'Delete my account'}
      </Button>
    </form>
  );
}
