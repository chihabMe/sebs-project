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

  it('should fail to update profile with invalid data', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A', // too short, min 2
        avatar: 'not-a-url',
      });

    expect(res.status).toBe(400);
  });

  it('should not allow updating someone else\'s profile', async () => {
    const { token: user1Token } = await createUser('USER');
    const { user: user2 } = await createUser('USER');
    
    // There is no endpoint for updating another user's profile, but we can attempt
    // to pass user2's ID in the body to see if it mistakenly updates user2.
    // The endpoint should ignore the ID and only update user1, or return an error if strict.
    const res = await api.put('/api/users/profile')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        id: user2.id,
        name: 'Hacked Name',
      });

    expect(res.status).toBe(200);
    // It should have updated the authenticated user (user1), not user2
    expect(res.body.data.id).not.toBe(user2.id);
    
    // Verify user2's name was NOT changed
    const user2Res = await api.get(`/api/users/public/${user2.id}`);
    expect(user2Res.body.data.user.name).not.toBe('Hacked Name');
  });

  it('should get user attendance history', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.get('/api/users/attendance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
