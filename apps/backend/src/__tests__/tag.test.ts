import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';

describe('Tags API', () => {
  it('should list all tags', async () => {
    const res = await api.get('/api/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should create a tag as ADMIN', async () => {
    const { token } = await createUser('ADMIN');
    
    const res = await api.post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Innovation' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Innovation');
  });

  it('should fail to create a tag as USER', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'NotAllowed' });

    expect(res.status).toBe(403);
  });
});
