import { expect, test, describe } from 'vitest';
import { Hono } from 'hono';
import { bibleRoutes } from './bible';

const app = new Hono();
app.route('/', bibleRoutes);

describe('Bible Routes', () => {
  test('GET /books returns book list and translations', async () => {
    const res = await app.request('/books');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books).toBeInstanceOf(Array);
    expect(body.translations).toContain('kjv');
    expect(body.translationNames).toHaveProperty('kjv');
  });

  test('GET /search rejects short queries', async () => {
    const res = await app.request('/search?q=ab');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toContain('at least 3 characters');
  });

  test('GET /search rejects overly long queries', async () => {
    const res = await app.request(`/search?q=${'a'.repeat(101)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toContain('Query too long');
  });

  test('GET /search accepts valid queries', async () => {
    const res = await app.request('/search?q=love&translation=kjv');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('results');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('offset');
  });

  test('GET /search respects limit and offset params', async () => {
    const res = await app.request('/search?q=god&limit=5&offset=0');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.limit).toBe(5);
    expect(body.offset).toBe(0);
  });

  test('GET /search caps limit at 50', async () => {
    const res = await app.request('/search?q=god&limit=999');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.limit).toBe(50);
  });

  test('GET /verses/:book/:chapter returns verses for valid reference', async () => {
    const res = await app.request('/verses/John/3');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('verses');
    expect(body).toHaveProperty('book', 'John');
    expect(body).toHaveProperty('chapter', 3);
  });

  test('GET /verses/:book/:chapter supports translation param', async () => {
    const res = await app.request('/verses/Psalms/23?translation=web');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('translation', 'web');
  });

  test('GET /verses/:book/:chapter handles unknown translation gracefully', async () => {
    const res = await app.request('/verses/John/3?translation=unknown');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verses).toEqual([]);
  });

  test('GET /daily returns a verse', async () => {
    const res = await app.request('/daily');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('text');
    expect(body).toHaveProperty('reference');
  });

  test('GET /daily respects translation param', async () => {
    const res = await app.request('/daily?translation=web');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('translation');
  });
});
