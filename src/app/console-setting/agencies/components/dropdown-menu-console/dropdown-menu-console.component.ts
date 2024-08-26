import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { EConsoleFilterTypes } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ESelectFilter } from '@shared/enum/selectFilter.enum';
import { IDropdownMenuItem } from '@/app/user/shared/interfaces/dropdown-menu.interfaces';

@Component({
  selector: 'dropdown-menu-console',
  templateUrl: './dropdown-menu-console.component.html',
  styleUrls: ['./dropdown-menu-console.component.scss']
})
export class DropdownMenuConsoleComponent implements OnInit, OnChanges {
  @Input() listItem: any[];
  @Input() label: string;
  @Input() noResetListItem: Boolean;
  @Input() type: EConsoleFilterTypes;
  @Input() formDropdown:
    | ESelectFilter.SINGLE_SELECTION
    | ESelectFilter.MULTIPLE_SELECTION = ESelectFilter.MULTIPLE_SELECTION;
  @Output() itemsSelected = new EventEmitter<{
    items: IDropdownMenuItem[];
    type: EConsoleFilterTypes;
  }>(null);

  public isSelect: boolean = true;
  public focus: boolean = false;
  public currentListItem: IDropdownMenuItem[] = [];
  public newFilterList: IDropdownMenuItem[] = [];
  public nonDisplayListItem: IDropdownMenuItem[] = [];
  public defaultFilterList: IDropdownMenuItem[] = [];

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listItem'].currentValue) {
      this.currentListItem = changes['listItem'].currentValue;
      this.currentListItem = this.currentListItem.map((item) => {
        return { ...item, selected: false };
      });
    }
  }

  onDropdownMenuVisibleChange(visible: boolean): void {
    this.isSelect = visible;
    if (!visible) {
      this.focus = false;
    }
  }

  onShowPopupAssign(event: MouseEvent): void {
    // event.stopPropagation();  Affects closing the notification modal when clicking outside
    this.focus = true;
  }

  handleCheckbox(key: string): void {
    const currentItem = this.currentListItem.find((item) => item.key === key);
    currentItem.selected = !currentItem.selected;
    switch (this.formDropdown) {
      case ESelectFilter.SINGLE_SELECTION:
        let items;
        if (currentItem.selected) {
          this.currentListItem = this.currentListItem.map((item) => {
            if (item.key === key) {
              return { ...item, selected: currentItem.selected };
            }
            return { ...item, selected: false };
          });
          this.defaultFilterList = [currentItem];
          this.onItemChanged(this.defaultFilterList);
        } else {
          this.defaultFilterList = [];
          this.onItemChanged(this.defaultFilterList);
        }
        this.itemsSelected.emit({
          items: this.defaultFilterList,
          type: this.type
        });
        break;

      default:
        if (currentItem.selected) {
          this.defaultFilterList = [...this.defaultFilterList, currentItem];
          this.onItemChanged(this.defaultFilterList);
        } else {
          this.defaultFilterList = this.defaultFilterList.filter(
            (agent) => agent.key !== key
          );
          this.onItemChanged(this.defaultFilterList);
        }
        this.itemsSelected.emit({
          items: this.defaultFilterList,
          type: this.type
        });
        break;
    }
  }

  onItemChanged(item): void {
    const maxDisplayAssignedAgents =
      this.defaultFilterList.length === 1 ? 2 : 1;
    if (item?.length === this.listItem?.length && !this.noResetListItem) {
      this.newFilterList = [];
      this.nonDisplayListItem = [];
    } else {
      this.newFilterList = item.slice(0, maxDisplayAssignedAgents);
      this.nonDisplayListItem = item.slice(maxDisplayAssignedAgents);
    }
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.newFilterList = [];
    this.defaultFilterList = [];
    this.nonDisplayListItem = [];
    this.currentListItem = this.currentListItem.map((item) => {
      return { ...item, selected: false };
    });
    this.itemsSelected.emit({ items: [], type: this.type });
  }
}
