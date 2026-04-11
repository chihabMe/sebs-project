import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyBookings, downloadTicket } from '../api/bookings';
import { formatImageUrl } from '../utils/formatUrl';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto w-full pb-20">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2">Welcome back, {user?.name.split(' ')[0]}</h2>
          <p className="text-on-surface-variant">Manage your tickets and upcoming experiences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-headline">My Tickets</h3>
              <Link to="/events" className="text-primary text-sm font-bold hover:underline">Explore More Events</Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all group">
                    <div className="w-full md:w-48 h-32 rounded-xl bg-primary/10 overflow-hidden border border-primary/20 shrink-0">
                      <img src={formatImageUrl(booking.event.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={booking.event.title} />
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl font-bold text-on-surface font-headline">{booking.event.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            booking.status === 'CONFIRMED' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-sm font-medium">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(booking.event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-sm font-medium">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {booking.event.location}
                          </div>
                        </div>
                      </div>

                      {booking.status === 'CONFIRMED' && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button 
                            onClick={() => downloadTicket(booking.id)}
                            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download Ticket
                          </button>
                          <Link 
                            to={`/events/${booking.eventId}`}
                            className="bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">info</span>
                            Event Info
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl p-12 text-center border-2 border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-outline mb-4">confirmation_number</span>
                <p className="text-on-surface-variant font-medium">No tickets yet. The pulse is waiting for you.</p>
                <Link to="/events" className="mt-4 inline-block text-primary font-bold hover:underline">Browse Upcoming Events</Link>
              </div>
            )}
          </section>

          <aside className="space-y-8">
            <div className="bg-primary rounded-3xl p-8 text-on-primary shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Pulse Status</h3>
              <p className="text-on-primary/80 text-sm mb-6 relative z-10">You have {bookings?.length || 0} active bookings.</p>
              <div className="w-full bg-white/20 rounded-full h-2 mb-4 relative z-10">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(((bookings?.length || 0) / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest relative z-10">
                {(bookings?.length || 0) > 5 ? 'Elite Curator' : 'Rising Explorer'}
              </p>
            </div>
            
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
              <h4 className="font-bold mb-4">Quick Tip</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Download your digital tickets before heading to the venue. Most events at Indigo Pulse require a valid QR code or ID for entry.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
