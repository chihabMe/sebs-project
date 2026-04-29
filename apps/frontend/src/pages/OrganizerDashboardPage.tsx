import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyEvents, updateEventStatus } from '../api/events';
import { getOrganizerDashboardStats } from '../api/organizer';
import { EventDto, EventStatus } from '@sebs/shared';
import { formatImageUrl } from '../utils/formatUrl';
import { Button } from '../components/ui/button';
import {
  Plus,
  Users,
  Edit,
  ClipboardList,
  ClipboardCheck,
  Eye,
  CheckCircle2,
  Ban,
  CalendarClock,
  Layers,
} from 'lucide-react';
import { useToast } from '../components/ui/toast-provider';

const PAGE_SIZE = 8;

type ApprovalFilter = 'ALL' | 'APPROVED' | 'PENDING';
type StatusFilter = 'ALL' | EventStatus;
type SortKey = 'date' | 'createdAt' | 'title';
type SortOrder = 'asc' | 'desc';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  const { data: events = [], isLoading: loadingEvents, isError: eventsError } = useQuery({
    queryKey: ['my-events'],
    queryFn: getMyEvents,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['organizer-dashboard-stats'],
    queryFn: getOrganizerDashboardStats,
  });

  const invalidateOrganizerQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['my-events'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    queryClient.invalidateQueries({ queryKey: ['recommended-events'] });
    queryClient.invalidateQueries({ queryKey: ['organizer-dashboard-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) => updateEventStatus(id, status),
    onSuccess: () => {
      invalidateOrganizerQueries();
      showToast('Event status updated.', 'success');
    },
    onError: () => {
      showToast('Failed to update event status.', 'error');
    },
  });

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const result = events
      .filter((event) => {
        if (statusFilter !== 'ALL' && event.status !== statusFilter) return false;
        if (approvalFilter === 'APPROVED' && !event.isApproved) return false;
        if (approvalFilter === 'PENDING' && event.isApproved) return false;
        if (!normalizedSearch) return true;
        const haystack = `${event.title} ${event.category} ${event.location}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortKey === 'title') {
          return a.title.localeCompare(b.title) * multiplier;
        }
        const av = new Date(a[sortKey]).getTime();
        const bv = new Date(b[sortKey]).getTime();
        return (av - bv) * multiplier;
      });

    return result;
  }, [approvalFilter, events, search, sortKey, sortOrder, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleStatusAction = (eventId: string, nextStatus: EventStatus) => {
    const message = `Set this event to ${nextStatus}?`;
    if (!window.confirm(message)) return;
    statusMutation.mutate({ id: eventId, status: nextStatus });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 text-primary">Organizer Workspace</h2>
            <p className="text-outline font-medium">
              Welcome back, {user?.name.split(' ')[0]}. Manage event lifecycle, attendees, and invite operations.
            </p>
          </div>
          <Link to="/organizer/events/new">
            <Button className="shadow-xl">
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
          </Link>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Events"
            value={loadingStats ? '...' : String(stats?.totalEvents ?? 0)}
            subtitle="Organizer-owned"
            icon={<Layers className="w-4 h-4" />}
          />
          <StatCard
            title="Pending Approval"
            value={loadingStats ? '...' : String(stats?.pendingApprovalEvents ?? 0)}
            subtitle="Awaiting admin review"
            icon={<CalendarClock className="w-4 h-4" />}
          />
          <StatCard
            title="Confirmed Bookings"
            value={loadingStats ? '...' : String(stats?.confirmedBookings ?? 0)}
            subtitle="Across all events"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            title="Confirmation Rate"
            value={loadingStats ? '...' : `${stats?.confirmationRate ?? 0}%`}
            subtitle="Confirmed / total bookings"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
        </section>

        <section className="bg-surface-container-low rounded-3xl p-6 md:p-8 border border-primary/5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="flex-1 bg-surface-container-high rounded-xl py-3 px-4 text-on-surface border-none outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search by title, category, or location..."
            />
            <select
              className="bg-surface-container-high rounded-xl py-3 px-4 text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-primary/30"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select
              className="bg-surface-container-high rounded-xl py-3 px-4 text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-primary/30"
              value={approvalFilter}
              onChange={(event) => {
                setApprovalFilter(event.target.value as ApprovalFilter);
                setPage(1);
              }}
            >
              <option value="ALL">All approvals</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending approval</option>
            </select>
            <select
              className="bg-surface-container-high rounded-xl py-3 px-4 text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-primary/30"
              value={`${sortKey}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortKey, nextSortOrder] = event.target.value.split(':') as [SortKey, SortOrder];
                setSortKey(nextSortKey);
                setSortOrder(nextSortOrder);
              }}
            >
              <option value="createdAt:desc">Newest created</option>
              <option value="createdAt:asc">Oldest created</option>
              <option value="date:asc">Nearest date</option>
              <option value="date:desc">Farthest date</option>
              <option value="title:asc">Title A-Z</option>
              <option value="title:desc">Title Z-A</option>
            </select>
          </div>

          {eventsError ? (
            <div className="bg-error/5 text-error rounded-xl p-4 border border-error/20 text-sm font-semibold">
              Failed to load organizer events.
            </div>
          ) : loadingEvents ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : paginatedEvents.length ? (
            <>
              <DesktopTable
                events={paginatedEvents}
                onStatusAction={handleStatusAction}
                isMutating={statusMutation.isPending}
              />
              <MobileCards
                events={paginatedEvents}
                onStatusAction={handleStatusAction}
                isMutating={statusMutation.isPending}
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredEvents.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest/40 rounded-3xl border-2 border-dashed border-primary/10">
              <h4 className="text-2xl font-bold font-headline text-primary mb-2">No Matching Events</h4>
              <p className="text-outline mb-6">Adjust filters or create a new event.</p>
              <Link to="/organizer/events/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 border border-primary/5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest font-bold text-outline">{title}</p>
        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
      </div>
      <p className="text-3xl font-black font-headline text-primary">{value}</p>
      <p className="text-xs text-outline mt-1">{subtitle}</p>
    </div>
  );
}

function DesktopTable({
  events,
  onStatusAction,
  isMutating,
}: {
  events: EventDto[];
  onStatusAction: (eventId: string, status: EventStatus) => void;
  isMutating: boolean;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left min-w-[980px]">
        <thead>
          <tr className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/5">
            <th className="pb-4 px-4">Event</th>
            <th className="pb-4 px-4">Date</th>
            <th className="pb-4 px-4">Approval</th>
            <th className="pb-4 px-4">Status</th>
            <th className="pb-4 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/5">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-surface-container-high transition-colors">
              <td className="py-5 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 overflow-hidden border border-primary/10 shrink-0">
                    <img src={formatImageUrl(event.image)} className="w-full h-full object-cover" alt={event.title} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{event.title}</p>
                    <p className="text-xs text-outline">{event.category} • {event.location}</p>
                  </div>
                </div>
              </td>
              <td className="py-5 px-4 text-sm font-semibold text-on-surface">
                {new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </td>
              <td className="py-5 px-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  event.isApproved ? 'bg-secondary-container/30 text-on-secondary-container border-secondary/20' : 'bg-primary/5 text-primary border-primary/10'
                }`}>
                  {event.isApproved ? 'APPROVED' : 'PENDING'}
                </span>
              </td>
              <td className="py-5 px-4">
                <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-surface-container-high text-on-surface">
                  {event.status}
                </span>
              </td>
              <td className="py-5 px-4">
                <div className="flex justify-end gap-2">
                  <Link to={`/events/${event.id}`} title="Preview">
                    <Button variant="ghost" size="icon" className="h-9 w-9"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Link to={`/organizer/events/${event.id}/attendees`} title="Attendees">
                    <Button variant="outline" size="icon" className="h-9 w-9 border-secondary/20 text-secondary"><Users className="w-4 h-4" /></Button>
                  </Link>
                  <Link to={`/organizer/events/${event.id}/applications`} title="Applications">
                    <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary"><ClipboardCheck className="w-4 h-4" /></Button>
                  </Link>
                  <Link to={`/organizer/events/${event.id}/form`} title="Form">
                    <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary"><ClipboardList className="w-4 h-4" /></Button>
                  </Link>
                  <Link to={`/organizer/events/${event.id}/edit`} title="Edit">
                    <Button variant="ghost" size="icon" className="h-9 w-9"><Edit className="w-4 h-4" /></Button>
                  </Link>
                  {event.status !== 'COMPLETED' && event.status !== 'CANCELLED' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-secondary"
                      disabled={isMutating}
                      onClick={() => onStatusAction(event.id, 'COMPLETED')}
                      title="Mark completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  ) : null}
                  {event.status !== 'CANCELLED' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-error"
                      disabled={isMutating}
                      onClick={() => onStatusAction(event.id, 'CANCELLED')}
                      title="Cancel"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({
  events,
  onStatusAction,
  isMutating,
}: {
  events: EventDto[];
  onStatusAction: (eventId: string, status: EventStatus) => void;
  isMutating: boolean;
}) {
  return (
    <div className="md:hidden space-y-4">
      {events.map((event) => (
        <div key={event.id} className="bg-surface-container-high rounded-2xl p-4 border border-primary/5">
          <p className="font-bold text-on-surface mb-1">{event.title}</p>
          <p className="text-xs text-outline mb-3">{event.category} • {event.location}</p>
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-surface text-outline">{event.status}</span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${event.isApproved ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'}`}>
              {event.isApproved ? 'APPROVED' : 'PENDING'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Link to={`/events/${event.id}`}><Button variant="ghost" size="sm" className="w-full"><Eye className="w-4 h-4" /></Button></Link>
            <Link to={`/organizer/events/${event.id}/attendees`}><Button variant="outline" size="sm" className="w-full"><Users className="w-4 h-4" /></Button></Link>
            <Link to={`/organizer/events/${event.id}/applications`}><Button variant="outline" size="sm" className="w-full"><ClipboardCheck className="w-4 h-4" /></Button></Link>
            <Button variant="outline" size="sm" className="w-full" onClick={() => onStatusAction(event.id, 'COMPLETED')} disabled={isMutating}><CheckCircle2 className="w-4 h-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-xs font-semibold text-outline">{totalItems} matching events</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </Button>
        <span className="text-xs font-bold text-outline px-2">
          {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
