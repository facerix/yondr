export const JOB_STATUSES = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Accepted', 'Rejected', 'Withdrawn'];
export const WORK_POLICIES = ['in-office', 'hybrid', 'remote'];

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
    timeline: Array.isArray(path.timeline) ? path.timeline : [],
  };
}
