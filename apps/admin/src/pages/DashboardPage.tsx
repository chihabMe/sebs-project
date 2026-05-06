import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BadgeCheck,
  Ban,
  CalendarClock,
  ExternalLink,
  LogOut,
  Search,
  ShieldCheck,
  Tag,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { AdminUserListItem, CreateAdminUserInput, Role } from '@sebs/shared';
import { approveEvent, createAdminUser, getAdminStats, getAdminUsers, getPendingEvents, rejectEvent, updateAdminUser } from '../api/admin';
import { changePassword } from '../api/auth';
import { passwordRules, validateStrongPassword } from '../utils/passwordPolicy';
import { createTag, deleteTag, getTags } from '../api/tags';
import { useAdminSession } from '../hooks/useAdminSession';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const mainAppUrl = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';
const inputClass = 'h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-1 focus-visible:ring-primary';
const cardClass = 'rounded-lg border border-border bg-background shadow-sm';

function formatDate(value?: string | Date) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } } | null)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className={cardClass}>
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <div className="p-6 pt-0">
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user, logout, isLoggingOut } = useAdminSession();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [tagName, setTagName] = useState('');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState<CreateAdminUserInput>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });
  const usersQuery = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter],
    queryFn: () =>
      getAdminUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        isBanned: statusFilter === 'ALL' ? undefined : statusFilter === 'BANNED',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });
  const pendingEventsQuery = useQuery({
    queryKey: ['admin-events', eventSearch],
    queryFn: () => getPendingEvents({ search: eventSearch || undefined }),
  });
  const tagsQuery = useQuery({ queryKey: ['admin-tags'], queryFn: getTags });

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] }),
    ]);
  };

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      setForm({ name: '', email: '', password: '', role: 'USER' });
      setNotice({ kind: 'success', message: 'User created successfully.' });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to create the user.') });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice({ kind: 'success', message: 'Password changed successfully.' });
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to change password.') });
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; isBanned?: boolean; isActive?: boolean }) => updateAdminUser(id, payload),
    onSuccess: async (_result, variables) => {
      let message = 'User updated successfully.';
      if (variables.isBanned !== undefined) {
        message = variables.isBanned ? 'User banned successfully.' : 'User restored successfully.';
      } else if (variables.isActive !== undefined) {
        message = variables.isActive ? 'User activated successfully.' : 'User deactivated successfully.';
      }
      setNotice({ kind: 'success', message });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to update the user.') });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveEvent,
    onSuccess: async () => {
      setNotice({ kind: 'success', message: 'Event approved successfully.' });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to approve the event.') });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectEvent,
    onSuccess: async () => {
      setNotice({ kind: 'success', message: 'Event rejected successfully.' });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to reject the event.') });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: async () => {
      setTagName('');
      setNotice({ kind: 'success', message: 'Tag created successfully.' });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to create the tag.') });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: async () => {
      setNotice({ kind: 'success', message: 'Tag deleted successfully.' });
      await refreshAdminData();
    },
    onError: (error) => {
      setNotice({ kind: 'error', message: getErrorMessage(error, 'Failed to delete the tag.') });
    },
  });

  const stats = statsQuery.data;
  const users = usersQuery.data ?? [];
  const pendingEvents = pendingEventsQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const recentlyCreatedUsers = useMemo(() => users.slice(0, 5), [users]);
  const newPasswordFailures = validateStrongPassword(passwordForm.newPassword);
  const createUserPasswordFailures = validateStrongPassword(form.password);

  return (
    <div className="min-h-screen bg-surface-strong/40">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background shadow-sm">
              <ShieldCheck className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">Admin</p>
              <p className="text-xs text-muted">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.assign(mainAppUrl)}>
              <ExternalLink className="h-4 w-4" />
              Main app
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
        <aside className="h-fit rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="border-b border-border pb-4">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="mt-1 truncate text-xs text-muted">{user?.email}</p>
            <span className="mt-3 inline-flex rounded-md border border-border px-2 py-1 text-xs font-medium text-muted">
              {user?.role}
            </span>
          </div>

          <nav className="mt-4 space-y-1 text-sm">
            {['Overview', 'Pending events', 'Users', 'Tags', 'Security'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block rounded-md px-3 py-2 text-muted hover:bg-surface-strong hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          {notice ? (
            <section
              className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${
                notice.kind === 'success'
                  ? 'border-success/20 bg-success/5 text-success'
                  : 'border-danger/20 bg-danger/5 text-danger'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{notice.message}</span>
                <button className="font-medium text-current/80 hover:text-current" onClick={() => setNotice(null)}>
                  Dismiss
                </button>
              </div>
            </section>
          ) : null}

          <section id="overview" className="space-y-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-2 text-sm text-muted">Manage platform activity from one admin workspace.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Users" value={stats?.totalUsers ?? 0} icon={Users} />
              <StatCard label="Events" value={stats?.totalEvents ?? 0} icon={CalendarClock} />
              <StatCard label="Bookings" value={stats?.totalBookings ?? 0} icon={Activity} />
              <StatCard label="Pending events" value={stats?.pendingEvents ?? 0} icon={BadgeCheck} />
              <StatCard label="Banned users" value={stats?.bannedUsers ?? 0} icon={Ban} />
            </div>
          </section>

          <section id="pending-events" className={cardClass}>
            <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeader title="Pending events" description="Review event submissions before they go live." />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm">
                  <Search className="h-4 w-4 text-muted" />
                  <input
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                    className="w-full min-w-[180px] bg-transparent text-sm outline-none placeholder:text-muted"
                    placeholder="Search events"
                  />
                </label>
                <span className="rounded-md bg-surface-strong px-2.5 py-1 text-xs font-medium text-muted">
                  {pendingEvents.length} waiting
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {pendingEvents.length > 0 ? (
                pendingEvents.map((event) => (
                  <article key={event.id} className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">{event.category}</p>
                        <h3 className="mt-1 text-base font-semibold text-foreground">{event.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm text-muted">{event.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                          <span className="rounded-md border border-border px-2 py-1">{formatDate(event.date)}</span>
                          <span className="rounded-md border border-border px-2 py-1">{event.location}</span>
                          <span className="rounded-md border border-border px-2 py-1">{event.organizer?.name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(event.id)} disabled={approveMutation.isPending}>
                          <BadgeCheck className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(event.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-10 text-center text-sm text-muted">No pending events need approval.</div>
              )}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div id="users" className={cardClass}>
              <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
                <SectionHeader title="Users" description="Search accounts and update access status." />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm">
                    <Search className="h-4 w-4 text-muted" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full min-w-[220px] bg-transparent text-sm outline-none placeholder:text-muted"
                      placeholder="Search name or email"
                    />
                  </label>
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'ALL')} className={inputClass}>
                    <option value="ALL">All roles</option>
                    <option value="USER">User</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'BANNED')} className={inputClass}>
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="BANNED">Banned</option>
                  </select>
                </div>
              </div>

              <div className="p-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((item: AdminUserListItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-sm text-muted">{item.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.role}</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-md px-2 py-1 text-xs font-medium ${
                                item.isBanned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                              }`}
                            >
                              {item.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-md px-2 py-1 text-xs font-medium ${
                                item.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {item.isActive ? 'Verified' : 'Unverified'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {item.role === 'ADMIN' ? (
                              <span className="text-xs font-medium text-muted">Protected</span>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant={item.isActive ? 'outline' : 'default'}
                                  onClick={() => toggleBanMutation.mutate({ id: item.id, isActive: !item.isActive })}
                                >
                                  {item.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={item.isBanned ? 'outline' : 'destructive'}
                                  onClick={() => toggleBanMutation.mutate({ id: item.id, isBanned: !item.isBanned })}
                                >
                                  {item.isBanned ? 'Restore' : 'Ban'}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted">
                          No users match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-6">
              <div className={cardClass}>
                <div className="border-b border-border p-6">
                  <SectionHeader title="Create user" description="Provision a new account." />
                </div>
                <form
                  className="space-y-4 p-6"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const passwordFailures = validateStrongPassword(form.password);
                    if (passwordFailures.length > 0) {
                      setNotice({ kind: 'error', message: `Password is too weak: ${passwordFailures.join(', ')}` });
                      return;
                    }
                    await createUserMutation.mutateAsync(form);
                  }}
                >
                  <input
                    className={inputClass}
                    placeholder="Name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                  <div className="grid gap-1 rounded-md bg-surface-strong p-3 text-xs text-muted">
                    {passwordRules.map((rule) => (
                      <span key={rule} className={createUserPasswordFailures.includes(rule) ? '' : 'font-medium text-foreground'}>
                        {createUserPasswordFailures.includes(rule) ? '-' : '[x]'} {rule}
                      </span>
                    ))}
                  </div>
                  <select className={inputClass} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}>
                    <option value="USER">User</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                    <UserPlus className="h-4 w-4" />
                    {createUserMutation.isPending ? 'Creating...' : 'Create user'}
                  </Button>
                </form>
              </div>

              <div id="tags" className={cardClass}>
                <div className="border-b border-border p-6">
                  <SectionHeader title="Tags" description="Manage shared event tags." />
                </div>
                <div className="p-6">
                  <form
                    className="flex gap-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!tagName.trim()) return;
                      await createTagMutation.mutateAsync({ name: tagName.trim() });
                    }}
                  >
                    <input className={inputClass} placeholder="New tag" value={tagName} onChange={(event) => setTagName(event.target.value)} />
                    <Button type="submit" disabled={createTagMutation.isPending || !tagName.trim()}>
                      <Tag className="h-4 w-4" />
                      Add
                    </Button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => deleteTagMutation.mutate(tag.id)}
                        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground shadow-sm hover:bg-surface-strong"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div id="security" className={cardClass}>
                <div className="border-b border-border p-6">
                  <SectionHeader title="Security" description="Change your admin password." />
                </div>
                <form
                  className="space-y-4 p-6"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (passwordForm.currentPassword === passwordForm.newPassword) {
                      setNotice({ kind: 'error', message: 'New password must be different from the current password.' });
                      return;
                    }
                    if (newPasswordFailures.length > 0) {
                      setNotice({ kind: 'error', message: `Password is too weak: ${newPasswordFailures.join(', ')}` });
                      return;
                    }
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      setNotice({ kind: 'error', message: 'Password confirmation does not match.' });
                      return;
                    }
                    await changePasswordMutation.mutateAsync({
                      currentPassword: passwordForm.currentPassword,
                      newPassword: passwordForm.newPassword,
                    });
                  }}
                >
                  <input
                    className={inputClass}
                    placeholder="Current password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="New password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Confirm new password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    required
                  />
                  <div className="grid gap-1 rounded-md bg-surface-strong p-3 text-xs text-muted">
                    {passwordRules.map((rule) => (
                      <span key={rule} className={newPasswordFailures.includes(rule) ? '' : 'font-medium text-foreground'}>
                        {newPasswordFailures.includes(rule) ? '-' : '[x]'} {rule}
                      </span>
                    ))}
                  </div>
                  <Button type="submit" className="w-full" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change password'}
                  </Button>
                </form>
              </div>

              <div className={cardClass}>
                <div className="border-b border-border p-6">
                  <SectionHeader title="Recent accounts" description="Newest registrations." />
                </div>
                <div className="divide-y divide-border">
                  {recentlyCreatedUsers.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted">{item.email}</p>
                        <p className="mt-1 text-xs text-muted">{formatDate(item.createdAt)}</p>
                      </div>
                      <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted">
                        {item.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
