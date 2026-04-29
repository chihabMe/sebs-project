/* AUTO-GENERATED FILE. DO NOT EDIT.
 * Source: apps/backend/openapi.json
 * Regenerate: pnpm api:types:generate
 */

export type ApiRoute =
  | '/admin/approve-event/{id}'
  | '/admin/pending-events'
  | '/admin/reject-event/{id}'
  | '/admin/stats'
  | '/admin/users'
  | '/admin/users/{id}'
  | '/auth/admin/login'
  | '/auth/admin/session'
  | '/auth/login'
  | '/auth/logout'
  | '/auth/refresh'
  | '/auth/register'
  | '/auth/session'
  | '/bookings'
  | '/bookings/my'
  | '/bookings/status/{eventId}'
  | '/bookings/{id}/cancel'
  | '/bookings/{id}/ticket'
  | '/event-forms/{eventId}'
  | '/events'
  | '/events/organizer'
  | '/events/recommended'
  | '/events/{id}'
  | '/events/{id}/manage'
  | '/events/{id}/status'
  | '/health'
  | '/organizer/bookings/{bookingId}'
  | '/organizer/bookings/{bookingId}/status'
  | '/organizer/dashboard/stats'
  | '/organizer/events/{eventId}/attendees'
  | '/organizer/events/{eventId}/bookings/remove'
  | '/organizer/events/{eventId}/bookings/status'
  | '/organizer/events/{eventId}/invite'
  | '/organizer/events/{eventId}/invite/rotate'
  | '/reviews'
  | '/reviews/event/{eventId}'
  | '/reviews/{id}'
  | '/tags'
  | '/tags/{id}'
  | '/users/attendance'
  | '/users/profile'
  | '/users/public/{userId}';

export type ApiMethod =
  | 'delete'
  | 'get'
  | 'patch'
  | 'post';

export type RouteMethods = {
  '/admin/approve-event/{id}': 'patch';
  '/admin/pending-events': 'get';
  '/admin/reject-event/{id}': 'patch';
  '/admin/stats': 'get';
  '/admin/users': 'get' | 'post';
  '/admin/users/{id}': 'patch';
  '/auth/admin/login': 'post';
  '/auth/admin/session': 'get';
  '/auth/login': 'post';
  '/auth/logout': 'post';
  '/auth/refresh': 'post';
  '/auth/register': 'post';
  '/auth/session': 'get';
  '/bookings': 'post';
  '/bookings/my': 'get';
  '/bookings/status/{eventId}': 'get';
  '/bookings/{id}/cancel': 'patch';
  '/bookings/{id}/ticket': 'get';
  '/event-forms/{eventId}': 'get' | 'post';
  '/events': 'get' | 'post';
  '/events/organizer': 'get';
  '/events/recommended': 'get';
  '/events/{id}': 'delete' | 'get' | 'patch';
  '/events/{id}/manage': 'get';
  '/events/{id}/status': 'patch';
  '/health': 'get';
  '/organizer/bookings/{bookingId}': 'delete';
  '/organizer/bookings/{bookingId}/status': 'patch';
  '/organizer/dashboard/stats': 'get';
  '/organizer/events/{eventId}/attendees': 'get';
  '/organizer/events/{eventId}/bookings/remove': 'post';
  '/organizer/events/{eventId}/bookings/status': 'patch';
  '/organizer/events/{eventId}/invite': 'post';
  '/organizer/events/{eventId}/invite/rotate': 'post';
  '/reviews': 'post';
  '/reviews/event/{eventId}': 'get';
  '/reviews/{id}': 'delete';
  '/tags': 'get' | 'post';
  '/tags/{id}': 'delete';
  '/users/attendance': 'get';
  '/users/profile': 'get' | 'patch';
  '/users/public/{userId}': 'get';
};

export type MethodForRoute<R extends ApiRoute> = RouteMethods[R];

export function assertApiRouteMethod<R extends ApiRoute, M extends MethodForRoute<R>>(
  _route: R,
  _method: M,
): void {}
