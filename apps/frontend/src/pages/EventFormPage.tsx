import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createEvent, updateEvent, getEvent } from '../api/events';
import Header from '../components/layout/Header';

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'Music',
    maxTickets: 0,
    price: 0,
    tags: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: existingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: isEdit,
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
        price: existingEvent.price,
        tags: existingEvent.tags?.join(', ') || '',
      });
    }
  }, [existingEvent]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? updateEvent(id!, data) : createEvent(data),
    onSuccess: () => {
      navigate('/organizer');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Something went wrong. Please check your data.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
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
                onChange={e => setFormData({ ...formData, title: e.target.value })}
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
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Date</label>
              <input 
                required
                type="date"
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Category</label>
              <select 
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Event Image</label>
              <input 
                type="file"
                accept="image/*"
                className="w-full bg-surface-container-high rounded-xl py-3 px-6 text-on-surface font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary"
                onChange={e => setImage(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Max Tickets</label>
              <input 
                required
                type="number"
                min="1"
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                value={formData.maxTickets}
                onChange={e => setFormData({ ...formData, maxTickets: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Price ($)</label>
              <input 
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-surface-container-high rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/10 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/organizer')}
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
