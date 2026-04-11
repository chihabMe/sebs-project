import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(62,0,0,0.06)] border-b border-primary/5">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined text-on-primary">bolt</span>
          </div>
          <span className="text-xl font-black text-on-surface font-headline tracking-tight">Indigo Pulse</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/events" className="text-on-surface-variant hover:text-primary font-headline font-bold text-sm transition-colors">Browse</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-on-surface-variant hover:text-primary font-headline font-bold text-sm transition-colors">My Tickets</Link>
          )}
          {user?.role === 'ORGANIZER' && (
            <Link to="/organizer" className="text-on-surface-variant hover:text-primary font-headline font-bold text-sm transition-colors">Organize</Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                  )}
                </div>
                <span className="text-sm font-bold text-on-surface">{user?.name.split(' ')[0]}</span>
              </Link>
              <button 
                onClick={() => logout()}
                className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error/5"
                title="Logout"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-gradient-to-br from-primary to-primary-dim text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
