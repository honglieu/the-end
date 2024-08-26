import { Pipe, PipeTransform } from '@angular/core';
import { ITaskTemplateRegion } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { RegionInfo } from '@shared/types/agency.interface';

@Pipe({
  name: 'displayRegions'
})
export class DisplayRegionsPipe implements PipeTransform {
  transform(
    regions: ITaskTemplateRegion[] | string[],
    allRegions: RegionInfo[]
  ): string {
    if (!regions || !allRegions) return '';
    if (regions.length === allRegions.length) {
      return 'All regions';
    } else if (regions.length > 2) {
      return (
        regions
          .slice(0, 2)
          .map((item) => item.regionName || item)
          .join(', ') +
        ' +' +
        (regions.length - 2)
      );
    } else {
      return regions.map((item) => item.regionName || item).join(', ');
    }
  }
}
