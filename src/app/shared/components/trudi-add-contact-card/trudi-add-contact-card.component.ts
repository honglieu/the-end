import {
  Component,
  EventEmitter,
  Host,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges
} from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';
import { cloneDeep } from 'lodash-es';
import { Observable, Subject, map, take, takeUntil } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { PopupQueue } from '@/app/share-pop-up/services/navigate-pop-ups.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  GetListUserPayload,
  GetListUserResponse,
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgComponent } from '@/app/trudi-send-msg/trudi-send-msg.component';
import {
  filterReceiversByPId,
  isCheckedReceiversInList,
  updateConfigs
} from '@/app/trudi-send-msg/utils/helper-functions';
import {
  defaultConfigs,
  popupQueue
} from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  UserConversationOption
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiAddContactCardService } from './services/trudi-add-contact-card.service';
import { EContactCardOpenFrom } from '@shared/enum';

@Component({
  selector: 'trudi-add-contact-card',
  templateUrl: './trudi-add-contact-card.component.html',
  styleUrls: ['./trudi-add-contact-card.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class TrudiAddContactCardComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() openFrom: EContactCardOpenFrom;
  @Input() listContactCard: ISelectedReceivers[] = [];
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() visible: boolean = false;
  @Input() form: FormGroup;
  @Input() closable: boolean = true;
  @Input() userType: EUserPropertyType = null;
  @Output() onTrigger: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() changeValue: EventEmitter<any> = new EventEmitter();
  @Input() isPolicy: boolean = false;
  @Input() isOutOfOffice: boolean = false;
  ModalPopupPosition = ModalPopupPosition;
  popupQueue: PopupQueue = popupQueue;
  isShowAddContactCard: boolean = false;
  defaultConfigs: ISendMsgConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      title: 'Add contact card'
    }
  };
  propertyId: string;
  EUserPropertyType = EUserPropertyType;
  listConversation: UserConversationOption[] = [];
  private destroy$ = new Subject();
  constructor(
    @Host() @Optional() private trudiSendMsg: TrudiSendMsgComponent,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private conversationService: ConversationService,
    private propertyService: PropertiesService,
    private trudiAddContactCardService: TrudiAddContactCardService
  ) {}

  get selectedContactCard(): AbstractControl {
    return this.form?.get('selectedContactCard');
  }

  get listReceiver() {
    return this.trudiAddContactCardService.getContactCardList();
  }

  ngOnInit(): void {
    this.trudiAddContactCardService.setFormGroup(this.form);
    const selectedContactCard =
      this.trudiAddContactCardService.getSelectedContactCard();
    if (selectedContactCard?.length > 0) {
      this.trudiAddContactCardService.setContactCardList([]);
      this.trudiSendMsgUserService
        .getListUserApi({
          limit: selectedContactCard.length,
          page: 1,
          search: '',
          email_null: true,
          types: [this.userType],
          isContactCard: true,
          filterAll: true,
          userDetails: selectedContactCard.map((user) => ({
            id: user.id,
            propertyId: user.propertyId
          }))
        } as GetListUserPayload)
        .pipe(map((rs) => (rs ? (rs as GetListUserResponse).users : [])))
        .subscribe((rs: ISelectedReceivers[]) => {
          const values = rs.filter((receiver) => {
            return selectedContactCard.some((contactCard) =>
              isCheckedReceiversInList(receiver, contactCard, 'id')
            );
          });
          this.selectedContactCard.setValue(values);
        });
    }

    this.getListUserContactCard();

    this.propertyId = this.trudiSendMsgFormService.property?.value?.id;
    if (this.propertyId) {
      this.searchUser('', { propertyId: this.propertyId });
    }
    this.trudiAddContactCardService.selectedContactCard$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cardSelected) => {
        this.selectedContactCard.setValue([...cardSelected]);
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']) {
      this.configs = updateConfigs(
        cloneDeep(this.defaultConfigs),
        this.configs
      );
    }
  }

  getListUserContactCard() {
    this.trudiSendMsgUserService
      .getListUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (this.trudiSendMsgUserService.getCurrentPage() === 1) {
          this.trudiAddContactCardService.setContactCardList(rs);
        } else {
          this.trudiAddContactCardService.setContactCardList([
            ...this.listReceiver,
            ...rs
          ]);
        }
      });

    let { agencyId, propertyId, propertyType, taskType } =
      this.trudiAddContactCardService.getIDsFromOtherService();
    propertyId =
      (propertyType === EUserPropertyType.UNIDENTIFIED &&
        taskType === TaskType.MESSAGE) ||
      this.configs.otherConfigs.isCreateMessageType === true
        ? ''
        : propertyId;

    this.getAllPrefilledReceiverIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe((prefillReceiverIds) => {
        if (propertyId)
          this.listConversation =
            this.conversationService.listConversationByTask.value;
        const prefillUserIds =
          this.openFrom === EContactCardOpenFrom.MESSAGE
            ? []
            : prefillReceiverIds;
        this.trudiSendMsgUserService.fetchMore({
          limit: prefillUserIds.length > 20 ? prefillUserIds.length : 20,
          page: 1,
          type: this.userType,
          isContactCard: true,
          search: '',
          email_null: true,
          userDetails: prefillUserIds,
          filterAll: true
        });
      });
  }

  getAllPrefilledReceiverIds(): Observable<PrefillUser[]> {
    const peopleList = this.propertyService.peopleList.getValue();
    return this.conversationService.listConversationByTask.pipe(
      take(1),
      map((conversations: UserConversationOption[]) => {
        this.listConversation = conversations;
        const userIdSet = new Set<PrefillUser>();
        conversations
          .filter((conversation) => !conversation.isDraft)
          .forEach((conversation) => {
            userIdSet.add({
              id: conversation.userId,
              propertyId: conversation.propertyId
            });
          });
        this.configs.body.prefillReceiversList.forEach((receiver) => {
          userIdSet.add({
            id: receiver.id,
            propertyId: receiver.propertyId
          });
        });
        if (this.configs.body.prefillContactCardTypes?.length > 0) {
          const userIds = filterReceiversByPId(
            peopleList,
            this.configs.body.prefillContactCardTypes,
            this.listConversation
          );
          if (userIds?.length > 0) {
            userIds.forEach((user) => {
              userIdSet.add({
                id: user.id,
                propertyId: user.propertyId
              });
            });
          }
        }
        if (this.listContactCard?.length) {
          this.listContactCard.forEach((one) =>
            userIdSet.add({
              id: one.id,
              propertyId: one.propertyId
            })
          );
        }
        return Array.from(userIdSet);
      })
    );
  }

  compareWith(
    receiverA: ISelectedReceivers,
    receiverB: ISelectedReceivers
  ): boolean {
    const areIdsEqual = receiverA.id === receiverB.id;
    const arePropertyIdsEqual = receiverA.propertyId === receiverB.propertyId;
    const areSecondaryEmailIdsEqual =
      (receiverA.secondaryEmail?.id || receiverA.secondaryEmailId) ===
      (receiverB.secondaryEmail?.id || receiverB.secondaryEmailId);

    return areIdsEqual && arePropertyIdsEqual && areSecondaryEmailIdsEqual;
  }

  searchUser(value: string, payload?: Partial<GetListUserPayload>) {
    this.trudiSendMsgUserService.useUserProperties = this.propertyId && !value;

    this.trudiAddContactCardService.setContactCardList([]);
    this.trudiSendMsgUserService.fetchMore({
      userDetails: [],
      search: value,
      page: 1,
      isContactCard: true,
      ...payload
    });
  }

  public get userListLoading$() {
    return this.trudiSendMsgUserService.isLoading$;
  }

  getNextPage() {
    if (this.trudiSendMsgUserService.lastPage) return;
    this.trudiSendMsgUserService.getNextPage();
  }

  onCloseSendMsg() {
    if (this.trudiAddContactCardService.getPopupState().addContactCard) {
      this.selectedContactCard.removeValidators(Validators.required);
      this.trudiSendMsg?.onQuit?.emit();
    }
    this.onClose.emit();
  }

  onTriggerClick(isCheck: boolean) {
    if (isCheck) {
      if (this.selectedContactCard.invalid) {
        this.selectedContactCard.markAllAsTouched();
        return;
      } else {
        const selectedContactCard = this.selectedContactCard.value?.map(
          (card) => ({
            ...card,
            openFrom: this.openFrom
          })
        );
        this.trudiAddContactCardService.setSelectedContactCard(
          selectedContactCard
        );
        selectedContactCard.length && this.changeValue.emit();
      }
    } else {
      this.selectedContactCard.setValue(
        this.trudiAddContactCardService.getSelectedContactCard()
      );
    }
    this.trudiAddContactCardService.setPopupState({
      isClickedAddButton: isCheck
    });
    this.onTrigger.emit();
    this.selectedContactCard.removeValidators(Validators.required);
    this.selectedContactCard.updateValueAndValidity();
  }

  onHandleShowArchivedContacts(isShow) {
    this.trudiSendMsgUserService.fetchMore({
      page: 1,
      isContactCard: true,
      isShowArchivedStatus: isShow
    });
  }

  ngOnDestroy(): void {
    this.trudiAddContactCardService.removeFormGroup();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
