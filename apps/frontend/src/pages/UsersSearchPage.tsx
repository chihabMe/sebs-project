import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import { followUser, searchUsers, unfollowUser } from '../api/auth';
import { useToast } from '../components/ui/toast-provider';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { PAGINATION } from '../constants/pagination';

export default function UsersSearchPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = PAGINATION.USERS_SEARCH;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['users-search', query, page, limit],
    queryFn: () => searchUsers(query, page, limit),
  });
  const users = data?.data || [];
  const meta = data?.meta;

  const followMutation = useMutation({
    mutationFn: async ({ userId, follow }: { userId: string; follow: boolean }) => {
      if (follow) return followUser(userId);
      return unfollowUser(userId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-search'] });
      showToast(variables.follow ? 'User followed' : 'User unfollowed', 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || 'Failed to update follow state', 'error');
    },
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-28 px-6 pb-20 max-w-4xl mx-auto w-full">
        <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/20 shadow-lg">
          <h1 className="text-3xl font-extrabold font-headline mb-2">Find Users</h1>
          <p className="text-on-surface-variant mb-6">Follow people and get notified when they book events.</p>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {isLoading ? <p className="text-sm text-on-surface-variant">Loading users...</p> : null}
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-outline-variant/20 bg-surface">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <span className="text-primary text-xs font-bold">{user.name.slice(0, 1)}</span>}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/users/${user.id}`} className="font-semibold truncate hover:text-primary transition-colors block">
                      {user.name}
                    </Link>
                    <p className="text-xs text-on-surface-variant truncate">{user.bio || 'No bio yet'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'ORGANIZER' ? (
                    <Link to={`/events?organizerId=${user.id}`}>
                      <Button variant="outline">See Events</Button>
                    </Link>
                  ) : (
                    <Link to={`/users/${user.id}#past-events`}>
                      <Button variant="outline">See Past Attended Events</Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => followMutation.mutate({ userId: user.id, follow: !user.isFollowing })}
                    disabled={followMutation.isPending}
                    variant={user.isFollowing ? 'outline' : 'default'}
                  >
                    {user.isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && users.length === 0 ? <p className="text-sm text-on-surface-variant">No users found.</p> : null}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              {meta ? `Page ${meta.page} of ${meta.totalPages} • ${meta.total} results` : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={!meta || page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!meta || page >= meta.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
