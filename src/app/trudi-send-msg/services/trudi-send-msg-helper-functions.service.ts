import {
  ERentManagerContactType,
  ETypeSend
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import {
  EUserInviteStatusType,
  EUserPropertyType,
  TaskType
} from '@shared/enum';
import { displayName } from '@shared/feature/function.feature';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  checkExistConversation,
  mapReceiverConversation,
  isCheckedReceiversInList,
  filterReceiversByTypes,
  filterReceiversByPId
} from '@/app/trudi-send-msg/utils/helper-functions';
import { receiverTypeAllowedPrefillAll } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  UserConversationOption
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable, OnDestroy, Optional } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import {
  takeUntil,
  map,
  distinctUntilChanged,
  shareReplay,
  combineLatest,
  filter,
  take,
  tap,
  Observable,
  Subject,
  firstValueFrom,
  delay
} from 'rxjs';
import { unionBy, uniqBy } from 'lodash-es';
import { TrudiConfirmRecipientService } from '@/app/trudi-send-msg/services/trudi-confirm-recipients.service';
import { IFile } from '@shared/types/file.interface';
import uuidv4 from 'uuid4';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { EMAIL_FORMAT_REGEX, EMAIL_PATTERN } from '@services/constants';
import { TrudiSaveDraftService } from './trudi-save-draft.service';
import uuid4 from 'uuid4';
import {
  MAP_TYPE_RECEIVER_TO_LABEL,
  MAP_TYPE_RECEIVER_TO_SUBLABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { UserService } from '@services/user.service';

@Injectable()
export class TrudiSendMsgHelperFunctionsService implements OnDestroy {
  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiSendMsgService: TrudiSendMsgService,
    //Todo remove
    private conversationService: ConversationService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private propertyService: PropertiesService,
    @Optional()
    private trudiConfirmRecipientService: TrudiConfirmRecipientService,
    private userService: UserService
  ) {}

  private destroy$ = new Subject<void>();
  private configs: ISendMsgConfigs;
  private listConversation;
  private openFrom;
  private listContactCard = [];

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm.get('selectedReceivers');
  }

  get ccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('ccReceivers');
  }

  get bccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('bccReceivers');
  }

  get listContactGroup(): FormArray {
    return this.trudiConfirmRecipientService?.listContactGroup;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public handlePrefillRecipientAndContactCard(
    configs,
    selectedTaskIds: string[]
  ) {
    this.configs = configs;
    this.listContactCard = configs.inputs.listContactCard || [];
    let { propertyId, agencyId } =
      this.trudiSendMsgService.getIDsFromOtherService();
    if (
      this.configs?.otherConfigs.isCreateMessageType === true ||
      this.configs?.otherConfigs?.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS
    )
      propertyId = null;

    const listReciver$ = this.trudiSendMsgUserService.getListUser().pipe(
      takeUntil(this.destroy$),
      map((receivers) => {
        // Ignore map receiver when scroll select dropdown
        const currentListReceiver = this.trudiSendMsgService.getListReceiver();
        if (currentListReceiver && currentListReceiver.length > 0) {
          return receivers;
        }

        const mapReceiversFn = (receiver) => {
          const { inputReceiver, conversation } = checkExistConversation(
            this.configs,
            this.conversationService.listConversationByTask.value,
            receiver
          );
          const conversationId =
            inputReceiver?.conversationId || conversation?.id;

          if (inputReceiver) {
            const extendedData = {
              conversationId,
              disabled: inputReceiver.disabled,
              propertyId: receiver.propertyId
                ? receiver.propertyId
                : inputReceiver.propertyId
            };

            if (
              [
                EUserPropertyType.SUPPLIER,
                EUserPropertyType.TENANT_PROSPECT,
                EUserPropertyType.LANDLORD_PROSPECT
              ].includes(receiver.type)
            ) {
              extendedData['propertyId'] = null;
            }

            const matchedInputReceiver = Object.assign(receiver, extendedData);
            return matchedInputReceiver;
          }
          if (conversation) {
            const receiverInConversation = Object.assign(receiver, {
              conversationId
            });
            return receiverInConversation;
          }
          return receiver;
        };

        return receivers.map(mapReceiversFn);
      })
    );

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

    const conversationUserIds$ =
      this.conversationService.listConversationByTask.pipe(
        map((conversations) =>
          conversations.map((conversation) => conversation.userId)
        )
      );

    combineLatest([sharedListReceiver$, conversationUserIds$])
      .pipe(
        takeUntil(
          this.selectedReceivers.valueChanges.pipe(
            filter((v) => v?.length),
            distinctUntilChanged()
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([receivers, prefillUserIds]) => {
        this.prefillReceivers(
          receivers,
          prefillUserIds,
          this.configs?.body?.prefillReceiverTypes
        );
        this.handlePrefillByCase(
          this.configs.otherConfigs.createMessageFrom,
          receivers,
          prefillUserIds
        );
      });

    this.getAllPrefilledReceiverIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe((prefillReceiverIds) => {
        this.setDefaultPrefillUser(
          this.listConversation,
          propertyId,
          agencyId,
          this.openFrom !== TaskType.MESSAGE ? prefillReceiverIds : []
        );
        this.trudiSendMsgUserService.fetchMore({
          limit:
            prefillReceiverIds?.length > 20 ? prefillReceiverIds?.length : 20,
          page: 1,
          search: '',
          propertyId: propertyId,
          email_null: false,
          userDetails:
            this.openFrom !== TaskType.MESSAGE ? prefillReceiverIds : [],
          taskIds:
            this.configs?.otherConfigs?.createMessageFrom !==
            ECreateMessageFrom.TASK_HEADER
              ? selectedTaskIds
              : []
        });
      });
  }

  private getContactTypeListApi() {
    let body = {
      taskIds: (this.configs?.inputs?.selectedTasksForPrefill || []).map(
        (data) => data.taskId
      )
    };
    return this.trudiSendMsgUserService.getListContactTypeApi(body).pipe(
      takeUntil(this.destroy$),
      map((res) => {
        // TODO: move to api function
        return res.map((item, index) => ({
          ...item,
          label: MAP_TYPE_RECEIVER_TO_LABEL[item.type],
          subLabel: MAP_TYPE_RECEIVER_TO_SUBLABEL[item.type] ?? '',
          disabled: !item?.data || item.data?.length === 0,
          id: item.type,
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
    );
  }

  handlePrefillTaskStepSingleEmail(listContactTypes = []) {
    const {
      sendTo = [],
      sendCc = [],
      sendBcc = []
    } = this.configs.inputs.prefillData?.fields ||
    (this.configs.trudiButton as TrudiStep).fields;

    const externalEmails = sendTo.filter((item) => EMAIL_PATTERN.test(item));
    const externalEmailsData = externalEmails.map((externalEmail) => {
      const isValid = true;
      const uuid = uuid4();
      return {
        id: uuid,
        isPrimary: true,
        isValid,
        type: EUserPropertyType.UNIDENTIFIED,
        email: externalEmail,
        firstName: null,
        lastName: null,
        inviteSent: null,
        lastActivity: null,
        phoneNumber: null,
        offBoardedDate: null,
        streetLine: null,
        propertyId: null
      };
    });

    // prefill contact types and external email from step data
    const recipients =
      listContactTypes
        .filter((item) => {
          return sendTo.includes(item.id) && item.data?.length;
        })
        .flatMap((item) => {
          return item.data.filter(
            (recipient) => recipient.email || recipient.secondaryEmail?.email
          );
        }) || [];

    this.selectedReceivers.setValue(
      uniqBy([...recipients, ...(externalEmailsData || [])], (item) => {
        return ['id', 'propertyId', 'secondaryEmail']
          .map((key) => {
            // item[key]?.id || item[key]?.email for case secondaryEmail
            return item[key]?.id || item[key]?.email || item[key] || '';
          })
          .join('_');
      })
    );

    this.ccReceivers.setValue(
      sendCc.map((cc) => ({
        ...cc,
        isValid: cc.isValid ?? !cc.isInvalid
      })) || []
    );
    this.bccReceivers.setValue(
      sendBcc.map((bcc) => ({
        ...bcc,
        isValid: bcc.isValid ?? !bcc.isInvalid
      })) || []
    );
  }
  setDefaultPrefillUser(
    listConversation: UserConversationOption[],
    propertyId: string,
    agencyId: string,
    userIds: PrefillUser[]
  ) {
    const peopleList = this.propertyService.peopleList.getValue();
    const typeSend =
      (this.configs?.trudiButton as TrudiStep)?.fields.typeSend ||
      this.configs?.inputs?.prefillData?.fields?.typeSend;
    const isTaskStepSingleEmailSendType = typeSend === ETypeSend.SINGLE_EMAIL;
    let listObservable$ = [
      this.trudiSendMsgService.getListReceiver$(),
      this.trudiSendMsgUserService.getListUserNotFilterEmail(
        propertyId,
        agencyId,
        userIds
      )
    ];
    if (isTaskStepSingleEmailSendType) {
      listObservable$.push(this.getContactTypeListApi());
    }

    combineLatest(listObservable$)
      .pipe(
        filter(
          ([array, _, listContact]) =>
            !!array?.length &&
            (!isTaskStepSingleEmailSendType || !!listContact?.length)
        ),
        take(1),
        takeUntil(this.destroy$),
        tap(([users, _]) => {
          // users.forEach((user) => {
          //   //input receiver from config
          //   const { inputReceiver, conversation } = checkExistConversation(
          //     this.configs,
          //     listConversation,
          //     user
          //   );
          //   // Has receiver in config
          //   if (inputReceiver) {
          //     if (
          //       user.isAppUser ||
          //       (!user.isAppUser && !!user?.email?.trim())
          //     ) {
          //       this.selectedReceivers.setValue([
          //         ...this.selectedReceivers.value,
          //         user
          //       ]);
          //     }
          //   } else if (conversation) {
          //     if (
          //       this.configs.body.prefillReceivers &&
          //       this.configs.body.receiverTypes &&
          //       !this.configs.body.prefillReceiversList.length &&
          //       this.configs.body.receiverTypes.includes(
          //         conversation.startMessageBy
          //       )
          //     ) {
          //       listConversation.find((one) => one.userId === user.id) &&
          //         this.selectedReceivers.setValue([
          //           ...this.selectedReceivers.value,
          //           user
          //         ]);
          //     }
          //   }
          // });
        })
      )
      .subscribe(([receivers, listContactCardNotFilterEmail, data]) => {
        if (
          this.configs.otherConfigs.createMessageFrom !==
          ECreateMessageFrom.TASK_STEP
        ) {
          return;
        }

        if (data) {
          this.handlePrefillTaskStepSingleEmail(data);
        }

        const receiverTypes = new Set(this.configs.body.receiverTypes);
        const isValidType = [...receiverTypeAllowedPrefillAll].some((type) =>
          receiverTypes.has(type)
        );
        const mappedReceivers = mapReceiverConversation(
          receivers,
          this.listConversation
        );
        const listReceiver = mappedReceivers.filter((receiver) => {
          if (this.configs.otherConfigs.isCreateMessageType) {
            return receiver;
          } else {
            return isCheckedReceiversInList(receiver, { propertyId });
          }
        });
        if (
          this.configs.body.prefillReceivers &&
          !this.selectedReceivers.value?.length &&
          isValidType
        ) {
          const validReceivers = filterReceiversByTypes(
            listReceiver.filter((receiver) =>
              listConversation.find((one) => one.userId === receiver.id)
            ),
            this.configs.body.receiverTypes
          );
          this.selectedReceivers.setValue(validReceivers);
        }

        if (this.listContactCard?.length) {
          const listContactCard = listContactCardNotFilterEmail.filter(
            (receiver) => {
              return this.listContactCard.some((contactCard) =>
                isCheckedReceiversInList(receiver, contactCard, 'id')
              );
            }
          );
          const listContactCardInForm = this.sendMsgForm.get(
            'selectedContactCard'
          ).value;
          this.handleReplaceContactCardData(listContactCard);
          if (
            !(listContactCardInForm?.length > 0) ||
            listContactCard.some(
              (cc) =>
                !listContactCardInForm.some(
                  (l) => l.id === cc.id && l.propertyId === cc.propertyId
                )
            )
          ) {
            this.sendMsgForm
              .get('selectedContactCard')
              .setValue(listContactCard);
            this.trudiSendMsgFormService.setSelectedContactCard(
              listContactCard
            );
          }
          this.trudiDynamicParameterService.triggerPrefillParameter.next(true);
        }
        // allow prefill contact card for TASK_STEP, receiver for CONTACT
        if (this.configs.body.prefillContactCardTypes?.length > 0) {
          const users = filterReceiversByPId(
            peopleList,
            this.configs.body.prefillContactCardTypes,
            listConversation
          );
          if (users?.length > 0) {
            const listContactCard = receivers.filter((item) =>
              users.some(
                (user) =>
                  user.id === item.id && user.propertyId === item.propertyId
              )
            );
            this.handleReplaceContactCardData(listContactCard);
            this.sendMsgForm
              .get('selectedContactCard')
              .setValue(listContactCard);
            this.trudiSendMsgFormService.setSelectedContactCard(
              listContactCard
            );
            if (listContactCard.length > 0) {
              this.trudiDynamicParameterService.triggerPrefillParameter.next(
                true
              );
            }
          }
        }
        this.trudiSendMsgService.setContactCardList([
          ...listContactCardNotFilterEmail.map((it) => ({
            ...it,
            disabled: false
          }))
        ]);
      });
  }

  handleReplaceContactCardData(listContactCard) {
    if (!listContactCard.length) return;
    const unknown = `<span style='color: var\(--danger-500, #fa3939\);' contenteditable='false'>unknown<\/span>`;
    const dataToReplaceVariable = listContactCard.map((item) => ({
      name: displayName(item?.firstName, item?.lastName) || unknown,
      address: item?.streetLine || unknown,
      emailAddress: item?.email || unknown,
      phoneNumber: item.phoneNumber || unknown
    }));
    this.trudiDynamicParameterService.setDynamicParametersContactCard(
      dataToReplaceVariable
    );
  }

  getAllPrefilledReceiverIds(): Observable<PrefillUser[]> {
    const peopleList = this.propertyService.peopleList.getValue();
    return this.conversationService.listConversationByTask.pipe(
      map((conversations) =>
        this.configs?.otherConfigs?.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS
          ? []
          : conversations
      ),
      take(1),
      map((conversations: UserConversationOption[]) => {
        this.listConversation = conversations;
        const userIdSet = new Set<PrefillUser>();
        conversations
          .filter((conversation) => !conversation.isDraft)
          .forEach((conversation) => {
            userIdSet.add({
              id: conversation.userId,
              propertyId: [
                EUserPropertyType.SUPPLIER,
                EUserPropertyType.OTHER,
                EUserPropertyType.AGENT,
                EUserPropertyType.LANDLORD_PROSPECT,
                EUserPropertyType.OWNER_PROSPECT,
                EUserPropertyType.EXTERNAL
              ].includes(conversation.propertyType as EUserPropertyType)
                ? null
                : conversation.propertyId
            });
          });
        this.configs.body.prefillReceiversList.forEach((receiver) => {
          userIdSet.add({
            id: receiver.id,
            propertyId: receiver.propertyId
          });
        });
        if (
          this.configs.body.prefillReceiverTypes?.length > 0 &&
          this.configs.body.prefillReceiversList.length === 0
        ) {
          const userIds = filterReceiversByPId(
            peopleList,
            this.configs.body.prefillReceiverTypes,
            conversations
          );
          if (userIds?.length > 0) {
            userIds.forEach((user) =>
              userIdSet.add({
                id: user.id,
                propertyId: user.propertyId
              })
            );
          }
        }

        if (this.configs.body.prefillContactCardTypes?.length > 0) {
          const userIds = filterReceiversByPId(
            peopleList,
            this.configs.body.prefillContactCardTypes,
            this.listConversation
          );
          if (userIds?.length > 0) {
            userIds.forEach((userId) => {
              userIdSet.add({
                id: userId.id,
                propertyId: userId.propertyId
              });
            });
          }
        }

        if (this.listContactCard.length) {
          this.listContactCard.forEach((one) =>
            userIdSet.add({
              id: one.id,
              propertyId: one.propertyId || null
            })
          );
        }
        return uniqBy(Array.from(userIdSet), (data) => JSON.stringify(data));
      })
    );
  }

  private prefillReceivers(receivers, prefillUserIds, prefillTypes): void {
    try {
      if (
        [receivers, prefillUserIds, prefillTypes].some(
          (element) => !Array.isArray(element)
        )
      ) {
        return;
      }

      this.conversationService.listConversationByTask.subscribe();

      const typeMap = {
        [ERentManagerContactType.ANY_LANDLORD_PROSPECT_IN_TASK]:
          EUserPropertyType.LANDLORD_PROSPECT,
        [ERentManagerContactType.ANY_TENANT_PROSPECT_IN_TASK]:
          EUserPropertyType.TENANT_PROSPECT
      };

      const listTypeCheck = this.configs.body.prefillReceiverTypes.map(
        (type) => typeMap[type]
      );

      const prefillUser = receivers.filter(
        (reciver) =>
          listTypeCheck.includes(reciver.type) &&
          prefillUserIds.includes(reciver.id)
      );
      this.selectedReceivers.setValue([
        ...(this.selectedReceivers?.value || []),
        ...prefillUser
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  // TODO
  public async handlePrefillRecipientAndContactCardV2(
    configs,
    selectedTaskIds: string[]
  ) {
    let { propertyId, agencyId } =
      this.trudiSendMsgService.getIDsFromOtherService();

    if (
      this.configs?.otherConfigs.isCreateMessageType === true ||
      this.configs?.otherConfigs?.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS
    )
      propertyId = null;

    const listReciver$ = this.trudiSendMsgUserService.getListUser().pipe(
      takeUntil(this.destroy$),
      map((receivers) => {
        // Ignore map receiver when scroll select dropdown
        const currentListReceiver = this.trudiSendMsgService.getListReceiver();
        if (currentListReceiver && currentListReceiver.length > 0) {
          return receivers;
        }

        const mapReceiversFn = (receiver) => {
          const { inputReceiver, conversation } = checkExistConversation(
            this.configs,
            this.conversationService.listConversationByTask.value,
            receiver
          );
          const conversationId =
            inputReceiver?.conversationId || conversation?.id;

          if (inputReceiver) {
            const extendedData = {
              conversationId,
              disabled: inputReceiver.disabled,
              propertyId: receiver.propertyId
                ? receiver.propertyId
                : inputReceiver.propertyId
            };

            if (
              [
                EUserPropertyType.SUPPLIER,
                EUserPropertyType.TENANT_PROSPECT,
                EUserPropertyType.LANDLORD_PROSPECT
              ].includes(receiver.type)
            ) {
              extendedData['propertyId'] = null;
            }

            const matchedInputReceiver = Object.assign(receiver, extendedData);
            return matchedInputReceiver;
          }
          if (conversation) {
            const receiverInConversation = Object.assign(receiver, {
              conversationId
            });
            return receiverInConversation;
          }
          return receiver;
        };

        return receivers.map(mapReceiversFn);
      })
    );

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

    const conversationUserIds$ =
      this.conversationService.listConversationByTask.pipe(
        map((conversations) =>
          conversations.map((conversation) => conversation.userId)
        )
      );

    // combineLatest([sharedListReceiver$, conversationUserIds$])
    //   .pipe(
    //     takeUntil(
    //       this.selectedReceivers.valueChanges.pipe(
    //         filter((v) => v?.length),
    //         distinctUntilChanged()
    //       )
    //     ),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe(([receivers, prefillUserIds]) => {
    //     this.prefillReceivers(
    //       receivers,
    //       prefillUserIds,
    //       this.configs?.body?.prefillReceiverTypes
    //     );
    //   });

    const prefillReceiverIds = await firstValueFrom(
      this.getAllPrefilledReceiverIds().pipe(takeUntil(this.destroy$))
    );

    this.trudiSendMsgUserService.fetchMore({
      limit: prefillReceiverIds?.length > 20 ? prefillReceiverIds?.length : 20,
      page: 1,
      search: '',
      propertyId: propertyId,
      email_null: false,
      userDetails: this.openFrom !== TaskType.MESSAGE ? prefillReceiverIds : [],
      taskIds:
        this.configs?.otherConfigs?.createMessageFrom !==
        ECreateMessageFrom.TASK_HEADER
          ? selectedTaskIds
          : []
    });

    // this.setDefaultPrefillUser(
    //   this.listConversation,
    //   propertyId,
    //   agencyId,
    //   this.openFrom !== TaskType.MESSAGE ? prefillReceiverIds : []
    // );

    /////////////////////////////////
    const listConversation = this.listConversation;
    const userIds =
      this.openFrom !== TaskType.MESSAGE ? prefillReceiverIds : [];
    const peopleList = this.propertyService.peopleList.getValue();

    const [receivers, listContactCardNotFilterEmail] = await firstValueFrom(
      combineLatest([
        this.trudiSendMsgService.getListReceiver$(),
        this.trudiSendMsgUserService.getListUserNotFilterEmail(
          propertyId,
          agencyId,
          userIds
        )
      ]).pipe(
        filter(([array, _]) => !!array?.length),
        take(1),
        takeUntil(this.destroy$)
      )
    );

    // **************** tap logic ************************************************
    receivers.forEach((user) => {
      //input receiver from config
      const { inputReceiver, conversation } = checkExistConversation(
        this.configs,
        listConversation,
        user
      );

      // Has receiver in config
      if (inputReceiver) {
        if (user.isAppUser || (!user.isAppUser && !!user?.email?.trim())) {
          this.selectedReceivers.setValue([
            ...this.selectedReceivers.value,
            user
          ]);
        }
      } else if (conversation) {
        if (
          this.configs.body.prefillReceivers &&
          this.configs.body.receiverTypes &&
          !this.configs.body.prefillReceiversList.length &&
          this.configs.body.receiverTypes.includes(conversation.startMessageBy)
        ) {
          listConversation.find((one) => one.userId === user.id) &&
            this.selectedReceivers.setValue([
              ...this.selectedReceivers.value,
              user
            ]);
        }
      }
    });

    // **************** subscribe logic ************************************************
    const receiverTypes = new Set(this.configs.body.receiverTypes);
    const isValidType = [...receiverTypeAllowedPrefillAll].some((type) =>
      receiverTypes.has(type)
    );
    const mappedReceivers = mapReceiverConversation(
      receivers,
      this.listConversation
    );
    const listReceiver = mappedReceivers.filter((receiver) => {
      if (this.configs.otherConfigs.isCreateMessageType) {
        return receiver;
      } else {
        return isCheckedReceiversInList(receiver, { propertyId });
      }
    });

    if (
      this.configs.body.prefillReceivers &&
      !this.selectedReceivers.value?.length &&
      isValidType
    ) {
      this.selectedReceivers.setValue(
        filterReceiversByTypes(
          listReceiver.filter((receiver) =>
            listConversation.find((one) => one.userId === receiver.id)
          ),
          this.configs.body.receiverTypes
        )
      );
    }

    if (this.listContactCard?.length) {
      const listContactCard = listContactCardNotFilterEmail.filter(
        (receiver) => {
          return this.listContactCard.some((contactCard) =>
            isCheckedReceiversInList(receiver, contactCard, 'id')
          );
        }
      );
      // const listContactCardInForm = this.sendMsgForm.get(
      //   'selectedContactCard'
      // ).value;
      // this.handleReplaceContactCardData(listContactCard);
      // if (
      //   !(listContactCardInForm?.length > 0) ||
      //   listContactCard.some(
      //     (cc) =>
      //       !listContactCardInForm.some(
      //         (l) => l.id === cc.id && l.propertyId === cc.propertyId
      //       )
      //   )
      // ) {
      //   this.sendMsgForm
      //     .get('selectedContactCard')
      //     .setValue(listContactCard);
      //   this.trudiSendMsgFormService.setSelectedContactCard(
      //     listContactCard
      //   );
      // }
      // this.trudiDynamicParameterService.triggerPrefillParameter.next(true);
    }

    if (
      this.configs.body.prefillReceiverTypes?.length > 0 &&
      this.configs.body.prefillReceiversList.length === 0 &&
      !this.configs.body?.receiver?.prefillSelectedTypeItem // For case prefill user type item
    ) {
      const users = filterReceiversByPId(
        peopleList,
        this.configs.body.prefillReceiverTypes,
        listConversation
      );
      if (users?.length > 0) {
        this.selectedReceivers.setValue(
          listReceiver.filter((item) =>
            users.some(
              (user) =>
                user.id === item.id && user.propertyId === item.propertyId
            )
          )
        );
      }
    }

    // if (this.configs.body.prefillContactCardTypes?.length > 0) {
    //   const users = filterReceiversByPId(
    //     peopleList,
    //     this.configs.body.prefillContactCardTypes,
    //     listConversation
    //   );
    //   if (users?.length > 0) {
    //     const listContactCard = receivers.filter((item) =>
    //       users.some(
    //         (user) =>
    //           user.id === item.id && user.propertyId === item.propertyId
    //       )
    //     );
    //     this.handleReplaceContactCardData(listContactCard);
    //     this.sendMsgForm
    //       .get('selectedContactCard')
    //       .setValue(listContactCard);
    //     this.trudiSendMsgFormService.setSelectedContactCard(
    //       listContactCard
    //     );
    //     this.trudiDynamicParameterService.triggerPrefillParameter.next(
    //       true
    //     );
    //   }
    // }

    if (
      [ECreateMessageFrom.CONTACT, ECreateMessageFrom.TASK_STEP].includes(
        this.configs.otherConfigs.createMessageFrom
      )
    ) {
      this.trudiSendMsgService.setViewRecipientList(
        this.selectedReceivers.value
      );
    }

    this.trudiSendMsgService.setContactCardList([
      ...listContactCardNotFilterEmail.map((it) => ({
        ...it,
        disabled: false
      }))
    ]);

    return {
      recipients: [],
      contactCards: []
    };
  }

  public handlePrefillByCase(
    createMessageFrom: ECreateMessageFrom,
    users: ISelectedReceivers[],
    prefillReceiverIds: string[]
  ) {
    switch (createMessageFrom) {
      case ECreateMessageFrom.CONTACT:
        const prefillReceiverList = this.configs.body.prefillReceiversList;
        //Prospect tenant/owners
        const isProspect = this.configs.otherConfigs.isProspect;
        if (isProspect) {
          const prospectUsers = users?.filter((user) =>
            prefillReceiverList?.find((receiver) => receiver.id === user.id)
          );
          this.listContactGroup
            ?.at(0)
            ?.get('recipients')
            ?.setValue(prospectUsers);
          return;
        }
        this.listContactGroup.controls.forEach((control) => {
          if (control.value['propertyId']) {
            const propertyUsers = users.filter((user) => {
              const isUserPrefill = prefillReceiverList?.some(
                (receiver) =>
                  receiver.id === user.id &&
                  receiver.propertyId === user.propertyId
              );
              return (
                isUserPrefill && user.propertyId === control.value['propertyId']
              );
            });
            (control as FormGroup).get('recipients').setValue(propertyUsers);
          }
        });
        break;
    }
  }

  handlePrefillFileUploaded(listFile: IFile[]) {
    const listFileUploaded = [];
    const currentFileUploaded =
      this.trudiSaveDraftService.getListFileUploaded() || [];

    const processFileItem = (fileItem) => {
      if (fileItem.icsFile) {
        fileItem.uploaded = true;
      }

      if (fileItem.mediaLink) {
        const existingFile = currentFileUploaded.find(
          (item) => item.localId === fileItem.localId
        );

        if (!existingFile) {
          const localId = fileItem.localId || uuidv4();

          listFileUploaded.push({
            documentTypeId: fileItem.documentTypeId,
            title: fileItem.title || fileItem.name,
            parentId: fileItem.parentId,
            fileName: fileItem.name || fileItem.fileName,
            fileSize: fileItem.size || fileItem.fileSize,
            fileType: fileItem?.fileType?.name || fileItem.fileType,
            mediaLink: fileItem.mediaLink,
            propertyId: fileItem.propertyId,
            propertyIds: [],
            localId: localId
          });

          return {
            ...fileItem,
            canUpload: true,
            localId: localId,
            uploaded: true
          };
        }
      }

      return fileItem;
    };

    const listFilePrefill =
      listFile.map((file) => processFileItem(file?.[0] || file)) || [];

    if (listFileUploaded.length) {
      const result = unionBy(currentFileUploaded, listFileUploaded, 'localId');
      this.trudiSaveDraftService.setListFileUploaded(result);
    }

    return listFilePrefill;
  }
}
