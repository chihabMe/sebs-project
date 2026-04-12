import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../../api/auth';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

interface EditProfileFormProps {
  onSuccess: () => void;
}

export default function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, bio, avatar });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-outline-variant/10">
      {error && (
        <div className="p-4 bg-error/5 text-error rounded-xl text-xs font-bold border border-error/10">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
          Avatar URL
        </label>
        <input
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://..."
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-y transition-colors"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onSuccess}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
