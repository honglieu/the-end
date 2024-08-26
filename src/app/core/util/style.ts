import { NgStyleInterface } from '@core';

export function isStyleSupport(styleName: string | string[]): boolean {
  if (
    typeof window !== 'undefined' &&
    window.document &&
    window.document.documentElement
  ) {
    const styleNameList = Array.isArray(styleName) ? styleName : [styleName];
    const { documentElement } = window.document;

    return styleNameList.some((name) => name in documentElement.style);
  }
  return false;
}

export function getStyleAsText(styles?: NgStyleInterface): string {
  if (!styles) {
    return '';
  }

  return Object.keys(styles)
    .map((key) => {
      const val = styles[key];
      return `${key}:${typeof val === 'string' ? val : `${val}px`}`;
    })
    .join(';');
}
