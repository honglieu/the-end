import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { userType } from '@trudi-ui';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { EReceiverType } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { hasInvalidEmail } from '@shared/components/select-receiver/utils/helper.function';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
@Component({
  selector: 'select-receiver',
  templateUrl: './select-receiver.component.html',
  styleUrl: './select-receiver.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectReceiverComponent),
      multi: true
    }
  ],
  exportAs: 'selectReceiver',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectReceiverComponent<T>
  implements OnChanges, AfterViewInit, ControlValueAccessor, OnDestroy
{
  @ViewChild('pseudoTemplate') pseudoTemplate: ElementRef;
  @ViewChild('suffixTemp') suffixTemp: ElementRef;

  // TODO: remove this, move to common select component
  @ViewChild(NgSelectComponent) ngSelectReceiver: NgSelectComponent;
  @Input() isSelectContactType: boolean = false;
  @Input() whiteList: string[] = ['.ng-dropdown-panel'];
  @Input() appendTo = '';
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() iconTemplate: string;
  @Input() prefixTemplate: string = '';
  @Input() placeholder: string = 'Search contact or add external email';
  @Input() extraCls!: string;
  @Input() isAddItem!: boolean;
  @Input() isHiddenLastChild: boolean = false;
  @Input() disabled: boolean = false;
  @Input() compareWith: (a, b) => boolean;
  @Input() sendMsgType: ISendMsgType = null;
  @Input() isPrefillSelected: boolean = false;
  @Input() prefillData: ICommunicationStep;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isShowSuffix: boolean = false;
  @Input() isShowCCBtn: boolean = false;
  @Input() isShowBCCBtn: boolean = false;
  @Input() closeOnSelect = false;
  @Input() selectedProperty: UserPropertyInPeople;
  @Input() showPropertyContactOnly = false;
  @Input() isLoading: boolean = false;
  @Input() items: T[];
  @Input() prefillReceivers = [];
  @Input() isRmEnvironment!: boolean;
  @Input() virtualScroll: boolean = true;
  @Input() otpGroupTemplate: TemplateRef<HTMLElement> = null;
  @Input() multiLabelTemplate: TemplateRef<HTMLElement> = null;
  @Input() optionTemplate: TemplateRef<HTMLElement> = null;
  @Input() headerTemplate: TemplateRef<HTMLElement> = null;
  @Input() suffixTemplate: TemplateRef<string> = null;
  @Input() suffixPaddingLeft: string = '30px';
  @Input() clearSearchOnAdd: boolean = false;

  @Output() triggerEventChange = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() focusChange = new EventEmitter();
  @Output() triggerAddTag = new EventEmitter();
  @Output() onOpen = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  public searchTerm: string = '';
  public selectedValue = [];
  public pipeType = userType;
  private destroy$ = new Subject<void>();
  public currentReceiverType: EReceiverType = null;
  public ESendMsgType = ISendMsgType;
  public EReceiverType = EReceiverType;
  public EMessageComeFromType = EMessageComeFromType;
  public currentPage: number = 1;
  @Input() totalPage: number = 0;
  @Input() isHasUnIdentifiedContact: boolean = false;
  @Input() isAddingTag: boolean = false;
  @Input() addTag: Function;
  public isFocused: boolean = false;

  constructor(public cdr: ChangeDetectorRef) {}

  @HostBinding('attr.class') get classes() {
    return `select-receiver ${
      this.appendTo ? 'append-to__' + this.appendTo.slice(1) : ''
    }`;
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  onInput(value: string): void {
    this.isHiddenLastChild = value?.length > 0;
  }

  writeValue(value: T[]): void {
    if (!value?.length) {
      this.updateStyleForPrefix(true);
    }
    this.selectedValue = value;
    if (value?.length) {
      this.cdr.markForCheck();
    }
    if (
      this.appendTo &&
      this.ngSelectReceiver &&
      this.ngSelectReceiver.isOpen &&
      this.ngSelectReceiver.dropdownPanel
    ) {
      setTimeout(() => {
        this.ngSelectReceiver.dropdownPanel.adjustPosition();
        this.cdr.markForCheck();
      }, 0);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = (value: any) => {
      if (
        this.appendTo &&
        this.ngSelectReceiver &&
        this.ngSelectReceiver.isOpen &&
        this.ngSelectReceiver.dropdownPanel
      ) {
        setTimeout(() => {
          this.ngSelectReceiver.dropdownPanel.adjustPosition();
          this.cdr.markForCheck();
        }, 0);
      }
      fn(value);
    };
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.checkHasUnIdentifiedContact();
    if (changes['suffixTemplate']) {
      this.updateStyleForPrefix();
    }
    if (changes['suffixPaddingLeft']) {
      this.updateStyleForPrefix();
    }
  }

  ngAfterViewInit() {
    this.updateStyleForPrefix();
  }

  onModelChange($event) {
    this.checkHasUnIdentifiedContact();
    let value = $event;
    this.triggerEventChange.emit(value);
    this.onChange(value);
  }

  checkHasUnIdentifiedContact() {
    this.isHasUnIdentifiedContact = hasInvalidEmail(this.selectedValue);
  }

  goToNextPage() {
    if (this.totalPage < this.currentPage + 1) return;
    this.currentPage += 1;
    this.search.emit({
      page: this.currentPage
    });
  }

  handleEnterKeyPress(event: KeyboardEvent) {
    if (event.code !== 'Enter' || !this.ngSelectReceiver) return;
    this.ngSelectReceiver.close();
  }

  onCloseSelect() {
    this.clearSearchTerm();
    this.onClose.emit();
  }

  handleOpenDropdown() {
    this.onOpen.emit();
  }

  clearSearchTerm() {
    if (this.searchTerm?.length) {
      this.searchTerm = '';
      this.currentPage = 1;
      this.search.emit({ search: this.searchTerm, page: this.currentPage });
    }
  }

  onSearchFn() {
    return true;
  }

  onSearch(data) {
    if (this.searchTerm?.trim() !== data?.term?.trim()) {
      this.searchTerm = data.term?.trim() ?? '';
      this.currentPage = 1;
      this.search.emit({ search: this.searchTerm, page: this.currentPage });
    }
  }

  handleClickOutsideReceiver() {
    if (this.ngSelectReceiver && !this.isAddingTag) {
      this.clearSearchTerm();
      this.ngSelectReceiver.searchInput.nativeElement.value = '';
      this.ngSelectReceiver?.close();
      this.ngSelectReceiver.blur();
    }
    this.isAddingTag = false;
    this.isSelectContactType && this.triggerEventChange.emit();
  }

  trackByFn(item: ISelectedReceivers) {
    return (
      item?.id +
      item?.idUserPropertyGroup +
      (item?.secondaryEmail?.id || item?.secondaryEmailId || '')
    );
  }

  updateStyleForPrefix(resetColor: boolean = false) {
    if (!this.ngSelectReceiver) return;
    const selectElement = !resetColor
      ? (this.ngSelectReceiver.element.querySelector(
          '.ng-value-container'
        ) as HTMLElement)
      : (document.querySelectorAll(
          '.select-wrapper .pseudo-input .invalid-receiver'
        ) as unknown as HTMLElement[]);
    if (resetColor) {
      (selectElement as HTMLElement[]).forEach((item) => {
        item.classList.remove('invalid-receiver');
      });
      return;
    }
    if (this.pseudoTemplate) {
      const span = document.createElement('span');
      span.innerText = (
        this.pseudoTemplate.nativeElement as HTMLElement
      ).innerText;
      span.style.position = 'absolute';
      span.style.left = '-9999px';
      document.body.appendChild(span);
      (selectElement as HTMLElement).style.setProperty(
        'padding-left',
        this.suffixPaddingLeft,
        'important'
      );
      document.body.removeChild(span);
    }
  }

  onFocusAndOpenSelect() {
    this.ngSelectReceiver.focus();
    this.ngSelectReceiver.open();
    this.isFocused = true;
    this.focusChange.emit(true);
  }

  handleBlur() {
    this.isFocused = false;
    this.focusChange.emit(false);
  }

  blur() {
    this.ngSelectReceiver.blur();
    this.ngSelectReceiver.close();
  }

  focusAndBlur() {
    this.onFocusAndOpenSelect();
    this.ngSelectReceiver.blur();
    this.ngSelectReceiver.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.ngSelectReceiver) {
      this.ngSelectReceiver.element
        .querySelector('.ng-value-container')
        .removeAttribute('style');
    }
  }
}
