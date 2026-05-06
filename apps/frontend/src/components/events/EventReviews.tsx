import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Star, MessageCircleHeart } from 'lucide-react';
import { useToast } from '../ui/toast-provider';
import { format } from 'date-fns';
import { PAGINATION } from '../../constants/pagination';

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
  const [page, setPage] = useState(1);
  const limit = PAGINATION.EVENT_REVIEWS;

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['event-reviews', eventId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/reviews/event/${eventId}`, { params: { page, limit } });
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
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    },
  });

  const reviews = reviewsData?.reviews || [];
  const meta = reviewsData?.meta;
  const stats = reviewsData?.stats || { averageRating: 0, totalReviews: 0 };
  const canReview = hasAttended && !!user;
  const canOpenReviewForm = !!user;

  return (
    <section className="space-y-8 mt-16 pt-16 border-t border-primary/10">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight font-headline text-primary uppercase">Reviews</h2>
        <div className="h-px bg-primary/10 flex-grow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="bg-surface-container-low rounded-[1.75rem] p-6 border border-primary/5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-outline mb-2">Average rating</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-primary font-headline leading-none">{Number(stats.averageRating).toFixed(1)}</span>
            <span className="text-sm text-outline pb-1">/ 5</span>
          </div>
          <div className="flex gap-1 my-4 text-secondary">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-4 h-4 ${star <= Math.round(stats.averageRating) ? 'fill-current' : 'text-outline/30'}`} />
            ))}
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-outline">{stats.totalReviews} reviews</p>
        </div>

        <div className="bg-surface-container-low rounded-[1.75rem] p-6 border border-primary/5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
              <MessageCircleHeart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest">Leave feedback</h3>
              <p className="text-sm text-outline mt-1 max-w-2xl">
                {canReview
                  ? 'Share a short, useful review for future attendees.'
                  : 'Only attendees can post a review after attending the event.'}
              </p>
            </div>
          </div>

          {canOpenReviewForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!hasAttended) {
                  showToast('You must attend this event before posting a review.', 'error');
                  return;
                }
                submitReviewMutation.mutate();
              }}
              className="mt-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-outline block mb-2">Rating</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                          rating >= star ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:border-primary/20'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-widest text-outline">Tip</p>
                  <p className="text-sm text-on-surface/70">Be specific and concise.</p>
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What stood out?"
                className="w-full min-h-28 bg-surface-container-high border border-outline-variant/20 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                rows={4}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-widest text-outline">
                  {comment.trim().length}/240
                </p>
                <Button
                  type="submit"
                  disabled={submitReviewMutation.isPending || !comment.trim()}
                  className="px-6"
                >
                  {submitReviewMutation.isPending ? 'Submitting...' : 'Post Review'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2].map((item) => (
              <div key={item} className="animate-pulse bg-surface-container-low rounded-[1.5rem] p-5 border border-primary/5">
                <div className="h-4 w-32 bg-slate-200 rounded-full mb-3" />
                <div className="h-3 w-full bg-slate-200 rounded-full mb-2" />
                <div className="h-3 w-5/6 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid gap-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-surface-container-lowest p-5 rounded-[1.5rem] border border-primary/5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{review.user.name}</h4>
                    <span className="text-[10px] text-outline font-medium">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex gap-1 text-secondary shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-outline/30'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {review.comment || 'No comment provided.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-surface-container-low rounded-[1.5rem] border border-dashed border-primary/10">
            <p className="text-outline text-sm italic">No reviews yet. Be the first to share one.</p>
          </div>
        )}
      </div>
      {meta ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-outline font-semibold">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((current: number) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((current: number) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
