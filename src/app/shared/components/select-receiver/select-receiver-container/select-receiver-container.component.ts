import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Input,
  OnDestroy,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { whiteListClickOutsideSelectReceiver } from '@shared/constants/outside-white-list.constant';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { mapUserId } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ECreateMessageFrom,
  EReceiverType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import {
  USER_TYPE_UNNECESSARY_PROPERTY_ID,
  defaultConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  IReceiver,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { SelectSpecificReceiverComponent } from '@shared/components/select-receiver/select-specific-receiver/select-specific-receiver.component';
import { SelectContactTypeComponent } from '@shared/components/select-receiver/select-contact-type/select-contact-type.component';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';

@Component({
  selector: 'select-receiver-container',
  templateUrl: './select-receiver-container.component.html',
  styleUrl: './select-receiver-container.component.scss',
  providers: [TrudiSendMsgUserService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectReceiverContainerComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('suffixForTOFieldTemplate')
  suffixForTOFieldTemplate: TemplateRef<string>;
  @ViewChild('suffixForCCAndBCCFieldsTemplate')
  suffixForCCAndBCCFieldsTemplate: TemplateRef<string>;
  @ContentChild('selectContactType', { static: false })
  selectContactType: SelectContactTypeComponent;
  @ViewChild('selectSpecificReceiver', { static: false })
  selectSpecificReceiver: SelectSpecificReceiverComponent;
  @ViewChild('bccField', { static: false })
  bccField: SelectSpecificReceiverComponent;
  @ViewChild('ccField', { static: false })
  ccField: SelectSpecificReceiverComponent;
  toField: any;

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() formGrp: FormGroup;
  @Input() toFormName: string;
  @Input() ccFormName: string;
  @Input() bccFormName: string;
  @Input() isRmEnvironment: boolean = false;
  @Input() openFrom: string;
  @Input() isContactType: boolean = true;
  @Input() listBulkSendTo;
  @Input() toPlaceholder: string;
  @Input() ccBccPlaceholder: string;
  @Input() selectedProperty: UserPropertyInPeople;
  @Input() toFieldLabel: string;
  @Input() ccBccLabel: string;
  @Input() toPrefixTemplate: string = 'To';
  @Input() suffixPaddingLeft: string = '30px';
  @Input() isFormSubmitted: boolean = false;
  @Input() isOnlySupplierAndOther: boolean = false;
  @Input() appendTo = '';

  readonly ISendMsgType = ISendMsgType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  readonly EReceiverType = EReceiverType;

  private destroy$ = new Subject<void>();
  public isShowBCCBtnForTOField: boolean = true;
  public isShowCCBtnForTOField: boolean = true;
  public isShowBCCBtnForCCField: boolean = true;
  public isShowCCBtnForBCCField: boolean = true;
  public isOpenFromCalendar: boolean;
  public prefillTOReceiversLists = [];
  public prefillCCReceiversLists = [];
  public prefillBCCReceiversLists = [];
  public isShowPreview: boolean = true;
  public whiteListClickOutsideSelectReceiver: string[] = [
    ...whiteListClickOutsideSelectReceiver
  ];

  get selectedReceivers(): AbstractControl {
    return this.formGrp.get(this.toFormName || 'selectedReceivers');
  }

  get ccReceivers(): AbstractControl {
    return this.formGrp.get(this.ccFormName || 'ccReceivers');
  }

  get bccReceivers(): AbstractControl {
    return this.formGrp.get(this.bccFormName || 'bccReceivers');
  }

  constructor(
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isOpenFromCalendar =
      this.openFrom === EUserPropertyType.CALENDAR_EVENT_BULK_CREATE_TASKS;
    this.getDataPrefill();
    this.selectedReceivers?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFormSubmitted']?.currentValue) {
      this.isShowPreview = this.formGrp.valid ? this.isShowPreview : false;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    if (this.isContactType) {
      this.toField = this.selectContactType;
      this.selectContactType.suffixTemplate = this.suffixForTOFieldTemplate;
    } else {
      this.toField = this.selectSpecificReceiver;
    }
  }

  handleClearAll() {
    this.selectedReceivers.setValue([]);
  }

  getDataPrefill() {
    if (this.configs.body.prefillReceiversList.length > 0) {
      this.prefillTOReceiversLists = this.configs.body.prefillReceiversList;
      return;
    }
    let tempData = this.configs.body.prefillToCcBccReceiversList;
    if (!tempData) return;
    this.prefillTOReceiversLists = this.mapDataPrefill(
      this.configs.body.prefillToCcBccReceiversList.to
    );
    this.prefillCCReceiversLists = this.mapDataPrefill(
      this.configs.body.prefillToCcBccReceiversList.cc
    );
    this.prefillBCCReceiversLists = this.mapDataPrefill(
      this.configs.body.prefillToCcBccReceiversList.bcc
    );
    this.selectedReceivers.setValue(
      mapUserId<IReceiver>(this.configs.body.prefillToCcBccReceiversList.to)
    );
    this.ccReceivers.setValue(
      mapUserId<IReceiver>(this.configs.body.prefillToCcBccReceiversList.cc)
    );
    this.bccReceivers.setValue(
      mapUserId<IReceiver>(this.configs.body.prefillToCcBccReceiversList.bcc)
    );
  }

  mapDataPrefill(data) {
    return (
      data?.map((item) => {
        const mappedValue = {
          id: item.userId,
          propertyId:
            !item.userType ||
            USER_TYPE_UNNECESSARY_PROPERTY_ID.includes(item.userType)
              ? null
              : item.propertyId
        };

        const secondaryEmailId =
          item.secondaryEmail?.id || item.secondaryEmailId;

        if (secondaryEmailId) {
          mappedValue['secondaryEmailId'] = secondaryEmailId;
        }
        return mappedValue;
      }) || []
    );
  }

  onClickToField() {
    if (this.isShowPreview) {
      this.isShowPreview = false;
      setTimeout(() => {
        if (
          this.prefillCCReceiversLists?.length ||
          this.ccReceivers?.value?.length
        ) {
          this.ccField.onFocusAndOpenSelect();
          this.ccField.focusAndBlur();
        }

        if (
          this.prefillBCCReceiversLists?.length ||
          this.bccReceivers?.value?.length
        ) {
          this.bccField.onFocusAndOpenSelect();
          this.bccField.focusAndBlur();
        }
        this.toField.onFocusAndOpenSelect();
      }, 0);
      this.handleShowCCAndBCC();
      this.cdr.markForCheck();
    }
  }

  clickCCInToField() {
    this.isShowCCBtnForTOField = false;
    this.focusField(EReceiverType.CC);
    this.cdr.markForCheck();
  }

  clickBCCInToField() {
    this.isShowBCCBtnForTOField = false;
    this.focusField(EReceiverType.BCC);
    this.cdr.markForCheck();
  }

  focusField(type: EReceiverType) {
    setTimeout(() => {
      if (type === EReceiverType.CC) {
        this.ccField.onFocusAndOpenSelect();
      } else {
        this.bccField.onFocusAndOpenSelect();
      }
    }, 0);
  }

  handleShowCCAndBCC() {
    const hasBCCReceivers = this.bccReceivers?.value?.length;
    const hasCCReceivers = this.ccReceivers?.value?.length;
    this.isShowCCBtnForTOField = false;
    this.isShowBCCBtnForTOField = false;
    if (hasBCCReceivers && hasCCReceivers) {
      this.isShowCCBtnForBCCField = false;
      this.isShowBCCBtnForCCField = false;
      return;
    }
    if (hasBCCReceivers) {
      this.isShowCCBtnForTOField = true;
      this.isShowCCBtnForBCCField = true;
      return;
    }
    if (hasCCReceivers) {
      this.isShowBCCBtnForTOField = true;
      this.isShowBCCBtnForCCField = true;
      return;
    }
    this.resetAllBtnToDefaultValue(true);
  }

  resetAllBtnToDefaultValue(value: boolean) {
    this.isShowCCBtnForTOField = value;
    this.isShowCCBtnForBCCField = value;
    this.isShowBCCBtnForTOField = value;
    this.isShowBCCBtnForCCField = value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
