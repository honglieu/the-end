import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

enum EHighLightTextType {
  PHONE_NUMBER = 'PHONE_NUMBER'
}

@Pipe({
  name: 'highlight'
})
export class HighlightSearch implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, args: string, type: string): SafeHtml | null {
    if (!args) {
      return this.sanitizer.bypassSecurityTrustHtml(value ? value : '');
    }

    if (type === EHighLightTextType.PHONE_NUMBER) {
      if (this.getMatchingSubstring(args, value)) {
        const replacedValue = value?.replace(
          this.getMatchingSubstring(args, value),
          `<mark class="highlight">$&</mark>`
        );
        return this.sanitizer.bypassSecurityTrustHtml(replacedValue);
      }
    }

    // Match in a case insensitive maneer
    const re = new RegExp(args.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'gi');
    const match = value?.match(re);

    // If there's no match, just return the original value.
    if (!match) {
      return value;
    }

    const replacedValue = value?.replace(
      re,
      `<mark class="highlight">$&</mark>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(replacedValue);
  }

  /**
   * todo: need to refactor
   * Find substring searchValue in string value without spaces
   * Example:
   * Input                          Output
   *     value: (+84) 962 563 090
   *     textSearch: (+84            (+84
   *                 9625            962 5
   *                 84)96256        84) 962 56
   *                 563 090         563 090
   *                 84) 96          (+84) 96
   *
   */
  getMatchingSubstring(textSearch: string, value: string): string {
    if (!value) {
      return '';
    }
    const firstNumberChars = 5;

    // Remove spaces and '(', ')', '+' in first number chars
    const textSearchWithoutSpace =
      textSearch.substring(0, firstNumberChars).replace(/[()+\s]/g, '') +
      textSearch.substring(firstNumberChars).replace(/\s/g, '');
    const valueWithoutSpace =
      value.substring(0, firstNumberChars).replace(/[()+\s]/g, '') +
      value.substring(firstNumberChars).replace(/\s/g, '');

    if (!valueWithoutSpace.includes(textSearchWithoutSpace)) {
      return '';
    }

    let indexSearchValue = 0;
    let matchString = '';
    let lenghMatch = textSearchWithoutSpace.length;
    let i = 0;
    let j = 0;
    while (lenghMatch !== 0) {
      if (value[i] === textSearchWithoutSpace[indexSearchValue]) {
        indexSearchValue = indexSearchValue + 1;
        matchString = matchString + value[i];
        lenghMatch = lenghMatch - 1;
        i = i + 1;
      } else if (this.isCharOfPhoneNumber(value[i], i)) {
        matchString = matchString + value[i];
        i = i + 1;
      } else {
        matchString = '';
        indexSearchValue = 0;
        lenghMatch = textSearchWithoutSpace.length;
        j = j + 1;
        i = j;
      }
    }
    return matchString;
  }

  /**
   *
   * @param char 1 character
   * @param index number
   * @returns boolean
   */
  isCharOfPhoneNumber(char, index: number): boolean {
    switch (index) {
      case 0:
        if (char === '(') {
          return true;
        }
        return false;
      case 1:
        if (char === '+') {
          return true;
        }
        return false;
      case 4:
        if (char === ')') {
          return true;
        }
        return false;
      default:
        if (char === ' ') {
          return true;
        }
        return false;
    }
  }
}
