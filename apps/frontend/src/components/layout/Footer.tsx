import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-low border-t border-primary/5 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-14">
        <div className="space-y-6 max-w-xl">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="Eventify logo" className="w-10 h-10 rounded-xl shadow-sm group-hover:rotate-6 transition-transform" />
            <span className="text-xl font-black text-on-surface font-headline tracking-tight uppercase">Eventify</span>
          </Link>
          <p className="text-outline text-sm leading-relaxed font-medium">
            Eventify helps people discover, book, and manage events with a cleaner experience for organizers and attendees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h4 className="text-primary font-black font-headline uppercase tracking-widest text-xs mb-6">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-outline text-sm font-medium leading-tight">Constantine, Algeria</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:contact@eventify.online" className="text-outline text-sm font-medium hover:text-primary transition-colors">
                  contact@eventify.online
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary font-black font-headline uppercase tracking-widest text-xs mb-6">Links</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/events" className="text-outline hover:text-primary text-sm font-bold transition-colors">Browse Events</Link>
              </li>
              <li>
                <Link to="/login" className="text-outline hover:text-primary text-sm font-bold transition-colors">Login</Link>
              </li>
              <li>
                <Link to="/register" className="text-outline hover:text-primary text-sm font-bold transition-colors">Register</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
          &copy; {currentYear} Eventify. All Rights Reserved.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Secure event platform</span>
        </div>
      </div>
    </footer>
  );
}
