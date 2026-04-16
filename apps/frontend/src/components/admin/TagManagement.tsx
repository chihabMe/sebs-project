import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTags, createTag, deleteTag } from '../../api/tags';
import { Button } from '../ui/button';
import { Tag, Plus, Trash2, Hash } from 'lucide-react';

export default function TagManagement() {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createMutation.mutate({ name: newTagName.trim() });
    }
  };

  return (
    <section className="bg-surface-container-low rounded-3xl p-8 border border-primary/5 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h3 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
          <Tag className="w-6 h-6" /> Classification Tags
        </h3>
        <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">
          {tags?.data?.length || 0} Tags Registered
        </div>
      </div>

      <form onSubmit={handleAddTag} className="mb-6 shrink-0 flex gap-2">
        <div className="relative flex-grow">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/50" />
          <input
            type="text"
            placeholder="New classification label..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl pl-10 p-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <Button type="submit" disabled={createMutation.isPending || !newTagName.trim()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </form>

      <div className="flex-grow overflow-auto custom-scrollbar">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : tags?.data && tags.data.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.data.map((tag) => (
              <div 
                key={tag.id} 
                className="bg-surface-container-high/50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-primary/5 hover:border-primary/20 transition-all group"
              >
                <span className="text-sm font-bold text-on-surface">#{tag.name}</span>
                <button 
                  onClick={() => deleteMutation.mutate(tag.id)}
                  disabled={deleteMutation.isPending}
                  className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-primary/5 rounded-2xl">
            <p className="text-outline text-xs font-bold uppercase tracking-widest">No tags in registry.</p>
          </div>
        )}
      </div>
    </section>
  );
}
