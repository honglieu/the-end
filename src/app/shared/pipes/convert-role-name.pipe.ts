import { Pipe, PipeTransform } from '@angular/core';
import { ERole } from '@/app/auth/auth.interface';

const defaultOptions = {
  convertVariant: false
};

@Pipe({
  name: 'convertRoleName',
  pure: true
})
export class ConvertRoleNamePipe implements PipeTransform {
  private readonly roleMapping = {
    [ERole.ADMIN]: { title: 'Administrator', variant: 'inProgress' },
    [ERole.OWNER]: { title: 'Owner', variant: 'warning' },
    [ERole.MEMBER]: { title: 'Team member', variant: 'role' }
  };

  transform(value: string, options = defaultOptions): string {
    const role = this.roleMapping[value];
    const { convertVariant } = options;

    if (role) {
      return convertVariant ? role.variant : role.title;
    }

    return convertVariant ? 'role' : '';
  }
}
