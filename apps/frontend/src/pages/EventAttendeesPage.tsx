import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvent } from '../api/events';
import { getEventAttendees, updateBookingStatus, removeAttendee, generateInviteLink } from '../api/organizer';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Check, X, Trash2, Link as LinkIcon, User } from 'lucide-react';
import { useState } from 'react';

export default function EventAttendeesPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['event-attendees', id],
    queryFn: () => getEventAttendees(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string, status: 'CONFIRMED' | 'REJECTED' }) => 
      updateBookingStatus(bookingId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bookingId: string) => removeAttendee(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => generateInviteLink(id!),
    onSuccess: (data) => {
      setInviteToken(data.token);
    },
  });

  const isLoading = eventLoading || bookingsLoading;

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

  const inviteUrl = `${window.location.origin}/events/${event.id}?token=${inviteToken || event.invitationToken}`;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/organizer" className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <span className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back to Dashboard</span>
            </div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2 text-primary">Event Attendees</h2>
            <p className="text-outline">Managing artifacts and participants for: <span className="text-primary font-bold">{event.title}</span></p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Unique Invitation Link</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px]" 
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending}
                >
                  Regenerate
                </Button>
              </div>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={inviteUrl} 
                  className="bg-surface-container-high px-3 py-2 rounded-lg text-xs font-mono w-full md:w-64 border-none outline-none text-outline"
                />
                <Button 
                  size="sm" 
                  className="h-9 w-9 p-0 rounded-lg"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    alert('Invite link copied to clipboard!');
                  }}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/20 overflow-x-auto shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-bold font-headline text-primary">Participant Log</h3>
               <div className="px-4 py-1.5 bg-primary/5 text-primary text-sm font-bold rounded-full border border-primary/10">
                 {bookings?.length || 0} Total Records
               </div>
            </div>
            
            {bookings && bookings.length > 0 ? (
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/5">
                    <th className="pb-4 px-4">Attendee Info</th>
                    <th className="pb-4 px-4">Form Answers</th>
                    <th className="pb-4 px-4">Joined On</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {bookings.map((booking: any) => (
                    <tr key={booking.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden">
                            {booking.user.avatar ? (
                              <img src={booking.user.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <User className="text-primary w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="font-black text-on-surface font-headline">{booking.user.name}</div>
                            <div className="text-xs text-outline font-medium">{booking.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 max-w-xs">
                        {booking.answers && booking.answers.length > 0 ? (
                          <div className="space-y-2">
                            {booking.answers.map((ans: any) => (
                              <div key={ans.id} className="text-xs">
                                <span className="text-outline block font-bold truncate" title={ans.question.question}>{ans.question.question}</span>
                                <span className="text-on-surface font-medium italic">"{ans.answer}"</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-outline/50 italic">No answers provided</span>
                        )}
                      </td>
                      <td className="py-6 px-4 text-xs font-medium text-outline">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-6 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          booking.status === 'CONFIRMED' ? 'bg-secondary-container text-on-secondary-container' : 
                          booking.status === 'PENDING' ? 'bg-primary/5 text-primary border border-primary/10' :
                          'bg-error/5 text-error border border-error/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            booking.status === 'CONFIRMED' ? 'bg-current animate-pulse' : 'bg-current'
                          }`}></span>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {booking.status === 'PENDING' && (
                            <>
                              <Button 
                                size="sm" 
                                className="h-8 w-8 p-0 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80"
                                onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'CONFIRMED' })}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'REJECTED' })}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0 text-error hover:bg-error/5"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this attendee?')) {
                                deleteMutation.mutate(booking.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 bg-surface-container-lowest/50 rounded-3xl border-2 border-dashed border-primary/10">
                <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="text-outline w-10 h-10 opacity-30" />
                </div>
                <h4 className="text-xl font-bold font-headline text-primary mb-2">Archive Empty</h4>
                <p className="text-outline font-medium max-w-xs mx-auto">No discovery records found for this event yet.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
