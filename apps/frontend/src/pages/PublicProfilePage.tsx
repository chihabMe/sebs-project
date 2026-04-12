import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import { getPublicProfile } from '../api/auth';
import { subDays, format, isSameDay } from 'date-fns';

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

  const { user, history } = data;
  const today = new Date();
  const days = Array.from({ length: 100 }).map((_, i) => subDays(today, 99 - i));

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

            <div className="bg-surface-container-high/50 p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Activity Heatmap</h3>
              <div className="flex flex-wrap gap-1">
                {days.map((day, i) => {
                  const attendedEvents = history?.filter((h: any) => isSameDay(new Date(h.date), day) && h.attended);
                  const hasAttended = attendedEvents && attendedEvents.length > 0;
                  
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${
                        hasAttended ? 'bg-primary' : 'bg-surface-container-highest/50'
                      }`}
                      title={format(day, 'MMM d, yyyy') + (hasAttended ? ` - ${attendedEvents.length} events` : '')}
                    />
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-surface-container-highest/50"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
