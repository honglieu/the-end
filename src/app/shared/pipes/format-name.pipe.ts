import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { User } from '@shared/types/user.interface';

@Pipe({
  name: 'formatDisplayFullName'
})
export class FormatNamePipe implements PipeTransform {
  private titleCasePipe = new TitleCasePipe();

  transform(value: string | User, formatCase: boolean = true): string {
    const fullName =
      typeof value === 'object'
        ? (value?.firstName ?? '') + ' ' + (value?.lastName ?? '')
        : value;

    if (!formatCase) return fullName;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(fullName);
    return isEmail
      ? fullName.toLowerCase()
      : this.titleCasePipe.transform(fullName);
  }
}
