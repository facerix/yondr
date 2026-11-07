import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { localStorage: new Map() };
window.localStorage.getItem = key => Map.prototype.get.call(window.localStorage, key) ?? null;
window.localStorage.setItem = (key, value) => Map.prototype.set.call(window.localStorage, key, value);
window.localStorage.removeItem = key => Map.prototype.delete.call(window.localStorage, key);
globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options.detail; } };

const { default: store } = await import('../dist/src/DataStore.js');

test('legacy paths load with stable IDs and empty job fields', async () => {
  window.localStorage.setItem('crossroads', JSON.stringify([{ id: 'crossroad', paths: [{ id: 'legacy', name: 'Old', baseSalary: '100000' }] }]));
  await store.init();
  const path = store.getPathById('legacy');
  assert.equal(path.id, 'legacy');
  assert.equal(path.baseSalary, '100000');
  assert.equal(path.status, 'Interested');
  assert.deepEqual(path.timeline, []);
  store.updatePath('crossroad', { id: 'legacy', bonuses: '1000' });
  assert.equal(store.getPathById('legacy').name, 'Old');
});

test('job fields and timeline CRUD survive reload', async () => {
  const path = { id: 'legacy', name: 'Old', baseSalary: null, company: 'Acme', role: 'Engineer', workPolicy: 'hybrid', officeDays: 2, salaryMin: '90000', salaryMax: '120000', listingUrl: 'https://example.com/job', timeline: [], equity: { type: 'rsu', quantity: '4000', vestingMonths: '48', cliffMonths: '12', cadence: 'quarterly', vestingStart: '2026-11-06', notes: 'Refresh grant possible' } };
  store.updatePath('crossroad', path);
  store.addTimelineEntry('crossroad', 'legacy', { date: '2026-11-06', title: 'Application sent', note: '**Applied**' });
  let entry = store.getPathById('legacy').timeline[0];
  assert.ok(entry.id);
  store.updateTimelineEntry('crossroad', 'legacy', { ...entry, title: 'Interview booked', note: '*Interview*' });
  store.updatePath('crossroad', { id: 'legacy', status: 'Interviewing' });
  await store.init();
  assert.equal(store.getPathById('legacy').company, 'Acme');
  assert.deepEqual(store.getPathById('legacy').equity, path.equity);
  assert.equal(store.getPathById('legacy').status, 'Interviewing');
  assert.equal(store.getPathById('legacy').timeline[0].title, 'Interview booked');
  assert.equal(store.getPathById('legacy').timeline[0].note, '*Interview*');
  store.deleteTimelineEntry('crossroad', 'legacy', entry.id);
  assert.deepEqual(store.getPathById('legacy').timeline, []);
});

test('new job options do not store a duplicate name', async () => {
  store.addPath('crossroad', { company: 'Acme', role: 'Engineer', baseSalary: null });
  const created = store.getCrossroadById('crossroad').paths[0];
  assert.equal(created.company, 'Acme');
  assert.equal(created.role, 'Engineer');
  assert.equal(Object.hasOwn(created, 'name'), false);
});
