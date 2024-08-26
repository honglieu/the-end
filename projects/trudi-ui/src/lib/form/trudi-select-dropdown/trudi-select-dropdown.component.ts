import {
  Component,
  Input,
  Output,
  OnInit,
  forwardRef,
  SimpleChanges,
  EventEmitter,
  OnDestroy,
  ContentChild,
  ViewChild,
  OnChanges,
  AfterViewInit
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Subject, filter, takeUntil } from 'rxjs';
import {
  TrudiSelectDropdownFooterTemplateDirective,
  TrudiSelectDropdownGroupTemplateDirective,
  TrudiSelectDropdownHeaderTemplateDirective,
  TrudiSelectDropdownOptionTemplateDirective,
  TrudiSelectDropdownTitleTemplateDirective
} from './trudi-select-dropdown-template.directive';
import { NzDropDownDirective } from 'ng-zorro-antd/dropdown';
import { OverlayRef } from '@angular/cdk/overlay';
import { IItemGroup } from './trudi-select-dropdown-v2';
import {
  TrudiButtonSize,
  TrudiButtonVariant
} from '../../views/trudi-button/trudi-button.component';
import { TaskStatusType } from '../../common/enums/task-status-type.enum';

@Component({
  selector: 'trudi-select-dropdown',
  templateUrl: './trudi-select-dropdown.component.html',
  styleUrls: ['./trudi-select-dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSelectDropdownComponent),
      multi: true
    }
  ]
})
/**
 * @deprecated The component should not be used
 */
export class TrudiSelectDropdownComponent
  implements OnInit, OnDestroy, OnChanges, ControlValueAccessor, AfterViewInit
{
  @ContentChild(TrudiSelectDropdownTitleTemplateDirective)
  titleTemplate: TrudiSelectDropdownTitleTemplateDirective;
  @ContentChild(TrudiSelectDropdownOptionTemplateDirective)
  optionTemplate: TrudiSelectDropdownOptionTemplateDirective;
  @ContentChild(TrudiSelectDropdownHeaderTemplateDirective)
  headerTemplate: TrudiSelectDropdownHeaderTemplateDirective;
  @ContentChild(TrudiSelectDropdownFooterTemplateDirective)
  footerTemplate: TrudiSelectDropdownFooterTemplateDirective;
  @ContentChild(TrudiSelectDropdownGroupTemplateDirective)
  groupTemplate: TrudiSelectDropdownGroupTemplateDirective;
  @ViewChild('dropdown') dropdown: NzDropDownDirective;
  private destroy$: Subject<void> = new Subject();
  @Input() size: TrudiButtonSize = 'medium';
  @Input() variant: TrudiButtonVariant = 'outlined';
  @Input() disabled: boolean = false;
  @Input() customTitle: string;
  @Input() items: any[] = [];
  @Input() groupBy: string;
  @Input() groupOrders: string[];
  @Input() alwaysShowTitleGroup: boolean = false;
  @Input() bindValue: string = 'id';
  @Input() bindLabel: string = 'label';
  @Input() placement: string = 'bottomLeft';
  @Input() trudiTrigger: 'click' | 'hover' = 'click';
  @Input() clearable: boolean = true;
  @Input() searchable: boolean = false;
  @Input() multi: boolean = false;
  @Input() prefixIcon: string;
  @Input() placeholder: string = '';
  @Input() showArrowIcon: boolean = true;
  @Input() itemImage: string;
  @Input() textNotFound: string = 'No results found';
  @Input() overlayClassName: string;
  @Input() dropdownWidth: number;
  @Input() backdrop = false;
  @Input() isPreventButton: boolean = false;
  @Input() customSearchFn: (item, search: string) => boolean;

  @Input() noAnimation: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() clearMultiValue = new EventEmitter();

  public _value: any | any[];
  /**
    selectedItems: Item for single select
    selectedItems: Record<Item[this.bindValue], Item> for multi select
   */
  public selectedItems: any;
  public selectedItemsCountTemplate;
  public _title: string;
  public searchValue: string = '';
  public itemGroups: IItemGroup[];
  public _groupMap: { [key: string]: Object } = {};
  public visibleDropdown: boolean = false;
  public NO_GROUP = 'NO_GROUP';
  private defaultGroupOrders: string[] = [];
  private defaultSearchFn = (item, searchValue: string) => {
    return searchValue
      ? item[this.bindLabel]
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase())
      : true;
  };

  private onChange: (_: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['items']?.currentValue) {
      this.handleFilterItems();
      this.handleUpdateWhenChangeValues();
    }
  }

  ngAfterViewInit(): void {
    this._scrollIntoViewSelected();
  }

  private _scrollIntoViewSelected() {
    if (!this.multi) {
      this.dropdown?.['inputVisible$']
        .pipe(takeUntil(this.destroy$), filter(Boolean))
        .subscribe(() => {
          const overlayRef = this.dropdown['overlayRef'] as OverlayRef;
          const overlayElement = overlayRef?.overlayElement;
          const selectedElement = overlayElement.querySelector(
            '.trudi-select-dropdown-item.selected'
          );
          if (selectedElement) {
            selectedElement.scrollIntoView();
          }
        });
    }
  }

  writeValue(value: any): void {
    this._value = value;
    this.handleUpdateWhenChangeValues();
  }

  registerOnChange(fn: any): void {
    this.onChange = (value) => {
      this._value = value;
      this.handleUpdateWhenChangeValues();
      fn(value);
    };
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // recalculate _title, selectedItems, defaultGroupOrders variables when items change
  handleUpdateWhenChangeValues() {
    const updateMultiTitle = () => {
      const selectedItemsData = Object.values(this.selectedItems) ?? [];
      this.selectedItemsCountTemplate = selectedItemsData?.length;
      if (selectedItemsData?.length > 0) {
        this._title = selectedItemsData[0][this.bindLabel];
      } else {
        this._title = '';
      }
    };

    const updateSingleTitle = () => {
      this._title = this.selectedItems?.[this.bindLabel];
    };

    // recalculate _title, selectedItems
    if (this.multi) {
      const newSelectedItems = {};
      this.items.forEach((item) => {
        if (this._value?.includes(item[this.bindValue])) {
          newSelectedItems[item[this.bindValue]] = item;
        }
      });
      this.selectedItems = newSelectedItems;
      updateMultiTitle();
    } else {
      this.selectedItems = this.items.find(
        (item) => item[this.bindValue] === this._value
      );
      updateSingleTitle();
    }

    // recalculate defaultGroupOrders
    const groupOrdersSet = new Set<string>();
    this.items.forEach((item) => {
      groupOrdersSet.add(
        item[this.groupBy] ? item[this.groupBy] : this.NO_GROUP
      );
    });
    this.defaultGroupOrders = Array.from(groupOrdersSet);
  }
  handleVisibleChange(event) {
    this.visibleDropdown = event;
    this.visibleChange.emit(event);
    if (!event) {
      this.onTouched();
      // Handle the filter after the dropdown closes
      setTimeout(() => {
        this.handleClearSearch();
      }, 250);
    } else {
      this.handleClearSearch();
    }
  }

  search(event) {
    this.searchChange.emit(event.target.value);
    this.handleFilterItems();
  }

  handleClearSearch() {
    this.searchValue = '';
    this.searchChange.emit('');
    this.handleFilterItems();
  }

  handleClearValue(event) {
    event.stopPropagation();
    const newValue = this.multi ? [] : null;
    this.onChange(newValue);
    this.valueChange.emit(newValue);
    if (this.visibleDropdown) {
      this.visibleDropdown = false;
      this.visibleChange.emit(false);
    }
  }

  handleClearMultiValue() {
    this.onChange([]);
    this.valueChange.emit([]);
    this.clearMultiValue.emit();
  }

  handleFilterItems() {
    // Handles filtering of items by searchValue
    const filterItems = this.searchable
      ? this.items.filter((item) =>
          this.customSearchFn
            ? this.customSearchFn(item, this.searchValue)
            : this.defaultSearchFn(item, this.searchValue)
        )
      : this.items;

    // Map items by groups
    const filterItemGroupMap = new Map<string, any>();
    filterItemGroupMap.set(this.NO_GROUP, []);
    filterItems.forEach((item) => {
      const groupType = item[this.groupBy] ? item[this.groupBy] : this.NO_GROUP;
      this._groupMap[groupType] = item;
      filterItemGroupMap.set(
        groupType,
        filterItemGroupMap.has(groupType)
          ? [...filterItemGroupMap.get(groupType), item]
          : [item]
      );
    });
    // Generate ItemGroups data
    let groupOrders = this.groupOrders || this.defaultGroupOrders;
    if (filterItemGroupMap.get(this.NO_GROUP).length === 0) {
      filterItemGroupMap.delete(this.NO_GROUP);
    }

    if (!groupOrders.includes(this.NO_GROUP)) {
      groupOrders.unshift(this.NO_GROUP);
    }

    if (!this.alwaysShowTitleGroup) {
      groupOrders = groupOrders.filter(
        (group) =>
          filterItemGroupMap.has(group) &&
          filterItemGroupMap.get(group).length > 0
      );
    }
    this.itemGroups = groupOrders.map((key) => ({
      group: key,
      ...filterItemGroupMap.get(key),
      items: filterItemGroupMap.has(key) ? filterItemGroupMap.get(key) : []
    }));
  }

  handleSelectItem(item: any) {
    if (this.disabled || item['disabled']) return;

    if (this.multi) {
      const newValue = this.selectedItems[item[this.bindValue]]
        ? this._value.filter((it) => it !== item[this.bindValue])
        : [...(this._value ?? []), item[this.bindValue]];

      this.valueChange.emit(newValue);
      if (this.isPreventButton && newValue?.name === TaskStatusType.completed) {
        return;
      }
      this.onChange(newValue);
    } else {
      this.valueChange.emit(item[this.bindValue]);
      if (this.isPreventButton && item?.name === TaskStatusType.completed) {
        this.visibleDropdown = false;
        this.visibleChange.emit(false);
        return;
      }
      this.onChange(item[this.bindValue]);
      if (this.visibleDropdown) {
        this.visibleDropdown = false;
        this.visibleChange.emit(false);
        // Handle the filter after the dropdown closes
        setTimeout(() => {
          this.handleClearSearch();
        }, 250);
      }
    }
  }

  checkAvatar(avatar: string) {
    return avatar && !avatar.includes('google_avatar');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
