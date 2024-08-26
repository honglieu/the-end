import { Pipe, PipeTransform } from '@angular/core';
import twemoji from 'twemoji';

@Pipe({
  name: 'twemoji',
  standalone: true
})
export class TwemojiPipe implements PipeTransform {
  transform(value: string): string {
    const parsedValue = twemoji.parse(value, {
      base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
      folder: 'svg',
      ext: '.svg'
    });
    const wrappedValue = parsedValue.replace(
      /<img[^>]*class="emoji"[^>]*>/g,
      (match) => `<span class='emoji-wrapper'>${match}</span> `
    );
    return wrappedValue;
  }
}
