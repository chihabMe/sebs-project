import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import AttendanceHeatmap from '../components/profile/AttendanceHeatmap';
import EditProfileForm from '../components/profile/EditProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import DeleteAccountForm from '../components/profile/DeleteAccountForm';
import { getFollowing } from '../api/auth';
import { PAGINATION } from '../constants/pagination';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [followingPage, setFollowingPage] = useState(1);
  const followingLimit = PAGINATION.FOLLOWING;
  const { data: followingResponse } = useQuery({
    queryKey: ['following', followingPage, followingLimit],
    queryFn: () => getFollowing(followingPage, followingLimit),
    enabled: !!user,
  });
  const following = followingResponse?.data || [];
  const followingMeta = followingResponse?.meta;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-4xl mx-auto w-full pb-20">
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

            <AttendanceHeatmap />

            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Following</h3>
              <div className="space-y-3">
                {following.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">You are not following anyone yet.</p>
                ) : (
                  following.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-outline-variant/20 bg-surface flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/users/${item.id}`} className="font-semibold hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                        <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">{item.role}</p>
                      </div>
                      {item.role === 'ORGANIZER' ? (
                        <Link to={`/events?organizerId=${item.id}`} className="text-xs font-semibold text-primary hover:underline">
                          See events
                        </Link>
                      ) : (
                        <Link to={`/users/${item.id}#past-events`} className="text-xs font-semibold text-primary hover:underline">
                          See past attended events
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  {followingMeta ? `Page ${followingMeta.page} of ${followingMeta.totalPages} • ${followingMeta.total} following` : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50"
                    disabled={!followingMeta || followingPage <= 1}
                    onClick={() => setFollowingPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50"
                    disabled={!followingMeta || followingPage >= followingMeta.totalPages}
                    onClick={() => setFollowingPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            
            {isEditing ? (
              <EditProfileForm onSuccess={() => setIsEditing(false)} />
            ) : (
              <div className="pt-8 border-t border-outline-variant/10">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold px-6 py-3 rounded-xl transition-all border border-outline-variant/30"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </section>
        </div>
        <div className="mt-8">
          <ChangePasswordForm />
        </div>
        {user?.role === 'USER' ? (
          <div className="mt-8">
            <DeleteAccountForm />
          </div>
        ) : null}
      </main>
    </div>
  );
}
