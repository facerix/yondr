import { selectedSalary, comparisonValues } from './jobPathModel.js';
import { calculateUSIncomeTax2025 } from './utils.js';
import { lookupCostOfLiving } from './costOfLivingData.js';

export async function compareJob(path, settings, { rangeMode = 'off', livingMode = 'relocate' }, currencyClient) {
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
  const currentCost = currentSpend == null || currentSpend === '' ? null : await convert(Number(currentSpend), currentCurrency, currency);
  const currentIndex = Number(settings.currentLocationCostOfLiving);
  const jobIndex = Number(path.costOfLiving);
  const livingCost = livingMode === 'commute' ? currentCost
    : currentCost !== null && currentIndex > 0 && jobIndex > 0 ? currentCost * jobIndex / currentIndex
    : path.costOfLivingSpend == null || path.costOfLivingSpend === '' ? null : Number(path.costOfLivingSpend);
  return { ...comparisonValues(path, { rangeMode, livingMode, fixedExpenses, livingCost, tax }), fixedExpenses };
}
