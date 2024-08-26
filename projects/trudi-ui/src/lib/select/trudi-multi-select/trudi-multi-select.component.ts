import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { TrudiFooterTemplateDirective } from '../../select/directives/trudi-footer-template.directive';
import { TrudiHeaderTemplateDirective } from '../../select/directives/trudi-header-template.directive';
import { TrudiLabelTemplateDirective } from '../../select/directives/trudi-label-template.directive';
import { TrudiOptionTemplateDirective } from '../../select/directives/trudi-option-template.directive';
import { EUserPropertyType } from '../../common/enums/user-property-type.enum';

@Component({
  selector: 'trudi-multi-select',
  templateUrl: './trudi-multi-select.component.html',
  styleUrls: ['./trudi-multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiMultiSelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiMultiSelectComponent implements OnInit, OnDestroy {
  @ContentChild(TrudiOptionTemplateDirective)
  optionTemplate!: TrudiOptionTemplateDirective;
  @ContentChild(TrudiFooterTemplateDirective)
  footerTemplate!: TrudiFooterTemplateDirective;
  @ContentChild(TrudiHeaderTemplateDirective)
  headerTemplate!: TrudiHeaderTemplateDirective;
  @ContentChild(TrudiLabelTemplateDirective)
  labelTemplate!: TrudiLabelTemplateDirective;
  @ViewChild('select') select: NgSelectComponent;
  @Input() items: any[] = [];
  @Input() addTagFn: Function;
  @Input() groupBy: string = '';
  @Input() searchFn: Function;
  @Input() label: string;
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() clearable: boolean = false;
  @Input() loading: boolean = false;
  @Input() virtualScroll: boolean = false;
  @Input() serversideSearch: boolean = false;
  @Input() trackByFn: Function;
  @Input() placeholder: string = '';
  @Input() dropdownPosition: string = '';
  @Input() typeahead: Subject<string>;
  @Input() readonly: boolean = false;
  @Input() disabledOnlyCheckbox: boolean = false;
  @Input() appendTo: string = '';
  @Input() className: string = '';
  @Input() totalOptions: number;
  @Input() clearSearchOnAdd: boolean = true;
  @Input() closeOnSelect: boolean = false;
  @Output() scrollToEnd = new EventEmitter();
  @Output() footerClick = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() focusOut = new EventEmitter();
  @Output() handleOpen = new EventEmitter();
  @Output() triggerAddTag = new EventEmitter();
  @Output() focusChange = new EventEmitter();
  @Output() visibleDropdownChange = new EventEmitter<boolean>();
  @Output() clearAllSelection = new EventEmitter();

  public isSearching = false;
  public valueSelected;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};
  public disabled: boolean;
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll, true);
  }

  writeValue(obj: any): void {
    this.valueSelected = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  handleSearch(event) {
    this.search.emit(event);
    if (this.addTagFn) {
      this.isSearching = true;
      this.items = [
        ...this.items.filter((item) => item.type !== EUserPropertyType.EXTERNAL)
      ];
    }
  }

  clearAll() {
    this.valueSelected = [];
    this.clearAllSelection.emit();
    if (this.appendTo) {
      this.select.blur();
    }
    this.handleFocus();
  }

  onDropdownClose(event) {
    this.isSearching = false;
    this.focusOut.emit(event);
    this.visibleDropdownChange.emit(false);
  }

  onDropdownOpen(event) {
    setTimeout(() => {
      const panel = document.querySelector('ng-dropdown-panel');
      if (panel && this.className) panel.classList.add(this.className);
    }, 0);
    this.select.focus();
    this.handleOpen.emit();
    this.visibleDropdownChange.emit(true);
  }

  handleFocus() {
    this.select.focus();
    this.focusChange.emit(true);
  }

  searchFnFake() {
    return true;
  }

  handleClickOutsideMultiSelect() {
    if (this.isSearching || this.closeOnSelect) return;
    if (this.select && !this.appendTo) {
      this.select?.close();
      this.focusChange.emit(false);
    }
  }

  handleBlur() {
    if (this.select) {
      this.select?.blur();
      this.focusChange.emit(false);
    }
  }

  private onScroll = (event: MouseEvent) => {
    if (this.select && this.select.isOpen && this.appendTo) {
      const isScrollingInScrollHost =
        ((event.target as Element).className as string).indexOf(
          'ng-dropdown-panel'
        ) > -1;
      if (isScrollingInScrollHost) {
        return;
      }
      this.select.close();
      this.select.blur();
    }
  };

  onAdd(data) {
    if (this.closeOnSelect) {
      event.stopPropagation();
      return;
    }
    this.triggerAddTag.emit(data);
  }

  focusNgSelect() {
    this.select.focus();
    this.select.open();
  }
  blurNgSelect() {
    this.select.blur();
    this.select.close();
  }
  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll, true);
  }
}
