import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvent } from '../api/events';
import { api } from '../api/client';
import { checkBookingStatus, cancelBooking } from '../api/bookings';
import { getEventForm } from '../api/organizer';
import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { formatImageUrl } from '../utils/formatUrl';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, User, ShieldCheck, Ticket } from 'lucide-react';
import BookingFormModal from '../components/events/BookingFormModal';
import ReviewList from '../components/events/ReviewList';
import ReviewForm from '../components/events/ReviewForm';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking-status', id],
    queryFn: () => checkBookingStatus(id!),
    enabled: !!id && !!user && user.role === 'USER',
  });

  const { data: formQuestions } = useQuery({
    queryKey: ['event-form', id],
    queryFn: () => getEventForm(id!),
    enabled: !!id,
  });

  const bookMutation = useMutation({
    mutationFn: async (answers?: any[]) => {
      const url = invitationToken ? `/bookings?token=${invitationToken}` : '/bookings';
      const response = await api.post(url, { eventId: id, answers });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-status', id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setIsFormOpen(false);
      setError(null);
      if (data.message) alert(data.message);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Booking failed. Please check your registry data.');
      setIsFormOpen(false);
    },
  });

  const handleBookingClick = () => {
    if (formQuestions && formQuestions.length > 0) {
      setIsFormOpen(true);
    } else {
      bookMutation.mutate([]);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-status', id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Cancellation failed.');
    },
  });

  const isLoading = eventLoading || (!!user && user.role === 'USER' && bookingLoading);

  if (isLoading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!event) return <div>Event not found</div>;

  const isOrganizerOrAdmin = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const hasConfirmedBooking = booking && booking.status === 'CONFIRMED';
  const hasPendingBooking = booking && booking.status === 'PENDING';
  const hasRejectedBooking = booking && booking.status === 'REJECTED';
  const hasCancelledBooking = booking && booking.status === 'CANCELLED';

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full h-[500px] md:h-[650px] overflow-hidden bg-primary">
          <img 
            src={formatImageUrl(event.image)} 
            alt={event.title}
            className="w-full h-full object-cover opacity-40 grayscale-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full px-8 pb-16 max-w-7xl mx-auto flex flex-col items-start gap-6">
            <div className="flex gap-3">
              <span className="px-4 py-1.5 bg-primary text-on-primary text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
                {event.category}
              </span>
              {invitationToken && (
                <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-container text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Private Invitation
                </span>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-none max-w-4xl font-headline">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-10 mt-4 text-outline font-bold uppercase tracking-widest text-xs">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary w-5 h-5" />
                <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-primary w-5 h-5" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Booking */}
        <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
          <div className="lg:col-span-8 space-y-16">
            <article className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-px bg-primary/10 flex-grow"></div>
                 <h2 className="text-3xl font-black tracking-tight font-headline text-primary uppercase">Experience Brief</h2>
                 <div className="h-px bg-primary/10 flex-grow"></div>
              </div>
              <p className="text-xl text-on-surface-variant leading-relaxed font-medium italic border-l-4 border-primary/20 pl-8">
                {event.description}
              </p>
            </article>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {event.tags.map((tag: string) => (
                  <span key={tag} className="px-4 py-2 bg-surface-container-low text-outline text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/5 hover:bg-primary/5 hover:text-primary transition-all cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reviews Section */}
            <div className="pt-16 border-t border-primary/10">
              <ReviewList eventId={event.id} />
              {hasConfirmedBooking && (
                <div className="mt-12">
                  <ReviewForm eventId={event.id} />
                </div>
              )}
            </div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="bg-surface-container-low rounded-3xl p-10 shadow-[0_24px_48px_rgba(62,0,0,0.06)] border border-primary/5 ring-1 ring-white">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <span className="text-outline text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">Entry Value</span>
                    <span className="text-5xl font-black text-primary font-headline tracking-tighter">${event.price}</span>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-2xl flex flex-col items-end border border-primary/10">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
                    </div>
                    <span className="text-[9px] font-bold text-outline uppercase tracking-[0.1em] mt-1">Archive Entry Open</span>
                  </div>
                </div>

                {hasConfirmedBooking ? (
                  <div className="space-y-4">
                    <div className="bg-secondary-container/20 text-on-secondary-container p-8 rounded-2xl text-center border border-secondary/20">
                      <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary opacity-80" />
                      <p className="font-black font-headline text-xl">Identity Verified</p>
                      <p className="text-xs mt-2 font-medium opacity-70">Your entry is authorized for this experience.</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full h-14 text-lg"
                      variant="secondary"
                    >
                      Retrieve Ticket
                    </Button>
                    <button 
                      onClick={() => window.confirm('Revoke this entry request?') && cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="w-full text-error font-bold text-[10px] uppercase tracking-widest hover:opacity-70 disabled:opacity-50 mt-2"
                    >
                      {cancelMutation.isPending ? 'Processing...' : 'Revoke My Registry'}
                    </button>
                  </div>
                ) : hasPendingBooking ? (
                   <div className="space-y-4 text-center">
                    <div className="bg-primary/5 text-primary p-8 rounded-2xl border border-primary/10">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-black font-headline text-xl">Registry Pending</p>
                      <p className="text-xs mt-2 font-medium text-outline">The curator is reviewing your entry credentials.</p>
                    </div>
                    <button 
                      onClick={() => cancelMutation.mutate()}
                      className="text-outline font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      Withdraw Registry Request
                    </button>
                   </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-6 p-4 bg-error/5 text-error rounded-xl text-xs font-bold border border-error/10">
                        {error}
                      </div>
                    )}

                    {!isAuthenticated ? (
                      <Button 
                        onClick={() => navigate('/login')}
                        className="w-full h-16 text-lg shadow-2xl"
                      >
                        Verify Identity to Book
                      </Button>
                    ) : isOrganizerOrAdmin ? (
                      <div className="space-y-4">
                        <Button 
                          disabled
                          className="w-full h-16 text-lg opacity-40 cursor-not-allowed"
                        >
                          Book Experience
                        </Button>
                        <p className="text-center text-[10px] font-bold text-error uppercase tracking-widest px-4">
                          Curation accounts restricted from entry.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleBookingClick}
                        disabled={bookMutation.isPending}
                        className="w-full h-16 text-lg shadow-2xl"
                      >
                        {bookMutation.isPending ? 'Processing Registry...' : (hasCancelledBooking || hasRejectedBooking ? 'Retry Registry Entry' : 'Authorize My Spot')}
                      </Button>
                    )}
                  </>
                )}

                <p className="text-center text-[10px] text-outline font-bold uppercase tracking-widest mt-6 opacity-40">
                  Secured Archive Entry • Instant Digital Proof
                </p>
              </div>

              {/* Host Info */}
              <div className="bg-surface-container-low rounded-2xl p-6 flex items-center gap-5 border border-primary/5 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                   <User className="text-primary w-8 h-8" />
                </div>
                <div>
                  <span className="text-[9px] text-outline uppercase font-black tracking-widest opacity-60">Authorized Curator</span>
                  <h4 className="font-black text-on-surface leading-tight font-headline text-lg">{event.organizer?.name || 'Anonymous Curator'}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="text-secondary w-4 h-4" />
                    <span className="text-[9px] font-black text-secondary uppercase tracking-[0.15em]">Verified Identity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {formQuestions && (
        <BookingFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          eventTitle={event.title}
          questions={formQuestions}
          isPending={bookMutation.isPending}
          onSubmit={(answers) => bookMutation.mutate(answers)}
        />
      )}
    </div>
  );
}

// Helper icons
function ClipboardCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}
