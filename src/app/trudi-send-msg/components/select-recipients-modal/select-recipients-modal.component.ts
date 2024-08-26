import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  Subject,
  distinctUntilChanged,
  map,
  shareReplay,
  takeUntil
} from 'rxjs';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { FormControl, Validators } from '@angular/forms';
import { validateReceivers } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { debounce } from 'lodash-es';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  MAP_TYPE_RECEIVER_TO_LABEL,
  MAP_TYPE_RECEIVER_TO_SUBLABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { UserService } from '@services/user.service';
import { getUniqReceiverData } from '@/app/trudi-send-msg/utils/helper-functions';

@Component({
  selector: 'select-recipients-modal',
  templateUrl: './select-recipients-modal.component.html',
  styleUrls: ['./select-recipients-modal.component.scss']
})
export class SelectRecipientsModalComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() selectedTaskIds: string[];
  @Input() openFrom: string;
  @Input() prefillData;
  @Input() listContactCard = [];
  @Output() cancel = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<ISelectedReceivers[]>();
  private destroy$ = new Subject<void>();
  public listContactTypes = [];
  readonly ISendMsgType = ISendMsgType;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  public selectRecipientsControl = new FormControl(
    [],
    [Validators.required, validateReceivers()]
  );
  public userListLoading$ = this.trudiSendMsgUserService.isLoading$;

  constructor(
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.selectedTaskIds = this.configs.inputs.selectedTasksForPrefill?.map(
      (item) => item.taskId
    );
    this.prefillData = this.configs.inputs.prefillData;
    this.getContactTypeList();
    if (
      [
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.CONTACT,
        ECreateMessageFrom.TASK_STEP,
        ECreateMessageFrom.MULTI_TASKS
      ].includes(this.configs.otherConfigs.createMessageFrom)
    ) {
      this.getReceiverList();
    }
  }

  handleCloseModal() {
    this.trudiSendMsgService.setPopupState({
      selectRecipients: false
    });
    this.cancel.emit();
  }

  handleConfirm() {
    const recipientTemp = this.selectRecipientsControl.value?.[0];
    const receivers = getUniqReceiverData(
      recipientTemp.hasOwnProperty('data') // map data when value is contact type
        ? this.selectRecipientsControl.value?.flatMap(
            (recipient) => recipient.data || []
          )
        : this.selectRecipientsControl.value
    ).map((receiver) => ({ ...receiver, isFromSelectRecipients: true }));
    this.confirm.emit(receivers);
    this.trudiSendMsgService.setViewRecipientList(receivers);
    this.trudiSendMsgService.setPopupState({
      selectRecipients: false,
      sendMessage: true
    });
  }

  handleBack() {
    this.back.emit();
  }

  compareWith(receiverA: ISelectedReceivers, receiverB: ISelectedReceivers) {
    return (
      receiverA.id === receiverB.id &&
      receiverA.propertyId == receiverB.propertyId
    );
  }

  private getContactTypeList() {
    if (!this.configs.body.receiver.isShowContactType) {
      return;
    }
    let body = {
      taskIds: (this.configs?.inputs?.selectedTasksForPrefill || []).map(
        (data) => data.taskId
      )
    };
    this.trudiSendMsgUserService
      .getListContactTypeApi(body)
      .pipe(
        takeUntil(this.destroy$),
        map((res) => {
          return res.map((item, index) => ({
            ...item,
            label: MAP_TYPE_RECEIVER_TO_LABEL[item.type],
            subLabel: MAP_TYPE_RECEIVER_TO_SUBLABEL[item.type] ?? '',
            disabled: !item?.data || item.data?.length === 0,
            id: index,
            data:
              (item.data || []).map((receiver) => {
                if (
                  receiver?.type === EUserPropertyType.TENANT ||
                  receiver?.type === EUserPropertyType.LANDLORD ||
                  receiver?.type === EUserPropertyType.TENANT_UNIT ||
                  receiver?.type === EUserPropertyType.TENANT_PROPERTY
                ) {
                  receiver.isAppUser =
                    this.userService.getStatusInvite(
                      receiver?.iviteSent,
                      receiver?.lastActivity,
                      receiver?.offBoardedDate,
                      receiver?.trudiUserId
                    ) === EUserInviteStatusType.active;
                }
                return receiver;
              }) ?? []
          }));
        })
      )
      .subscribe((rs) => {
        this.listContactTypes = rs;
      });
  }

  get listReceiver() {
    return this.trudiSendMsgService.getListReceiver();
  }

  private getReceiverList() {
    const listReciver$ = this.trudiSendMsgUserService
      .getListUser()
      .pipe(takeUntil(this.destroy$));

    const sharedListReceiver$ = listReciver$.pipe(
      distinctUntilChanged(),
      shareReplay(1) // Share the same subscription and replay the latest emitted value
    );

    sharedListReceiver$.subscribe((receivers) => {
      this.trudiSendMsgService.setListReceiver([
        ...this.trudiSendMsgService.getListReceiver(),
        ...receivers
      ]);
    });

    this.trudiSendMsgUserService.fetchMore({
      limit: 20,
      page: 1,
      search: '',
      propertyId: null,
      email_null: false,
      userDetails: [],
      taskIds: this.selectedTaskIds
    });
  }

  public searchUser = debounce((value: string) => {
    this.trudiSendMsgService.setListReceiver([]);
    this.trudiSendMsgUserService.fetchMore({
      userDetails: !value?.length
        ? this.selectRecipientsControl.value?.map(
            (selected: { id: string; propertyId: string }) => {
              return {
                id: selected.id,
                propertyId: selected.propertyId
              };
            }
          )
        : [],
      search: value,
      page: 1,
      taskIds:
        this.configs?.otherConfigs?.createMessageFrom !==
        ECreateMessageFrom.TASK_HEADER
          ? this.selectedTaskIds
          : []
    });
  }, 200);

  getNextPage() {
    if (this.trudiSendMsgUserService.lastPage) return;
    this.trudiSendMsgUserService.getNextPage();
  }

  handleClearAll() {
    this.selectRecipientsControl.setValue([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
