import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'phoneNumberHighlight',
  standalone: true
})
export class PhoneNumberHighlight implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, args: string): SafeHtml | null {
    if (!value) return value;
    if (!args) {
      return this.sanitizer.bypassSecurityTrustHtml(value ? value : '');
    }

    const cleanValue = value.replace(/[()+\s-]/g, '');
    const cleanArgs = args.replace(/[()+\s-]/g, '');

    // the position of the clearArgs in the cleanValue => x
    // start checking the value from the x-th number
    const position = cleanValue.indexOf(cleanArgs);

    if (position !== -1) {
      const formattedValue = this.getFormatterPhoneNumber(
        value,
        cleanArgs,
        position
      );

      const replacedValue = value?.replace(
        formattedValue,
        `<mark class="highlight">$&</mark>`
      );
      return this.sanitizer.bypassSecurityTrustHtml(replacedValue);
    }

    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

  getFormatterPhoneNumber(
    value: string,
    cleanArgs: string,
    position: number = 0
  ) {
    const length = cleanArgs.length;
    let count = 0;
    let response = '';
    let numberCount = 0;
    const numbers = Array(10)
      .fill(0)
      .map((_, i) => i.toString());
    for (let i = 0; i < value.length; i++) {
      const element = value[i];

      // if the current position (numberCount) <= position, ignore it
      // ex:
      // value = (+1) (253) 617-1902
      // => cleanValue = 12536171902
      //
      // the search phrase (cleanArgs) is 36171
      // => position will be 3
      // we will ignore the first 3 numbers

      if (numbers.includes(element)) numberCount++;
      if (numberCount <= position) continue;

      response += element;
      if (element === cleanArgs[count]) count++;
      if (count === length) break;
    }
    return response;
  }
}
