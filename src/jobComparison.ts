import { selectedSalary, comparisonValues, type JobPathType } from './jobPathModel.js';
import { calculateUSIncomeTax2025 } from './utils.js';
import { lookupCostOfLiving } from './costOfLivingData.js';
import type { CurrencyClient } from './currencyClient.js';
import type { UserSettingsType } from './DataStore.js';

export const LIVING_MODE = ['commute', 'relocate'] as const;
export type LivingModeType = typeof LIVING_MODE[number];
export const RANGE_MODE = ['off', 'midpoint', 'maximum'] as const;
export type RangeModeType = typeof RANGE_MODE[number];

export type JobComparison = {
  compensation: number;
  bottomLine: number;
  livingCost: number;
  tax: number;
  projected: boolean;
  livingMode: LivingModeType;
  fixedExpenses: number;

  // added/modified during the comparison phase
  referenceCompensation?: number;
  referenceBottomLine?: number;
}

export type ComparisonSettings = {
  rangeMode: RangeModeType,
  livingMode: LivingModeType
};

export async function compareJob(
  path: JobPathType,
  settings: UserSettingsType,
  { rangeMode = 'off', livingMode = 'relocate' }: ComparisonSettings,
  currencyClient: CurrencyClient
): Promise<JobComparison> {
  const salary = selectedSalary(path, rangeMode);
  if (!salary) return null;
  const currency = path.currency || 'USD';
  const convert = async (amount, from, to) => from === to || amount === 0 ? amount : amount * await currencyClient.getExchangeRate(from, to);
  const compensation = salary.base + (Number(path.bonuses) || 0);
  const fixedExpenses = await convert(Number(settings.fixedExpenses) || 0, settings.fixedExpensesCurrency || 'USD', currency);
  const taxableUSD = Math.max(0, await convert(compensation, currency, 'USD') - await convert(fixedExpenses, currency, 'USD'));
  const taxUSD = settings.citizenship === 'US' || !settings.citizenship
    ? calculateUSIncomeTax2025(settings.taxFilingStatus || 'single', taxableUSD) : 0;
  const tax = await convert(taxUSD, 'USD', currency);
  const currentSpend = settings.currentLocationCostOfLivingSpend;
  const currentCurrency = settings.currentLocationCurrency || lookupCostOfLiving(settings.currentLocation || '')?.currency || settings.fixedExpensesCurrency || 'USD';
  const currentCost = currentSpend == null ? null : await convert(Number(currentSpend), currentCurrency, currency);
  const currentIndex = Number(settings.currentLocationCostOfLiving);
  const jobIndex = Number(path.costOfLiving);
  const livingCost = livingMode === 'commute' ? currentCost
    : currentCost !== null && currentIndex > 0 && jobIndex > 0 ? currentCost * jobIndex / currentIndex
      : path.costOfLivingSpend == null || path.costOfLivingSpend === '' ? null : Number(path.costOfLivingSpend);
  return { ...comparisonValues(path, { rangeMode, livingMode, fixedExpenses, livingCost, tax }), fixedExpenses };
}
