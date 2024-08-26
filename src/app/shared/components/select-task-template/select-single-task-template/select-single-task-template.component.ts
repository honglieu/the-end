import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Pipe,
  PipeTransform,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { RegionInfo } from '@shared/types/agency.interface';
import { Subject } from 'rxjs';

@Component({
  selector: 'select-single-task-template',
  templateUrl: './select-single-task-template.component.html',
  styleUrls: ['./select-single-task-template.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectSingleTaskTemplateComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectSingleTaskTemplateComponent
  implements OnDestroy, ControlValueAccessor
{
  @Input() items: TaskItemDropdown[];
  @Input() editableSearchTerm: boolean = true;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() placeholder: string = 'Select task';
  @Input() clearable: boolean = true;
  @Input() listRegion: RegionInfo[] = [];
  @Input() isShowRegion: boolean = true;
  @Output() onTaskChanged = new EventEmitter<TaskItemDropdown>();

  private unsubscribe = new Subject<void>();
  public selectedValue: string;
  constructor(private cdr: ChangeDetectorRef) {}

  onChange: (_: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this.selectedValue = obj;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  searchTaskTemplateFn = (searchText: string, item) => {
    if (Object.entries(item).length === 1) return true;
    return item.label?.toLowerCase().includes(searchText.trim().toLowerCase());
  };

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

@Pipe({
  name: 'regionShowName'
})
export class RegionShowNamePipe implements PipeTransform {
  transform(regionId, regions) {
    const region = regions.find((item) => item.id === regionId);
    return region?.alias[1] ?? '';
  }
}

@Pipe({
  name: 'regionTaskName'
})
export class RegionTaskNamePipe implements PipeTransform {
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
      return taskRegionText + ', +' + (taskTemplateRegions.length - 2);
    } else {
      return taskTemplateRegions
        .map((taskTemplateRegion) => taskTemplateRegion.regionName)
        .join(', ');
    }
  }
}
