import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { cloneDeep } from 'lodash-es';

interface IDisplayItem extends ITasksForPrefillDynamicData {
  isChecked: boolean;
}

@Component({
  selector: 'view-tasks-modal',
  templateUrl: './view-tasks-modal.component.html',
  styleUrls: ['./view-tasks-modal.component.scss']
})
export class ViewTasksModalComponent implements OnInit, OnChanges {
  @Input() items: ITasksForPrefillDynamicData[] = [];
  @Input() selectedItems: ITasksForPrefillDynamicData[] = [];
  @Input() isVisible: boolean = false;
  @Output() confirm: EventEmitter<ITasksForPrefillDynamicData[]> =
    new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  public displayItems: IDisplayItem[] = [];
  public disabled: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.handleMapDisplayItems(this.items);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['selectedItems']) {
      this.handleMapDisplayItems(this.items);
    }
  }

  handleMapDisplayItems(items: ITasksForPrefillDynamicData[]) {
    this.displayItems = (items || []).map((item) => ({
      ...item,
      isChecked: this.selectedItems?.some(
        (selectedItem) => selectedItem.taskId === item.taskId
      )
    }));
  }

  handleChangeSelectedTask() {
    this.disabled = !this.displayItems.some((item) => item.isChecked);
  }

  handleConfirm() {
    const value = cloneDeep(this.displayItems).filter((item) => item.isChecked);
    value.forEach((item) => {
      delete item.isChecked;
    });
    this.confirm.emit(value);
  }

  handleCancel() {
    this.cancel.emit();
  }
}
