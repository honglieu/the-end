import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { TrudiFooterTemplateDirective } from '../directives/trudi-footer-template.directive';
import { TrudiHeaderTemplateDirective } from '../directives/trudi-header-template.directive';
import { TrudiLabelTemplateDirective } from '../directives/trudi-label-template.directive';
import { TrudiOptionTemplateDirective } from '../directives/trudi-option-template.directive';
import { TrudiGroupTemplateDirective } from '../directives/trudi-group-template.directive';

export const TimeRegex =
  /^(0?[0-9]|1[0-2]):[0-5][0-9] (am|pm)\s?(\([a-z]*\))?$/i;

@Component({
  selector: 'trudi-single-select',
  templateUrl: './trudi-single-select.component.html',
  styleUrls: ['./trudi-single-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSingleSelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiSingleSelectComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('select') select: NgSelectComponent;

  @ContentChild(TrudiHeaderTemplateDirective)
  headerTemplate!: TrudiHeaderTemplateDirective;
  @ContentChild(TrudiOptionTemplateDirective)
  optionTemplate!: TrudiOptionTemplateDirective;
  @ContentChild(TrudiFooterTemplateDirective)
  footerTemplate!: TrudiFooterTemplateDirective;
  @ContentChild(TrudiLabelTemplateDirective)
  labelTemplate!: TrudiLabelTemplateDirective;

  @ContentChild(TrudiGroupTemplateDirective)
  groupTemplate!: TrudiGroupTemplateDirective;
  @Input()
  items: any[] = [];
  @Input() itemSelected;
  @Input() groupBy: string = '';
  @Input() searchFn: Function;
  @Input() label: string;
  @Input() notFoundText = 'No results found';
  @Input() isDisabled: boolean = false;
  @Input() labelTpl: TemplateRef<{}>;
  @Input() bindLabel: string = 'title';
  @Input() bindValue: string = 'id';
  @Input() enableSearch: boolean = true;
  @Input() clearable: boolean = true;
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() virtualScroll: boolean = false;
  @Input() serversideSearch: boolean = false;
  @Input() trackByFn: Function;
  @Input() placeholder: string = '';
  @Input() dropdownPosition: string = 'auto';
  @Input() typeahead: Subject<string>;
  @Input() typeToSearchText: string = '';
  @Input() compareWith: (a, b) => boolean;
  @Output() scrollToEnd = new EventEmitter();
  @Output() footerClick = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() onClear = new EventEmitter();
  @Output() triggerEventChange = new EventEmitter();
  @Output() isOpened = new EventEmitter();
  @Output() triggerEventBlur = new EventEmitter<string>();
  @Output() triggerTrackControl = new EventEmitter<void>();
  @Input() isShowSubLabel: boolean = false;
  @Input() isShowSubLabelOption: boolean = false;
  @Input() appendTo: string = '';
  @Input() showLeftIcon: boolean = false;
  @Input() iconName: string;
  @Input() editableSearchTerm: boolean = false;
  @Input() isUnlimitedContentLong: boolean = false;
  @Input() className: string = '';
  @Input() isShowLabelSuggested: boolean = true;
  @Input() isHideLabelGroup: boolean = false;
  @Input() stopPropagationClick: boolean = false;
  @Input() setSelectOpen: boolean = false;
  @Input() isOpen: boolean | null = null;
  public isClickOutsideOpen: boolean = false;
  public isSearching = false;
  public valueSelected;
  public isTimeValue: boolean = false;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}
  writeValue(obj: any): void {
    this.isTimeValue = TimeRegex.test(obj);
    this.valueSelected = obj;
    this.cdr.markForCheck();
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

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['setSelectOpen'] && this.select) {
      this.select.isOpen = changes['setSelectOpen'].currentValue;
      this.isClickOutsideOpen = changes['setSelectOpen'].currentValue;
    }
  }

  handleSearch(event) {
    this.isSearching = true;
  }

  clearSearchTerm() {
    if (this.isClickOutsideOpen) this.select.isOpen = true;
    this.search.emit('');
  }

  handleClear() {
    if (this.isClickOutsideOpen) this.select.isOpen = true;
    this.onClear.emit();
  }

  handleChange(event) {
    this.isClickOutsideOpen = false;
    this.triggerEventChange.emit(event);
    setTimeout(() => {
      this.select.blur();
    }, 0);
  }

  handleFocus() {
    if (this.stopPropagationClick) event.stopPropagation();
    setTimeout(() => {
      const panel = document.querySelector('ng-dropdown-panel');
      if (panel && this.className) panel.classList.add(this.className);
    }, 0);
    this.select.focus();
  }

  clearAll() {
    this.select.handleClearClick();
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

  handleClickOutsideSingleSelect() {
    if (this.select) {
      this.select?.close();
    }
  }

  handledSearchFn(term: string, item: { [label: string]: string }) {
    if (this.serversideSearch) return true;
    if (this.searchFn === undefined) {
      return item[this.bindLabel]
        .toLowerCase()
        .includes(term.trim().toLowerCase());
    }
    return this.searchFn(term.trim(), item);
  }

  trackUserChange() {
    this.triggerTrackControl.emit();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll, true);
  }

  searchFnFake() {
    return true;
  }
}
