import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { debounce, uniqBy } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import {
  ERentManagerContactType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ChatGptService, EBoxMessageType } from '@services/chatGpt.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { TIME_FORMAT } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { displayName } from '@shared/feature/function.feature';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { IFile } from '@shared/types/file.interface';
import {
  FormFile,
  FormFileInfo,
  ReiFormData
} from '@shared/types/rei-form.interface';
import { ITaskDetail } from '@shared/types/task.interface';
import { TrudiResponseVariable } from '@shared/types/trudi.interface';
import { TargetFromFormMessage } from '@shared/types/user.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  IGetListContactTypeResponse,
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { EFallback } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import {
  filterReceiversByPId,
  filterReceiversByTypes,
  isCheckedReceiversInList,
  replaceVariables
} from '@/app/trudi-send-msg/utils/helper-functions';
import {
  defaultConfigs,
  receiverTypeAllowedPrefillAll,
  trudiInfo
} from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  IDefaultValueTrudiSendMsg,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType,
  UserConversationOption
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { sendOptionType } from '@/app/trudi-send-msg/components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { IListDynamic } from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import {
  MAP_TYPE_RECEIVER_TO_LABEL,
  MAP_TYPE_RECEIVER_TO_SUBLABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  ECreateMessageFrom,
  ECreateMessageType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'trudi-send-msg-body',
  templateUrl: './trudi-send-msg-body.component.html',
  styleUrls: ['./trudi-send-msg-body.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class TrudiSendMsgBodyComponent implements OnInit, OnChanges, OnDestroy {
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly ISendMsgType = ISendMsgType;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public currentProperty;
  public createMessageType = ECreateMessageType;

  constructor(
    private trudiService: TrudiService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private userService: UserService,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private elementRef: ElementRef,
    public fileService: FilesService,
    public companyEmailSignatureService: CompanyEmailSignatureService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private chatGptService: ChatGptService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private toastService: ToastrService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private uploadFromCRMService: UploadFromCRMService,
    public cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() rawMsg: string = '';
  @Input() openFrom;
  @Input() listOfFiles: IFile[] = [];
  @Input() listContactCard: ISelectedReceivers[] = [];
  @Input() prefillVariables: Record<string, string> | TrudiResponseVariable =
    {};
  @Input() reiformData: ReiFormData;
  @Input() listDynamicParams: IListDynamic[] = [];
  @Input() isShowEmbedDynamicFieldBtn: boolean = false;
  @Input() selectedTaskIds: string[] = [];
  @Input() prefillData: ICommunicationStep;
  @Input() listUser: ISelectedReceivers[] = [];
  @Output() template = new EventEmitter<string>();
  public isOpenFromCalendar: boolean = false;
  private popoverElm: HTMLElement | null = null;
  public currentReiformData;
  public currentCompany: ICompany;
  public searchUser = debounce((value: string) => {
    this.trudiSendMsgService.setListReceiver([]);
    this.trudiSendMsgUserService.fetchMore({
      userDetails: this.selectedReceivers.value?.map((receiver) => {
        const mappedValue = {
          id: receiver.id,
          propertyId: receiver.propertyId
        };

        const secondaryEmailId =
          receiver.secondaryEmail?.id || receiver.secondaryEmailId;

        if (secondaryEmailId) {
          mappedValue['secondaryEmailId'] = secondaryEmailId;
        }

        return mappedValue;
      }),
      search: value,
      page: 1,
      taskIds:
        this.configs?.otherConfigs?.createMessageFrom !==
        ECreateMessageFrom.TASK_HEADER
          ? this.selectedTaskIds
          : []
    });
  }, 200);
  public listContactTypes: IGetListContactTypeResponse[] = [];
  // TODO: remove this, move to common select component
  @ViewChild('ngSelectSender', { static: true })
  ngSelectSender: NgSelectComponent;
  listConversation: UserConversationOption[];

  // form getter
  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get selectedSender(): AbstractControl {
    return this.sendMsgForm?.get('selectedSender');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get msgTitle(): AbstractControl {
    return this.sendMsgForm?.get('msgTitle');
  }

  get msgContent(): AbstractControl {
    return this.sendMsgForm?.get('msgContent');
  }

  get emailSignature(): AbstractControl {
    return this.sendMsgForm?.get('emailSignature');
  }

  get listOfFilesControl(): AbstractControl {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get listOfFilesReiFormSignRemote() {
    if (this.reiformData) return [this.reiformData];
    return this.trudiSendMsgService.getListFilesReiFormSignRemote();
  }

  get attachMediaFiles(): AbstractControl {
    return this.sendMsgForm?.get('attachMediaFiles');
  }

  get selectedContactCardControl() {
    return this.sendMsgForm?.get('selectedContactCard');
  }

  get formDefaultValue(): IDefaultValueTrudiSendMsg {
    return {
      selectedSender:
        this.listSender$.value.find(
          (sender) => sender.id === this.configs.body.prefillSender
        ) || this.listSender$.value[0],
      msgTitle: this.getPrefillMsgTitle(),
      selectedReceivers: [],
      listOfFiles: [],
      attachMediaFiles: [],
      isRequiredContactCard: this.configs.body.contactCard.required,
      emailSignature: this.configs.body.hasEmailSignature,
      externalSendTo: this.configs.body.prefillExternalSendTo,
      property: null
    };
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get listReceiver(): ISelectedReceivers[] {
    return this.trudiSendMsgService.getListReceiver();
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  private subscriber = new Subject<void>();
  prefillMsg: string = '';
  tenancyId: string = '';
  listSender$: BehaviorSubject<TargetFromFormMessage[]> = new BehaviorSubject<
    TargetFromFormMessage[]
  >([...trudiInfo]);
  ngOnInit(): void {
    this.isOpenFromCalendar =
      this.openFrom === EUserPropertyType.CALENDAR_EVENT_BULK_CREATE_TASKS;
    this.trudiSendMsgService.listSender$ = this.listSender$;
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (!res) return;
        this.currentCompany = res;
      });
    this.getSenderList();
    this.initForm();
    this.getReceiverList();
    this.getContactTypeList();
    this.subscribeTaskDetailData();
    this.initPrefillMsg();
    this.onChangeFormGroup();
    this.trudiDynamicParameterService.triggerPrefillParameter
      .pipe(takeUntil(this.subscriber))
      .subscribe((_data) => {
        setTimeout(() => {
          this.prefillDynamicParameters(_data);
        }, 0);
      });
    this.prefillDynamicParameters();
    this.subscribeControls();
    this.getCurrentProperty();
  }

  getCurrentProperty() {
    this.currentProperty = this.taskService.currentTask$?.value?.property;
    if (this.configs?.otherConfigs.isCreateMessageType === true)
      this.currentProperty = null;
  }

  subscribeControls() {
    this.sendMsgForm
      .get('selectedSender')
      .valueChanges.pipe(takeUntil(this.subscriber))
      .subscribe((value) => {
        if (!value) return;
        this.prefillDynamicParameters();
      });

    this.selectedReceivers.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((users) => {
        const optionType = users?.some((user) => user.isAppUser)
          ? sendOptionType.APP
          : sendOptionType.EMAIL;
        this.trudiSendMsgFormService.triggerUpdateSendOption.next({
          type: optionType,
          defaultValue: this.configs.body.defaultSendOption
        });
      });

    this.sendOption.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((option) => {
        let hasEmailSignature = option === sendOptionType.EMAIL;
        if (!hasEmailSignature) {
          hasEmailSignature = this.selectedReceivers.value?.some(
            (item) => !item.isAppUser
          );
        }
        this.companyEmailSignatureService.hasSignature.next(hasEmailSignature);
        this.companyEmailSignatureService.selectedButton.next(
          hasEmailSignature
        );
      });
  }

  prefillDynamicParameters(changePrefill: boolean = false) {
    if (EStepAction[this.configs?.trudiButton?.action?.toLocaleUpperCase()]) {
      this.trudiDynamicParameterService.setDynamicParamaterPm(
        this.selectedSender?.value
      );
      if (this.listOfFiles) {
        const fileNames = this.listOfFiles
          .map((item) => item['0']?.name)
          .join(', ');
        const senderNames = this.getSenderName(
          this.listOfFiles,
          this.selectedSender?.value?.name
        ).join('; ');
        this.trudiDynamicParameterService.setDynamicParametersConversationFiles(
          {
            file_name: String(fileNames) ?? '',
            file_sender_name: senderNames ?? ''
          }
        );
      }
      let newPrefillMsg = `${this.trudiDynamicParameterService.prefillDynamicParameters(
        this.configs?.body?.receiver?.prefillSelectedTypeItem
      )} `;

      if (newPrefillMsg === this.prefillMsg && changePrefill) {
        this.prefillMsg = newPrefillMsg + ' ';
      } else {
        this.prefillMsg = newPrefillMsg;
      }

      if (this.prefillMsg) {
        this.msgContent.setValue(this.prefillMsg);
        this.handleChangeOriginContent(this.prefillMsg);
        this.template.emit(this.prefillMsg);
      }
    }
  }
  getSenderName(files, senderName) {
    const listFileModified = files.map((item) => {
      if (item['0']?.user) {
        item['senderName'] = [
          item['0']?.user?.firstName,
          item['0']?.user?.lastName
        ]
          .filter(Boolean)
          .join(' ');
      } else {
        item['senderName'] = senderName;
      }
      return item.senderName;
    });
    return listFileModified;
  }
  // Init functions
  initForm() {
    this.trudiSendMsgFormService.buildForm(this.formDefaultValue);
    if (!!this.configs.body.defaultSendOption) {
      this.sendOption.setValue(this.configs.body.defaultSendOption);
    }
    if (this.listOfFiles) {
      this.listOfFilesControl.setValue(this.listOfFiles);
    }

    if (this.listContactCard) {
      this.selectedContactCardControl.setValue(this.listContactCard);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reiformData'] && changes['reiformData']?.currentValue) {
      this.mapReiformData(changes);
    }
    if (changes['listUser']?.currentValue) {
      this.trudiSendMsgService.setListReceiver([
        ...this.trudiSendMsgService.getListReceiver(),
        ...this.listUser
      ]);
    }
    if (changes['configs']?.currentValue) {
      this.companyEmailSignatureService.selectedButton.next(
        this.configs.body.hasEmailSignature
      ); // checek focus Email Signature. Default True
    }
    if (
      changes['rawMsg']?.currentValue &&
      !this.configs.body.applyAIGenerated
    ) {
      this.initPrefillMsg();
    }

    if (changes['listOfFiles']?.currentValue) {
      this.listOfFilesControl &&
        this.listOfFilesControl.setValue(this.listOfFiles || []);
    }
  }

  mapReiformData(changes: SimpleChanges) {
    this.reiformData = { ...changes['reiformData']?.currentValue };
    if (Object.keys(this.reiformData).length) {
      this.reiformData.formDetail.formFiles =
        this.reiformData.formDetail.formFiles.map((file) => ({
          ...file,
          fileIcon: this.fileService.getFileIcon(file.filename),
          shortName: file.filename.split('.')[0]
        })) as FormFile[];
      this.reiformData.formFileInfo = {
        ...this.reiformData.formFileInfo,
        fileIcon: this.fileService.getFileIcon(
          this.reiformData?.formFileInfo.fileName
        ),
        shortName: this.reiformData.formFileInfo.fileName.split('.')[0]
      } as FormFileInfo;
    }
  }

  initPrefillMsg() {
    const photos = this.configs?.body?.prefillPhotoFiles;
    if (photos?.length) {
      this.attachMediaFiles && this.attachMediaFiles?.setValue(photos);
    }
    this.updatePrefillVariables();
  }

  handleValueChange(value: string) {
    this.msgContent.setValue(value);
  }

  handleChangeOriginContent(value: string) {
    this.trudiSendMsgFormService.setOriginMsgContent(value);
    this.msgContent.updateValueAndValidity();
  }

  subscribeTaskDetailData() {
    this.trudiService.getTrudiResponse
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (res) {
          this.updatePrefillVariables({
            ...res.data?.[0]?.body?.variable,
            '{amount}': this.prefillVariables?.['{amount}'] ?? ''
          });
          const detailData = res.data && res.data[0]?.taskDetail;
          if ((detailData as ITaskDetail)?.variable) {
            this.updatePrefillVariables({
              ...(detailData as ITaskDetail).variable,
              '{amount}': this.prefillVariables?.['{amount}'] ?? ''
            });
          }
        }
      });
  }

  dropFile(event) {
    if (this.configs.body.tinyEditor.attachBtn.attachOptions.disabledUpload)
      return;
    this.listOfFilesControl.setValue([
      ...this.listOfFilesControl.value,
      ...[event]?.flatMap((item) => item)
    ]);
  }

  editorAddFileComputer() {
    const button = this.elementRef.nativeElement.querySelector(
      '#trudi-send-msg-upload-btn'
    );
    button?.click();
  }

  editorAddContactCard() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.trudiAddContactCardService.setPopupState({
      addContactCard: true
    });
  }

  editorAddFileFromCrm() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: true
    });
  }

  addReiForm() {
    this.trudiSendMsgService.setPopupState({
      addReiForm: true,
      selectDocument: true,
      sendMessage: false
    });
  }

  updatePrefillVariables(
    updatedVariables?: Record<string, string> | TrudiResponseVariable
  ) {
    const taskDetailData = this.taskService.currentTask$?.getValue()
      ?.trudiResponse?.data?.[0]?.taskDetail as ITaskDetail;

    const pmVariables = {
      '{Role}': this.selectedSender?.value?.title,
      '{role}': this.selectedSender?.value?.title,
      '{Name}': this.selectedSender?.value?.name,
      '{name}': this.selectedSender?.value?.name,
      '{property manager name}': this.selectedSender?.value?.name ?? ''
    };
    const defaultVariables = {
      '{maintenance_object}': taskDetailData?.maintenanceObject ?? '',
      '{maintenance_summary}': taskDetailData?.description ?? '',
      '{expenditure_limit}': this.prefillVariables?.['{expenditure_limit}']
        ? '$' + this.prefillVariables?.['{expenditure_limit}']
        : '',
      '{maintenance expenditure limit}': this.prefillVariables?.[
        '{maintenance expenditure limit}'
      ]
        ? '$' + this.prefillVariables?.['{maintenance expenditure limit}']
        : '',
      '{amount}': this.prefillVariables?.['{amount}'] ?? '',
      '{maintenance issue}':
        this.prefillVariables?.['{maintenance issue}'] ?? '',
      '{property address}':
        this.taskService.currentTask$.value?.property?.streetline ?? '',
      '{Agency}': this.currentCompany?.name ?? '',
      '{agency}': this.currentCompany?.name ?? '',
      '{Agency Name}': this.currentCompany?.name ?? '',
      '@petType': taskDetailData?.petType?.join(', ') || '',
      '@petInfomation': taskDetailData?.description || '',
      '{content}': ''
    };
    defaultVariables['{expenditure_limit}'] = defaultVariables[
      '{expenditure_limit}'
    ]?.replace(/\$+/, '$');
    defaultVariables['{maintenance expenditure limit}'] = defaultVariables[
      '{maintenance expenditure limit}'
    ]?.replace(/\$+/, '$');
    this.prefillVariables = {
      ...this.prefillVariables,
      ...pmVariables,
      ...defaultVariables,
      ...updatedVariables
    }; // updatedVariables will overwrite the key and return the newest value
    if (
      !this.configs.body.applyAIGenerated &&
      (!EStepAction[this.configs?.trudiButton?.action?.toLocaleUpperCase()] ||
        this.configs?.body?.receiver?.prefillSelectedTypeItem)
    ) {
      this.prefillMsg =
        replaceVariables(this.prefillVariables, this.rawMsg) + ' ';
      const varibaleTemplate = this.excludeFieldsFromKeyObject(
        this.prefillVariables,
        pmVariables
      );
      this.template.emit(replaceVariables(varibaleTemplate, this.rawMsg));
    }
  }

  private getSenderList() {
    this.userService.userInfo$
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (res) {
          this.listSender$.next([
            {
              index: 1,
              id: res.id,
              name: res.firstName + ' ' + res.lastName,
              firstName: res.firstName,
              lastName: res.lastName,
              avatar: res.googleAvatar,
              title: res.title
            },
            ...trudiInfo
          ]);
        }
      });
  }

  checkExistConversation(
    listConversation: UserConversationOption[],
    receiver: ISelectedReceivers
  ) {
    const inputReceiver = this.configs.body.prefillReceiversList.find((ir) =>
      isCheckedReceiversInList(receiver, ir, 'id')
    );
    const conversation = listConversation.find((c) =>
      isCheckedReceiversInList(receiver, c, 'userId')
    );
    return { inputReceiver, conversation };
  }

  setDefaultPrefillUser(
    listConversation: UserConversationOption[],
    propertyId: string,
    agencyId: string,
    userIds: PrefillUser[]
  ) {
    const peopleList = this.propertyService.peopleList.getValue();

    combineLatest([
      this.trudiSendMsgService.getListReceiver$(),
      this.trudiSendMsgUserService.getListUserNotFilterEmail(
        propertyId,
        agencyId,
        userIds
      )
    ])
      .pipe(
        filter(([array, _]) => !!array?.length),
        take(1),
        takeUntil(this.subscriber),
        tap(([users, _]) => {
          users.forEach((user) => {
            //input receiver from config
            const { inputReceiver, conversation } = this.checkExistConversation(
              this.listConversation,
              user
            );

            // Has receiver in config
            if (inputReceiver) {
              if (
                user.isAppUser ||
                (!user.isAppUser && !!user?.email?.trim())
              ) {
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
                this.configs.body.receiverTypes.includes(
                  conversation.startMessageBy
                )
              ) {
                this.listConversation.find((one) => one.userId === user.id) &&
                  this.selectedReceivers.setValue([
                    ...this.selectedReceivers.value,
                    user
                  ]);
              }
            }
          });
        })
      )
      .subscribe(([receivers, listContactCardNotFilterEmail]) => {
        const receiverTypes = new Set(this.configs.body.receiverTypes);
        const isValidType = [...receiverTypeAllowedPrefillAll].some((type) =>
          receiverTypes.has(type)
        );
        const listReceiver = receivers.filter((receiver) => {
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

        if (this.configs.body.prefillContactCardTypes?.length > 0) {
          const users = filterReceiversByPId(
            peopleList,
            this.configs.body.prefillContactCardTypes,
            this.listConversation
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
            this.trudiDynamicParameterService.triggerPrefillParameter.next(
              true
            );
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

  compareWith(receiverA: ISelectedReceivers, receiverB: ISelectedReceivers) {
    return (
      receiverA.id === receiverB.id &&
      receiverA.propertyId == receiverB.propertyId
    );
  }

  private getReceiverList() {
    let { propertyId, agencyId } =
      this.trudiSendMsgService.getIDsFromOtherService();
    if (this.configs?.otherConfigs.isCreateMessageType === true)
      propertyId = null;

    const listReciver$ = this.trudiSendMsgUserService.getListUser().pipe(
      takeUntil(this.subscriber),
      map((receivers) => {
        // Ignore map receiver when scroll select dropdown
        const currentListReceiver = this.trudiSendMsgService.getListReceiver();
        if (currentListReceiver && currentListReceiver.length > 0) {
          return receivers;
        }

        const mapReceiversFn = (receiver) => {
          const { inputReceiver, conversation } = this.checkExistConversation(
            this.listConversation,
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
        takeUntil(this.subscriber)
      )
      .subscribe(([receivers, prefillUserIds]) => {
        this.prefillReceivers(
          receivers,
          prefillUserIds,
          this.configs?.body?.prefillReceiverTypes
        );
      });

    this.getAllPrefilledReceiverIds()
      .pipe(takeUntil(this.subscriber))
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
              ? this.selectedTaskIds
              : []
        });
      });
  }

  private getContactTypeList() {
    if (!this.configs.body.receiver.isShowContactType) {
      return;
    }
    let body = {
      taskIds: this.selectedTaskIds
    };
    this.trudiSendMsgUserService
      .getListContactTypeApi(body)
      .pipe(
        takeUntil(this.subscriber),
        switchMap((res) => {
          return of(
            res.map((item, index) => ({
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
            }))
          );
        })
      )
      .subscribe((res) => {
        this.listContactTypes = res;
      });
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
        ...this.selectedReceivers.value,
        ...prefillUser
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  public get userListLoading$() {
    return this.trudiSendMsgUserService.isLoading$;
  }

  getAllPrefilledReceiverIds(): Observable<PrefillUser[]> {
    const peopleList = this.propertyService.peopleList.getValue();
    return this.conversationService.listConversationByTask.pipe(
      take(1),
      map((conversations: UserConversationOption[]) => {
        this.listConversation = conversations;
        const userIdSet = new Set<PrefillUser>();
        conversations.forEach((conversation) => {
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

  getNextPage() {
    if (this.trudiSendMsgUserService.lastPage) return;
    this.trudiSendMsgUserService.getNextPage();
  }

  private onChangeFormGroup() {
    this.sendMsgForm.valueChanges.subscribe((_value) => {
      this.updatePrefillVariables();
    });
  }

  getPrefillMsgTitle() {
    const prefillMsgTitle = this.configs?.body?.prefillTitle;
    const maxCharacter = this.configs?.body?.title?.maxCharacter;
    if (prefillMsgTitle?.length > maxCharacter) {
      return `${prefillMsgTitle.slice(0, maxCharacter - 3)}...`;
    } else {
      return prefillMsgTitle;
    }
  }

  onClearContact(_contact: ISelectedReceivers, indexContact: number) {
    if (this.selectedContactCardControl.value.length > 0) {
      const selectedContactCard = this.selectedContactCardControl.value.filter(
        (_it, index) => index !== indexContact
      );
      this.sendMsgForm.get('selectedContactCard').setValue(selectedContactCard);
      this.trudiSendMsgFormService.setSelectedContactCard(selectedContactCard);
    }
  }

  ngOnDestroy() {
    this.trudiSendMsgService.setListReceiver([]);
    this.chatGptService.onLoading.next({
      type: EBoxMessageType.POPUP,
      status: false
    });
    this.chatGptService.onGenerated.next({
      type: EBoxMessageType.POPUP,
      status: false
    });
    this.subscriber.next();
    this.subscriber.complete();
  }

  isObject(obj) {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  }

  excludeFieldsFromKeyObject(object, objectWithKeyExclude) {
    let objectClone = { ...object };
    if (!this.isObject(object) || !this.isObject(objectWithKeyExclude))
      return {};
    const keysExclude = Object.keys(objectWithKeyExclude);
    for (let keyExclude of keysExclude) {
      delete objectClone[keyExclude];
    }
    return objectClone;
  }

  isFormScheduleMsg() {
    return (
      this.configs.footer.buttons.sendType ===
      ISendMsgType.EVENT_EDIT_SCHEDULED_MSG
    );
  }

  // TODO: remove this, move to common select component
  handleClickOutsideSender() {
    if (this.ngSelectSender) {
      this.ngSelectSender?.close();
    }
  }

  getListContactSupplier() {
    return this.sendMsgForm
      .get('selectedContactCard')
      ?.value?.filter((item) => item.type === EConfirmContactType.SUPPLIER)
      ?.map((supplier) => ({
        supplierName:
          displayName(supplier?.firstName, supplier?.lastName) ||
          EFallback.UNKNOWN,
        contactNumber: supplier?.phoneNumber
          ? this.phoneNumberFormatPipe.transform(supplier?.phoneNumber)
          : EFallback.UNKNOWN,
        emailAddress: supplier?.email || EFallback.UNKNOWN,
        website: supplier?.landingPage || EFallback.UNKNOWN
      }));
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

  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    const scrollTop = event.target.scrollTop;
    const isPopoverGoesOverScrollContainer = scrollTop > 250; // height from scroll container to the button contains popover
    const isHiding = this.popoverElm?.classList.contains('d-none');
    if (isPopoverGoesOverScrollContainer && !isHiding) {
      this.popoverElm = document.querySelector('.ai-setting-gen-msg-overlay');
      this.popoverElm?.classList.add('d-none');
    } else if (!isPopoverGoesOverScrollContainer && isHiding) {
      this.popoverElm?.classList.remove('d-none');
    }
  }
}
