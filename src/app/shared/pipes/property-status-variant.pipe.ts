import { Pipe, PipeTransform } from '@angular/core';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import { TrudiBadgeVariant } from '@trudi-ui';

@Pipe({
  name: 'propertyStatusVariant'
})
export class PropertyStatusVariantPipe implements PipeTransform {
  transform(value: string): TrudiBadgeVariant {
    if (!value) return 'border';

    switch (value.toUpperCase()) {
      case ECrmStatus.ACTIVE:
        return 'success';
      case ECrmStatus.ARCHIVED:
      case ECrmStatus.DELETED:
      case ECrmStatus.INACTIVE:
      case ECrmStatus.RM_CRM_PAST:
        return 'archive';
      default:
        return 'border';
    }
  }
}
