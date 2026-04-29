import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvent } from '../api/events';
import { checkBookingStatus, cancelBooking, createBooking, getMyBookings } from '../api/bookings';
import { getEventForm } from '../api/organizer';
import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { formatImageUrl } from '../utils/formatUrl';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, User, ShieldCheck, Ticket, Clock3, BadgeCheck } from 'lucide-react';
import BookingFormModal from '../components/events/BookingFormModal';
import { useToast } from '../components/ui/toast-provider';
import EventReviews from '../components/events/EventReviews';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasAttended, setHasAttended] = useState(false);

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

  useEffect(() => {
    if (user && id && booking && booking.isBooked && booking.status === 'CONFIRMED') {
      getMyBookings()
        .then((myBookings) => {
          if (!myBookings) return;
          const currentBooking = myBookings.find((b: any) => b.eventId === id);
          if (currentBooking && currentBooking.attended) {
            setHasAttended(true);
          }
        })
        .catch(console.error);
    }
  }, [user, id, booking]);

  const { data: formQuestions } = useQuery({
    queryKey: ['event-form', id],
    queryFn: () => getEventForm(id!),
    enabled: !!id,
  });

  const bookMutation = useMutation({
    mutationFn: async (answers?: any[]) => createBooking(id!, answers, invitationToken || undefined),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-status', id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setIsFormOpen(false);
      setError(null);
      if (data.message) showToast(data.message, 'success');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Booking failed. Please check your registry data.');
      showToast(err.response?.data?.message || 'Booking failed. Please check your registry data.', 'error');
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
    mutationFn: () => cancelBooking(booking?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-status', id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Cancellation failed.');
      showToast(err.response?.data?.message || 'Cancellation failed.', 'error');
    },
  });

  const isLoading = eventLoading || (!!user && user.role === 'USER' && bookingLoading);

  if (isLoading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Header />
        <EventDetailsSkeleton />
      </div>
    );
  }

  if (!event) return <div>Event not found</div>;

  const isOrganizer = user?.role === 'ORGANIZER';
  const hasConfirmedBooking = booking && booking.status === 'CONFIRMED';
  const hasPendingBooking = booking && booking.status === 'PENDING';
  const hasRejectedBooking = booking && booking.status === 'REJECTED';
  const hasCancelledBooking = booking && booking.status === 'CANCELLED';
  const canBook = event.isApproved && event.status === 'UPCOMING';
  const isCompleted = event.status === 'COMPLETED' || new Date(event.date) < new Date();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />

      <main className="pt-20">
        <section className="relative w-full min-h-[580px] md:min-h-[720px] overflow-hidden bg-[#071b1d]">
          <img
            src={formatImageUrl(event.image)}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_28%),linear-gradient(to_top,rgba(7,27,29,0.96),rgba(7,27,29,0.55),rgba(7,27,29,0.08))]" />
          <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 pb-16">
            <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)] items-end">
              <div className="flex flex-col items-start gap-6">
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 bg-primary text-on-primary text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
                    {event.category}
                  </span>
                  {event.isApproved ? (
                    <span className="px-4 py-1.5 bg-emerald-500/15 text-emerald-100 text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-2 border border-emerald-300/20">
                      <BadgeCheck className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 bg-amber-500/15 text-amber-100 text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-2 border border-amber-300/20">
                      <Clock3 className="w-3 h-3" /> Awaiting approval
                    </span>
                  )}
                  {invitationToken && (
                    <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-container text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Private Invitation
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.95] max-w-4xl font-headline">
                  {event.title}
                </h1>
                <p className="text-white/78 text-base md:text-lg max-w-2xl leading-relaxed">
                  {event.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-white/85 font-bold uppercase tracking-widest text-[11px]">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur">
                    <Calendar className="text-primary w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur">
                    <MapPin className="text-primary w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface/92 backdrop-blur-xl rounded-[1.75rem] p-5 md:p-6 border border-white/15 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] font-black text-outline">Quick facts</p>
                    <p className="text-sm font-semibold text-on-surface/80 mt-1 line-clamp-1">{event.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.2em] font-black text-outline">Price</p>
                    <p className="text-xl font-black text-primary leading-none">{event.price === 0 ? 'Free' : `$${event.price}`}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 items-center rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-outline">Organizer</span>
                    <span className="font-semibold text-on-surface text-sm leading-tight">{event.organizer?.name || 'Anonymous Curator'}</span>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 items-center rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-outline">Approval</span>
                    <span className="font-semibold text-on-surface text-sm leading-tight">
                      {event.isApproved ? 'Approved by admin' : 'Waiting for admin review'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 items-center rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-outline">Date</span>
                    <span className="font-semibold text-on-surface text-sm leading-tight">
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 items-center rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-outline">Location</span>
                    <span className="font-semibold text-on-surface text-sm leading-tight">{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          <div className="lg:col-span-8 space-y-10">
            <article className="space-y-8 bg-surface-container-low rounded-[2rem] p-8 md:p-10 border border-primary/5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-px bg-primary/10 flex-grow" />
                <h2 className="text-3xl font-black tracking-tight font-headline text-primary uppercase">About the Event</h2>
                <div className="h-px bg-primary/10 flex-grow" />
              </div>
              <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed font-medium border-l-4 border-primary/20 pl-6 md:pl-8">
                {event.description}
              </p>
            </article>

            {event.tags && event.tags.length > 0 && (
              <div className="bg-surface-container-low rounded-[2rem] p-8 border border-primary/5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.24em] text-outline mb-4">Tags</h3>
                <div className="flex flex-wrap gap-3">
                  {event.tags.map((tag: any) => (
                    <span key={tag.id} className="px-4 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/10 hover:bg-primary/10 transition-all cursor-default">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <EventReviews eventId={event.id} hasAttended={hasAttended || isCompleted} />
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="bg-surface-container-low rounded-[2rem] p-6 md:p-8 shadow-[0_24px_48px_rgba(62,0,0,0.06)] border border-primary/5 ring-1 ring-white">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <div className="space-y-1">
                    <span className="text-outline text-[10px] font-black uppercase tracking-widest block opacity-60">Event Summary</span>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight font-headline text-on-surface">{event.title}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-outline text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60">Entry Access</span>
                    <span className="text-2xl md:text-3xl font-black text-primary font-headline tracking-tighter leading-none">
                      {event.price === 0 ? 'Free' : `$${event.price}`}
                    </span>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl flex flex-col items-end border border-primary/10 mb-6">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{event.isApproved ? 'Available' : 'Locked'}</span>
                  </div>
                  <span className="text-[9px] font-bold text-outline uppercase tracking-[0.1em] mt-1">
                    {event.isApproved ? 'Archive Entry Open' : 'Awaiting Admin Approval'}
                  </span>
                </div>

                {hasConfirmedBooking ? (
                  <div className="space-y-4">
                    <div className="bg-secondary-container/20 text-on-secondary-container p-8 rounded-2xl text-center border border-secondary/20">
                      <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary opacity-80" />
                      <p className="font-black font-headline text-xl">Identity Verified</p>
                      <p className="text-xs mt-2 font-medium opacity-70">Your entry is authorized for this experience.</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard')} className="w-full h-14 text-lg" variant="secondary">
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
                      <p className="text-xs mt-2 font-medium text-outline">The curator is processing your entry request.</p>
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
                      <Button onClick={() => navigate('/login')} className="w-full h-16 text-lg shadow-2xl">
                        Verify Identity to Book
                      </Button>
                    ) : isOrganizer ? (
                      <div className="space-y-4">
                        <Button disabled className="w-full h-16 text-lg opacity-40 cursor-not-allowed">
                          Book Experience
                        </Button>
                        <p className="text-center text-[10px] font-bold text-error uppercase tracking-widest px-4">
                          Curation accounts restricted from entry.
                        </p>
                      </div>
                    ) : !canBook ? (
                      <div className="space-y-4">
                        <Button disabled className="w-full h-16 text-lg opacity-50 cursor-not-allowed">
                          Awaiting Admin Approval
                        </Button>
                        <p className="text-center text-[10px] font-bold text-outline uppercase tracking-widest px-4">
                          The booking button stays locked until the event is approved and upcoming.
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleBookingClick}
                        disabled={bookMutation.isPending}
                        className="w-full h-16 text-lg shadow-2xl"
                      >
                        {bookMutation.isPending ? 'Processing Registry...' : hasCancelledBooking || hasRejectedBooking ? 'Retry Registry Entry' : 'Authorize My Spot'}
                      </Button>
                    )}
                  </>
                )}

                <p className="text-center text-[10px] text-outline font-bold uppercase tracking-widest mt-6 opacity-40">
                  Secured Archive Entry • Instant Digital Proof
                </p>
              </div>

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

function EventDetailsSkeleton() {
  return (
    <main className="pt-20 animate-pulse">
      <section className="relative w-full min-h-[580px] md:min-h-[720px] overflow-hidden bg-surface-container-high">
        <div className="absolute inset-0 bg-slate-300/40" />
        <div className="absolute inset-x-0 bottom-0 px-6 md:px-8 pb-16">
          <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)] items-end">
            <div className="space-y-5">
              <div className="h-8 w-36 rounded-full bg-slate-200/80" />
              <div className="h-20 w-full max-w-4xl rounded-3xl bg-slate-200/70" />
              <div className="h-7 w-full max-w-2xl rounded-2xl bg-slate-200/60" />
              <div className="flex gap-3">
                <div className="h-10 w-28 rounded-full bg-slate-200/70" />
                <div className="h-10 w-36 rounded-full bg-slate-200/70" />
              </div>
            </div>
            <div className="rounded-[2rem] p-8 bg-slate-200/60 min-h-[220px]" />
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-64 rounded-[2rem] bg-slate-200/60" />
          <div className="h-32 rounded-[2rem] bg-slate-200/60" />
          <div className="h-96 rounded-[2rem] bg-slate-200/60" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-[540px] rounded-[2rem] bg-slate-200/60" />
          <div className="h-24 rounded-2xl bg-slate-200/60" />
        </div>
      </div>
    </main>
  );
}

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
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
