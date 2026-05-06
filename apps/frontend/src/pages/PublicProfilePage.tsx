import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import { getPublicProfile } from '../api/auth';
import AttendanceHeatmap from '../components/profile/AttendanceHeatmap';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => getPublicProfile(userId!),
    enabled: !!userId,
  });

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

  if (error || !data) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center text-error font-bold uppercase tracking-widest text-xl">
          Profile not found
        </div>
      </div>
    );
  }

  const { user, history, stats } = data;
  const pastAttended = history.filter((item: any) => item.attended && new Date(item.date) < new Date());
  const missed = history.filter((item: any) => item.missed);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-3xl mx-auto w-full pb-20">
        <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 shadow-xl border border-outline-variant/20">
          <header className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-surface shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-6xl">person</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2">{user.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-primary/20">
                  {user.role}
                </span>
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-widest border border-outline-variant/30">
                  Member since {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </header>

          <section className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Bio</h3>
              <p className="text-on-surface-variant leading-relaxed">
                {user.bio || 'This user is keeping a low profile.'}
              </p>
            </div>

            <AttendanceHeatmap history={history} stats={stats} title="Public activity" />
            <section id="past-events" className="rounded-2xl border border-outline-variant/20 p-5 bg-surface">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Past attended events</h3>
              {pastAttended.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No attended events yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastAttended.map((item: any) => (
                    <Link
                      key={item.id}
                      to={`/events/${item.eventId}`}
                      className="block rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(item.date).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              )}
              {missed.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-error mb-2">Missed booked events</h4>
                  <div className="space-y-2">
                    {missed.map((item: any) => (
                      <div key={item.id} className="rounded-xl border border-error/20 bg-error/5 px-4 py-2">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
