export const TOTAL_AMOUNT_TO_GST_RATIO = 11;
export const GST_PERCENT = 10;

export function calculateGSTFromPreTaxExpense(
  preTaxAmount,
  taxPercent: number = GST_PERCENT
): number {
  if (!preTaxAmount && typeof preTaxAmount !== 'number') return null;
  return preTaxAmount ? (Number(preTaxAmount) * taxPercent) / 100 : 0;
}

export function calculateGSTFromTotalExpense(
  totalAmount,
  totalAmountToGSTRatio: number = TOTAL_AMOUNT_TO_GST_RATIO
): number {
  if (!totalAmount && typeof totalAmount !== 'number') return null;
  return totalAmount && totalAmountToGSTRatio
    ? Number(totalAmount) / totalAmountToGSTRatio
    : 0;
}

export function reformatNumberInput(input): string {
  let formattedValue = input?.toLocaleString();
  formattedValue = formattedValue?.replace(/[^0-9.]/g, '') ?? '';
  const arr = formattedValue.split('.');
  arr[0] = arr[0] ? Number(arr[0]).toLocaleString() : arr[0];
  return arr.join('.');
}

export function formatNumber(number) {
  if (!number && typeof number !== 'number') return null;
  let formattedNumber = number?.toLocaleString();
  formattedNumber = formattedNumber.replace(/,/g, '');
  if (formattedNumber.indexOf('.') === -1) {
    formattedNumber = formattedNumber.replace(/\.0+$/, '');
  } else {
    formattedNumber = parseFloat(formattedNumber).toFixed(2);
  }
  return formattedNumber;
}

export function convertStringToNumber(localeString) {
  if (!localeString) return null;
  const number = parseFloat(String(localeString).replace(/[^0-9.]/g, ''));
  return number || 0;
}
