import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, getManageEvent } from '../api/events';
import { getAllTags } from '../api/tags';
import Header from '../components/layout/Header';
import TagPicker from '../components/ui/TagPicker';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const draftKey = isEdit ? `organizer-event-draft:${id}` : 'organizer-event-draft:new';
  const stepTitles = ['Basics', 'Media & Capacity', 'Policy & Tags', 'Review'];

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
      setSelectedImageName('');
      setImagePreviewUrl(existingEvent?.image ? formatImageUrl(existingEvent.image) : null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(image);
    setSelectedImageName(image.name);
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

  const validateStep = (step: number) => {
    if (step === 0) {
      if (!formData.title.trim()) return 'Title is required.';
      if (!formData.description.trim()) return 'Description is required.';
      if (!formData.date) return 'Date is required.';
      if (!formData.location.trim()) return 'Location is required.';
    }
    if (step === 1) {
      if (!formData.maxTickets || formData.maxTickets < 1) return 'Max tickets must be at least 1.';
      if (formData.price < 0) return 'Price cannot be negative.';
    }
    if (step === 2) {
      if (formData.tags.length < 3) return 'Please select at least 3 tags.';
    }
    return null;
  };

  const goToStep = (nextStep: number) => {
    const stepError = validateStep(currentStep);
    if (nextStep > currentStep && stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setCurrentStep(nextStep);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const stepError = validateStep(0) || validateStep(1) || validateStep(2);
    if (stepError) {
      setError(stepError);
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
          <Tabs value={String(currentStep)} onValueChange={(value) => setCurrentStep(Number(value))}>
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 rounded-2xl bg-surface-container-high">
              {stepTitles.map((step, index) => (
                <TabsTrigger
                  key={step}
                  value={String(index)}
                  className="rounded-xl py-3 text-xs font-black uppercase tracking-widest"
                  disabled={index > currentStep + 1}
                >
                  {index + 1}. {step}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {currentStep === 0 ? (
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
                  rows={5}
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
                <Select value={formData.category} onValueChange={(value) => updateFormField('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Location</label>
                <input
                  required
                  className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="e.g., The Kinetic Hall"
                  value={formData.location}
                  onChange={(e) => updateFormField('location', e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Event Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-surface-container-high rounded-xl py-3 px-6 text-on-surface font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary"
                  onChange={(e) => {
                    setHasUnsavedChanges(true);
                    const file = e.target.files?.[0] || null;
                    setImage(file);
                  }}
                />
                <p className="text-xs text-outline ml-1">JPG, PNG, WebP, or GIF up to 5 MB.</p>
                {selectedImageName ? (
                  <p className="text-xs font-semibold text-primary ml-1">Selected: {selectedImageName}</p>
                ) : null}
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

              <div className="space-y-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  value={formData.price}
                  onChange={(e) => updateFormField('price', parseFloat(e.target.value) || 0)}
                />
              </div>

              {imagePreviewUrl ? (
                <div className="md:col-span-2 mt-2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high">
                  <img src={imagePreviewUrl} alt="Event preview" className="h-56 w-full object-cover" />
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
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

              <div>
                <TagPicker
                  availableTags={tagsResponse?.data || []}
                  selectedTagIds={formData.tags}
                  onChange={(ids) => updateFormField('tags', ids)}
                />
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReviewItem label="Title" value={formData.title} />
              <ReviewItem label="Category" value={formData.category} />
              <ReviewItem label="Date" value={formData.date || '-'} />
              <ReviewItem label="Location" value={formData.location} />
              <ReviewItem label="Max tickets" value={String(formData.maxTickets)} />
              <ReviewItem label="Price" value={String(formData.price)} />
              <ReviewItem label="Auto-approve" value={formData.autoApproveBookings ? 'Enabled' : 'Disabled'} />
              <ReviewItem label="Tags selected" value={String(formData.tags.length)} />
              <ReviewItem label="Image" value={selectedImageName || (existingEvent?.image ? 'Current image retained' : 'No image selected')} />
              <div className="md:col-span-2">
                <ReviewItem label="Description" value={formData.description || '-'} />
              </div>
              {imagePreviewUrl ? (
                <div className="md:col-span-2 mt-2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high">
                  <img src={imagePreviewUrl} alt="Event preview" className="h-56 w-full object-cover" />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
            <Button
              type="button" 
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave anyway?')) {
                  return;
                }
                navigate('/organizer');
              }}
              variant="ghost"
            >
              Cancel
            </Button>
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={() => goToStep(currentStep - 1)}>
                Previous
              </Button>
            ) : null}
            {currentStep < stepTitles.length - 1 ? (
              <Button type="button" onClick={() => goToStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processing...' : (isEdit ? 'Save Changes' : 'Launch Event')}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface break-words">{value || '-'}</p>
    </div>
  );
}
