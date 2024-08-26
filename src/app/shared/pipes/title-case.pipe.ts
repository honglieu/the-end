import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titleCasePipe'
})
export class TrudiTitleCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    let words = value.split('_').join(' ');
    words = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();

    let wordsArray = words.split(' - ');
    wordsArray = wordsArray.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    words = wordsArray.join(' - ');

    return words;
  }
}
