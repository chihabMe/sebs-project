import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../../api/auth';
import { getAllTags } from '../../api/tags';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { handleApiError } from '../../utils/errorHandler';
import { Image as ImageIcon } from 'lucide-react';
import TagPicker from '../ui/TagPicker';

interface EditProfileFormProps {
  onSuccess: () => void;
}

export default function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.tags?.map((tag) => tag.id) || []);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [notifyFollowersOnBooking, setNotifyFollowersOnBooking] = useState(Boolean(user?.notifyFollowersOnBooking));
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEditInterests = user?.role === 'USER';

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
    enabled: canEditInterests,
  });

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
    if (canEditInterests && selectedTags.length < 3) {
      setError('Please select at least 3 interests.');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (canEditInterests) {
      selectedTags.forEach((id) => formData.append('tags', id));
      formData.append('notifyFollowersOnBooking', String(notifyFollowersOnBooking));
    }
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

      {canEditInterests ? (
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
            Interests
          </label>
          <TagPicker
            availableTags={tagsResponse?.data || []}
            selectedTagIds={selectedTags}
            onChange={setSelectedTags}
            min={3}
            max={10}
          />
        </div>
      ) : null}

      {canEditInterests ? (
        <div className="rounded-xl border border-outline-variant/20 p-4 bg-surface">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Notify followers when I book events</p>
              <p className="text-xs text-on-surface-variant mt-1">
                If enabled, your followers receive a notification after you book an event.
              </p>
            </div>
            <Button
              type="button"
              variant={notifyFollowersOnBooking ? 'default' : 'outline'}
              onClick={() => setNotifyFollowersOnBooking((prev) => !prev)}
            >
              {notifyFollowersOnBooking ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      ) : null}

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
