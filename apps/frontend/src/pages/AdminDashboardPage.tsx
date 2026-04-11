import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateAdminUserStatus, getAdminPendingEvents, approveAdminEvent, getAdminStats } from '../api/admin';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Shield, User, Calendar, Check, X, Activity, Users, AlertCircle } from 'lucide-react';
import { formatImageUrl } from '../utils/formatUrl';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });
  const { data: users, isLoading: usersLoading } = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers });
  const { data: pendingEvents, isLoading: eventsLoading } = useQuery({ queryKey: ['admin-events'], queryFn: getAdminPendingEvents });

  const approveEventMutation = useMutation({
    mutationFn: approveAdminEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const statsItems = [
    { label: 'Total Curators', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary' },
    { label: 'Active Artifacts', value: stats?.totalEvents || 0, icon: Calendar, color: 'text-secondary' },
    { label: 'Registry Logs', value: stats?.totalBookings || 0, icon: Activity, color: 'text-outline' },
    { label: 'Total Value', value: `$${stats?.totalRevenue || 0}`, icon: Shield, color: 'text-primary' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="mb-12">
          <h2 className="text-4xl font-black font-headline tracking-tight text-primary mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10" /> Global Surveillance
          </h2>
          <p className="text-outline font-medium">System-wide monitoring and administrative control center.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsItems.map((stat, i) => (
            <div key={i} className="bg-surface-container-low p-6 rounded-3xl border border-primary/5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 rounded-xl bg-surface-container-high">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                 </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{stat.label}</p>
              <h4 className="text-3xl font-black font-headline text-on-surface mt-1">{stat.value}</h4>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-surface-container-low rounded-3xl p-8 border border-primary/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-headline text-primary">Awaiting Clearance</h3>
              <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">
                {pendingEvents?.length || 0} Pending Approvals
              </div>
            </div>

            {eventsLoading ? (
              <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
            ) : pendingEvents && pendingEvents.length > 0 ? (
              <div className="space-y-4">
                {pendingEvents.map((event: any) => (
                  <div key={event.id} className="bg-surface-container-high/50 p-4 rounded-2xl flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-primary/10 shrink-0">
                      <img src={formatImageUrl(event.image)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-on-surface truncate">{event.title}</p>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">By {event.organizer.name}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="h-8 w-8 p-0" onClick={() => approveEventMutation.mutate(event.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-error hover:bg-error/5">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-primary/5 rounded-2xl">
                 <AlertCircle className="w-8 h-8 text-outline/30 mx-auto mb-3" />
                 <p className="text-outline text-xs font-bold uppercase tracking-widest">All artifacts cleared.</p>
              </div>
            )}
          </section>

          <section className="bg-surface-container-low rounded-3xl p-8 border border-primary/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-headline text-primary">Identity Registry</h3>
              <div className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">
                Management Mode
              </div>
            </div>

            {usersLoading ? (
              <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {users.map((u: any) => (
                  <div key={u.id} className="bg-surface-container-high/50 p-4 rounded-2xl flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <User className="text-primary w-4 h-4" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-on-surface truncate text-sm">{u.name}</p>
                      <p className="text-[10px] text-outline font-bold uppercase">{u.role}</p>
                    </div>
                    <div className="flex gap-2">
                       {u.role !== 'ADMIN' && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className={`h-8 ${u.isBanned ? 'text-primary' : 'text-error hover:bg-error/5'}`}
                           onClick={() => updateUserMutation.mutate({ id: u.id, data: { isBanned: !u.isBanned } })}
                         >
                           {u.isBanned ? 'Unban' : 'Ban'}
                         </Button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
