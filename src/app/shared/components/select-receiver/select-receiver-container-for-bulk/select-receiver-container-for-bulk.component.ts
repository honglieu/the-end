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
import { SelectContactTypeComponent } from '@shared/components/select-receiver/select-contact-type/select-contact-type.component';
import { SelectSpecificReceiverComponent } from '@shared/components/select-receiver/select-specific-receiver/select-specific-receiver.component';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'select-receiver-container-for-bulk',
  providers: [TrudiSendMsgUserService],
  templateUrl: './select-receiver-container-for-bulk.component.html',
  styleUrls: ['./select-receiver-container-for-bulk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectReceiverContainerForBulkComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
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
  @Input() selectedProperties: UserPropertyInPeople[] = [];
  @Input() toPlaceholder: string;
  @Input() ccBccPlaceholder: string;
  @Input() toFieldLabel: string;
  @Input() ccBccLabel: string;
  @Input() toPrefixTemplate: string = 'SP To';
  @Input() suffixPaddingLeft: string = '45px';
  @Input() isFormSubmitted: boolean = false;
  @Input() isOnlySupplierAndOther: boolean = false;
  @Input() appendTo = '';

  private destroy$ = new Subject<void>();
  readonly ISendMsgType = ISendMsgType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  readonly EReceiverType = EReceiverType;

  public isShowBCCBtnForCCField: boolean = false;
  public isShowCCBtnForBCCField: boolean = false;
  public isOpenFromCalendar: boolean;
  public prefillTOReceiversLists = [];
  public prefillCCReceiversLists = [];
  public prefillBCCReceiversLists = [];
  public isShowPreviewTo: boolean = true;
  public isShowPreviewCcBcc: boolean = true;
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

  constructor(private cdr: ChangeDetectorRef) {}

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

  ngAfterViewInit(): void {
    this.toField = this.isContactType
      ? this.selectContactType
      : this.selectSpecificReceiver;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFormSubmitted']?.currentValue) {
      this.isShowPreviewTo = this.selectedReceivers.valid
        ? this.isShowPreviewTo
        : false;
      this.isShowPreviewCcBcc =
        this.ccReceivers.valid && this.bccReceivers.valid
          ? this.isShowPreviewCcBcc
          : false;
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
    if (this.isShowPreviewTo) {
      this.isShowPreviewTo = false;
      setTimeout(() => {
        this.toField.onFocusAndOpenSelect();
      });
    }
  }

  onClickCcBccField() {
    if (this.isShowPreviewCcBcc) {
      this.isShowPreviewCcBcc = false;
      setTimeout(() => {
        const hasCcPrefill = !!(
          this.prefillCCReceiversLists?.length ||
          this.ccReceivers?.value?.length
        );
        const hasBccPrefill = !!(
          this.prefillBCCReceiversLists?.length ||
          this.bccReceivers?.value?.length
        );
        const isFocused = this.ccField?.isFocused || this.bccField?.isFocused;

        if (isFocused) return;

        this.ccField?.onFocusAndOpenSelect();

        if (hasBccPrefill && !hasCcPrefill) {
          this.ccField?.blur();
          this.bccField?.onFocusAndOpenSelect();
        }
      }, 0);
      this.handleShowCCAndBCC();
      this.cdr.markForCheck();
    }
  }

  handleFocusCCAndBCC(type: EReceiverType) {
    setTimeout(() => {
      if (type === EReceiverType.CC) {
        this.ccField.onFocusAndOpenSelect();
      } else {
        this.bccField.onFocusAndOpenSelect();
      }
    }, 0);
  }

  clickCCInToField() {}

  clickBCCInToField() {}

  handleShowCCAndBCC() {
    const hasCCReceivers = this.ccReceivers?.value?.length;
    const hasBCCReceivers = this.bccReceivers?.value?.length;
    if (hasBCCReceivers && hasCCReceivers) {
      this.isShowCCBtnForBCCField = false;
      this.isShowBCCBtnForCCField = false;
      return;
    }
    if (hasBCCReceivers) {
      this.isShowCCBtnForBCCField = true;
      return;
    }
    if (hasCCReceivers) {
      this.isShowBCCBtnForCCField = true;
      return;
    }
    this.resetAllBtnToDefaultValue();
  }

  resetAllBtnToDefaultValue() {
    this.isShowCCBtnForBCCField = false;
    this.isShowBCCBtnForCCField = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
