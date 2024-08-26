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
import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Host,
  HostListener,
  Inject,
  Input,
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
  ViewEncapsulation,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BehaviorSubject,
  Subject,
  firstValueFrom,
  of as observableOf,
  switchMap
} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';

import { slideMotion } from '@core';
import { TrudiConfigKey, TrudiConfigService, WithConfig } from '@core';
import { TrudiFormNoStatusService } from '@core';
import { TrudiFormStatusService } from '@core';
import { TrudiNoAnimationDirective } from '@core';
import { DATE_PICKER_POSITION_MAP, DEFAULT_DATE_PICKER_POSITIONS } from '@core';
import {
  CandyDate,
  CompatibleValue,
  cloneDate,
  wrongSortOrder
} from '@trudi-ui';
import {
  BooleanInput,
  FunctionProp,
  NgClassInterface,
  OnChangeType,
  OnTouchedType,
  TrudiSafeAny,
  TrudiStatus,
  TrudiValidateStatus
} from '@core';
import { InputBoolean, getStatusClassNames, valueFunctionProp } from '@core';
import {
  DateHelperService,
  TrudiDatePickerI18nInterface,
  TrudiDatePickerLangI18nInterface,
  TrudiI18nService
} from '@/app/i18n';

import { convertUTCToLocalDateTime } from '@core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CalendarService } from '@services/calendar.service';
import { ERepeatType } from '@shared/enum/calendar.enum';
import { DatePickerService } from './date-picker.service';
import { DateRangePopupComponent } from './date-range-popup.component';
import {
  CompatibleDate,
  DisabledTimeFn,
  PresetRanges,
  RangePartType,
  TrudiDateMode
} from './standard-types';
import { PREFIX_CLASS } from './util';

const POPUP_STYLE_PATCH = { position: 'relative' }; // Aim to override antd's style to support overlay's position strategy (position:absolute will cause it not working because the overlay can't get the height/width of it's content)
const TRUDI_CONFIG_MODULE_NAME: TrudiConfigKey = 'datePicker';

export type TrudiDatePickerSizeType = 'large' | 'default' | 'small';
export type TrudiPlacement =
  | 'bottomLeft'
  | 'bottomRight'
  | 'topLeft'
  | 'topRight';

/**
 * The base picker for all common APIs
 */

//using trudiOnOk => emit correct ISO date time
//using formControl => emit correct date time with local timezone

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'trudi-date-picker',
  exportAs: 'trudiDatePicker',
  template: `
    <ng-container *ngIf="!trudiInline; else inlineMode">
      <!-- Content of single picker -->
      <div *ngIf="true" class="{{ prefixCls }}-input">
        <input
          #pickerInput
          [attr.id]="trudiId"
          [class.trudi-input-disabled]="trudiDisabled"
          [disabled]="trudiDisabled"
          [(ngModel)]="inputValue"
          [placeholder]="placeHolder$ | async"
          [size]="inputSize"
          autocomplete="off"
          (focus)="onFocus($event)"
          (focusout)="onFocusout($event)"
          (ngModelChange)="onInputChange($event)"
          (keyup.enter)="onKeyupEnter($event)"
          readOnly />
        <ng-container *ngTemplateOutlet="tplRightRest"></ng-container>
      </div>
    </ng-container>

    <!-- Right operator icons -->
    <ng-template #tplRightRest>
      <div class="{{ prefixCls }}-active-bar" [ngStyle]="activeBarStyle"></div>
      <span
        *ngIf="showClear()"
        class="{{ prefixCls }}-clear"
        (click)="onClickClear($event)">
        <!-- <span trudi-icon trudiType="close-circle" trudiTheme="fill"></span> -->
        <span class="trudi-picker-icon">
          <trudi-icon icon="smallCloseBlack2"></trudi-icon>
        </span>
      </span>
      <span class="{{ prefixCls }}-suffix">
        <ng-container
          *trudiStringTemplateOutlet="trudiSuffixIcon; let suffixIcon">
          <trudi-icon
            [icon]="
              isCalendarFocus ? 'calendar2' : 'calendarDeactive'
            "></trudi-icon>
        </ng-container>
        <trudi-form-item-feedback-icon
          *ngIf="hasFeedback && !!status"
          [status]="status"></trudi-form-item-feedback-icon>
      </span>
    </ng-template>

    <ng-template #inlineMode>
      <div
        class="{{ prefixCls }}-dropdown {{ trudiDropdownClassName }}"
        [class.trudi-picker-dropdown-rtl]="dir === 'rtl'"
        [class.trudi-picker-dropdown-placement-bottomLeft]="
          currentPositionY === 'bottom' && currentPositionX === 'start'
        "
        [class.trudi-picker-dropdown-placement-topLeft]="
          currentPositionY === 'top' && currentPositionX === 'start'
        "
        [class.trudi-picker-dropdown-placement-bottomRight]="
          currentPositionY === 'bottom' && currentPositionX === 'end'
        "
        [class.trudi-picker-dropdown-placement-topRight]="
          currentPositionY === 'top' && currentPositionX === 'end'
        "
        [class.trudi-picker-active-left]="
          datePickerService.activeInput === 'left'
        "
        [class.trudi-picker-active-right]="
          datePickerService.activeInput === 'right'
        "
        [ngStyle]="trudiPopupStyle">
        <date-range-popup
          [inline]="trudiInline"
          [defaultPickerValue]="trudiDefaultPickerValue"
          [showWeek]="trudiShowWeekNumber || trudiMode === 'week'"
          [panelMode]="panelMode"
          (panelModeChange)="onPanelModeChange($event)"
          [locale]="trudiLocale?.lang!"
          [showToday]="trudiMode === 'date' && trudiShowToday"
          [showNow]="trudiMode === 'date' && trudiShowNow"
          [dateRender]="trudiDateRender"
          [disabledDate]="trudiDisabledDate"
          [disabledTime]="trudiDisabledTime"
          [extraFooter]="extraFooter"
          [dir]="dir"
          [showDayOff]="showDayOff"
          (resultOk)="onResultOk()"></date-range-popup>
      </div>
    </ng-template>

    <!-- Overlay -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayHasBackdrop]="trudiBackdrop"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="realOpenState"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayTransformOriginOn]="'.trudi-picker-wrapper'"
      (positionChange)="onPositionChange($event)"
      (detach)="close()"
      (overlayKeydown)="onOverlayKeydown($event)">
      <div
        class="trudi-picker-wrapper"
        [trudiNoAnimation]="!!noAnimation?.trudiNoAnimation"
        [@slideMotion]="'enter'"
        style="position: relative;">
        <div style="opacity: 0; height: 7px"></div>
        <ng-container *ngTemplateOutlet="inlineMode"></ng-container>
      </div>
    </ng-template>
  `,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[class.trudi-picker]': `true`,
    '[class.trudi-picker-large]': `trudiSize === 'large'`,
    '[class.trudi-picker-small]': `trudiSize === 'small'`,
    '[class.trudi-picker-disabled]': `trudiDisabled`,
    '[class.trudi-picker-rtl]': `dir === 'rtl'`,
    '[class.trudi-picker-borderless]': `trudiBorderless`,
    '[class.trudi-picker-inline]': `trudiInline`
    // '(click)': 'onClickInputBox($event)'
  },
  providers: [
    DatePickerService,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TrudiDatePickerComponent)
    }
  ],
  animations: [slideMotion],
  styleUrls: ['style/style.scss']
})
export class TrudiDatePickerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, ControlValueAccessor
{
  readonly _trudiModuleName: TrudiConfigKey = TRUDI_CONFIG_MODULE_NAME;
  static ngAcceptInputType_trudiAllowClear: BooleanInput;
  static ngAcceptInputType_trudiAutoFocus: BooleanInput;
  static ngAcceptInputType_trudiDisabled: BooleanInput;
  static ngAcceptInputType_trudiBorderless: BooleanInput;
  static ngAcceptInputType_trudiInputReadOnly: BooleanInput;
  static ngAcceptInputType_trudiInline: BooleanInput;
  static ngAcceptInputType_trudiOpen: BooleanInput;
  static ngAcceptInputType_trudiShowToday: BooleanInput;
  static ngAcceptInputType_trudiShowNow: BooleanInput;
  static ngAcceptInputType_trudiMode:
    | TrudiDateMode
    | TrudiDateMode[]
    | string
    | string[]
    | null
    | undefined;

  extraFooter?: TemplateRef<TrudiSafeAny> | string;
  dir: Direction = 'ltr';

  // status
  statusCls: NgClassInterface = {};
  status: TrudiValidateStatus = '';
  hasFeedback: boolean = false;

  public panelMode: TrudiDateMode | TrudiDateMode[] = 'date';
  private destroyed$: Subject<void> = new Subject();
  private isCustomPlaceHolder: boolean = false;
  private isCustomFormat: boolean = false;
  private isTrudiDisableFirstChange: boolean = true;
  private invalidInput: string = null;
  private isCalendarFocus: boolean = false;
  // --- Common API
  @Input() @InputBoolean() trudiAllowClear: boolean = true;
  @Input() @InputBoolean() trudiAutoFocus: boolean = false;
  @Input() @InputBoolean() trudiDisabled: boolean = false;
  @Input() @InputBoolean() trudiBorderless: boolean = false;
  @Input() @InputBoolean() trudiInputReadOnly: boolean = false;
  @Input() @InputBoolean() trudiInline: boolean = false;
  @Input() @InputBoolean() trudiOpen?: boolean;
  @Input() trudiDisabledDate?: (d: Date) => boolean;
  @Input() trudiLocale!: TrudiDatePickerI18nInterface;
  @Input() showDayOff: boolean = true;

  private _placeholderSource$ = new BehaviorSubject<string | string[]>(null);
  public placeHolder$ = this._placeholderSource$.asObservable().pipe(
    switchMap((dateFormat: string) => {
      return this.agencyDateFormatService.dateFormatPipe$.pipe(
        map((defaultDateFormat) =>
          (dateFormat || defaultDateFormat).toLowerCase()
        )
      );
    })
  );
  @Input() set trudiPlaceHolder(value: string | string[]) {
    this._placeholderSource$.next(value);
    if (value) {
      this.isCustomPlaceHolder = true;
    }
  }

  private _trudiFormatSource$ = new BehaviorSubject<string>(null);
  public format$ = this._trudiFormatSource$.asObservable().pipe(
    switchMap((dateFormat: string) => {
      return this.agencyDateFormatService.dateFormatPipe$.pipe(
        map((defaultDateFormat) => dateFormat || defaultDateFormat)
      );
    })
  );

  public timezone$ = this.agencyDateFormatService.timezone$;

  @Input() set trudiFormat(value: string) {
    this._trudiFormatSource$.next(value);
    if (value) {
      this.isCustomFormat = true;
    }
  }

  @Input() trudiPopupStyle: object = POPUP_STYLE_PATCH;
  @Input() trudiDropdownClassName?: string;
  @Input() trudiSize: TrudiDatePickerSizeType = 'default';
  @Input() trudiStatus: TrudiStatus = '';
  @Input() trudiDateRender?:
    | TemplateRef<TrudiSafeAny>
    | string
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() trudiDisabledTime?: DisabledTimeFn;
  @Input() trudiRenderExtraFooter?:
    | TemplateRef<TrudiSafeAny>
    | string
    | FunctionProp<TemplateRef<TrudiSafeAny> | string>;
  @Input() @InputBoolean() trudiShowToday: boolean = true;
  @Input() trudiMode: TrudiDateMode = 'date';
  @Input() @InputBoolean() trudiShowNow: boolean = true;
  @Input() trudiRanges?: PresetRanges;
  @Input() trudiDefaultPickerValue: CompatibleDate | null = null;
  @Input() @WithConfig() trudiSeparator?: string | TemplateRef<TrudiSafeAny> =
    undefined;
  @Input() @WithConfig() trudiSuffixIcon: string | TemplateRef<TrudiSafeAny> =
    'calendar';
  @Input() @WithConfig() trudiBackdrop = false;
  @Input() trudiId: string | null = null;
  @Input() trudiPlacement: TrudiPlacement = 'bottomLeft';
  @Input() @InputBoolean() trudiShowWeekNumber: boolean = false;
  @Input() dueDate: string;
  @Input() defaultValue: Date | string;
  @Input() dueDateTooltipText: string;
  @Input() breakNochange: boolean = false;

  // TODO(@wenqi73) The PanelMode need named for each pickers and export
  @Output() readonly trudiOnPanelChange = new EventEmitter<
    TrudiDateMode | TrudiDateMode[] | string | string[]
  >();
  @Output() readonly trudiOnCalendarChange = new EventEmitter<
    Array<Date | null>
  >();
  @Output() readonly trudiOnOk = new EventEmitter<
    CompatibleDate | null | any
  >();
  @Output() readonly trudiOnOpenChange = new EventEmitter<boolean>();
  @Output() readonly trudiOnClearDate = new EventEmitter<void>();

  // ------------------------------------------------------------------------
  // Input API Start
  // ------------------------------------------------------------------------
  @ViewChild(CdkConnectedOverlay, { static: false })
  cdkConnectedOverlay?: CdkConnectedOverlay;
  @ViewChild(DateRangePopupComponent, { static: false })
  panel!: DateRangePopupComponent;
  @ViewChild('separatorElement', { static: false })
  separatorElement?: ElementRef;
  @ViewChild('pickerInput', { static: false })
  pickerInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('rangePickerInput') rangePickerInputs?: QueryList<
    ElementRef<HTMLInputElement>
  >;

  origin: CdkOverlayOrigin;
  document: Document;
  inputSize: number = 12;
  inputWidth?: number;
  prefixCls = PREFIX_CLASS;
  inputValue!: TrudiSafeAny;
  activeBarStyle: object = {};
  overlayOpen: boolean = false; // Available when "trudiOpen" = undefined
  overlayPositions: ConnectionPositionPair[] = [
    ...DEFAULT_DATE_PICKER_POSITIONS
  ];
  currentPositionX: HorizontalConnectionPos = 'start';
  currentPositionY: VerticalConnectionPos = 'bottom';

  get realOpenState(): boolean {
    // The value that really decide the open state of overlay
    return this.isOpenHandledByUser() ? !!this.trudiOpen : this.overlayOpen;
  }

  ngAfterViewInit(): void {
    if (this.trudiAutoFocus) {
      this.focus();
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

    this.elementRef.nativeElement.addEventListener(
      'mousedown',
      this.onMouseDown
    );
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
    if (this.trudiInline) {
      return undefined;
    }
    return undefined;
  }

  focus(): void {
    const activeInputElement = this.getInput(
      this.datePickerService.activeInput
    );
    if (this.document.activeElement !== activeInputElement) {
      activeInputElement?.focus();
    }
  }

  onMouseDown(event: Event): void {
    if ((event.target as HTMLInputElement).tagName.toLowerCase() !== 'input') {
      event.preventDefault();
    }
  }

  onFocus(event: FocusEvent, partType?: RangePartType): void {
    event.preventDefault();
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

  // Show overlay content
  open(): void {
    if (this.trudiInline) {
      return;
    }
    if (!this.realOpenState && !this.trudiDisabled) {
      this.updateInputWidthAndArrowLeft();
      this.overlayOpen = true;
      this.trudiOnOpenChange.emit(true);
      this.focus();
      this.cdr.markForCheck();
    }
  }

  close(): void {
    if (this.trudiInline) {
      return;
    }
    if (this.realOpenState) {
      this.onResultOk();
      this.overlayOpen = false;
      this.trudiOnOpenChange.emit(false);
    }
    // const event = new Event('focusout');
    // this.pickerInput.nativeElement.dispatchEvent(event);
  }

  showClear(): boolean {
    return (
      !this.trudiDisabled &&
      !this.isEmptyValue(this.datePickerService.value) &&
      this.trudiAllowClear
    );
  }

  checkAndClose(): void {
    if (!this.realOpenState) {
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
      if (!this.breakNochange) {
        this.datePickerService.emitValue$.next();
      }
    } else {
      this.datePickerService.setValue(this.datePickerService.initialValue!);
    }
    this.close();
  }

  onClickInputBox(event: MouseEvent): void {
    event.stopPropagation();
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
  // All other components like "trudi-dropdown" which depends on overlay also has the same issue.
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
    this.trudiOnClearDate.emit();
  }

  async updateInputValue() {
    const newValue = this.datePickerService.value;
    this.inputValue = await this.formatValue(newValue as CandyDate);
    this.cdr.markForCheck();
  }

  async formatValue(value: CandyDate): Promise<string> {
    const format = await firstValueFrom(this.format$);
    return this.dateHelper.format(
      value && (value as CandyDate).nativeDate,
      format
    );
  }

  async onInputChange(value: string, isEnter: boolean = false): Promise<void> {
    this.open();
    // if (
    //   !this.platform.TRIDENT &&
    //   this.document.activeElement === this.getInput(this.datePickerService.activeInput) &&
    //   !this.realOpenState
    // ) {
    //   this.open();
    //   return;
    // }
    const date = await this.checkValidDate(value);
    if (date && this.realOpenState) {
      this.panel.changeValueFromSelect(await date, isEnter);
      this.invalidInput = null;
    } else {
      this.invalidInput = value;
    }
  }

  onKeyupEnter(event: Event): void {
    this.onInputChange((event.target as HTMLInputElement).value, true);
  }

  private async checkValidDate(value: string): Promise<CandyDate | null> {
    const format = await firstValueFrom(this.format$);
    const date = new CandyDate(this.dateHelper.parseDate(value, format));
    if (
      !date.isValid() ||
      value.trim() !== this.dateHelper.format(date.nativeDate, format).trim()
    ) {
      return null;
    }
    return date;
  }

  isEmptyValue(value: CompatibleValue): boolean {
    if (value === null) {
      return true;
    }
    return !value;
  }

  // Whether open state is permanently controlled by user himself
  isOpenHandledByUser(): boolean {
    return this.trudiOpen !== undefined;
  }

  // ------------------------------------------------------------------------
  // Input API End
  // ------------------------------------------------------------------------

  constructor(
    public trudiConfigService: TrudiConfigService,
    public datePickerService: DatePickerService,
    protected i18n: TrudiI18nService,
    protected cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private dateHelper: DateHelperService,
    private calendarService: CalendarService,
    // private trudiResizeObserver: TrudiResizeObserver,
    private platform: Platform,
    private agencyDateFormatService: AgencyDateFormatService,
    @Inject(DOCUMENT) doc: TrudiSafeAny,
    @Optional() private directionality: Directionality,
    @Host() @Optional() public noAnimation?: TrudiNoAnimationDirective,
    @Optional() private trudiFormStatusService?: TrudiFormStatusService,
    @Optional() private trudiFormNoStatusService?: TrudiFormNoStatusService
  ) {
    this.document = doc;
    this.origin = new CdkOverlayOrigin(this.elementRef);
  }

  async ngOnInit() {
    this.trudiFormStatusService?.formStatusChanges
      .pipe(
        distinctUntilChanged((pre, cur) => {
          return (
            pre.status === cur.status && pre.hasFeedback === cur.hasFeedback
          );
        }),
        withLatestFrom(
          this.trudiFormNoStatusService
            ? this.trudiFormNoStatusService.noFormStatus
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

    // Subscribe the every locale change if the trudiLocale is not handled by user
    if (!this.trudiLocale) {
      this.i18n.localeChange
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => this.setLocale());
    }

    // Default value
    this.datePickerService.initValue(true);
    this.datePickerService.emitValue$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        const value = this.datePickerService.value;
        this.datePickerService.initialValue = cloneDate(value);
        if (value) {
          this.onChangeFn((value as CandyDate).nativeDate);
        } else {
          this.onChangeFn(null);
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
    this.inputValue = '';
    this.setModeAndFormat();

    this.datePickerService.valueChange$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.updateInputValue();
      });

    //get holidays list
    this.calendarService.holidaysList$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((val) => {
        const holidays = val.reduce((obj, item) => {
          const dateHoliday = new CandyDate(item.date);
          const day = dateHoliday.getDate();
          const month = dateHoliday.getMonth() + 1;
          const year = dateHoliday.getYear();
          const monthString = month < 10 ? `0${month}` : `${month}`;
          if (item.isActive) {
            switch (item.typeRepeat) {
              case ERepeatType.ONCE:
                obj[`${year}-${monthString}-${day}`] = {
                  isDayOff: true
                };
                break;
              case ERepeatType.MONTHLY:
                const monthlyKey = `${day}-${ERepeatType.MONTHLY}`;
                if (obj[monthlyKey] === undefined) {
                  obj[monthlyKey] = {
                    isDayOff: true,
                    date: item.date
                  };
                } else {
                  obj[monthlyKey] = {
                    isDayOff: true,
                    date:
                      item.date.localeCompare(obj[monthlyKey].date) < 0
                        ? item.date
                        : obj[monthlyKey].date
                  };
                }
                break;
              case ERepeatType.ANNUALLY:
                const annuallyKey = `${day}-${monthString}-${ERepeatType.ANNUALLY}`;
                if (obj[annuallyKey] === undefined) {
                  obj[annuallyKey] = {
                    isDayOff: true,
                    date: item.date
                  };
                } else {
                  obj[annuallyKey] = {
                    isDayOff: true,
                    date:
                      item.date.localeCompare(obj[annuallyKey].date) < 0
                        ? item.date
                        : obj[annuallyKey].date
                  };
                }
                break;
              default:
                break;
            }
          }
          return obj;
        }, {});
        this.datePickerService.holidays = holidays;
      });
  }

  async ngOnChanges(changes: SimpleChanges) {
    const { trudiStatus, trudiPlacement } = changes;

    if (changes['dueDate'] && changes['dueDate']?.currentValue) {
      this.datePickerService.dueDate = new CandyDate(
        changes['dueDate'].currentValue
      );
      if (
        changes['dueDateTooltipText'] &&
        changes['dueDateTooltipText'].currentValue
      ) {
        this.datePickerService.dueDateTooltipText =
          changes['dueDateTooltipText'].currentValue;
      }
    }

    if (changes['defaultValue']) {
      if (!!changes['defaultValue']?.currentValue) {
        const date = new CandyDate(changes['defaultValue'].currentValue);
        if (date.isValid()) {
          let defaultDate = this.defaultValue;
          const isFirstChange = changes['defaultValue'].isFirstChange();

          if (isFirstChange) {
            const timezone = await firstValueFrom(this.timezone$);
            defaultDate = convertUTCToLocalDateTime(
              defaultDate,
              timezone.value
            );
          }
          this.setValue(defaultDate as any);
          this.inputValue =
            (await this.formatValue(new CandyDate(defaultDate))) ??
            changes['defaultValue'].currentValue;
        } else {
          this.inputValue = changes['defaultValue']?.currentValue;
        }
      } else {
        this.inputValue = changes['defaultValue']?.currentValue || '';
      }
    }

    if (changes['trudiPopupStyle']) {
      // Always assign the popup style patch
      this.trudiPopupStyle = this.trudiPopupStyle
        ? { ...this.trudiPopupStyle, ...POPUP_STYLE_PATCH }
        : POPUP_STYLE_PATCH;
    }

    if (changes['trudiLocale']) {
      // The trudiLocale is currently handled by user
      this.setDefaultPlaceHolder();
    }

    if (changes['trudiRenderExtraFooter']) {
      this.extraFooter = valueFunctionProp(this.trudiRenderExtraFooter!);
    }

    if (changes['trudiMode']) {
      this.setDefaultPlaceHolder();
      this.setModeAndFormat();
    }

    if (trudiStatus) {
      this.setStatusStyles(this.trudiStatus, this.hasFeedback);
    }

    if (trudiPlacement) {
      this.setPlacement(this.trudiPlacement);
    }
  }

  ngOnDestroy(): void {
    this.datePickerService.dueDate = null;
    this.datePickerService.dueDateTooltipText = null;
    this.destroyed$.next();
    this.destroyed$.complete();
    this.elementRef.nativeElement.removeEventListener(
      'mousedown',
      this.onMouseDown
    );
  }

  async setModeAndFormat(): Promise<void> {
    const format = await firstValueFrom(this.format$);
    const inputFormats: { [key in TrudiDateMode]?: string } = {
      year: 'yyyy',
      month: 'yyyy-MM',
      week: this.i18n.getDateLocale() ? 'RRRR-II' : 'yyyy-ww', // Format for week
      date: 'yyyy-MM-dd'
    };

    if (!this.trudiMode) {
      this.trudiMode = 'date';
    }

    this.panelMode = this.trudiMode;

    // Default format when it's empty
    if (!this.isCustomFormat && !format) {
      this._trudiFormatSource$.next(
        inputFormats[this.trudiMode as TrudiDateMode]!
      );
    }

    this.inputSize = Math.max(10, format.length) + 2;
    this.updateInputValue();
  }

  /**
   * Triggered when overlayOpen changes (different with realOpenState)
   *
   * @param open The overlayOpen in picker component
   */
  onOpenChange(open: boolean): void {
    this.trudiOnOpenChange.emit(open);
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
    this.trudiDisabled =
      (this.isTrudiDisableFirstChange && this.trudiDisabled) || isDisabled;
    this.cdr.markForCheck();
    this.isTrudiDisableFirstChange = false;
  }

  // ------------------------------------------------------------------------
  // | Internal methods
  // ------------------------------------------------------------------------

  // Reload locale from i18n with side effects
  private setLocale(): void {
    this.trudiLocale = this.i18n.getLocaleData('DatePicker', {});
    this.setDefaultPlaceHolder();
    this.cdr.markForCheck();
  }

  private async setDefaultPlaceHolder(): Promise<void> {
    const placeholder = await firstValueFrom(this.placeHolder$);
    if (!this.isCustomPlaceHolder && !placeholder && this.trudiLocale) {
      const defaultPlaceholder: { [key in TrudiDateMode]?: string } = {
        year: this.getPropertyOfLocale('yearPlaceholder'),
        month: this.getPropertyOfLocale('monthPlaceholder'),
        week: this.getPropertyOfLocale('weekPlaceholder'),
        date: this.getPropertyOfLocale('placeholder')
      };
      this._placeholderSource$.next(
        defaultPlaceholder[this.trudiMode as TrudiDateMode]
      );
    }
  }

  private getPropertyOfLocale<T extends keyof TrudiDatePickerLangI18nInterface>(
    type: T
  ): TrudiDatePickerLangI18nInterface[T] {
    return (
      this.trudiLocale.lang[type] ||
      this.i18n.getLocaleData(`DatePicker.lang.${type}`)
    );
  }

  // Safe way of setting value with default
  private setValue(value: CompatibleDate): void {
    const newValue: CompatibleValue = this.datePickerService.makeValue(value);
    this.datePickerService.setValue(newValue);
    this.datePickerService.initialValue = newValue;
    this.cdr.markForCheck();
  }

  renderClass(value: boolean): void {
    // TODO: avoid autoFocus cause change after checked error
    this.isCalendarFocus = value;
    if (value) {
      this.renderer.addClass(
        this.elementRef.nativeElement,
        'trudi-picker-focused'
      );
      // this.renderer.addClass(this.elementRef.nativeElement, 'trudi-picker-error');
    } else {
      this.renderer.removeClass(
        this.elementRef.nativeElement,
        'trudi-picker-focused'
      );
      // this.renderer.removeClass(this.elementRef.nativeElement, 'trudi-picker-error');
    }
  }

  onPanelModeChange(panelMode: TrudiDateMode | TrudiDateMode[]): void {
    this.trudiOnPanelChange.emit(panelMode);
  }

  onResultOk(): void {
    if (this.invalidInput !== null) {
      this.trudiOnOk.emit(this.invalidInput);
      this.invalidInput = null;
      return;
    }
    if (this.datePickerService.value) {
      const dateValue = this.agencyDateFormatService.expectedTimezoneDate(
        (this.datePickerService.value as CandyDate).nativeDate ||
          this.datePickerService.value
      );
      this.trudiOnOk.emit(dateValue);
    }
  }

  // status
  private setStatusStyles(
    status: TrudiValidateStatus,
    hasFeedback: boolean
  ): void {
    // set inner status
    this.status = status;
    this.hasFeedback = hasFeedback;
    this.cdr.markForCheck();
    // render status if trudiStatus is set
    this.statusCls = getStatusClassNames(this.prefixCls, status, hasFeedback);
    Object.keys(this.statusCls).forEach((status) => {
      if (this.statusCls[status]) {
        this.renderer.addClass(this.elementRef.nativeElement, status);
      } else {
        this.renderer.removeClass(this.elementRef.nativeElement, status);
      }
    });
  }

  private setPlacement(placement: TrudiPlacement): void {
    const position: ConnectionPositionPair =
      DATE_PICKER_POSITION_MAP[placement];
    this.overlayPositions = [position, ...DEFAULT_DATE_PICKER_POSITIONS];
    this.currentPositionX = position.originX;
    this.currentPositionY = position.originY;
  }

  @HostListener('click', ['$event'])
  onClick($event: MouseEvent) {
    this.onClickInputBox($event);
    this.pickerInput.nativeElement.focus();
    this.open();
  }
}
