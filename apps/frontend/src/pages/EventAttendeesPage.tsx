import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getManageEvent } from '../api/events';
import { QRCodeSVG } from 'qrcode.react';
import {
  bulkRemoveAttendees,
  bulkUpdateBookingStatus,
  EventAttendeeBooking,
  generateInviteLink,
  getEventAttendees,
  removeAttendee,
  rotateInviteLink,
  updateBookingStatus,
} from '../api/organizer';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Check, Download, Link as LinkIcon, RotateCw, Search, Trash2, User, X, QrCode } from 'lucide-react';
import { useToast } from '../components/ui/toast-provider';
import { BookingStatus } from '@sebs/shared';

type StatusFilter = 'ALL' | BookingStatus;

export default function EventAttendeesPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);

  const attendeesQueryParams = {
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: 20,
  };

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getManageEvent(id!),
    enabled: !!id,
  });

  const { data: attendeesPayload, isLoading: attendeesLoading, isFetching: attendeesFetching } = useQuery({
    queryKey: ['event-attendees', id, attendeesQueryParams],
    queryFn: () => getEventAttendees(id!, attendeesQueryParams),
    enabled: !!id,
  });

  const invalidateAttendees = () => {
    queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });
    queryClient.invalidateQueries({ queryKey: ['organizer-dashboard-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'CONFIRMED' | 'REJECTED' }) =>
      updateBookingStatus(bookingId, { status }),
    onSuccess: () => {
      invalidateAttendees();
      showToast('Booking status updated.', 'success');
    },
    onError: () => {
      showToast('Failed to update booking status.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bookingId: string) => removeAttendee(bookingId),
    onSuccess: () => {
      invalidateAttendees();
      showToast('Attendee removed.', 'success');
    },
    onError: () => {
      showToast('Failed to remove attendee.', 'error');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => generateInviteLink(id!),
    onSuccess: (data) => {
      setInviteToken(data?.token ?? null);
      showToast('Invite link is ready.', 'success');
    },
    onError: () => {
      showToast('Failed to generate invite link.', 'error');
    },
  });

  const rotateInviteMutation = useMutation({
    mutationFn: () => rotateInviteLink(id!),
    onSuccess: (data) => {
      setInviteToken(data?.token ?? null);
      invalidateAttendees();
      showToast('Invite link rotated.', 'success');
    },
    onError: () => {
      showToast('Failed to rotate invite link.', 'error');
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ status }: { status: BookingStatus }) => bulkUpdateBookingStatus(id!, selectedBookingIds, status),
    onSuccess: (response) => {
      setSelectedBookingIds([]);
      invalidateAttendees();
      showToast(`${response.data?.updatedCount ?? 0} attendees updated.`, 'success');
    },
    onError: () => {
      showToast('Bulk status update failed.', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: () => bulkRemoveAttendees(id!, selectedBookingIds),
    onSuccess: (response) => {
      setSelectedBookingIds([]);
      invalidateAttendees();
      showToast(`${response.data?.removedCount ?? 0} attendees removed.`, 'success');
    },
    onError: () => {
      showToast('Bulk remove failed.', 'error');
    },
  });

  const isLoading = eventLoading || attendeesLoading;
  const attendees: EventAttendeeBooking[] = attendeesPayload?.items ?? [];
  const summary = attendeesPayload?.summary;
  const meta = attendeesPayload?.meta;
  const isBusy =
    statusMutation.isPending ||
    deleteMutation.isPending ||
    inviteMutation.isPending ||
    rotateInviteMutation.isPending ||
    bulkStatusMutation.isPending ||
    bulkDeleteMutation.isPending;

  const inviteUrl = useMemo(() => {
    if (!event) return '';
    const existingToken = (event as { invitationToken?: string | null }).invitationToken ?? '';
    return `${window.location.origin}/events/${event.id}?token=${inviteToken || existingToken}`;
  }, [event, inviteToken]);
  
  const checkInUrl = useMemo(() => {
    if (!event) return '';
    return `${window.location.origin}/events/${event.id}/checkin`;
  }, [event]);

  const allCurrentSelected =
    attendees.length > 0 && attendees.every((booking) => selectedBookingIds.includes(booking.id));

  const toggleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      setSelectedBookingIds((prev) => prev.filter((id) => !attendees.some((booking) => booking.id === id)));
      return;
    }
    const merged = new Set([...selectedBookingIds, ...attendees.map((booking) => booking.id)]);
    setSelectedBookingIds([...merged]);
  };

  const toggleSelect = (bookingId: string) => {
    setSelectedBookingIds((prev) => (prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]));
  };

  const exportCsv = () => {
    if (!attendees.length) return;
    const header = ['name', 'email', 'status', 'createdAt', 'answers'];
    const rows = attendees.map((booking) => {
      const answers = booking.answers
        .map((answer) => `${answer.question.question}: ${answer.answer}`)
        .join(' | ')
        .replaceAll('"', '""');

      return [
        booking.user.name,
        booking.user.email,
        booking.status,
        new Date(booking.createdAt).toISOString(),
        `"${answers}"`,
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `event-attendees-${event?.id ?? 'export'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported.', 'success');
  };

  if (isLoading) {
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/organizer" className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <span className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back to Dashboard</span>
            </div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2 text-primary">Attendee Operations</h2>
            <p className="text-outline">
              Managing participants for <span className="text-primary font-bold">{event.title}</span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Check-In</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setShowQR(!showQR)}>
                  <QrCode className="w-3 h-3 mr-1" /> {showQR ? 'Hide QR' : 'Show QR'}
                </Button>
              </div>
              {showQR && (
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl mb-4">
                  <QRCodeSVG value={checkInUrl} size={150} />
                  <span className="text-xs text-black font-bold mt-2">Scan to check-in</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Invite Link</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => inviteMutation.mutate()} disabled={isBusy}>
                    Generate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => {
                      if (window.confirm('Rotate invite token? Old links will stop working.')) {
                        rotateInviteMutation.mutate();
                      }
                    }}
                    disabled={isBusy}
                  >
                    <RotateCw className="w-3 h-3 mr-1" /> Rotate
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <input readOnly value={inviteUrl} className="bg-surface-container-high px-3 py-2 rounded-lg text-xs font-mono w-[320px] border-none outline-none text-outline" />
                <Button
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteUrl);
                    showToast('Invite link copied to clipboard.', 'success');
                  }}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Pending" value={summary?.pending ?? 0} />
          <SummaryCard label="Confirmed" value={summary?.confirmed ?? 0} />
          <SummaryCard label="Rejected" value={summary?.rejected ?? 0} />
          <SummaryCard label="Cancelled" value={summary?.cancelled ?? 0} />
        </section>

        <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-high rounded-xl py-3 pl-9 pr-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search attendee name or email..."
              />
            </div>
            <select
              className="bg-surface-container-high rounded-xl py-3 px-4 text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-primary/30"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <Button variant="outline" onClick={exportCsv} disabled={!attendees.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>

          {selectedBookingIds.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between mb-4 bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs font-bold text-primary">{selectedBookingIds.length} selected</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => bulkStatusMutation.mutate({ status: 'CONFIRMED' })} disabled={isBusy}>
                  <Check className="w-4 h-4 mr-1" /> Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ status: 'REJECTED' })} disabled={isBusy}>
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm(`Remove ${selectedBookingIds.length} attendees?`)) {
                      bulkDeleteMutation.mutate();
                    }
                  }}
                  disabled={isBusy}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : null}

          {attendeesFetching ? (
            <div className="text-xs text-outline mb-2">Updating results...</div>
          ) : null}

          {attendees.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[920px]">
                <thead>
                  <tr className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/5">
                    <th className="pb-4 px-4">
                      <input type="checkbox" checked={allCurrentSelected} onChange={toggleSelectAllCurrent} />
                    </th>
                    <th className="pb-4 px-4">Attendee</th>
                    <th className="pb-4 px-4">Answers</th>
                    <th className="pb-4 px-4">Joined</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {attendees.map((booking) => (
                    <AttendeeRow
                      key={booking.id}
                      booking={booking}
                      selected={selectedBookingIds.includes(booking.id)}
                      onSelect={() => toggleSelect(booking.id)}
                      onConfirm={() => statusMutation.mutate({ bookingId: booking.id, status: 'CONFIRMED' })}
                      onReject={() => statusMutation.mutate({ bookingId: booking.id, status: 'REJECTED' })}
                      onRemove={() => {
                        if (window.confirm('Remove attendee from this event?')) {
                          deleteMutation.mutate(booking.id);
                        }
                      }}
                      disabled={isBusy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest/50 rounded-3xl border-2 border-dashed border-primary/10">
              <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="text-outline w-10 h-10 opacity-30" />
              </div>
              <h4 className="text-xl font-bold font-headline text-primary mb-2">No attendees found</h4>
              <p className="text-outline font-medium max-w-xs mx-auto">Try changing filters or waiting for new bookings.</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-outline font-semibold">
              {meta?.total ?? 0} records • page {meta?.page ?? 1}/{meta?.totalPages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={(meta?.page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-primary/5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-outline">{label}</p>
      <p className="text-xl font-black font-headline text-primary mt-1">{value}</p>
    </div>
  );
}

function AttendeeRow({
  booking,
  selected,
  onSelect,
  onConfirm,
  onReject,
  onRemove,
  disabled,
}: {
  booking: EventAttendeeBooking;
  selected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <tr className="group hover:bg-surface-container-high transition-colors">
      <td className="py-5 px-4">
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </td>
      <td className="py-5 px-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden">
            {booking.user.avatar ? (
              <img src={booking.user.avatar} className="w-full h-full object-cover" />
            ) : (
              <User className="text-primary w-5 h-5" />
            )}
          </div>
          <div>
            <div className="font-bold text-on-surface">{booking.user.name}</div>
            <div className="text-xs text-outline">{booking.user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-5 px-4 max-w-sm">
        {booking.answers.length ? (
          <div className="space-y-1">
            {booking.answers.slice(0, 2).map((answer) => (
              <div key={answer.id} className="text-xs">
                <span className="text-outline block font-semibold truncate" title={answer.question.question}>{answer.question.question}</span>
                <span className="text-on-surface/80">{answer.answer}</span>
              </div>
            ))}
            {booking.answers.length > 2 ? (
              <span className="text-[10px] text-outline">+{booking.answers.length - 2} more answers</span>
            ) : null}
          </div>
        ) : (
          <span className="text-[10px] text-outline/60 italic">No answers</span>
        )}
      </td>
      <td className="py-5 px-4 text-xs font-semibold text-outline">
        {new Date(booking.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </td>
      <td className="py-5 px-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
          booking.status === 'CONFIRMED'
            ? 'bg-secondary-container text-on-secondary-container'
            : booking.status === 'PENDING'
              ? 'bg-primary/5 text-primary border border-primary/10'
              : 'bg-error/5 text-error border border-error/10'
        }`}>
          {booking.status}
        </span>
      </td>
      <td className="py-5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {booking.status === 'PENDING' ? (
            <>
              <Button size="sm" className="h-8 w-8 p-0 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80" onClick={onConfirm} disabled={disabled}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={onReject} disabled={disabled}>
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-error hover:bg-error/5" onClick={onRemove} disabled={disabled}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
