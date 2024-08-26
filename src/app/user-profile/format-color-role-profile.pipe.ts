import { Pipe, PipeTransform } from '@angular/core';
import { ERole } from '@/app/auth/auth.interface';

@Pipe({
  name: 'formatColorRoleProfile'
})
export class FormatColorRoleProfilePipe implements PipeTransform {
  transform(value: string) {
    switch (value) {
      case ERole.OWNER:
        return 'warning';
      case ERole.ADMIN:
        return 'inProgress';
      case ERole.MEMBER:
        return 'role';
      default:
        return '';
    }
  }
}
