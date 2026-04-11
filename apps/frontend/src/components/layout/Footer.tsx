import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-low border-t border-primary/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        {/* Brand Info */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-on-primary">bolt</span>
            </div>
            <span className="text-xl font-black text-on-surface font-headline tracking-tight uppercase">Indigo Pulse</span>
          </Link>
          <p className="text-outline text-sm leading-relaxed max-w-xs font-medium">
            Curating kinetic experiences and academic artifacts for the modern discoverer. Your archive for the pulse of the community.
          </p>
          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary transition-all">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-primary font-black font-headline uppercase tracking-widest text-xs mb-8">Navigation</h4>
          <ul className="space-y-4">
            {['Browse Experiences', 'About the Archive', 'Curation Services', 'Member Registry', 'Privacy Policy'].map((link) => (
              <li key={link}>
                <a href="#" className="text-outline hover:text-primary text-sm font-bold transition-colors">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-primary font-black font-headline uppercase tracking-widest text-xs mb-8">Curation</h4>
          <ul className="space-y-4">
            {['Event Verification', 'Ticketing Archive', 'Identity Registry', 'Artifact Management', 'Global Surveillance'].map((link) => (
              <li key={link}>
                <a href="#" className="text-outline hover:text-primary text-sm font-bold transition-colors">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-primary font-black font-headline uppercase tracking-widest text-xs mb-8">Registry Hub</h4>
          <ul className="space-y-6">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="text-outline text-sm font-medium leading-tight">The Kinetic Hall, 42 Discovery Lane, Pulse District</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <span className="text-outline text-sm font-medium">archive@indigopulse.com</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span className="text-outline text-sm font-medium">+1 (555) 000-ARTIFACT</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
          &copy; {currentYear} Indigo Pulse Curation System. All Rights Reserved.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Secured Archive Node v2.0.4</span>
        </div>
      </div>
    </footer>
  );
}
