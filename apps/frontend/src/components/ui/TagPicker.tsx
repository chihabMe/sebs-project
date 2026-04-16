import { TagDto } from '@sebs/shared';
import { Check, Hash, Info } from 'lucide-react';

interface TagPickerProps {
  availableTags: TagDto[];
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
  min?: number;
  max?: number;
}

export default function TagPicker({ availableTags, selectedTagIds, onChange, min = 3, max = 7 }: TagPickerProps) {
  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter(i => i !== id));
    } else {
      if (selectedTagIds.length < max) {
        onChange([...selectedTagIds, id]);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[0.75rem] font-bold uppercase tracking-widest block ml-1">Classification Labels</label>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedTagIds.length < min ? 'text-error' : 'text-primary'}`}>
          {selectedTagIds.length} / {max} Selected (Min {min})
        </span>
      </div>
      
      <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10">
        {availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border
                    ${isSelected 
                      ? 'bg-primary text-on-primary border-primary shadow-sm' 
                      : 'bg-surface-container-low text-outline border-outline-variant/20 hover:border-primary/30'}
                  `}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                  {tag.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-outline text-xs italic">
            No tags available in registry. Contact Admin.
          </div>
        )}
      </div>
      
      {selectedTagIds.length < min && (
        <p className="text-[10px] text-error font-bold flex items-center gap-1.5 ml-1 animate-pulse">
          <Info className="w-3 h-3" /> Please select at least {min} tags for optimal discovery.
        </p>
      )}
    </div>
  );
}
