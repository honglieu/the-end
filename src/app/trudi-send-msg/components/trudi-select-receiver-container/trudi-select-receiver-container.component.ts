import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { whiteListClickOutsideSelectReceiver } from '@shared/constants/outside-white-list.constant';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { mapUserId } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ECreateMessageFrom,
  EReceiverType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import {
  USER_TYPE_UNNECESSARY_PROPERTY_ID,
  defaultConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  IReceiver,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiSelectReceiverV2Component } from '@/app/trudi-send-msg/components/trudi-select-receiver-v2/trudi-select-receiver-v2.component';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'trudi-select-receiver-container',
  templateUrl: './trudi-select-receiver-container.component.html',
  styleUrls: ['./trudi-select-receiver-container.component.scss']
})
export class TrudiSelectReceiverContainerComponent implements OnInit {
  @ViewChild('suffixForTOFieldTemplate')
  suffixForTOFieldTemplate: TemplateRef<string>;
  @ViewChild('suffixForCCAndBCCFieldsTemplate')
  suffixForCCAndBCCFieldsTemplate: TemplateRef<string>;
  @ViewChild('toField', { static: false })
  toField: TrudiSelectReceiverV2Component;
  @ViewChild('bccField', { static: false })
  bccField: TrudiSelectReceiverV2Component;
  @ViewChild('ccField', { static: false })
  ccField: TrudiSelectReceiverV2Component;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isRmEnvironment: boolean = false;
  @Input() openFrom: string;

  readonly ISendMsgType = ISendMsgType;
  readonly ECreateMessageFrom = ECreateMessageFrom;

  private destroy$ = new Subject<boolean>();
  public isShowBCCBtnForTOField: boolean = true;
  public isShowCCBtnForTOField: boolean = true;
  public isShowBCCBtnForCCField: boolean = true;
  public isShowCCBtnForBCCField: boolean = true;
  public isOpenFromCalendar: boolean;
  public prefillTOReceiversLists = [];
  public prefillCCReceiversLists = [];
  public prefillBCCReceiversLists = [];
  public isShowPreview: boolean = false;
  public isTaskStepSingleEmailSendType = false;
  public whiteListClickOutsideSelectReceiver: string[] = [
    ...whiteListClickOutsideSelectReceiver
  ];
  public EReceiverType = EReceiverType;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private cdr: ChangeDetectorRef,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  ngOnInit(): void {
    this.isOpenFromCalendar =
      this.openFrom === EUserPropertyType.CALENDAR_EVENT_BULK_CREATE_TASKS;
    const typeSend =
      (this.configs?.trudiButton as TrudiStep)?.fields.typeSend ||
      this.configs?.inputs?.prefillData?.fields?.typeSend;
    this.isTaskStepSingleEmailSendType = typeSend === ETypeSend.SINGLE_EMAIL;
    this.getDataPrefill();
    this.trudiSendMsgService.showPreview$
      .pipe(takeUntil(this.destroy$))
      .subscribe((showPreview) => {
        this.isShowPreview = showPreview;
        this.cdr.markForCheck();
      });
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }
  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm.get('selectedReceivers');
  }

  get ccReceivers(): AbstractControl {
    return this.sendMsgForm.get('ccReceivers');
  }

  get bccReceivers(): AbstractControl {
    return this.sendMsgForm.get('bccReceivers');
  }

  get selectedProperty(): AbstractControl {
    return this.sendMsgForm.get('property');
  }

  compareWith(
    receiverA: ISelectedReceivers,
    receiverB: ISelectedReceivers
  ): boolean {
    const areIdsEqual = receiverA.id === receiverB.id;
    const arePropertyIdsEqual = receiverA.propertyId === receiverB.propertyId;
    const areSecondaryEmailIdsEqual =
      (receiverA.secondaryEmail?.id || receiverA.secondaryEmailId) ==
      (receiverB.secondaryEmail?.id || receiverB.secondaryEmailId);

    return areIdsEqual && arePropertyIdsEqual && areSecondaryEmailIdsEqual;
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

  setPreviewLabel(isShow: boolean) {
    const dropdown = document.querySelector('.ng-dropdown-panel');
    if (dropdown && this.isShowPreview) {
      this.trudiSendMsgService.setShowPreview(isShow);
    }
  }

  handleClickOutSide() {
    this.trudiSendMsgService.setShowPreview(true);
    this.cdr.markForCheck();
  }

  onClickToField() {
    if (this.isShowPreview) {
      this.trudiSendMsgService.setShowPreview(false);
      setTimeout(() => {
        if (
          this.prefillCCReceiversLists?.length ||
          this.ccReceivers?.value?.length
        ) {
          this.ccField.onFocusAndOpenSelect();
          this.ccField.ngSelectReceiver.blur();
          this.ccField.ngSelectReceiver.close();
        }

        if (
          this.prefillBCCReceiversLists?.length ||
          this.bccReceivers?.value?.length
        ) {
          this.bccField.onFocusAndOpenSelect();
          this.bccField.ngSelectReceiver.blur();
          this.bccField.ngSelectReceiver.close();
        }

        this.toField.onFocusAndOpenSelect();
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

  trackUserChangeValue() {
    this.trudiSaveDraftService.setTrackControlChange('selectedReceivers', true);
  }
}
