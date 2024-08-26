import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export interface ItemDropdown {
  id: number;
  icon: string; // icon display on dropdown
  buttonIcon: string; // icon display on button
  action: string;
}

@Component({
  selector: 'button-with-dropdown-actions',
  templateUrl: './button-with-dropdown-actions.component.html',
  styleUrls: ['./button-with-dropdown-actions.component.scss']
})
export class ButtonWithDropdownActionsComponent implements OnInit {
  @Input() dropdownList: ItemDropdown[] = [];
  @Input() disabled: boolean;
  @Input() defaultSelect: number;
  @Output() onClickBtn = new EventEmitter<ItemDropdown>();
  @Output() onChangeBtn = new EventEmitter<ItemDropdown>();
  selectedItem: ItemDropdown;

  constructor() {}

  ngOnInit(): void {
    if (this.dropdownList.length) {
      this.selectedItem = this.dropdownList[this.defaultSelect];
    }
  }

  onGetSelectedItem(item) {
    this.selectedItem = item;
    this.onChangeBtn.emit(this.selectedItem);
  }

  handleClickBtn() {
    this.onClickBtn.emit(this.selectedItem);
  }
}
