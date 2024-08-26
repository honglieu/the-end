/**
 * Much like lodash.
 */
export function padStart(
  toPad: string,
  length: number,
  element: string
): string {
  if (toPad.length > length) {
    return toPad;
  }

  const joined = `${getRepeatedElement(length, element)}${toPad}`;
  return joined.slice(joined.length - length, joined.length);
}

export function padEnd(toPad: string, length: number, element: string): string {
  const joined = `${toPad}${getRepeatedElement(length, element)}`;
  return joined.slice(0, length);
}

export function getRepeatedElement(length: number, element: string): string {
  return Array(length).fill(element).join('');
}

export const firstCapitalize = (element: string): string => {
  if (element) {
    element = `${element.charAt(0).toUpperCase()}${element
      .slice(1)
      .toLowerCase()}`;
  }

  return element;
};

export const firstCapitalizeWords = (element: string): string => {
  if (element) {
    element = element
      .split('_')
      .map((s) => firstCapitalize(s))
      .join(' ');
  }

  return element;
};

export const stringFormat = (str: string, ...args): string => {
  return str.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};
