import { Pipe, PipeTransform } from '@angular/core';
import { ENoteSaveToType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';

@Pipe({ name: 'formatNoteInfo' })
export class FormatNoteInfoPipe implements PipeTransform {
  transform(data) {
    let entityTypeName = '';
    switch (data.entityType) {
      case ENoteSaveToType.TENANT: {
        entityTypeName = 'Tenant note';
        break;
      }
      case ENoteSaveToType.OWNERSHIP: {
        entityTypeName = 'Owner note';
        break;
      }
      case ENoteSaveToType.PROPERTY: {
        entityTypeName = 'Property note';
        break;
      }
    }
    return `${entityTypeName} - ${data.categoryName} ${
      data.entityType !== ENoteSaveToType.PROPERTY && data.entityName
        ? ` (${data.entityName})`
        : ''
    }`;
  }
}
