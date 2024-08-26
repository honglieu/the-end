import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  Validator,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { Subject, takeUntil } from 'rxjs';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { CompanyService } from '@services/company.service';
@Component({
  selector: 'trudi-send-option-menu',
  templateUrl: './trudi-send-option-menu.component.html',
  styleUrls: ['./trudi-send-option-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSendOptionMenuComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TrudiSendOptionMenuComponent),
      multi: true
    }
  ]
})
export class TrudiSendOptionMenuComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  private destroy$ = new Subject<boolean>();
  private listReceiver = new Map<number, ISelectedReceivers>();

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get bccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('bccReceivers');
  }

  get ccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('ccReceivers');
  }

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  @Input() hasAppUser: boolean = false;

  isDropdownMenuOpen = false;
  dataList: sendOptionModel[] = [
    {
      id: 1,
      name: 'Tenant app',
      value: sendOptionType.APP,
      active: true
    },
    {
      id: 2,
      name: 'Tenant app & email',
      value: sendOptionType.EMAIL,
      active: true
    }
  ];

  public model: sendOptionModel = null;
  public activeMobileApp: boolean = true;

  onChange: (model: sendOptionType) => void;
  onTouched: () => void;
  isDisabled: boolean;

  validate(control: AbstractControl): ValidationErrors {
    return null;
  }

  writeValue(value: sendOptionType) {
    this.setModel(value);
  }

  registerOnChange(fn: (model: sendOptionType) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
  }

  setModel(defaultValue: sendOptionType = null) {
    const model = this.dataList.find((item) => item.value === defaultValue);
    this.model =
      model || (this.hasAppUser ? this.dataList[0] : this.dataList[1]);
    this.cdr.markForCheck();
  }

  handleOnChange($event: Event, item: sendOptionModel) {
    if (!item.id || !item.active) {
      $event.preventDefault();
      return;
    }
    const model = item;
    this.writeValue(model.value);
    this.onChange(model.value);
    this.isDropdownMenuOpen = false;
  }

  ngOnInit(): void {
    this.trudiSendMsgFormService.triggerUpdateSendOption
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.setModel(data.defaultValue);
      });

    this.subscribeToMobileAppChanges();
    this.subscribeActiveMobileApp();
  }

  subscribeToMobileAppChanges() {
    this.subscribeToFormControlChanges([
      this.selectedReceivers,
      this.bccReceivers,
      this.ccReceivers
    ]);
  }

  private subscribeToFormControlChanges(formControls: AbstractControl[]) {
    formControls.forEach((control, index) => {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((users) => {
        this.listReceiver.set(index, users);
        this.hasAppUser = Array.from(this.listReceiver.values())
          .flat()
          .some((user) => user?.isAppUser);
      });
    });
  }

  subscribeActiveMobileApp() {
    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: boolean) => {
        this.activeMobileApp = status;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

export interface sendOptionModel {
  id: number;
  name: string;
  value: sendOptionType;
  active: boolean;
}

export enum sendOptionType {
  EMAIL = 'EMAIL',
  APP = 'APP',
  APPANDEMAIL = 'APPANDEMAIL'
}
