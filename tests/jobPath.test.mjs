import test from 'node:test';
import assert from 'node:assert/strict';
import { hasConcreteSalary, validateJobPath, sortTimeline, getComparableMetrics, selectedSalary, comparisonValues, formatEquityGrant, formatEquityTerms, formatEquitySummary, formatJobOptionName } from '../dist/src/jobPathModel.js';
import { renderNoteMarkdown } from '../dist/src/noteMarkdown.js';
import { compareJob } from '../dist/src/jobComparison.js';

test('range-only paths cannot enter financial rankings', () => {
  const range = { baseSalary: null, salaryMin: '90000', salaryMax: '120000', bonuses: '5000' };
  assert.equal(hasConcreteSalary(range), false);
  assert.equal(getComparableMetrics(range), null);
  assert.deepEqual(getComparableMetrics({ baseSalary: '0', bonuses: '1000', yearNetIncome: '0' }), { compensation: 1000, bottomLine: 0 });
});

test('salary bounds and links are validated', () => {
  assert.throws(() => validateJobPath({ salaryMin: '120', salaryMax: '90' }), /minimum/i);
  assert.throws(() => validateJobPath({ salaryMin: '-1' }), /salary/i);
  assert.throws(() => validateJobPath({ listingUrl: 'javascript:alert(1)' }), /URL/i);
  assert.throws(() => validateJobPath({ timeline: [{ id: 'a', date: '2026-11-06', note: 'Hi', url: 'file:///tmp/x' }] }), /URL/i);
  assert.doesNotThrow(() => validateJobPath({ salaryMin: '90000', salaryMax: '120000', listingUrl: 'https://example.com/job' }));
});

test('job option labels use company and role with a legacy name fallback', () => {
  assert.equal(formatJobOptionName({ company: ' Acme ', role: ' Engineer ', name: 'Old label' }), 'Acme · Engineer');
  assert.equal(formatJobOptionName({ company: 'Acme', role: '' }), 'Acme');
  assert.equal(formatJobOptionName({ name: 'Old label' }), 'Old label');
  assert.throws(() => validateJobPath({ company: '', role: 'Engineer' }), /company/i);
  assert.throws(() => validateJobPath({ company: 'Acme', role: '' }), /role/i);
  assert.doesNotThrow(() => validateJobPath({ company: 'Acme', role: 'Engineer' }));
});

test('equity terms are validated without adding unvested grants to cash compensation', () => {
  const equity = { type: 'options', quantity: '10000', vestingMonths: '48', cliffMonths: '12', cadence: 'monthly', strikePrice: '2.50', vestingStart: '2026-11-06', notes: 'Early exercise available' };
  const path = { baseSalary: '100000', bonuses: '5000', equity };
  assert.doesNotThrow(() => validateJobPath(path));
  assert.deepEqual(getComparableMetrics(path), { compensation: 105000, bottomLine: 105000 });
  assert.equal(formatEquityGrant(equity), '10,000 options');
  assert.match(formatEquityTerms(equity), /^4 years vesting · 1-year cliff · monthly/);
  assert.match(formatEquitySummary(equity), /10,000 options/);
  assert.match(formatEquitySummary(equity), /4 years/);
  assert.match(formatEquitySummary(equity), /1-year cliff/);
  assert.match(formatEquitySummary(equity), /\$2\.50 strike/);
  assert.match(formatEquitySummary({ ...equity, strikeCurrency: 'EUR' }), /€2\.50 strike/);
  assert.match(formatEquitySummary({ type: 'rsu', quantity: '4000', vestingMonths: '36', cliffMonths: '0', cadence: 'quarterly' }), /4,000 RSUs.*3 years.*quarterly/);
  assert.equal(formatEquitySummary(null), '');
  assert.throws(() => validateJobPath({ equity: { ...equity, cliffMonths: '49' } }), /cliff/i);
  assert.throws(() => validateJobPath({ equity: { ...equity, quantity: '-1' } }), /quantity/i);
  assert.throws(() => validateJobPath({ equity: { ...equity, type: 'rsu', strikePrice: '2.50' } }), /strike/i);
  assert.throws(() => validateJobPath({ equity: { ...equity, strikeCurrency: 'dollars' } }), /currency/i);
  assert.throws(() => validateJobPath({ equity: { ...equity, vestingStart: 'not a date' } }), /date/i);
});

test('timeline sorts newest first without losing same-day order', () => {
  const entries = [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-02-01' }, { id: 'c', date: '2026-02-01' }];
  assert.deepEqual(sortTimeline(entries).map(entry => entry.id), ['b', 'c', 'a']);
  assert.deepEqual(entries.map(entry => entry.id), ['a', 'b', 'c']);
});

test('range selection keeps estimates distinct from concrete salaries', () => {
  const range = { baseSalary: null, salaryMin: '90000', salaryMax: '120000', bonuses: '5000' };
  assert.equal(selectedSalary(range), null);
  assert.deepEqual(selectedSalary(range, 'median'), { base: 105000, projected: true });
  assert.deepEqual(selectedSalary(range, 'max'), { base: 120000, projected: true });
  assert.equal(selectedSalary({ salaryMin: 90000 }, 'median'), null);
  assert.deepEqual(comparisonValues(range, { rangeMode: 'median', livingCost: 30000, fixedExpenses: 10000, tax: 20000 }), {
    compensation: 110000, bottomLine: 50000, livingCost: 30000, tax: 20000, projected: true, livingMode: 'relocate',
  });
});

test('commute and relocate use different living costs', async () => {
  const path = { baseSalary: 100000, bonuses: 0, currency: 'USD', costOfLiving: 150 };
  const settings = { fixedExpenses: 10000, fixedExpensesCurrency: 'USD', currentLocationCostOfLivingSpend: 20000, currentLocationCostOfLiving: 100, citizenship: 'OTHER' };
  const currencyClient = { getExchangeRate: async () => 1 };
  const commute = await compareJob(path, settings, { livingMode: 'commute' }, currencyClient);
  const relocate = await compareJob(path, settings, { livingMode: 'relocate' }, currencyClient);
  assert.equal(commute.bottomLine, 70000);
  assert.equal(relocate.bottomLine, 60000);
});

test('commute costs use the saved current-location currency', async () => {
  const calls = [];
  const result = await compareJob({ baseSalary: 100000, currency: 'USD' }, {
    currentLocationCostOfLivingSpend: 10000, currentLocationCurrency: 'EUR', citizenship: 'OTHER',
  }, { livingMode: 'commute' }, { getExchangeRate: async (from, to) => { calls.push([from, to]); return 2; } });
  assert.equal(result.livingCost, 20000);
  assert.deepEqual(calls, [['EUR', 'USD']]);
});

test('markdown notes render formatting while escaping HTML and unsafe links', () => {
  const html = renderNoteMarkdown('**Bold** and [safe](https://example.com)\n\n- <img src=x onerror=alert(1)>\n- [bad](javascript:alert(1))');
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /href="https:\/\/example.com\/"/);
  assert.doesNotMatch(html, /<img|href="javascript:/);
});
