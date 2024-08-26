import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IOptionPill } from './dropdown-pill';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';

@Component({
  selector: 'dropdown-pill',
  templateUrl: './dropdown-pill.component.html',
  styleUrls: ['./dropdown-pill.component.scss']
})
export class DropdownPillComponent implements OnInit {
  @Input() options: IOptionPill[] = [];
  @Input() value: string;
  @Output() onChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  public change(value: boolean): void {}

  public selectMenuItem(value: string): void {
    this.onChange.emit(value);
  }

  get getLabelByValue() {
    return this.options.find((item) => item.value === this.value)?.label;
  }

  public getBadgeType(status): string {
    switch (status) {
      case SendMaintenanceType.OPEN: {
        return 'inProgress';
      }
      case SendMaintenanceType.CANCELLED: {
        return 'error';
      }
      case SendMaintenanceType.COMPLETE: {
        return 'success';
      }
      default: {
        return 'inProgress';
      }
    }
  }

  public getIconCheckMark() {
    switch (this.value) {
      case SendMaintenanceType.OPEN: {
        return 'iconChevronDownInprogress';
      }
      case SendMaintenanceType.CANCELLED: {
        return 'iconChevronDownDanger';
      }
      case SendMaintenanceType.COMPLETE: {
        return 'iconChevronDownSuccess';
      }
      default: {
        return 'iconChevronDownInprogress';
      }
    }
  }
}
