/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import { ESCAPE } from '@angular/cdk/keycodes';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedOverlayPositionChange,
  ConnectionPositionPair,
  HorizontalConnectionPos,
  VerticalConnectionPos
} from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Host,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent, of as observableOf, Subject, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';

import { NzResizeObserver } from 'ng-zorro-antd/cdk/resize-observer';
import { slideMotion } from 'ng-zorro-antd/core/animation';
import {
  NzConfigKey,
  NzConfigService,
  WithConfig
} from 'ng-zorro-antd/core/config';
import {
  NzFormNoStatusService,
  NzFormStatusService
} from 'ng-zorro-antd/core/form';
import { NzNoAnimationDirective } from 'ng-zorro-antd/core/no-animation';
import {
  DEFAULT_DATE_PICKER_POSITIONS,
  DATE_PICKER_POSITION_MAP
} from 'ng-zorro-antd/core/overlay';
import {
  CandyDate,
  cloneDate,
  CompatibleValue,
  wrongSortOrder
} from 'ng-zorro-antd/core/time';
import {
  BooleanInput,
  FunctionProp,
  NgClassInterface,
  NzSafeAny,
  NzStatus,
  NzValidateStatus,
  OnChangeType,
  OnTouchedType
} from 'ng-zorro-antd/core/types';
import {
  getStatusClassNames,
  InputBoolean,
  toBoolean,
  valueFunctionProp
} from 'ng-zorro-antd/core/util';
import {
  DateHelperService,
  NzDatePickerI18nInterface,
  NzDatePickerLangI18nInterface,
  NzI18nService
} from 'ng-zorro-antd/i18n';

import { DatePickerService } from '../../../date-picker/date-picker.service';
import {
  CompatibleDate,
  DisabledTimeFn,
  NzDateMode,
  PresetRanges,
  RangePartType,
  SupportTimeOptions
} from '../../../date-picker/standard-types';
import { PREFIX_CLASS, isAllowedDate } from '../../../date-picker/util';
import { format, parse } from 'date-fns';
import { SingleDateRangePopupComponent } from '../../../date-picker/custom/trudi-single-range-picker/single-date-range-popup.component';
import { TRUDI_DATE_FORMAT } from '../../../provider/trudi-config';
import { TrudiDateFormat } from '../../../interfaces';

const POPUP_STYLE_PATCH = { position: 'relative' }; // Aim to override antd's style to support overlay's position strategy (position:absolute will cause it not working because the overlay can't get the height/width of it's content)
const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'datePicker';

export type NzDatePickerSizeType = 'large' | 'default' | 'small';
export type NzPlacement =
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'topLeft'
  | 'topCenter'
  | 'topRight';

/**
 * The base picker for all common APIs
 */
//Incase selector already in use, reuse selector when implementing new type of date picker
//Selector: 'trudi-date-picker,trudi-week-picker,trudi-month-picker,trudi-year-picker,trudi-range-picker',
@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'trudi-single-range-picker',
  exportAs: 'trudiDatePicker',
  template: `
    <div *ngIf="!nzInline" #rangePickerInputTmp class="date-input-wrapper">
      <input
        tabindex="0"
        class="date-input"
        [class.invalid]="isInputError('left')"
        #rangePickerInput
        strictCharacter
        [onlyNumber]="true"
        [specialCharacters]="['/']"
        [disabled]="nzDisabled"
        [readOnly]="nzInputReadOnly"
        [size]="inputSize"
        autocomplete="off"
        (click)="onClickInputBox($event, 'left')"
        (focus)="onFocus($event, 'left')"
        (keyup.enter)="onKeyupEnter($event)"
        [(ngModel)]="inputValue[datePickerService.getActiveIndex('left')]"
        (ngModelChange)="onInputChange($event, false, 'left')"
        (focusout)="onFocusoutInput($event, 'left')"
        placeholder="{{ nzFormat | lowercase }}" />
      -
      <input
        tabindex="0"
        class="date-input"
        [class.invalid]="isInputError('right')"
        #rangePickerInput
        strictCharacter
        [onlyNumber]="true"
        [specialCharacters]="['/']"
        [disabled]="nzDisabled"
        [readOnly]="nzInputReadOnly"
        [size]="inputSize"
        autocomplete="off"
        (click)="onClickInputBox($event, 'right')"
        (focus)="onFocus($event, 'right')"
        (keyup.enter)="onKeyupEnter($event)"
        [(ngModel)]="inputValue[datePickerService.getActiveIndex('right')]"
        (ngModelChange)="onInputChange($event, false, 'right')"
        (focusout)="onFocusoutInput($event, 'right')"
        placeholder="{{ nzFormat | lowercase }}" />
    </div>

    <ng-template #inlineMode>
      <div
        class="{{ prefixCls }}-dropdown {{ nzDropdownClassName }}"
        [class.ant-picker-dropdown-rtl]="dir === 'rtl'"
        [class.ant-picker-dropdown-placement-bottomLeft]="
          currentPositionY === 'bottom' && currentPositionX === 'start'
        "
        [class.ant-picker-dropdown-placement-topLeft]="
          currentPositionY === 'top' && currentPositionX === 'start'
        "
        [class.ant-picker-dropdown-placement-bottomRight]="
          currentPositionY === 'bottom' && currentPositionX === 'end'
        "
        [class.ant-picker-dropdown-placement-topRight]="
          currentPositionY === 'top' && currentPositionX === 'end'
        "
        [class.ant-picker-dropdown-range]="isRange"
        [class.ant-picker-active-left]="
          datePickerService.activeInput === 'left'
        "
        [class.ant-picker-active-right]="
          datePickerService.activeInput === 'right'
        "
        [ngStyle]="nzPopupStyle">
        <single-date-range-popup
          [inputValue]="inputValue"
          [errorInputs]="errorInputs"
          [isRange]="isRange"
          [onlyLeft]="onlyLeft"
          [tplHeader]="tplHeader"
          [inline]="nzInline"
          [defaultPickerValue]="nzDefaultPickerValue"
          [showWeek]="nzMode === 'week'"
          [panelMode]="panelMode"
          (panelModeChange)="onPanelModeChange($event)"
          (calendarChange)="onCalendarChange($event)"
          [locale]="nzLocale?.lang!"
          [showToday]="
            nzMode === 'date' && nzShowToday && !isRange && !nzShowTime
          "
          [showNow]="nzMode === 'date' && nzShowNow && !isRange && !!nzShowTime"
          [showTime]="nzShowTime"
          [dateRender]="nzDateRender"
          [disabledDate]="nzDisabledDate"
          [disabledTime]="nzDisabledTime"
          [extraFooter]="extraFooterProp || extraFooter"
          [ranges]="nzRanges"
          [dir]="dir"
          (resultOk)="onResultOk()">
          <!-- Custom input for range picker -->
          <ng-container *ngIf="nzInline">
            <input
              class="date-input"
              [class.invalid]="isInputError('left')"
              #rangePickerInput
              strictCharacter
              [onlyNumber]="true"
              [specialCharacters]="['/']"
              [disabled]="nzDisabled"
              [readOnly]="nzInputReadOnly"
              [size]="inputSize"
              autocomplete="off"
              (click)="onClickInputBox($event, 'left')"
              (focus)="onFocus($event, 'left')"
              (keyup.enter)="onKeyupEnter($event)"
              [(ngModel)]="inputValue[datePickerService.getActiveIndex('left')]"
              (ngModelChange)="onInputChange($event, false, 'left')"
              (focusout)="onFocusoutInput($event, 'left')"
              placeholder="{{ nzFormat | lowercase }}" />
            -
            <input
              class="date-input"
              [class.invalid]="isInputError('right')"
              #rangePickerInput
              strictCharacter
              [onlyNumber]="true"
              [specialCharacters]="['/']"
              [disabled]="nzDisabled"
              [readOnly]="nzInputReadOnly"
              [size]="inputSize"
              autocomplete="off"
              (click)="onClickInputBox($event, 'right')"
              (focus)="onFocus($event, 'right')"
              (keyup.enter)="onKeyupEnter($event)"
              [(ngModel)]="
                inputValue[datePickerService.getActiveIndex('right')]
              "
              (ngModelChange)="onInputChange($event, false, 'right')"
              (focusout)="onFocusoutInput($event, 'right')"
              placeholder="{{ nzFormat | lowercase }}" />
          </ng-container>
          <ng-template #extraFooter>
            <div class="d-flex justify-content-end gap-6 pb-12 extra-footer">
              <button class="footer-button" (click)="handleCancel()">
                Cancel
              </button>
              <button class="footer-button" (click)="handleApply()">
                Apply
              </button>
            </div>
          </ng-template>
        </single-date-range-popup>
      </div>
    </ng-template>

    <!-- Overlay -->
    <ng-template
      cdkConnectedOverlay
      nzConnectedOverlay
      [cdkConnectedOverlayHasBackdrop]="nzBackdrop"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="realOpenState"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayTransformOriginOn]="'.ant-picker-wrapper'"
      (positionChange)="onPositionChange($event)"
      (detach)="close()"
      (overlayKeydown)="onOverlayKeydown($event)"
      (backdropClick)="handleCancel()">
      <div
        class="ant-picker-wrapper"
        [nzNoAnimation]="!!noAnimation?.nzNoAnimation"
        [@slideMotion]="'enter'"
        style="position: relative;">
        <ng-container *ngTemplateOutlet="inlineMode"></ng-container>
      </div>
    </ng-template>
  `,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[class.ant-picker]': `true`,
    '[class.ant-picker-range]': `isRange`,
    '[class.ant-picker-large]': `nzSize === 'large'`,
    '[class.ant-picker-small]': `nzSize === 'small'`,
    '[class.ant-picker-disabled]': `nzDisabled`,
    '[class.ant-picker-rtl]': `dir === 'rtl'`,
    '[class.ant-picker-borderless]': `nzBorderless`,
    '[class.ant-picker-inline]': `nzInline`,
    '[class.ant-picker-not-inline]': `!nzInline`,
    '(click)': 'onClickInputBox($event)'
  },
  providers: [
    DatePickerService,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TrudiSingleRangePickerComponent)
    }
  ],
  styleUrls: ['./single-panel-range-picker.scss'],
  animations: [slideMotion]
})
export class TrudiSingleRangePickerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, ControlValueAccessor
{
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;
  static ngAcceptInputType_nzAllowClear: BooleanInput;
  static ngAcceptInputType_nzAutoFocus: BooleanInput;
  static ngAcceptInputType_nzDisabled: BooleanInput;
  static ngAcceptInputType_nzBorderless: BooleanInput;
  static ngAcceptInputType_nzInputReadOnly: BooleanInput;
  static ngAcceptInputType_nzInline: BooleanInput;
  static ngAcceptInputType_nzOpen: BooleanInput;
  static ngAcceptInputType_nzShowToday: BooleanInput;
  static ngAcceptInputType_nzShowNow: BooleanInput;
  static ngAcceptInputType_nzMode:
    | NzDateMode
    | NzDateMode[]
    | string
    | string[]
    | null
    | undefined;
  static ngAcceptInputType_nzShowTime:
    | BooleanInput
    | SupportTimeOptions
    | null
    | undefined;

  isRange: boolean = true; // Indicate whether the value is a range value
  extraFooterProp?: TemplateRef<NzSafeAny> | string;
  dir: Direction = 'ltr';

  // status
  statusCls: NgClassInterface = {};
  status: NzValidateStatus = '';
  hasFeedback: boolean = false;

  public panelMode: NzDateMode | NzDateMode[] = 'date';
  private destroyed$: Subject<void> = new Subject();
  private isCustomPlaceHolder: boolean = false;
  private isCustomFormat: boolean = false;
  private showTime: SupportTimeOptions | boolean = false;

  // --- Common API
  @Input() @InputBoolean() nzAllowClear: boolean = true;
  @Input() @InputBoolean() nzAutoFocus: boolean = false;
  @Input() @InputBoolean() nzDisabled: boolean = false;
  @Input() @InputBoolean() nzBorderless: boolean = false;
  @Input() @InputBoolean() nzInputReadOnly: boolean = false;
  @Input() @InputBoolean() nzInline: boolean = true;
  @Input() @InputBoolean() nzOpen?: boolean;
  @Input() nzDisabledDate?: (d: Date) => boolean;
  @Input() nzLocale!: NzDatePickerI18nInterface;
  @Input() nzPlaceHolder: string | string[] = '';
  @Input() nzPopupStyle: object = POPUP_STYLE_PATCH;
  @Input() nzDropdownClassName?: string;
  @Input() nzSize: NzDatePickerSizeType = 'default';
  @Input() nzStatus: NzStatus = '';
  @Input() nzFormat!: string;
  @Input() nzDateRender?:
    | TemplateRef<NzSafeAny>
    | string
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() nzDisabledTime?: DisabledTimeFn;
  @Input() nzRenderExtraFooter?:
    | TemplateRef<NzSafeAny>
    | string
    | FunctionProp<TemplateRef<NzSafeAny> | string>;
  @Input() @InputBoolean() nzShowToday: boolean = true;
  @Input() nzMode: NzDateMode = 'date';
  @Input() @InputBoolean() nzShowNow: boolean = true;
  @Input() nzRanges?: PresetRanges;
  @Input() nzDefaultPickerValue: CompatibleDate | null = null;
  @Input() @WithConfig() nzSeparator?: string = undefined;
  @Input() @WithConfig() nzSuffixIcon: string | TemplateRef<NzSafeAny> =
    'calendar';
  @Input() @WithConfig() nzBackdrop = true;
  @Input() nzId: string | null = null;
  @Input() nzPlacement: NzPlacement = 'bottomLeft';
  @Input() set customOrigin(elementRef: ElementRef) {
    this.origin = new CdkOverlayOrigin(elementRef);
  }

  // TODO(@wenqi73) The PanelMode need named for each pickers and export
  @Output() readonly nzOnPanelChange = new EventEmitter<
    NzDateMode | NzDateMode[] | string | string[]
  >();
  @Output() readonly nzOnCalendarChange = new EventEmitter<
    Array<Date | null>
  >();
  @Output() readonly nzOnOk = new EventEmitter<CompatibleDate | null>();
  @Output() readonly nzOnOpenChange = new EventEmitter<boolean>();
  @Output() readonly nzOnCancel = new EventEmitter<boolean>();
  errorInputs: boolean[] = [false, false];
  isApply: boolean;
  timeOutId: NodeJS.Timeout;

  @Input() get nzShowTime(): SupportTimeOptions | boolean {
    return this.showTime;
  }

  //Customize input
  @Input() tplHeader: TemplateRef<HTMLElement>;

  set nzShowTime(value: SupportTimeOptions | boolean) {
    this.showTime = typeof value === 'object' ? value : toBoolean(value);
  }

  // ------------------------------------------------------------------------
  // Input API Start
  // ------------------------------------------------------------------------
  @ViewChild(CdkConnectedOverlay, { static: false })
  cdkConnectedOverlay?: CdkConnectedOverlay;
  @ViewChild(SingleDateRangePopupComponent, { static: false })
  panel!: SingleDateRangePopupComponent;
  @ViewChild('separatorElement', { static: false })
  separatorElement?: ElementRef;
  @ViewChild('pickerInput', { static: false })
  pickerInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('rangePickerInput') rangePickerInputs?: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChild('rangePickerInputTmp') rangePickerInputsTmp?: ElementRef;

  origin: CdkOverlayOrigin;
  document: Document;
  inputSize: number = 12;
  inputWidth?: number;
  prefixCls = PREFIX_CLASS;
  inputValue!: NzSafeAny;
  activeBarStyle: object = {};
  overlayOpen: boolean = false; // Available when "nzOpen" = undefined
  overlayPositions: ConnectionPositionPair[] = [
    ...DEFAULT_DATE_PICKER_POSITIONS
  ];
  currentPositionX: HorizontalConnectionPos = 'start';
  currentPositionY: VerticalConnectionPos = 'bottom';

  onlyLeft: boolean = true; //Use for range only
  subscription = new Subscription();

  get realOpenState(): boolean {
    // The value that really decide the open state of overlay
    return this.isOpenHandledByUser() ? !!this.nzOpen : this.overlayOpen;
  }

  ngAfterViewInit(): void {
    if (this.nzAutoFocus) {
      this.focus();
    }

    if (!this.nzInline) {
      this.origin = new CdkOverlayOrigin(this.rangePickerInputsTmp);
    }

    if (this.isRange && this.platform.isBrowser) {
      this.nzResizeObserver
        .observe(this.elementRef)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.updateInputWidthAndArrowLeft();
        });
    }

    this.datePickerService.inputPartChange$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((partType) => {
        if (partType) {
          this.datePickerService.activeInput = partType;
        }
        this.focus();
        this.updateInputWidthAndArrowLeft();
      });

    this.rangePickerInputs.changes
      .pipe(takeUntil(this.destroyed$))
      .subscribe((rs) => {
        this.rangePickerInputs.first?.nativeElement.focus();
      });
  }

  updateInputWidthAndArrowLeft(): void {
    this.inputWidth =
      this.rangePickerInputs?.first?.nativeElement.offsetWidth || 0;

    const baseStyle = { position: 'absolute', width: `${this.inputWidth}px` };
    this.datePickerService.arrowLeft =
      this.datePickerService.activeInput === 'left'
        ? 0
        : this.inputWidth + this.separatorElement?.nativeElement.offsetWidth ||
          0;

    if (this.dir === 'rtl') {
      this.activeBarStyle = {
        ...baseStyle,
        right: `${this.datePickerService.arrowLeft}px`
      };
    } else {
      this.activeBarStyle = {
        ...baseStyle,
        left: `${this.datePickerService.arrowLeft}px`
      };
    }

    this.cdr.markForCheck();
  }

  getInput(partType?: RangePartType): HTMLInputElement | undefined {
    if (this.nzInline && !this.onlyLeft) {
      return undefined;
    }
    return this.isRange
      ? partType === 'left'
        ? this.rangePickerInputs?.first?.nativeElement
        : this.rangePickerInputs?.last?.nativeElement
      : this.pickerInput!.nativeElement;
  }

  focus(): void {
    const activeInputElement = this.getInput(
      this.datePickerService.activeInput
    );
    if (this.document.activeElement !== activeInputElement) {
      activeInputElement?.focus();
    }
  }

  onFocus(event: FocusEvent, partType?: RangePartType): void {
    event.preventDefault();
    if (!this.nzInline) {
      this.nzOpen = true;
    }
    if (partType) {
      this.datePickerService.inputPartChange$.next(partType);
    }
    this.renderClass(true);
  }

  // blur event has not the relatedTarget in IE11, use focusout instead.
  onFocusout(event: FocusEvent): void {
    event.preventDefault();
    if (!this.elementRef.nativeElement.contains(event.relatedTarget)) {
      this.checkAndClose();
    }
    this.renderClass(false);
  }

  /*
    Clear selected date when user typed in invalid value then focusout
  */
  onFocusoutInput(event: FocusEvent, partType: RangePartType): void {
    const index = this.datePickerService.getActiveIndex(partType);
    if (!this.elementRef.nativeElement.contains(event.relatedTarget)) {
      // handle close dropdown when input focusout
      // Only for case !this.nzInline
      if (!this.nzInline && this.nzOpen) {
        this.nzOpen = false;
        this.blur();
        this.nzOnCancel.emit(true);
      }
      const value = this.inputValue[index];
      if (
        !this.checkValidDate(value) ||
        !isAllowedDate(this.checkValidDate(value), this.nzDisabledDate)
      ) {
        this.inputValue[index] = null;
        //Clear selected date
        const value = cloneDate(this.datePickerService.value);
        value[index] = null;
        this.datePickerService.setValue(value);
        this.cdr.markForCheck();
      }
    }
    this.renderClass(false);
  }

  // Show overlay content
  open(): void {
    if (this.nzInline) {
      return;
    }
    if (!this.realOpenState && !this.nzDisabled) {
      this.updateInputWidthAndArrowLeft();
      this.overlayOpen = true;
      this.nzOnOpenChange.emit(true);
      this.focus();
      this.cdr.markForCheck();
    }
  }

  close(): void {
    if (this.nzInline) {
      return;
    }
    if (this.realOpenState) {
      this.overlayOpen = false;
      this.nzOnOpenChange.emit(false);
    }
  }

  showClear(): boolean {
    return (
      !this.nzDisabled &&
      !this.isEmptyValue(this.datePickerService.value) &&
      this.nzAllowClear
    );
  }

  checkInputValue(partType: RangePartType) {
    let inputValue =
      this.inputValue[this.datePickerService.getActiveIndex(partType)];
    const isValid =
      !!inputValue &&
      isAllowedDate(this.checkValidDate(inputValue), this.nzDisabledDate);
    if (isValid) return;
    //Reset input value back to previous valid value
    this.updateInputValue();
  }

  checkAndClose(): void {
    //Enable input for inline
    if (!this.realOpenState && !this.nzInline) {
      return;
    }
    if (this.panel.isAllowed(this.datePickerService.value!, true)) {
      if (
        Array.isArray(this.datePickerService.value) &&
        wrongSortOrder(this.datePickerService.value)
      ) {
        const index = this.datePickerService.getActiveIndex();
        const value = this.datePickerService.value[index];
        this.panel.changeValueFromSelect(value!, true);
        return;
      }
      this.updateInputValue();
      this.datePickerService.emitValue$.next();
    } else {
      this.datePickerService.setValue(this.datePickerService.initialValue!);
      this.close();
    }
  }

  onClickInputBox(event: MouseEvent, partType?: RangePartType): void {
    const target = event.target as HTMLInputElement;
    target.focus();
    event.stopPropagation();
    this.datePickerService.inputPartChange$.next(partType);
    this.focus();
    if (!this.isOpenHandledByUser()) {
      this.open();
    }
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.keyCode === ESCAPE) {
      this.datePickerService.initValue();
    }
  }

  // NOTE: A issue here, the first time position change, the animation will not be triggered.
  // Because the overlay's "positionChange" event is emitted after the content's full shown up.
  // All other components like "nz-dropdown" which depends on overlay also has the same issue.
  // See: https://github.com/NG-ZORRO/ng-zorro-antd/issues/1429
  onPositionChange(position: ConnectedOverlayPositionChange): void {
    this.currentPositionX = position.connectionPair.originX;
    this.currentPositionY = position.connectionPair.originY;
    this.cdr.markForCheck(); // Take side-effects to position styles
  }

  onClickClear(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.datePickerService.initValue(true);
    this.datePickerService.emitValue$.next();
  }

  updateInputValue(): void {
    const newValue = this.datePickerService.value;
    if (this.isRange) {
      this.inputValue = newValue
        ? (newValue as CandyDate[]).map((v) => this.formatValue(v))
        : ['', ''];
      this.validateAllInputPart();
    } else {
      this.inputValue = this.formatValue(newValue as CandyDate);
    }
    this.cdr.markForCheck();
  }

  formatValue(value: CandyDate): string {
    return this.dateHelper.format(
      value && (value as CandyDate).nativeDate,
      this.nzFormat
    );
  }

  onInputChange(
    value: string,
    isEnter: boolean = false,
    partType = null
  ): void {
    /**
     * in IE11 focus/blur will trigger ngModelChange if placeholder changes,
     * so we forbidden IE11 to open panel through input change
     */
    //onlyLeft and nzInline for custom date range popup
    if (
      !this.platform.TRIDENT &&
      this.document.activeElement ===
        this.getInput(this.datePickerService.activeInput) &&
      !this.realOpenState &&
      !this.onlyLeft &&
      !this.nzInline
    ) {
      this.open();
      return;
    }

    const date = this.checkValidDate(value);
    this.errorInputs[this.datePickerService.getActiveIndex(partType)] = !(
      !!date && isAllowedDate(date, this.nzDisabledDate)
    );
    if (this.inputValue?.every((value) => !!!value)) {
      this.datePickerService.setValue([null, null]);
    }

    // Identify the value changes when manually changing input.
    if (!this.nzInline) {
      this.nzOnCalendarChange.emit(this.inputValue);
    }

    // Can only change date when it's open
    // Customize range input
    if (
      (date && this.realOpenState) ||
      (date && this.nzInline && this.isRange)
    ) {
      this.errorInputs[this.datePickerService.getActiveIndex(partType)] = false;
      this.panel.changeValueFromSelect(date, isEnter);
    }
  }

  onKeyupEnter(event: Event): void {
    this.onInputChange((event.target as HTMLInputElement).value, true);
  }

  private checkValidDate(value: string): CandyDate | null {
    // const date = new CandyDate(this.dateHelper.parseDate(value, this.nzFormat));
    //Temporary fix for custom format of input
    const date = new CandyDate(parse(value, this.nzFormat, 0));

    if (!date.isValid() || value !== format(date.nativeDate, this.nzFormat)) {
      return null;
    }

    if (!isAllowedDate(date, this.nzDisabledDate)) return null;

    return date;
  }

  getPlaceholder(partType?: RangePartType): string {
    return this.isRange
      ? this.nzPlaceHolder[this.datePickerService.getActiveIndex(partType!)]
      : (this.nzPlaceHolder as string);
  }

  isEmptyValue(value: CompatibleValue): boolean {
    if (value === null) {
      return true;
    } else if (this.isRange) {
      return !value || !Array.isArray(value) || value.every((val) => !val);
    } else {
      return !value;
    }
  }

  // Whether open state is permanently controlled by user himself
  isOpenHandledByUser(): boolean {
    return this.nzOpen !== undefined;
  }

  // ------------------------------------------------------------------------
  // Input API End
  // ------------------------------------------------------------------------

  constructor(
    public nzConfigService: NzConfigService,
    public datePickerService: DatePickerService,
    protected i18n: NzI18nService,
    protected cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private dateHelper: DateHelperService,
    private nzResizeObserver: NzResizeObserver,
    private platform: Platform,
    private location: Location,
    private ngZone: NgZone,
    @Inject(TRUDI_DATE_FORMAT) private trudiDateFormat: TrudiDateFormat,
    private host: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) doc: NzSafeAny,
    @Optional() private directionality: Directionality,
    @Host() @Optional() public noAnimation?: NzNoAnimationDirective,
    @Optional() private nzFormStatusService?: NzFormStatusService,
    @Optional() private nzFormNoStatusService?: NzFormNoStatusService
  ) {
    this.document = doc;
    // this.origin = new CdkOverlayOrigin(this.elementRef);
    this.datePickerService.onlyLeft = true;
  }

  ngOnInit(): void {
    if (!this.nzInline) {
      this.ngZone.runOutsideAngular(() => {
        fromEvent(this.host.nativeElement, 'mousedown')
          .pipe(takeUntil(this.destroyed$))
          .subscribe((event) => {
            const target = event.target as HTMLElement;
            if (target?.tagName?.toLocaleLowerCase() !== 'input')
              event.preventDefault();
          });
      });
    }

    this.subscription.add(
      this.location.subscribe(() => {
        this.cdkConnectedOverlay?.overlayRef?.detach();
        this.overlayOpen = false;
        this.nzOnCancel.emit(true);
      })
    );
    this.nzFormStatusService?.formStatusChanges
      .pipe(
        distinctUntilChanged((pre, cur) => {
          return (
            pre.status === cur.status && pre.hasFeedback === cur.hasFeedback
          );
        }),
        withLatestFrom(
          this.nzFormNoStatusService
            ? this.nzFormNoStatusService.noFormStatus
            : observableOf(false)
        ),
        map(([{ status, hasFeedback }, noStatus]) => ({
          status: noStatus ? '' : status,
          hasFeedback
        })),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ status, hasFeedback }) => {
        this.setStatusStyles(status, hasFeedback);
      });

    // Subscribe the every locale change if the nzLocale is not handled by user
    if (!this.nzLocale) {
      this.i18n.localeChange
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => this.setLocale());
    }

    // Default value
    this.datePickerService.isRange = this.isRange;
    this.datePickerService.initValue(true);
    this.datePickerService.emitValue$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((_) => {
        this.isApply = false;
        const value = this.datePickerService.value;
        this.datePickerService.initialValue = cloneDate(value);
        if (this.isRange) {
          const vAsRange = value as CandyDate[];
          if (vAsRange.length) {
            this.onChangeFn([
              vAsRange[0]?.nativeDate ?? null,
              vAsRange[1]?.nativeDate ?? null
            ]);
          } else {
            this.onChangeFn([]);
          }
        } else {
          if (value) {
            this.onChangeFn((value as CandyDate).nativeDate);
          } else {
            this.onChangeFn(null);
          }
        }
        this.onTouchedFn();
        // When value emitted, overlay will be closed
        this.close();
      });

    this.directionality.change
      ?.pipe(takeUntil(this.destroyed$))
      .subscribe((direction: Direction) => {
        this.dir = direction;
        this.cdr.markForCheck();
      });
    this.dir = this.directionality.value;
    this.inputValue = this.isRange ? ['', ''] : '';
    this.setModeAndFormat();

    this.datePickerService.valueChange$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.updateInputValue();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzStatus, nzPlacement } = changes;
    if (changes['nzPopupStyle']) {
      // Always assign the popup style patch
      this.nzPopupStyle = this.nzPopupStyle
        ? { ...this.nzPopupStyle, ...POPUP_STYLE_PATCH }
        : POPUP_STYLE_PATCH;
    }

    // Mark as customized placeholder by user once nzPlaceHolder assigned at the first time
    if (changes['nzPlaceHolder']?.currentValue) {
      this.isCustomPlaceHolder = true;
    }

    if (changes['nzFormat']?.currentValue) {
      this.isCustomFormat = true;
      this.updateInputValue();
    }

    if (changes['nzLocale']) {
      // The nzLocale is currently handled by user
      this.setDefaultPlaceHolder();
    }

    if (changes['nzRenderExtraFooter']) {
      this.extraFooterProp = valueFunctionProp(this.nzRenderExtraFooter!);
    }

    if (changes['nzMode']) {
      this.setDefaultPlaceHolder();
      this.setModeAndFormat();
    }

    if (changes['onlyLeft']) {
      this.cdr.markForCheck();
    }

    if (changes['nzOpen']) {
      if (this.nzOpen) {
        this.datePickerService.inputPartChange$.next('left');
      }
    }

    if (nzStatus) {
      this.setStatusStyles(this.nzStatus, this.hasFeedback);
    }

    if (nzPlacement) {
      this.setPlacement(this.nzPlacement);
    }
  }

  ngOnDestroy(): void {
    if (this.timeOutId) clearTimeout(this.timeOutId);
    this.subscription.unsubscribe();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  setModeAndFormat(): void {
    const inputFormats: { [key in NzDateMode]?: string } = {
      year: 'yyyy',
      month: 'yyyy-MM',
      week: this.i18n.getDateLocale() ? 'RRRR-II' : 'yyyy-ww', // Format for week
      date: this.nzShowTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'
    };

    if (!this.nzMode) {
      this.nzMode = 'date';
    }

    this.panelMode = this.isRange ? [this.nzMode, this.nzMode] : this.nzMode;

    // Default format when it's empty
    if (!this.isCustomFormat) {
      this.nzFormat = inputFormats[this.nzMode as NzDateMode]!;
    }

    this.inputSize = Math.max(10, this.nzFormat.length) + 2;
    this.updateInputValue();
  }

  /**
   * Triggered when overlayOpen changes (different with realOpenState)
   *
   * @param open The overlayOpen in picker component
   */
  onOpenChange(open: boolean): void {
    this.nzOnOpenChange.emit(open);
  }

  // ------------------------------------------------------------------------
  // | Control value accessor implements
  // ------------------------------------------------------------------------

  // NOTE: onChangeFn/onTouchedFn will not be assigned if user not use as ngModel
  onChangeFn: OnChangeType = () => void 0;
  onTouchedFn: OnTouchedType = () => void 0;

  writeValue(value: CompatibleDate): void {
    this.setValue(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.nzDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  // ------------------------------------------------------------------------
  // | Internal methods
  // ------------------------------------------------------------------------

  // Reload locale from i18n with side effects
  private setLocale(): void {
    this.nzLocale = this.i18n.getLocaleData('DatePicker', {});
    this.setDefaultPlaceHolder();
    this.cdr.markForCheck();
  }

  private setDefaultPlaceHolder(): void {
    if (!this.isCustomPlaceHolder && this.nzLocale) {
      const defaultPlaceholder: { [key in NzDateMode]?: string } = {
        year: this.getPropertyOfLocale('yearPlaceholder'),
        month: this.getPropertyOfLocale('monthPlaceholder'),
        week: this.getPropertyOfLocale('weekPlaceholder'),
        date: this.getPropertyOfLocale('placeholder')
      };

      const defaultRangePlaceholder: { [key in NzDateMode]?: string[] } = {
        year: this.getPropertyOfLocale('rangeYearPlaceholder'),
        month: this.getPropertyOfLocale('rangeMonthPlaceholder'),
        week: this.getPropertyOfLocale('rangeWeekPlaceholder'),
        date: this.getPropertyOfLocale('rangePlaceholder')
      };

      this.nzPlaceHolder = this.isRange
        ? defaultRangePlaceholder[this.nzMode as NzDateMode]!
        : defaultPlaceholder[this.nzMode as NzDateMode]!;
    }
  }

  private getPropertyOfLocale<T extends keyof NzDatePickerLangI18nInterface>(
    type: T
  ): NzDatePickerLangI18nInterface[T] {
    return (
      this.nzLocale.lang[type] ||
      this.i18n.getLocaleData(`DatePicker.lang.${type}`)
    );
  }

  // Safe way of setting value with default
  private setValue(value: CompatibleDate): void {
    let newValue: CompatibleValue = this.datePickerService.makeValue(value);
    if (
      !this.nzInline &&
      Array.isArray(value) &&
      value.every((item) => item === null)
    ) {
      newValue = [null, null];
    }
    this.datePickerService.setValue(newValue);
    this.datePickerService.initialValue = newValue;
  }

  renderClass(value: boolean): void {
    // TODO: avoid autoFocus cause change after checked error
    if (value) {
      this.renderer.addClass(
        this.elementRef.nativeElement,
        'ant-picker-focused'
      );
    } else {
      this.renderer.removeClass(
        this.elementRef.nativeElement,
        'ant-picker-focused'
      );
    }
  }

  onPanelModeChange(panelMode: NzDateMode | NzDateMode[]): void {
    this.nzOnPanelChange.emit(panelMode);
  }

  // Emit nzOnCalendarChange when select date by nz-range-picker
  onCalendarChange(value: CompatibleValue): void {
    if (this.isRange && Array.isArray(value)) {
      this.isApply = false;
      const rangeValue = value
        .filter((x) => x instanceof CandyDate)
        .map((x) => x!.nativeDate);
      this.nzOnCalendarChange.emit(rangeValue);
    }
  }

  onResultOk(): void {
    if (this.isRange) {
      const value = this.datePickerService.value as CandyDate[];
      if (value.length) {
        const dateValue1 = this.trudiDateFormat.expectedTimezoneDate(
          value[0]?.nativeDate
        );
        const dateValue2 = this.trudiDateFormat.expectedTimezoneDate(
          value[1]?.nativeDate
        );
        this.nzOnOk.emit([dateValue1, dateValue2]);
      } else {
        this.nzOnOk.emit([]);
      }
      // handle close dropdown when apply value
      if (!this.nzInline) {
        this.blur();
      }
    } else {
      if (this.datePickerService.value) {
        const dateValue = this.trudiDateFormat.expectedTimezoneDate(
          (this.datePickerService.value as CandyDate).nativeDate
        );
        this.nzOnOk.emit(dateValue);
      } else {
        this.nzOnOk.emit(null);
      }
    }
  }

  // status
  private setStatusStyles(
    status: NzValidateStatus,
    hasFeedback: boolean
  ): void {
    // set inner status
    this.status = status;
    this.hasFeedback = hasFeedback;
    this.cdr.markForCheck();
    // render status if nzStatus is set
    this.statusCls = getStatusClassNames(this.prefixCls, status, hasFeedback);
    Object.keys(this.statusCls).forEach((status) => {
      if (this.statusCls[status]) {
        this.renderer.addClass(this.elementRef.nativeElement, status);
      } else {
        this.renderer.removeClass(this.elementRef.nativeElement, status);
      }
    });
  }

  private setPlacement(placement: NzPlacement): void {
    const position: ConnectionPositionPair =
      DATE_PICKER_POSITION_MAP[placement];
    this.overlayPositions = [position, ...DEFAULT_DATE_PICKER_POSITIONS];
    this.currentPositionX = position.originX;
    this.currentPositionY = position.originY;
  }

  //footer function
  handleCancel() {
    this.nzOnCancel.emit(true);
    if (!this.nzInline) {
      this.nzOpen = false;
      this.blur();
    }
  }

  handleApply() {
    this.isApply = true;
    const errorInputPart = this.getErrorInput();
    if (!this.nzInline) {
      if (!this.errorInputs[0] && !this.errorInputs[1]) {
        this.errorInputs.fill(false);
        if (wrongSortOrder(this.datePickerService.value as CandyDate[])) {
          this.errorInputs.fill(true);
          this.datePickerService.activeInput = 'left';
          this.focus();
          return;
        } else {
          this.onResultOk();
        }
      } else {
        this.errorInputs[
          this.datePickerService.getActiveIndex(errorInputPart)
        ] = true;
        this.datePickerService.activeInput = errorInputPart;
        this.focus();
      }
    } else {
      if (errorInputPart === 'left' || errorInputPart === 'right') {
        this.errorInputs[
          this.datePickerService.getActiveIndex(errorInputPart)
        ] = true;
        this.datePickerService.activeInput = errorInputPart;
        this.focus();
      } else {
        this.errorInputs.fill(false);
        if (wrongSortOrder(this.datePickerService.value as CandyDate[])) {
          this.errorInputs.fill(true);
          this.datePickerService.activeInput = 'left';
          this.focus();
          return;
        } else {
          this.onResultOk();
        }
      }
    }
  }

  getErrorInput() {
    const index = this.inputValue?.findIndex(
      (value) => !this.validateInputValue(value)
    );
    if (index === -1) return null;
    return index === 0 ? 'left' : 'right';
  }

  validateAllInputPart() {
    this.errorInputs = this.inputValue?.map(
      (value) => !this.validateInputValue(value)
    );
    if (!this.nzInline && this.errorInputs[0] && this.errorInputs[1]) {
      this.errorInputs = [false, false];
    }
    return this.errorInputs;
  }

  validateInputValue(value: string) {
    return (
      !!value &&
      !!this.checkValidDate(value) &&
      isAllowedDate(this.checkValidDate(value), this.nzDisabledDate)
    );
  }

  isInputError(partType: RangePartType) {
    return this.errorInputs[this.datePickerService.getActiveIndex(partType)];
  }

  blur() {
    this.rangePickerInputs.first?.nativeElement.blur();
    this.rangePickerInputs.last?.nativeElement.blur();
  }
}
