import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../../api/auth';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { handleApiError } from '../../utils/errorHandler';
import { Image as ImageIcon } from 'lucide-react';

interface EditProfileFormProps {
  onSuccess: () => void;
}

export default function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      onSuccess();
    },
    onError: (err: any) => {
      const apiError = handleApiError(err);
      setError(apiError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (password) formData.append('password', password);
    if (avatarFile) formData.append('avatar', avatarFile);

    mutation.mutate(formData);
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
          Avatar
        </label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            {avatarFile ? avatarFile.name : 'Upload New Avatar'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
          {avatarFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAvatarFile(null)}
              className="text-error hover:bg-error/5"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
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
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-y transition-colors"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
          New Password (Leave blank to keep current)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
