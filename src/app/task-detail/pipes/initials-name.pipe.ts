import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initialsName'
})
export class InitialsNamePipe implements PipeTransform {
  transform(fullName: string): string {
    if (typeof fullName == 'string') {
      const names = fullName.split(' ');

      if (names.length == 1) {
        return fullName.slice(0, 2).toUpperCase();
      }

      const first = names[0];
      const last = names[names.length - 1];

      if (first && last) {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
      }

      return (
        first ||
        last ||
        fullName.slice(0, 2).toUpperCase()
      )?.toUpperCase();
    }

    return fullName;
  }
}
