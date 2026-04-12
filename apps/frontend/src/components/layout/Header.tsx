import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown, User, LogOut, LayoutDashboard, Shield, Info, Rocket, HeartHandshake, Menu } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

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
                <Link to="/events">
                  <DropdownMenuItem className="font-bold uppercase tracking-widest text-[10px]">
                    Experiences
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-outline">About</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Info className="w-4 h-4" /> Our Mission
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <HeartHandshake className="w-4 h-4" /> Community Pulse
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-outline">Services</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Rocket className="w-4 h-4" /> Rapid Deployment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link to="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-on-primary">bolt</span>
            </div>
            <span className="text-xl font-black text-on-surface font-headline tracking-tight uppercase hidden sm:inline-block">Indigo Pulse</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/events" className="text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors">Experiences</Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors outline-none">
                About <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="mt-2">
                <DropdownMenuLabel>The Archive</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Info className="w-4 h-4" /> Our Mission
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <HeartHandshake className="w-4 h-4" /> Community Pulse
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-[10px] uppercase font-bold text-outline">
                  Curator Registry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-outline hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors outline-none">
                Services <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="mt-2">
                <DropdownMenuLabel>Platform Capabilities</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Rocket className="w-4 h-4" /> Rapid Deployment
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                   Secure Registry
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                   Artifact Management
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
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
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin">
                      <DropdownMenuItem className="gap-2 text-primary font-bold">
                        <Shield className="w-4 h-4" /> Global Control
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
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Identity Registry</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">New Artifact</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
