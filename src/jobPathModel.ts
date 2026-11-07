export const JOB_STATUSES = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Accepted', 'Rejected', 'Withdrawn'];
export const WORK_POLICIES = ['in-office', 'hybrid', 'remote'];
export const EQUITY_TYPES = ['options', 'rsu'];
export const VESTING_CADENCES = ['monthly', 'quarterly', 'annually'];

export function formatJobOptionName(path) {
  const company = String(path.company ?? '').trim();
  const role = String(path.role ?? '').trim();
  return [company, role].filter(Boolean).join(' · ') || String(path.name ?? '').trim();
}

export function formatEquityGrant(equity) {
  if (!equity?.type) return '';
  const quantity = Number(equity.quantity).toLocaleString('en-US');
  return `${quantity} ${equity.type === 'rsu' ? 'RSUs' : 'options'}`;
}

export function formatEquityTerms(equity) {
  if (!equity?.type) return '';
  const duration = Number(equity.vestingMonths);
  const durationText = duration % 12 === 0 ? `${duration / 12} ${duration === 12 ? 'year' : 'years'}` : `${duration} months`;
  const cliff = Number(equity.cliffMonths) || 0;
  const cliffText = cliff ? ` · ${cliff % 12 === 0 ? `${cliff / 12}-year` : `${cliff}-month`} cliff` : '';
  const strike = equity.type === 'options' && equity.strikePrice !== '' && equity.strikePrice != null
    ? ` · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: equity.strikeCurrency || 'USD' }).format(Number(equity.strikePrice))} strike` : '';
  return `${durationText} vesting${cliffText} · ${equity.cadence}${strike}`;
}

export function formatEquitySummary(equity) {
  if (!equity?.type) return '';
  return `${formatEquityGrant(equity)} · ${formatEquityTerms(equity)}`;
}

export function hasConcreteSalary(path) {
  return path.baseSalary !== null && path.baseSalary !== undefined && path.baseSalary !== '' &&
    Number.isFinite(Number(path.baseSalary)) && Number(path.baseSalary) >= 0;
}

export function getComparableMetrics(path) {
  if (!hasConcreteSalary(path)) return null;
  const compensation = Number(path.baseSalary) + (Number(path.bonuses) || 0);
  const bottomLine = path.yearNetIncome !== null && path.yearNetIncome !== undefined && path.yearNetIncome !== ''
    ? Number(path.yearNetIncome) : compensation;
  return { compensation, bottomLine };
}

export function selectedSalary(path, rangeMode = 'off') {
  if (hasConcreteSalary(path)) return { base: Number(path.baseSalary), projected: false };
  const min = path.salaryMin == null || path.salaryMin === '' ? null : Number(path.salaryMin);
  const max = path.salaryMax == null || path.salaryMax === '' ? null : Number(path.salaryMax);
  if (rangeMode === 'median' && min !== null && max !== null) return { base: (min + max) / 2, projected: true };
  if (rangeMode === 'max' && max !== null) return { base: max, projected: true };
  return null;
}

export function comparisonValues(path, { rangeMode = 'off', livingMode = 'relocate', fixedExpenses = 0, livingCost = null, tax = 0 } = {}) {
  const salary = selectedSalary(path, rangeMode);
  if (!salary) return null;
  const compensation = salary.base + (Number(path.bonuses) || 0);
  const bottomLine = livingCost === null ? null : Math.max(0, compensation - fixedExpenses - tax - livingCost);
  return { compensation, bottomLine, livingCost, tax, projected: salary.projected, livingMode };
}

export function sortTimeline(entries = []) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function validateHttpUrl(value) {
  if (!value) return '';
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Enter a valid URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP(S) URLs are allowed.');
  return parsed.href;
}

export function validateJobPath(path) {
  if ((path.company !== undefined || path.role !== undefined) &&
    (String(path.company ?? '').trim() || String(path.role ?? '').trim() || !String(path.name ?? '').trim())) {
    if (!String(path.company ?? '').trim()) throw new Error('Company is required.');
    if (!String(path.role ?? '').trim()) throw new Error('Role is required.');
  }
  for (const field of ['salaryMin', 'salaryMax', 'baseSalary']) {
    const value = path[field];
    if (value !== null && value !== undefined && value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      throw new Error(`${field} must be a nonnegative salary.`);
    }
  }
  if (path.salaryMin !== '' && path.salaryMin != null && path.salaryMax !== '' && path.salaryMax != null && Number(path.salaryMin) > Number(path.salaryMax)) {
    throw new Error('Salary minimum cannot exceed maximum.');
  }
  if (path.workPolicy && !WORK_POLICIES.includes(path.workPolicy)) throw new Error('Invalid work policy.');
  if (path.status && !JOB_STATUSES.includes(path.status)) throw new Error('Invalid application status.');
  if (path.workPolicy === 'hybrid' && (!Number.isInteger(Number(path.officeDays)) || Number(path.officeDays) < 0 || Number(path.officeDays) > 5)) {
    throw new Error('Hybrid office days must be from 0 to 5.');
  }
  const equity = path.equity;
  if (equity != null) {
    if (!EQUITY_TYPES.includes(equity.type)) throw new Error('Choose options or RSUs for equity type.');
    if (!Number.isFinite(Number(equity.quantity)) || Number(equity.quantity) <= 0) throw new Error('Equity quantity must be positive.');
    if (!Number.isInteger(Number(equity.vestingMonths)) || Number(equity.vestingMonths) <= 0) throw new Error('Vesting months must be a positive whole number.');
    if (!Number.isInteger(Number(equity.cliffMonths)) || Number(equity.cliffMonths) < 0 || Number(equity.cliffMonths) > Number(equity.vestingMonths)) throw new Error('Cliff months must be between 0 and the vesting duration.');
    if (!VESTING_CADENCES.includes(equity.cadence)) throw new Error('Choose a vesting cadence.');
    if (equity.vestingStart && (!/^\d{4}-\d{2}-\d{2}$/.test(equity.vestingStart) ||
      Number.isNaN(Date.parse(`${equity.vestingStart}T00:00:00Z`)) ||
      new Date(`${equity.vestingStart}T00:00:00Z`).toISOString().slice(0, 10) !== equity.vestingStart)) throw new Error('Enter a valid vesting start date.');
    if (equity.type === 'rsu' && equity.strikePrice !== '' && equity.strikePrice != null) throw new Error('RSUs cannot have a strike price.');
    if (equity.strikePrice !== '' && equity.strikePrice != null && (!Number.isFinite(Number(equity.strikePrice)) || Number(equity.strikePrice) < 0)) throw new Error('Strike price must be nonnegative.');
    if (equity.type === 'options' && equity.strikePrice !== '' && equity.strikePrice != null && !/^[A-Z]{3}$/.test(equity.strikeCurrency || 'USD')) throw new Error('Strike currency must be a three-letter code.');
  }
  validateHttpUrl(path.listingUrl);
  for (const entry of path.timeline || []) {
    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !entry.note?.trim()) throw new Error('Timeline entries need a date and note.');
    if (entry.title !== undefined && (typeof entry.title !== 'string' || !entry.title.trim())) throw new Error('Timeline title must be text.');
    validateHttpUrl(entry.url);
  }
  return path;
}

export function normalizePath(path) {
  return {
    ...path,
    company: path.company ?? '',
    role: path.role ?? '',
    listingUrl: path.listingUrl ?? '',
    workPolicy: path.workPolicy ?? '',
    officeDays: path.officeDays ?? null,
    status: path.status ?? 'Interested',
    salaryMin: path.salaryMin ?? null,
    salaryMax: path.salaryMax ?? null,
    equity: path.equity ?? null,
    timeline: Array.isArray(path.timeline) ? path.timeline : [],
  };
}
