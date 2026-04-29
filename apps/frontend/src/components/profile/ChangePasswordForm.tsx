import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { passwordRules, validateStrongPassword } from '../../utils/passwordPolicy';
import { changePassword } from '../../api/auth';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast-provider';

export default function ChangePasswordForm() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const failures = validateStrongPassword(newPassword);

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      showToast('Password changed successfully.', 'success');
    },
    onError: (err: Error) => {
      setError(err.message || 'Could not change password.');
      showToast(err.message || 'Could not change password.', 'error');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (currentPassword === newPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    if (failures.length > 0) {
      setError(`Password is too weak: ${failures.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-lg">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-outline">Security</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-on-surface">Change password</h3>
        <p className="mt-2 text-sm text-on-surface-variant">Use your current password to set a stronger one.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/10 bg-error/5 p-4 text-xs font-bold text-error">
          {error}
        </div>
      ) : null}

      <input
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        placeholder="Current password"
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        required
      />
      <input
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="New password"
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        required
      />

      <div className="grid gap-2 rounded-2xl bg-surface-container-high/60 p-4 text-xs text-on-surface-variant sm:grid-cols-2">
        {passwordRules.map((rule) => (
          <span key={rule} className={failures.includes(rule) ? 'text-on-surface-variant' : 'font-bold text-primary'}>
            {failures.includes(rule) ? '-' : '[x]'} {rule}
          </span>
        ))}
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Changing...' : 'Change password'}
      </Button>
    </form>
  );
}
