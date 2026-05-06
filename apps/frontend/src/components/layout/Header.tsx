import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown, User, LogOut, LayoutDashboard, Menu, Bell } from 'lucide-react';
import { getNotifications } from '../../api/auth';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isAuthenticated && user?.role === 'USER',
    refetchInterval: 15_000,
  });

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(62,0,0,0.06)] border-b border-primary/5">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-outline">
                  <Menu className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 mt-2">
                <Link to="/">
                  <DropdownMenuItem className="font-bold uppercase tracking-widest text-[10px]">
                    Home
                  </DropdownMenuItem>
                </Link>
                <Link to="/events">
                  <DropdownMenuItem className="font-bold uppercase tracking-widest text-[10px]">
                    Experiences
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link to="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <img src="/logo.svg" alt="Eventify logo" className="w-10 h-10 rounded-xl shadow-sm group-hover:rotate-6 transition-transform" />
            <span className="text-xl font-black text-on-surface font-headline tracking-tight uppercase hidden sm:inline-block">Eventify</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors">Home</Link>
            <Link to="/events" className="text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors">Experiences</Link>
            {user?.role === 'USER' ? (
              <Link to="/users" className="text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors">Users</Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'USER' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-4 h-4" />
                      {notifications.length > 0 ? (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] leading-4">
                          {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="mt-2 w-80 max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <DropdownMenuItem className="text-xs text-outline">No new notifications</DropdownMenuItem>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="flex-col items-start gap-1 py-3">
                          <p className="text-xs font-semibold">{notification.title}</p>
                          <p className="text-[11px] text-outline whitespace-normal">{notification.message}</p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-surface-container-low hover:bg-surface-container transition-all border border-primary/5 shadow-sm group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 group-hover:scale-105 transition-transform">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-primary w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-on-surface uppercase tracking-widest hidden sm:inline-block">{user?.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-outline" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-2 w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-[9px] font-medium text-outline lowercase">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem className="gap-2">
                      <User className="w-4 h-4" /> Profile Settings
                    </DropdownMenuItem>
                  </Link>
                  {user?.role === 'USER' && (
                    <Link to="/dashboard">
                      <DropdownMenuItem className="gap-2">
                        <LayoutDashboard className="w-4 h-4" /> My Experiences
                      </DropdownMenuItem>
                    </Link>
                  )}
                  {user?.role === 'ORGANIZER' && (
                    <Link to="/organizer">
                      <DropdownMenuItem className="gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Curator Console
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="gap-2 text-error focus:text-error focus:bg-error/5">
                    <LogOut className="w-4 h-4" /> Deauthorize Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
