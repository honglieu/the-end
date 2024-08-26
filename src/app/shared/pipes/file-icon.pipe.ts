import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileIcon'
})
export class TrudiFileIconPipe implements PipeTransform {
  transform(fileType: 'pdf' | 'video', ...args: string[]) {
    const [thumnail] = args;
    if (thumnail) {
      return thumnail;
    }
    return `/assets/icon/${fileType}.svg`;
  }
}
