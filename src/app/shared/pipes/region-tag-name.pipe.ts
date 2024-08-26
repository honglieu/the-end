import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'regionTagName'
})
export class RegionTagNamePipe implements PipeTransform {
  transform(taskTemplateRegions, regions) {
    const hasAllRegions =
      regions.length === taskTemplateRegions.length &&
      regions.every((region) => {
        return taskTemplateRegions.find(
          (taskTemplateRegion) => taskTemplateRegion.regionId === region.id
        );
      });

    if (hasAllRegions) {
      return 'All regions';
    }

    if (taskTemplateRegions.length > 2) {
      const taskRegionText = taskTemplateRegions
        .slice(0, 2)
        .map((taskTemplateRegion) => taskTemplateRegion.regionName)
        .join(', ');
      return taskRegionText + ' +' + (taskTemplateRegions.length - 2);
    } else {
      return taskTemplateRegions
        .map((taskTemplateRegion) => taskTemplateRegion.regionName)
        .join(', ');
    }
  }
}
