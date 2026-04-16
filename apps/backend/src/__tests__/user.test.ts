import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';

describe('User API', () => {
  it('should get public profile for a user', async () => {
    const { user } = await createUser('USER');
    
    const res = await api.get(`/api/users/public/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('should update user profile', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        bio: 'This is a new bio'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.bio).toBe('This is a new bio');
  });

  it('should get user attendance history', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.get('/api/users/attendance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
