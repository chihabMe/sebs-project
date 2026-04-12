import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '../../api/reviews';
import { Star } from 'lucide-react';
import { Button } from '../ui/button';
import { handleApiError } from '../../utils/errorHandler';

interface ReviewFormProps {
  eventId: string;
}

export default function ReviewForm({ eventId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createReview({ eventId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', eventId] });
      setRating(0);
      setComment('');
      setError(null);
    },
    onError: (err: any) => {
      const apiError = handleApiError(err);
      setError(apiError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-primary/5 shadow-sm">
      <h3 className="text-xl font-black font-headline text-primary mb-6">Leave a Review</h3>
      
      {error && (
        <div className="mb-6 p-4 bg-error/5 text-error rounded-xl text-xs font-bold border border-error/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-secondary fill-secondary'
                      : 'text-outline/20'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
            Your Experience (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-y transition-colors"
            placeholder="Tell us about your experience..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending || rating === 0}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  );
}
