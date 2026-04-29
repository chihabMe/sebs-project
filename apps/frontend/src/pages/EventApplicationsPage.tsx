import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import { getManageEvent } from '../api/events';
import { getEventAttendees, updateBookingStatus } from '../api/organizer';
import { Button } from '../components/ui/button';
import { Check, Clock3, User, X } from 'lucide-react';
import { useToast } from '../components/ui/toast-provider';

export default function EventApplicationsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getManageEvent(id!),
    enabled: !!id,
  });

  const { data: applicationsPayload, isLoading: loadingApplications } = useQuery({
    queryKey: ['event-applications', id, page],
    queryFn: () =>
      getEventAttendees(id!, {
        status: 'PENDING',
        page,
        limit: 20,
      }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'CONFIRMED' | 'REJECTED' }) =>
      updateBookingStatus(bookingId, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-applications', id] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });
      queryClient.invalidateQueries({ queryKey: ['organizer-dashboard-stats'] });
      showToast(variables.status === 'CONFIRMED' ? 'Application accepted.' : 'Application rejected.', 'success');
    },
    onError: () => {
      showToast('Failed to update application status.', 'error');
    },
  });

  if (loadingEvent || loadingApplications) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!event) return <div>Event not found</div>;

  const applications = applicationsPayload?.items ?? [];
  const meta = applicationsPayload?.meta;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-6xl mx-auto w-full pb-20">
        <header className="mb-8">
          <Link to="/organizer" className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-base">arrow_back</span> Back to Organizer
          </Link>
          <h2 className="text-4xl font-black font-headline tracking-tight text-primary mb-2">Event Applications</h2>
          <p className="text-outline">
            Pending applications for <span className="font-bold text-primary">{event.title}</span>
          </p>
        </header>

        <section className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
          {applications.length ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="bg-surface-container-high rounded-2xl p-5 border border-primary/5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                        {application.user.avatar ? (
                          <img src={application.user.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{application.user.name}</p>
                        <p className="text-sm text-outline">{application.user.email}</p>
                        <p className="text-xs text-outline mt-1 inline-flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          Requested on {new Date(application.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80"
                        onClick={() => updateMutation.mutate({ bookingId: application.id, status: 'CONFIRMED' })}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateMutation.mutate({ bookingId: application.id, status: 'REJECTED' })}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                  {application.answers.length ? (
                    <div className="mt-4 border-t border-primary/10 pt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-outline">Application Answers</p>
                      {application.answers.map((answer) => (
                        <div key={answer.id} className="text-sm">
                          <p className="font-semibold text-on-surface">{answer.question.question}</p>
                          <p className="text-outline">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest/50 rounded-3xl border-2 border-dashed border-primary/10">
              <h4 className="text-xl font-bold font-headline text-primary mb-2">No Pending Applications</h4>
              <p className="text-outline">New user requests will appear here for approval.</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-outline font-semibold">
              {meta?.total ?? 0} pending applications • page {meta?.page ?? 1}/{meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={(meta?.page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
