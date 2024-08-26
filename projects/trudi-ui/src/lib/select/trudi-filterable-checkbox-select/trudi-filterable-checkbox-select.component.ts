import {
  Component,
  Input,
  OnInit,
  forwardRef,
  Output,
  EventEmitter,
  OnDestroy,
  ContentChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EScrollBlock } from '../../common/enums/scroll.enum';
import { scrollSelectedIntoView } from '../../common/functions/scroll';
import {
  TrudiOptionTemplateDirective,
  TrudiFooterTemplateDirective,
  TrudiLabelTemplateDirective
} from '../directives';

@Component({
  selector: 'trudi-filterable-checkbox-select',
  templateUrl: './trudi-filterable-checkbox-select.component.html',
  styleUrls: ['./trudi-filterable-checkbox-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiFilterableCheckboxSelect),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiFilterableCheckboxSelect
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @ContentChild(TrudiOptionTemplateDirective)
  optionTemplate!: TrudiOptionTemplateDirective;
  @ContentChild(TrudiFooterTemplateDirective)
  footerTemplate!: TrudiFooterTemplateDirective;
  @ContentChild(TrudiLabelTemplateDirective)
  labelTemplate!: TrudiLabelTemplateDirective;
  @Input() items: any[] = [];
  @Input() listCheckbox: FilterCheckboxItem[] = [];
  @Input() groupBy = 'groupTitle';
  @Input() searchFn: Function;
  @Input() bindLabel = 'title';
  @Input() bindValue = 'id';
  @Input() defaultChecked = false;
  @Input() clearable = false;
  @Input() loading = false;
  @Input() virtualScroll = false;
  @Input() trackByFn: Function;
  @Input() checkBox = [];
  @Input() typeahead;
  @Output() checkboxValueChange = new EventEmitter();
  @Output() scrollToEnd = new EventEmitter();
  @Output() footerClick = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() onchange = new EventEmitter();
  public isSearching = false;
  public valueSelected;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};
  public disabled: boolean;
  public filteredItems: any;
  private timeOut;
  constructor() {}

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
  }
  ngOnInit(): void {}

  handleSearch(event) {
    this.isSearching = true;
  }

  handleCheckboxValue(checkboxValue: string[]) {
    this.checkboxValueChange.emit(checkboxValue);
  }

  onOpenSelect() {
    this.timeOut = setTimeout(() => {
      scrollSelectedIntoView(EScrollBlock.CENTER);
    }, 0);
  }

  ngOnDestroy(): void {
    this.checkBox = [];
    clearTimeout(this.timeOut);
  }
}

export interface FilterCheckboxItem {
  label: string;
  propertyName: string;
  value: string | number;
}
