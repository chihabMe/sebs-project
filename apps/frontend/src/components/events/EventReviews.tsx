import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Star, MessageSquare } from 'lucide-react';
import { useToast } from '../ui/toast-provider';
import { format } from 'date-fns';

interface EventReviewsProps {
  eventId: string;
  hasAttended: boolean;
}

export default function EventReviews({ eventId, hasAttended }: EventReviewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['event-reviews', eventId],
    queryFn: async () => {
      const response = await api.get(`/reviews/event/${eventId}`);
      return response.data.data;
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/reviews', { eventId, rating, comment });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-reviews', eventId] });
      setComment('');
      setRating(5);
      showToast('Review submitted successfully!', 'success');
      setIsSubmitting(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    submitReviewMutation.mutate();
  };

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || { averageRating: 0, totalReviews: 0 };

  return (
    <section className="space-y-8 mt-16 pt-16 border-t border-primary/10">
      <div className="flex items-center gap-4">
         <h2 className="text-3xl font-black tracking-tight font-headline text-primary uppercase">Community Pulse</h2>
         <div className="h-px bg-primary/10 flex-grow"></div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-8 border border-primary/5 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="text-center">
          <p className="text-5xl font-black text-primary font-headline">{Number(stats.averageRating).toFixed(1)}</p>
          <div className="flex justify-center gap-1 my-2 text-secondary">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-5 h-5 ${star <= Math.round(stats.averageRating) ? 'fill-current' : 'text-outline/30'}`} />
            ))}
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-outline">{stats.totalReviews} Reviews</p>
        </div>
        
        {hasAttended && user && (
          <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-primary/10 pt-8 md:pt-0 md:pl-8">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Share Your Experience</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-outline block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-secondary' : 'text-outline/30'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What was the vibe like?"
                className="w-full bg-surface-container-high border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20"
                rows={3}
              ></textarea>
              <Button type="submit" disabled={isSubmitting || !comment.trim()} className="w-full sm:w-auto">
                {isSubmitting ? 'Submitting...' : 'Post Review'}
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-surface-container-low rounded-2xl"></div>
            <div className="h-24 bg-surface-container-low rounded-2xl"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review: any) => (
            <div key={review.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-sm">{review.user.name}</h4>
                  <span className="text-[10px] text-outline font-medium">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex gap-1 text-secondary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-outline/30'}`} />
                  ))}
                </div>
              </div>
              <p className="text-on-surface-variant text-sm flex gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-outline/50" />
                {review.comment}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-outline text-sm italic py-8">No reviews yet. The archive awaits your feedback.</p>
        )}
      </div>
    </section>
  );
}
