import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, getManageEvent } from '../api/events';
import { getAllTags } from '../api/tags';
import Header from '../components/layout/Header';
import TagPicker from '../components/ui/TagPicker';
import { formatImageUrl } from '../utils/formatUrl';

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'Music',
    maxTickets: 0,
    price: 0,
    autoApproveBookings: false,
    tags: [] as string[],
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const draftKey = isEdit ? `organizer-event-draft:${id}` : 'organizer-event-draft:new';

  const { data: existingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getManageEvent(id!),
    enabled: isEdit,
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        title: existingEvent.title,
        description: existingEvent.description,
        date: new Date(existingEvent.date).toISOString().split('T')[0],
        location: existingEvent.location,
        category: existingEvent.category,
        maxTickets: existingEvent.maxTickets,
        price: 0,
        autoApproveBookings: existingEvent.autoApproveBookings ?? false,
        tags: existingEvent.tags?.map((t: any) => t.id) || [],
      });
      setHasUnsavedChanges(false);
    }
  }, [existingEvent]);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(existingEvent?.image ? formatImageUrl(existingEvent.image) : null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(image);
    setImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [existingEvent?.image, image]);

  useEffect(() => {
    if (isEdit) return;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (!rawDraft) return;
      const parsedDraft = JSON.parse(rawDraft);
      setFormData((prev) => ({ ...prev, ...parsedDraft }));
    } catch {
      // Ignore malformed local draft data.
    }
  }, [draftKey, isEdit]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (!isEdit) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [draftKey, formData, hasUnsavedChanges, isEdit]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? updateEvent(id!, data) : createEvent(data),
    onSuccess: () => {
      localStorage.removeItem(draftKey);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-events'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['event', id] });
      }
      navigate('/organizer');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Something went wrong. Please check your data.');
    },
  });

  const updateFormField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setHasUnsavedChanges(true);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.tags.length < 3) {
      setError('Please select at least 3 tags.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'tags') {
        (value as string[]).forEach((tagId) => data.append('tags', tagId));
      } else {
        data.append(key, value.toString());
      }
    });
    if (image) {
      data.append('image', image);
    }

    mutation.mutate(data);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-4xl mx-auto w-full pb-20">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2">
            {isEdit ? 'Edit Experience' : 'Create New Experience'}
          </h2>
          <p className="text-on-surface-variant">Define the pulse and kinetic energy of your event.</p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-xl font-bold border border-error/10">
            {error}
          </div>
        )}

        <form className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/20 space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Event Title</label>
              <input 
                required
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="e.g., Neon Horizon: Digital Pulse"
                value={formData.title}
                onChange={(e) => updateFormField('title', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Description</label>
              <textarea 
                required
                rows={4}
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="Describe the vibe and experience..."
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Date</label>
              <input 
                required
                type="date"
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                value={formData.date}
                onChange={(e) => updateFormField('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Category</label>
              <select 
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none"
                value={formData.category}
                onChange={(e) => updateFormField('category', e.target.value)}
              >
                <option>Music</option>
                <option>Tech</option>
                <option>Art</option>
                <option>Food</option>
                <option>Social</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Location</label>
              <input 
                required
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="e.g., The Kinetic Hall"
                value={formData.location}
                onChange={(e) => updateFormField('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Event Image</label>
              <input 
                type="file"
                accept="image/*"
                className="w-full bg-surface-container-high rounded-xl py-3 px-6 text-on-surface font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary"
                onChange={(e) => {
                  setHasUnsavedChanges(true);
                  setImage(e.target.files ? e.target.files[0] : null);
                }}
              />
              <p className="text-xs text-outline ml-1">
                JPG, PNG, WebP, or GIF up to 5 MB.
              </p>
              {imagePreviewUrl && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high">
                  <img
                    src={imagePreviewUrl}
                    alt="Event preview"
                    className="h-52 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Max Tickets</label>
              <input 
                required
                type="number"
                min="1"
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                value={formData.maxTickets}
                onChange={(e) => updateFormField('maxTickets', parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Application Policy</label>
              <div className="bg-surface-container-high rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface">Auto-accept booking requests</p>
                  <p className="text-xs text-outline mt-1">
                    If enabled, users are accepted immediately after requesting this event. If disabled, requests stay pending for manual organizer approval.
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${formData.autoApproveBookings ? 'bg-primary' : 'bg-outline-variant/40'}`}
                  onClick={() => updateFormField('autoApproveBookings', !formData.autoApproveBookings)}
                  aria-label="Toggle auto approve bookings"
                >
                  <span
                    className={`block w-6 h-6 rounded-full bg-white transition-transform ${formData.autoApproveBookings ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <TagPicker 
                availableTags={tagsResponse?.data || []}
                selectedTagIds={formData.tags}
                onChange={(ids) => updateFormField('tags', ids)}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave anyway?')) {
                  return;
                }
                navigate('/organizer');
              }}
              className="px-8 py-4 rounded-xl font-bold hover:bg-surface-container-high transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
            >
              {mutation.isPending ? 'Processing...' : (isEdit ? 'Save Changes' : 'Launch Event')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
