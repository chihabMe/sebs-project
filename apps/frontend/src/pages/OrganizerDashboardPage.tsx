import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyEvents, deleteEvent } from '../api/events';
import { formatImageUrl } from '../utils/formatUrl';
import { Button } from '../components/ui/button';
import { Plus, Users, Edit, Trash2, ClipboardList, Eye } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: getMyEvents,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 text-primary">Organizer Archive</h2>
            <p className="text-outline font-medium">Welcome back, {user?.name.split(' ')[0]}. Curator of curated experiences.</p>
          </div>
          <Link to="/organizer/events/new">
            <Button className="shadow-xl">
              <Plus className="mr-2 h-4 w-4" /> Initialize New Event
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <section className="bg-surface-container-low rounded-3xl p-8 border border-primary/5 overflow-x-auto shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-headline text-primary">Active Experiences</h3>
              <div className="px-4 py-1.5 bg-primary/5 text-primary text-xs font-bold rounded-full border border-primary/10 uppercase tracking-widest">
                {events?.length || 0} Managed Entries
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : events && events.length > 0 ? (
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold border-b border-primary/5">
                    <th className="pb-4 px-4">Event Catalog</th>
                    <th className="pb-4 px-4">Schedule & Status</th>
                    <th className="pb-4 px-4">Registry Info</th>
                    <th className="pb-4 px-4 text-right">Management Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {events.map((event: any) => (
                    <tr key={event.id} className="group hover:bg-surface-container-high transition-all duration-300">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 rounded-2xl bg-primary/5 overflow-hidden border border-primary/10 shrink-0 shadow-inner">
                            <img src={formatImageUrl(event.image)} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt={event.title} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-on-surface font-headline text-lg truncate mb-1">{event.title}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{event.category}</span>
                               <span className="w-1 h-1 rounded-full bg-outline/30"></span>
                               <span className="text-[10px] font-bold text-primary uppercase tracking-widest">${event.price}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <p className="text-sm font-bold text-on-surface">{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                        <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          event.isApproved ? 'bg-secondary-container/30 text-on-secondary-container border-secondary/20' : 'bg-primary/5 text-primary border-primary/10'
                        }`}>
                          {event.isApproved ? 'Approved Entry' : 'Awaiting Clearance'}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <p className="text-sm font-bold text-on-surface">{event.maxTickets} Total Capacity</p>
                        <p className="text-xs text-outline font-medium mt-1">Registry Open</p>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/events/${event.id}`} title="Preview Page">
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/organizer/events/${event.id}/attendees`} title="Manage Attendees">
                            <Button variant="outline" size="icon" className="h-10 w-10 border-secondary/20 text-secondary hover:bg-secondary/5">
                              <Users className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/organizer/events/${event.id}/form`} title="Manage Discovery Form">
                            <Button variant="outline" size="icon" className="h-10 w-10 border-primary/20 text-primary hover:bg-primary/5">
                              <ClipboardList className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/organizer/events/${event.id}/edit`} title="Edit Catalog Info">
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-error hover:bg-error/5"
                            onClick={() => window.confirm('Are you sure you want to delete this event?') && deleteMutation.mutate(event.id)}
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
              <div className="text-center py-24 bg-surface-container-lowest/50 rounded-3xl border-2 border-dashed border-primary/10">
                <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <Plus className="text-outline w-10 h-10 opacity-30" />
                </div>
                <h4 className="text-2xl font-bold font-headline text-primary mb-2">No Active Artifacts</h4>
                <p className="text-outline font-medium max-w-sm mx-auto mb-10">Your archive is currently empty. Initialize your first curated experience to begin.</p>
                <Link to="/organizer/events/new">
                   <Button variant="default">Start First Curated Experience</Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
