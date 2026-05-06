import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { getRecommendedEvents, getEvents } from '../api/events';
import { formatImageUrl } from '../utils/formatUrl';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: recommendedEvents, isLoading: recommendedLoading } = useQuery({
    queryKey: ['recommended-events'],
    queryFn: getRecommendedEvents,
    enabled: !!user,
  });

  const { data: upcomingEventsPayload, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => getEvents({ search: '' }),
  });
  const upcomingEvents = upcomingEventsPayload?.data || [];

  const handleExplore = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    navigate(`/events?${params.toString()}`);
  };

  const renderEventCard = (event: any) => (
    <Link 
      key={event.id} 
      to={`/events/${event.id}`}
      className="group bg-surface-container-low rounded-3xl border border-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={formatImageUrl(event.image)} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          {event.tags?.slice(0, 2).map((tag: any) => (
            <span key={tag.id} className="bg-primary/90 text-on-primary text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h4 className="text-xl font-bold font-headline text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h4>
        <div className="space-y-2 mt-auto">
          <div className="flex items-center gap-2 text-outline text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-outline text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-6 font-headline">
                Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">experience</span>
              </h1>
              <p className="text-on-surface-variant text-lg lg:text-xl mb-10 max-w-2xl leading-relaxed font-body">
                Discover curated events, underground performances, and high-energy gatherings in your city. The kinetic hub for the modern explorer.
              </p>

              {/* Search Bar */}
              <div className="bg-surface-container-lowest p-2 rounded-2xl shadow-[0_20px_40px_rgba(50,41,79,0.06)] flex flex-col md:flex-row gap-2 max-w-4xl border border-outline-variant/30">
                <div className="flex-grow flex items-center px-4 gap-3 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary">search</span>
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 py-4 text-on-surface placeholder:text-outline" 
                    placeholder="Search events, artists, or venues..." 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
                  />
                </div>
                <div className="md:w-px bg-outline-variant/20 hidden md:block self-stretch my-2"></div>
                <div className="flex items-center px-4 gap-3 bg-surface-container-low md:bg-transparent rounded-xl md:rounded-none">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <input className="w-full md:w-40 bg-transparent border-none focus:ring-0 py-4 text-on-surface" placeholder="Location" type="text"/>
                </div>
                <button 
                  onClick={handleExplore}
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended for You Section */}
        {user && (
          <section className="bg-surface py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black font-headline text-primary mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8" /> Recommended for You
                  </h2>
                  <p className="text-outline font-medium">Experiences tuned to your unique kinetic signature.</p>
                </div>
                <Link to="/events" className="text-primary font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  See All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {recommendedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-surface-container-high rounded-3xl animate-pulse" />)}
                </div>
              ) : recommendedEvents && recommendedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendedEvents.map(renderEventCard)}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface-container-low rounded-[3rem] border-2 border-dashed border-primary/5">
                  <p className="text-outline font-bold uppercase tracking-widest">No matching experiences found yet.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Global Feed Section */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black font-headline text-on-surface mb-2">Upcoming Experiences</h2>
                <div className="w-16 h-1.5 bg-primary rounded-full"></div>
              </div>
              <Link to="/events" className="text-primary font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                Browse Registry <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {upcomingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-surface-container-high rounded-3xl animate-pulse" />)}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingEvents.slice(0, 8).map(renderEventCard)}
              </div>
            ) : (
              <p className="text-on-surface-variant text-center py-12">Stay tuned for the kinetic pulse of upcoming experiences...</p>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
