import { Pipe, PipeTransform } from '@angular/core';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';

@Pipe({ name: 'formatEntityType' })
export class FormatEntityTypePipe implements PipeTransform {
  transform(data) {
    let entityType = '';
    switch (data) {
      case EEntityType.UNITTYPE:
        entityType = 'Unit type';
        break;
      default:
        entityType = data;
        break;
    }
    return entityType;
  }
}
