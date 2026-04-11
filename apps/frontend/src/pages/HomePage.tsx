import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleExplore = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    navigate(`/events?${params.toString()}`);
  };

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

        {/* Featured Events Placeholder */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 font-headline">Featured Events</h2>
            <div className="w-16 h-1.5 bg-primary rounded-full mx-auto mb-12"></div>
            <p className="text-on-surface-variant">Stay tuned for the kinetic pulse of upcoming experiences...</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest py-12 px-6 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-sm">bolt</span>
            </div>
            <span className="font-headline font-bold">Indigo Pulse</span>
          </div>
          <p className="text-on-surface-variant text-sm">&copy; 2026 Indigo Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
