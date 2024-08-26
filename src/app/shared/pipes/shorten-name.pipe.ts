import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenName'
})
export class ShortenName implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }
    let words = value.split(' ');
    let firstWord = words[0].charAt(0);
    let secondWord = words.length > 1 ? words[1].charAt(0) : words[0].charAt(1);
    let initialsName = firstWord + secondWord;
    return initialsName.toUpperCase();
  }
}
