import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTags } from '../../api/tags';
import { updateProfile } from '../../api/auth';
import TagPicker from '../ui/TagPicker';
import { Button } from '../ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function OnboardingModal() {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save preferences.');
    },
  });

  const handleSave = () => {
    if (selectedTags.length < 3) {
      setError('Please select at least 3 labels to customize your feed.');
      return;
    }
    mutation.mutate({ tags: selectedTags });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl" />
      
      <div className="relative bg-surface-container-low w-full max-w-2xl rounded-[2.5rem] border border-primary/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-12">
          <header className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-black font-headline text-primary mb-3">Initialize Discovery</h2>
            <p className="text-outline font-medium max-w-md mx-auto">
              Select your interests to train our recommendation engine and personalize your kinetic feed.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-2xl text-error text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="mb-10">
            <TagPicker 
              availableTags={tagsResponse?.data || []}
              selectedTagIds={selectedTags}
              onChange={(ids) => {
                setSelectedTags(ids);
                setError(null);
              }}
              min={3}
              max={10}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              size="lg" 
              className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 group"
              onClick={handleSave}
              disabled={mutation.isPending || selectedTags.length < 3}
            >
              {mutation.isPending ? 'Synchronizing...' : 'Enter the System'}
              {!mutation.isPending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
            <p className="text-[10px] text-outline text-center uppercase tracking-widest font-black">
              System verification required before entry
            </p>
          </div>
        </div>

        <div className="bg-primary/5 p-4 text-center border-t border-primary/5">
           <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Global Discovery Protocol v2.0</p>
        </div>
      </div>
    </div>
  );
}
