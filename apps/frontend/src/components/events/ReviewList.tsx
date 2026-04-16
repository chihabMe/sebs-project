import { useQuery } from '@tanstack/react-query';
import { getEventReviews } from '../../api/reviews';
import { Star, User } from 'lucide-react';
import { formatImageUrl } from '../../utils/formatUrl';

interface ReviewListProps {
  eventId: string;
}

export default function ReviewList({ eventId }: ReviewListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', eventId],
    queryFn: () => getEventReviews(eventId),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const reviewsArray = data?.reviews || [];

  if (!reviewsArray || reviewsArray.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-primary/5">
        <p className="text-outline font-medium text-sm">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black font-headline text-primary">Experiences & Reviews ({reviewsArray.length})</h3>
      <div className="space-y-4">
        {reviewsArray.map((review: any) => (
          <div key={review.id} className="bg-surface-container-low p-6 rounded-2xl border border-primary/5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {review.user?.avatar ? (
                  <img src={formatImageUrl(review.user.avatar)} alt={review.user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-bold text-on-surface text-sm">{review.user?.name}</p>
                <p className="text-[10px] text-outline font-bold uppercase tracking-widest">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'text-secondary fill-secondary' : 'text-outline/20'}`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-on-surface-variant text-sm leading-relaxed pl-14">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
