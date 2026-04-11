import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-3xl mx-auto w-full">
        <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 shadow-xl border border-outline-variant/20">
          <header className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-surface shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-6xl">person</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-2">{user?.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-primary/20">
                  {user?.role}
                </span>
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-widest border border-outline-variant/30">
                  Member since 2026
                </span>
              </div>
            </div>
          </header>

          <section className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Bio</h3>
              <p className="text-on-surface-variant leading-relaxed">
                {user?.bio || 'No bio provided yet. Tell the world about your kinetic interests.'}
              </p>
            </div>
            
            <div className="pt-8 border-t border-outline-variant/10">
              <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold px-6 py-3 rounded-xl transition-all border border-outline-variant/30">
                Edit Profile
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
