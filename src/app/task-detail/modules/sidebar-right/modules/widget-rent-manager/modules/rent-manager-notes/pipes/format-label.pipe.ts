import { Pipe, PipeTransform } from '@angular/core';
import { ENoteSaveToType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';

@Pipe({ name: 'formatLabel' })
export class FormatLabelBySaveToTypePipe implements PipeTransform {
  transform(saveToType) {
    switch (saveToType) {
      case ENoteSaveToType.TENANT: {
        return 'tenant';
      }
      case ENoteSaveToType.OWNERSHIP: {
        return 'owner';
      }
      case ENoteSaveToType.PROPERTY: {
        return 'property';
      }
    }
    return '';
  }
}
