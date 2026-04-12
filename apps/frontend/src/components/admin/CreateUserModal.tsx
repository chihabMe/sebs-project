import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminUser } from '../../api/admin';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface CreateUserModalProps {
  onClose: () => void;
}

export default function CreateUserModal({ onClose }: CreateUserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container-low w-full max-w-md rounded-3xl p-8 border border-primary/5 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-outline hover:text-on-surface">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-2xl font-black font-headline text-primary mb-6">Initialize User</h3>
        
        {error && (
          <div className="mb-6 p-4 bg-error/5 text-error rounded-xl text-xs font-bold border border-error/10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Display Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Access Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="USER">User</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="pt-4">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Processing...' : 'Authorize User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
