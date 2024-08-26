import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isHTML'
})
export class IsHTMLPipe implements PipeTransform {
  transform(value: string): boolean {
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
  }
}
