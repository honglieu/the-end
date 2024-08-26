import { cloneDeep, isEqual, omit } from 'lodash-es';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationSkipped,
  NavigationStart,
  Params,
  Router,
  Scroll
} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  first,
  map,
  mergeMap,
  takeUntil,
  tap,
  distinctUntilChanged,
  switchMap,
  combineLatest
} from 'rxjs';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import {
  MESSAGES_MOVING_TO_TASK,
  MESSAGE_DELETED,
  MESSAGE_MOVED,
  MESSAGE_MOVING_TO_TASK,
  MESSAGE_REOPENED,
  MESSAGE_RESOLVED,
  getTitleToastMovingProcessing
} from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import {
  TaskDataPayloadChangeStatus,
  TaskItem
} from '@shared/types/task.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { TrudiTab } from '@trudi-ui';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { InboxToolbarComponent } from './components/inbox-toolbar/inbox-toolbar.component';
import {
  EUpdateMultipleTaskAction,
  InboxToolbarService,
  toolbarConfig
} from './services/inbox-toolbar.service';
import {
  ErrorMessages,
  LABEL_EXTERNAL_ID_MAIL_BOX,
  LABEL_NAME_OUTLOOK,
  PHONE_PREFIXES,
  POSITION_MAP
} from '@services/constants';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask,
  IParticipant,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { EInboxQueryParams, EMailBoxStatus } from '@shared/enum/inbox.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { InboxSidebarService } from './services/inbox-sidebar.service';
import { EmailApiService } from './modules/email-list-view/services/email-api.service';
import {
  EmailItem,
  ICheckMoveMailFolderResponse,
  IEmailMoveToAction
} from './modules/email-list-view/interfaces/email.interface';
import { InboxService } from './services/inbox.service';
import {
  EInboxAction,
  EPopupMoveMessToTaskState,
  ERouterLinkInbox
} from './enum/inbox.enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  EActionSyncResolveMessage,
  EInboxFilterSelected,
  EMessageQueryType,
  IConversationsConfirmProperties
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { EUserPropertyType, UserStatus } from '@shared/enum/user.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ConversationService } from '@services/conversation.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import {
  ETypeMessage,
  ISelectedReceivers,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import {
  EBulkSendMethod,
  ECreateMessageFrom
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  ISocketSyncTaskActivityToPT,
  SyncPropertyDocumentStatus
} from '@shared/types/socket.interface';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { EMessageMenuOption } from './modules/message-list-view/interfaces/message.interface';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { displayName } from '@shared/feature/function.feature';
import { EmailViewService } from './modules/email-list-view/services/email-view.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SocketType } from '@shared/enum/socket.enum';
import {
  EToastCustomType,
  EToastSocketTitle
} from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { FolderService } from './services/inbox-folder.service';
import { getDeletedItemsFolderExternalId } from '@/app/dashboard/modules/inbox/utils/function';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { getOS } from '@shared/utils/helper-functions';
import { EPlatform } from '@shared/enum/trudi';
import { TaskFolderStoreService } from './services/task-folder-store.service';
import { TrudiConfirmService } from '@trudi-ui';
import { CompanyService } from '@services/company.service';
import {
  EModalID,
  ModalManagementService
} from '@/app/dashboard/services/modal-management.service';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { ECreatePopupOptionType } from '@/app/task-detail/enums/task-detail.enum';
import { UtilsService } from '@/app/dashboard/services/utils.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EDataE2EMailFolder } from '@shared/enum/E2E.enum';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import { IListTaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { AppRouteName } from '@shared/enum/app-route-name.enum';
import { PropertiesService } from '@services/properties.service';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  IGetInfoTasksForPrefillDynamicBody,
  ITaskRow,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import { filter, finalize } from 'rxjs/operators';
import { AddToTaskWarningService } from './components/add-to-task-warning/add-to-task-warning.service';
import { ContactTitleByConversationPropertyPipe } from '@/app/shared';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';

export interface InboxQueryParams {
  inboxType: string;
  status?: TaskStatusType;
  taskStatus?: string;
  taskTypeID?: string;
}

@Component({
  selector: 'inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  providers: [EmailApiService]
})
export class InboxComponent implements OnInit, OnDestroy {
  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  @ViewChild('menu') triggerMenu: TriggerMenuDirective;
  @ViewChild('folderMenu')
  folderMenu: NzDropdownMenuComponent;
  @ViewChild('moveOptionMenu')
  moveToOptionMenu: NzDropdownMenuComponent;

  @ViewChild('groupList') groupList: TemplateRef<HTMLElement>;
  public inboxTabs: TrudiTab<InboxQueryParams>[] = [
    {
      title: 'My inbox',
      link: '.',
      queryParam: {
        inboxType: TaskStatusType.my_task
      }
    },
    {
      title: 'Team inbox',
      link: '.',
      queryParam: {
        inboxType: TaskStatusType.team_task
      }
    }
  ];

  private unsubscribe = new Subject<void>();
  public activePath = '';
  private _previousRoute = '';
  private componentRef: ComponentRef<InboxToolbarComponent>;
  private overlayRef: OverlayRef;
  private inboxItems: TaskItem[] | EmailItem[] | ITaskRow[] = [];
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public hasInboxContentMargin = false;
  public loadingAction = false;
  public isShowInboxFilter = true;
  public inboxQueryParams = EInboxQueryParams;
  public visiblePageContent: boolean;
  public totalTask: number = 0;
  public isShowModalForward: boolean = false;
  public isShowModalCreateTask: boolean = false;
  readonly EMailBoxStatus = EMailBoxStatus;
  private currentParams: Params;
  private currentMailboxId: string;
  private currentMailboxIdEmailFolder: string;
  private isSameFolder: boolean;
  public listConversation: IListConvertMultipleTask;
  public createTaskByCateType = CreateTaskByCateOpenFrom;
  public isCreatePopupState: boolean = false;
  public dataConvert: IListConversationConfirmProperties[];
  public isShowModalConfirmProperties: boolean = false;
  public isShowSyncNoteRmPopup: boolean = false;
  public isActionSyncConversationToRM: boolean = false;
  public listConversationConfirmProperties: IConversationsConfirmProperties = {
    listConversationMove: [],
    listConversationNotMove: []
  };
  public listConversationSelected: PreviewConversation[];
  public dataConfirmedProperties: PreviewConversation[];
  readonly EUserPropertyType = EUserPropertyType;
  readonly SYNC_TYPE = SyncMaintenanceType;
  public isShowPopupSendBulkMsg: boolean = false;
  public isShowBulkSendMethod = false;
  public listDynamicFieldData: string[];
  public prefillData: ICommunicationStep;
  public sendMessageConfigs;
  public isDisabledSaveToRM = {
    isCheckSyncingStatus: false,
    isArchivedMailbox: false,
    isRmEnvironment: false
  };
  public isDisabledSaveToPT = {
    isCheckSyncingStatus: false
  };
  public isDisabledSyncActivity = false;

  public createNewConversationConfigs;
  private readonly defaultCreateNewConversationConfigs = {
    'header.title': 'Bulk send email',
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.receiver.isShowContactType': true,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.prefillReceivers': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.prefillReceiversList': [],
    'otherConfigs.isCreateMessageType': false,
    'header.icon': 'energy'
  };
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  readonly MessageType = ETypeMessage;
  readonly TaskType = TaskType;
  public createdTasks: IListConversationConfirmProperties[];
  public taskFolders: ITaskFolder[];
  public threadIds: string[];
  public conversationIds: string[];
  public currentLabelId: string;
  public openByModalExistingTask: boolean;
  public optionCreateTaskMultiple: ECreatePopupOptionType;

  public popupState: EPopupMoveMessToTaskState;
  public EPopupState = EPopupMoveMessToTaskState;
  public subTitleMoveToTask = '';
  public listConversationsSyncing = [];
  public showBackBtn: boolean = false;
  public createdTaskConfigs: IConfigs = cloneDeep(defaultConfigs);
  public openFrom: CreateTaskByCateOpenFrom =
    CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK;
  public EInboxAction = EInboxAction;
  public listUser: ISelectedReceivers[] = [];
  public areaCode: string;
  public isRMEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  public isShowNavigateSyncNotePopup: boolean = false;
  public keyupEvent;
  private isDisabledToolbar: ICheckMoveMailFolderResponse = {
    inbox: false,
    emailFolders: [],
    resolvedEnquiries: false,
    deletedEnquiries: false
  };
  private taskTemplate: IListTaskTemplate;
  public visible = false;
  private fireworksTimeout: NodeJS.Timeout = null;
  public moveToFolderId = '';
  public selectedFolderId: string;
  public isDragDropMessage: boolean;
  public isFromVoiceMail: boolean;
  private toolbarConfigDefault: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.ADD_TO_TASK,
        icon: 'taskNewIcon',
        label: 'Add to task',
        dataE2e: 'tool-bar-add-to-task',
        action: () => {},
        children: [
          {
            key: EInboxAction.CREATE_NEW_TASK,
            label: 'Create new task',
            description: 'Create a new task and add messages to this task',
            hasSpecialStyle: true,
            dataE2e: 'tool-bar-create-new-task',
            action: () => {
              this.showWarningAddToTask(this.handleCreateNewTask);
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_TASK,
            label: 'Add to existing task',
            description: 'Add messages to an existing task',
            hasSpecialStyle: true,
            action: () => {
              this.showWarningAddToTask(this.handleMoveMessToExistTask);
            }
          },
          {
            key: EInboxAction.BULK_CREATE_TASKS,
            label: 'Bulk create tasks',
            description:
              'Create multiple tasks at once - one task for each message selected',
            hasSpecialStyle: true,
            action: () => {
              this.showWarningAddToTask(this.handleBulkCreateTasks);
            },
            hideOption: false
          }
        ]
      },
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        key: EInboxAction.SEND_MESSAGE,
        icon: 'mailThin',
        label: 'Send email',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-send-message',
        action: () => {
          this.handleSendMessage();
        }
      },
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        icon: 'deleteIconOutline',
        label: 'Delete',
        key: EInboxAction.DELETE,
        dataE2e: 'tool-bar-delete',
        action: () => {
          this.handleConfirmDelete();
        }
      },
      {
        icon: 'greyThreeDotHorizontal',
        label: 'More',
        key: EInboxAction.MORE,
        dataE2e: 'tool-bar-more',
        action: () => {},
        children: [
          {
            key: EInboxAction.MOVE_TO_FOLDER,
            icon: 'iconMoveV3',
            label: 'Move to folder',
            tooltip: '',
            dataE2e: 'tool-bar-move-to-folder',
            action: () => {
              this.handleMoveMessToEmailFolder();
            },
            disabled: !!this.isDisabledToolbar.emailFolders.length
          },
          {
            key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
            icon: 'conversationExport',
            label: 'Export conversation history',
            action: () => {},
            grandchildren: [
              {
                key: EInboxAction.SAVE_TO_PROPERTY_TREE,
                icon: 'archive',
                label: 'Save to Property Tree',
                dataE2e: 'tool-bar-save-to-pt',
                action: () => {
                  this.handleSaveToCRM(this.listConversationSelected);
                }
              },
              {
                key: EInboxAction.DOWNLOAD_AS_PDF,
                icon: 'iconDownload',
                label: 'Download as PDF',
                action: () => {
                  this.handleSaveToCRM(this.listConversationSelected, true);
                }
              }
            ]
          },
          {
            key: EInboxAction.EXPORT_TASK_ACTIVITY,
            icon: 'conversationExport',
            label: 'Export task activity',

            action: () => {},
            grandchildren: [
              {
                key: EInboxAction.SAVE_TO_PROPERTY_TREE,
                icon: 'archive',
                disabled: this.isDisabledSyncActivity,

                label: 'Save to Property Tree ',
                action: () => {
                  this.handleSyncTasksActivity();
                }
              },
              {
                key: EInboxAction.DOWNLOAD_AS_PDF,
                icon: 'iconDownload',
                label: 'Download as PDF',
                action: () => {
                  this.handleSyncTasksActivity(true);
                }
              }
            ]
          },
          {
            key: EInboxAction.REPORT_SPAM,
            icon: 'alertOctagonv2',
            label: 'Report spam',
            dataE2e: 'tool-bar-report-spam',
            action: () => {
              this.handleReportSpam(TaskStatusType.inprogress);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'resolved-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.SAVE_TO_RENT_MANAGER,
        icon: 'archive',
        label: 'Save to Rent Manager',
        action: () => {
          this.handleSaveToCRM(this.listConversationSelected);
        }
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: EInboxAction.REPORT_SPAM,
        icon: 'alertOctagonv2',
        label: 'Report spam',
        action: () => {
          this.handleReportSpam(TaskStatusType.inprogress);
        }
      },
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        icon: 'deleteIconOutline',
        label: 'Delete',
        key: EInboxAction.DELETE,
        dataE2e: 'tool-bar-delete',
        action: (event?: MouseEvent) => {
          this.handleConfirmDelete(event);
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'deleted-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: EInboxAction.REPORT_SPAM,
        icon: 'alertOctagonv2',
        label: 'Report spam',
        action: () => {
          this.handleReportSpam(TaskStatusType.inprogress);
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    spam: [
      {
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected();
        }
      }
    ],
    mailfolder: [
      {
        key: EInboxAction.MOVE_MESSAGE,
        icon: 'nextArrowBold',
        label: 'Move to',
        action: () => {
          this.refetchCheckMoveToFolder$.next();
        },
        children: [
          {
            key: EInboxAction.MOVE_MESSAGE_TO_INBOX,
            dataE2e: EDataE2EMailFolder.MOVE_TO_INBOX,
            label: 'Inbox',
            disabled: this.isDisabledToolbar.inbox,
            action: () => {
              this.handleMoveMessages(TaskStatusType.inprogress);
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_EMAIL,
            label: 'Email folder',
            action: () => {
              this.handleMoveMessToEmailFolder();
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_RESOLVED,
            label: 'Resolved',
            disabled: this.isDisabledToolbar.resolvedEnquiries,
            action: () => {
              this.handleMoveMessages(TaskStatusType.completed);
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_DELETED,
            label: 'Deleted',
            disabled: this.isDisabledToolbar.deletedEnquiries,
            action: () => {
              this.handleMoveMessages(TaskStatusType.deleted);
            }
          }
        ]
      },
      {
        key: EInboxAction.REPORT_SPAM,
        icon: 'alertOctagonv2',
        dataE2e: 'email-details-check-box-report-spam',
        label: 'Report spam',
        action: () => {
          this.handleReportSpam(TaskStatusType.mailfolder);
        }
      },
      {
        key: EInboxAction.NOT_SPAM,
        icon: 'unmarkSpam',
        label: 'Not spam',
        action: () => {
          this.handleNotSpam();
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected();
        }
      }
    ]
  };

  private toolbarConfig: toolbarConfig = cloneDeep(this.toolbarConfigDefault);

  private toolbarAppMessage: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.ADD_TO_TASK,
        icon: 'taskNewIcon',
        label: 'Add to task',
        dataE2e: 'tool-bar-add-to-task',
        action: () => {
          this.handleBulkCreateTasks();
        },
        routeName: AppRouteName.APP_MESSAGES,
        hideChildren: false,
        children: [
          {
            key: EInboxAction.CREATE_NEW_TASK,
            label: 'Create new task',
            description: 'Create a new task and add messages to this task',
            hasSpecialStyle: true,
            dataE2e: 'tool-bar-create-new-task',
            action: () => {
              this.handleCreateNewTask();
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_TASK,
            label: 'Add to existing task',
            description: 'Add messages to an existing task',
            hasSpecialStyle: true,
            action: () => {
              this.handleMoveMessToExistTask();
            }
          }
        ]
      },
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        key: EInboxAction.ADD_TO_TASK,
        icon: 'taskNewIcon',
        label: 'Add to task',
        dataE2e: 'tool-bar-add-to-task',
        action: () => {
          this.handleBulkCreateTasks();
        },
        routeName: AppRouteName.APP_MESSAGES,
        hideChildren: false,
        children: [
          {
            key: EInboxAction.CREATE_NEW_TASK,
            label: 'Create new task',
            description: 'Create a new task and add messages to this task',
            hasSpecialStyle: true,
            dataE2e: 'tool-bar-create-new-task',
            action: () => {
              this.handleCreateNewTask();
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_TASK,
            label: 'Add to existing task',
            description: 'Add messages to an existing task',
            hasSpecialStyle: true,
            action: () => {
              this.handleMoveMessToExistTask();
            }
          }
        ]
      },
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'resolved-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [],
    spam: [],
    mailfolder: []
  };

  private toolbarSmsMessage: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [],
    spam: [],
    mailfolder: []
  };

  private toolbarVoiceMailMessage: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.ADD_TO_TASK,
        icon: 'taskNewIcon',
        label: 'Add to task',
        dataE2e: 'tool-bar-add-to-task',
        action: () => {
          this.handleBulkCreateTasks();
        },
        routeName: AppRouteName.VOICEMAIL_MESSAGES,
        hideChildren: false,
        children: [
          {
            key: EInboxAction.CREATE_NEW_TASK,
            label: 'Create new task',
            description: 'Create a new task and add messages to this task',
            hasSpecialStyle: true,
            dataE2e: 'tool-bar-create-new-task',
            action: () => {
              this.handleCreateNewTask();
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_TASK,
            label: 'Add to existing task',
            description: 'Add messages to an existing task',
            hasSpecialStyle: true,
            action: () => {
              this.handleMoveMessToExistTask();
            }
          },
          {
            key: EInboxAction.BULK_CREATE_TASKS,
            label: 'Bulk create tasks',
            description:
              'Create multiple tasks at once - one task for each message selected',
            hasSpecialStyle: true,
            action: () => {
              this.handleBulkCreateTasks();
            },
            hideOption: false
          }
        ]
      },
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        key: EInboxAction.ADD_TO_TASK,
        icon: 'taskNewIcon',
        label: 'Add to task',
        dataE2e: 'tool-bar-add-to-task',
        action: () => {
          this.handleBulkCreateTasks();
        },
        routeName: AppRouteName.VOICEMAIL_MESSAGES,
        hideChildren: false,
        children: [
          {
            key: EInboxAction.CREATE_NEW_TASK,
            label: 'Create new task',
            description: 'Create a new task and add messages to this task',
            hasSpecialStyle: true,
            dataE2e: 'tool-bar-create-new-task',
            action: () => {
              this.handleCreateNewTask();
            }
          },
          {
            key: EInboxAction.MOVE_MESSAGE_TO_TASK,
            label: 'Add to existing task',
            description: 'Add messages to an existing task',
            hasSpecialStyle: true,
            action: () => {
              this.handleMoveMessToExistTask();
            }
          },
          {
            key: EInboxAction.BULK_CREATE_TASKS,
            label: 'Bulk create tasks',
            description:
              'Create multiple tasks at once - one task for each message selected',
            hasSpecialStyle: true,
            action: () => {
              this.handleBulkCreateTasks();
            },
            hideOption: false
          }
        ]
      },
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'resolved-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [],
    spam: [],
    mailfolder: []
  };

  private toolbarFacebookMessage: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'resolved-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.MARK_AS_STATUS,
        icon: 'markAsUnread',
        label: 'Mark as unread',
        disabled: false,
        dataE2e: 'tool-bar-mark-as-state',
        action: () => {}
      },
      {
        key: EInboxAction.EXPORT_CONVERSATION_HISTORY,
        icon: 'conversationExport',
        label: 'Export conversation history',
        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            label: 'Save to Property Tree',
            dataE2e: 'tool-bar-save-to-pt',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected);
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSaveToCRM(this.listConversationSelected, true);
            }
          }
        ]
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [],
    spam: [],
    mailfolder: []
  };

  private refetchCheckMoveToFolder$ = new Subject<void>();
  public readonly EModalID = EModalID;
  public createdTasksData: ITasksForPrefillDynamicData[] = [];
  private selectedCreatedTasksData: ITasksForPrefillDynamicData[] = [];
  private isTriggeredDownloadPDFOption: boolean = false;

  get isVisibleInboxFilter() {
    const excludedRoutes = [
      EInboxQueryParams.MESSAGES,
      EInboxQueryParams.TASKS,
      EInboxQueryParams.SETTINGS,
      EInboxQueryParams.EMAIL,
      EInboxQueryParams.APP_MESSAGE,
      EInboxQueryParams.VOICEMAIL_MESSAGES,
      EInboxQueryParams.MESSENGER,
      EInboxQueryParams.SMS_MESSAGES,
      EInboxQueryParams.WHATSAPP
    ];

    return !excludedRoutes.some((route) =>
      this.router.url?.includes('/' + route)
    );
  }

  private _ignoredQueryParamsWhenCheckRouteChange = [
    EInboxFilterSelected.CONVERSATION_ID,
    EInboxFilterSelected.TASK_ID,
    EMessageQueryType.THREAD_ID,
    EMessageQueryType.EMAIL_MESSAGE_ID
  ];

  constructor(
    private router: Router,
    private activeRouter: ActivatedRoute,
    private statisticService: StatisticService,
    private overlay: Overlay,
    private inboxToolbarService: InboxToolbarService,
    public loadingService: LoadingService,
    private toatrService: ToastrService,
    private taskService: TaskService,
    private emailApiService: EmailApiService,
    public inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private conversationService: ConversationService,
    private syncResolveMessageService: SyncResolveMessageService,
    private agencyDashboardService: AgencyService,
    private websocketService: RxWebsocketService,
    private taskApiService: TaskApiService,
    public trudiSendMsgFormService: TrudiSendMsgFormService,
    public trudiDynamicParameterService: TrudiDynamicParameterService,
    private toastService: ToastrService,
    private headerService: HeaderService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private emailViewService: EmailViewService,
    private sharedMessageViewService: SharedMessageViewService,
    private toastCustomService: ToastCustomService,
    public folderService: FolderService,
    private stepService: StepService,
    private companyService: CompanyService,
    private taskFolderStoreService: TaskFolderStoreService,
    private trudiConfirmService: TrudiConfirmService,
    private taskGroupService: TaskGroupService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    public modalManagementService: ModalManagementService,
    private utilsService: UtilsService,
    private messageFlowService: MessageFlowService,
    private syncTaskActivityService: SyncTaskActivityService,
    private propertiesService: PropertiesService,
    private addToTaskWarningService: AddToTaskWarningService,
    private readonly contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private messageTaskLoadingService: MessageTaskLoadingService
  ) {}

  ngOnInit(): void {
    this.checkDisableSyncingStatus();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isArchivedMailbox) => {
        this.handleDisableSaveToRm({
          isArchivedMailbox: isArchivedMailbox
        });
      });
    this.subscribePopupState();
    this.checkCurrentPath(this.router.url);
    this._previousRoute = this.router.url.split('?')[0];
    this.router.events
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((prev, current) => {
          if (
            (prev instanceof NavigationStart ||
              prev instanceof NavigationEnd ||
              prev instanceof NavigationSkipped ||
              prev instanceof Scroll) &&
            current instanceof NavigationStart
          ) {
            let prevRouteData = this._splitUrl(
              !(prev instanceof Scroll) ? prev.url : prev.routerEvent.url
            );
            prevRouteData.paramsMap = omit(
              prevRouteData.paramsMap,
              ...this._ignoredQueryParamsWhenCheckRouteChange
            );
            let currentRouteData = this._splitUrl(current.url);
            currentRouteData.paramsMap = omit(
              currentRouteData.paramsMap,
              ...this._ignoredQueryParamsWhenCheckRouteChange
            );
            return isEqual(prevRouteData, currentRouteData);
          }
          return true;
        })
      )
      .subscribe((rs) => {
        if (rs instanceof NavigationStart) {
          this.checkCurrentPath(rs.url);
          this.handleClearSelected();
        }
      });
    this.activeRouter.queryParams.subscribe((rs) => {
      this.currentParams = rs;
      this.inboxTabs = this.inboxTabs.map((tab) => ({
        ...tab,
        queryParam: {
          ...tab.queryParam
        }
      }));
      this.currentMailboxIdEmailFolder = this.currentParams['mailBoxId'];
    });
    // handle show red dot on tabs in box
    combineLatest([
      this.inboxService.getCurrentMailBoxId(),
      this.statisticService.getStatisticUnreadTabsInbox(
        this.currentParams?.[ETaskQueryParams.SHOW_MESSAGE_IN_TASK] === 'true'
      )
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([mailBoxId, res]) => {
        if (mailBoxId && res) {
          const myInboxTab = this.inboxTabs[0];
          const teamInbox = this.inboxTabs[1];
          if (!myInboxTab || !teamInbox) return;
          myInboxTab.unread = res?.[mailBoxId]?.myInbox;
          teamInbox.unread = res?.[mailBoxId]?.teamInbox;
        }
      });
    this.subscribeInboxItem();

    this.inboxToolbarService.addMarginBottomInToInboxContent$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((hasMargin) => {
        this.hasInboxContentMargin = !!hasMargin;
      });

    this.inboxSidebarService.openCreateSidebar.subscribe((status) => {
      if (status) {
        this.handleClearSelected();
      }
    });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        if (!company) return;
        this.isRMEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        this.handleDisableSaveToRm({
          isRmEnvironment: this.isRMEnvironment
        });

        this.areaCode = this.isRMEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });

    this.subscribePageContent();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (!mailBoxId) return;
        this.currentMailboxId = mailBoxId;
      });

    this.getListMessageSelectedFromToolbar();
    this.inboxSidebarService.taskFolders$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((rs) => {
        this.taskFolders = rs;
      });

    this.handleNotifyToastWhenSendMessageDone();

    this.taskService.currenTaskTrudiResponse$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.inboxItems = this.updateArray(this.inboxItems, res);
          this.inboxToolbarService.setInboxItem(this.inboxItems);
        }
      });

    this.inboxService.onBulkCreateTaskSuccess$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => this.showModalSendBulkMsg(value));
    this.inboxService.moveToFolderId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.moveToFolderId = value;
      });
    this.inboxService.taskTemplate$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          this.taskTemplate = rs;
        }
      });

    this.subscribeEmailMoveToAction();
    this.subscribeCheckMoveToFolder();
    this.subscribeTriggerSaveMessagePT();
    this.subscribeToggleMoveConversationSate();
    this.subscribeMoveToFolderId();
    this.subscribeDropMessageToPortalInbox();
    this.subscribeCurrentTaskActivity();
    this.subscribeShowModalWarrningSchedule();
  }

  getListEmailFolder() {
    const currentMailBoxId = this.getCurrentMailBoxIdByStatus();
    return this.folderService.flattenTreeEmailFolder(
      this.folderService.getEmailFolderByMailBoxId(currentMailBoxId)?.tree,
      '',
      currentMailBoxId
    );
  }

  subscribeCurrentTaskActivity() {
    this.taskService
      .getCurrentTaskActivity()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: ISocketSyncTaskActivityToPT) => {
        if (!res) return;
        const { status } = res || {};
        this.isDisabledSyncActivity = status === ESyncStatus.PENDING;
        this.updateToolbarConfigBasedOnSyncActivity();
      });
  }

  subscribeShowModalWarrningSchedule() {
    this.conversationService.isShowModalWarrningSchedule
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data: boolean) => {
        if (!data) return;
        this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
        this.isShowModalWarning = data;
      });
  }

  updateToolbarConfigBasedOnSyncActivity() {
    Object.keys(this.toolbarConfig).forEach((key) => {
      const sections = this.toolbarConfig[key];
      sections.forEach((section) => {
        if (section.children) {
          section.children.forEach((child) => {
            if (child.key === EInboxAction.SAVE_TO_PROPERTY_TREE) {
              child.disabled = this.isDisabledSyncActivity;
            }
          });
        }
      });
    });
  }

  subscribeMoveToFolderId() {
    this.inboxService.createTaskByMoveToTaskDragDrop
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value.isDragDrop) {
          this.selectedFolderId = value.folderId;
        }
      });
  }

  subscribeEmailMoveToAction() {
    this.emailViewService.emailMoveToAction$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((emailMoveToAction) => {
        this.handleEmailMoveToAction(emailMoveToAction);
      });
  }

  sortGroupByOrder(a: ITaskGroup, b: ITaskGroup) {
    if (a.isCompletedGroup && !b.isCompletedGroup) return 1;
    if (!a.isCompletedGroup && b.isCompletedGroup) return -1;
    return a.order > b.order ? 1 : -1;
  }

  handleEmailMoveToAction(emailMoveToAction: IEmailMoveToAction) {
    this.threadIds = [emailMoveToAction.threadId];
    this.subTitleMoveToTask = '1 message selected';
    switch (emailMoveToAction.action) {
      case EInboxAction.MOVE_MESSAGE_TO_INBOX:
        this.handleMoveMessages(TaskStatusType.inprogress);
        break;
      case EInboxAction.MOVE_MESSAGE_TO_EMAIL:
        this.handleMoveMessToEmailFolder();
        break;
      case EInboxAction.MOVE_MESSAGE_TO_RESOLVED:
        this.handleMoveMessages(TaskStatusType.completed);
        break;
      case EInboxAction.MOVE_MESSAGE_TO_DELETED:
        this.handleMoveMessages(TaskStatusType.deleted);
        break;
      default:
        return;
    }
  }

  handleDisableSaveToRm(disabledStatus) {
    this.isDisabledSaveToRM = { ...this.isDisabledSaveToRM, ...disabledStatus };
  }

  handleDisableSaveToPT(disabledStatus) {
    this.isDisabledSaveToPT = { ...this.isDisabledSaveToPT, ...disabledStatus };
  }

  handleCloseModal(event) {
    this.isShowPopupSendBulkMsg = event;
    this.handleClearSelected();
    this.resetFill();
    this.selectedTasks = [];
  }

  subscribePopupState() {
    this.inboxService
      .getPopupMoveToTaskState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.popupState = res;
      });
  }

  subscribePageContent() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.visiblePageContent = true;
      });
  }

  subscribeInboxItem() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs: TaskItem[] | EmailItem[]) => {
        if (this.activePath === EInboxQueryParams.TASKS) {
          this.toolbarConfig = cloneDeep(this.toolbarConfigDefault);
          this.toolbarConfig = {
            ...this.toolbarConfig,
            inprogress: [
              ...this.toolbarConfig.inprogress
                .filter(
                  (item) => item.key !== EInboxAction.SAVE_TO_PROPERTY_TREE
                )
                .map((value) => {
                  return {
                    ...value,
                    actionType: value.key === EInboxAction.DELETE && 'danger',
                    disabled:
                      (value.key === EInboxAction.SEND_MESSAGE ||
                        value.key === EInboxAction.RESOLVE ||
                        value.key === EInboxAction.MARK_AS_STATUS) &&
                      !!(rs as TaskItem[]).some(
                        (item) =>
                          item.status === TaskStatusType.completed ||
                          item.status === TaskStatusType.deleted
                      )
                  };
                })
            ]
          };
        } else if (
          this.activePath === EInboxQueryParams.MESSAGES ||
          this.activePath === EInboxQueryParams.EMAIL
        ) {
          this.toolbarConfig = cloneDeep(this.toolbarConfigDefault);
        } else if (this.activePath === EInboxQueryParams.APP_MESSAGE) {
          this.toolbarConfig = this.toolbarAppMessage;
          this.filterExportConversationHistory(this.toolbarAppMessage);
          this.filterAddToTask(this.toolbarAppMessage);
        } else if (this.activePath === EInboxQueryParams.VOICEMAIL_MESSAGES) {
          this.toolbarConfig = this.toolbarVoiceMailMessage;
          this.filterExportConversationHistory(this.toolbarVoiceMailMessage);
          this.filterAddToTask(this.toolbarVoiceMailMessage);
        } else if (
          this.activePath === EInboxQueryParams.MESSENGER ||
          this.activePath === EInboxQueryParams.WHATSAPP
        ) {
          this.toolbarConfig = this.toolbarFacebookMessage;
          this.filterExportConversationHistory(this.toolbarFacebookMessage);
        } else if (this.activePath === EInboxQueryParams.SMS_MESSAGES) {
          this.toolbarConfig = this.toolbarSmsMessage;
          this.filterExportConversationHistory(this.toolbarSmsMessage);
        }
        this.inboxItems = rs;
        this.updateToolbarVisibility();
        this.updateToolbarState(this.inboxItems as TaskItem[]);
        this.processInboxItems(this.inboxItems);
        this.subTitleMoveToTask = `${rs?.length}  ${
          rs?.length > 1 ? ' messages selected' : ' message selected'
        }`;
        if (rs?.length > 0) {
          const taskStatus = this.activePath
            ? TaskStatusType.inprogress?.toLowerCase()
            : (
                this.currentParams[EInboxQueryParams.STATUS] as string
              )?.toLowerCase();
          const moveTaskAction = this.toolbarConfig[taskStatus]?.find(
            (x) => x.key === EInboxAction.MOVE_TASK
          );
          if (moveTaskAction) moveTaskAction['customTemplate'] = this.groupList;
          this.inboxToolbarService.setValueActivePath(this.activePath);
          this.inboxToolbarService.getListToolbar(
            this.toolbarConfig,
            this.isDisabledSaveToRM,
            this.isDisabledSaveToPT
          );
          if (
            ![
              EInboxQueryParams.TASKS,
              EInboxQueryParams.EMAIL,
              EInboxQueryParams.APP_MESSAGE,
              EInboxQueryParams.VOICEMAIL_MESSAGES,
              EInboxQueryParams.SMS_MESSAGES,
              EInboxQueryParams.MESSENGER,
              EInboxQueryParams.WHATSAPP
            ].includes(this.activePath as EInboxQueryParams)
          ) {
            this.refetchCheckMoveToFolder$.next();
          }
          this.handleOpen();
        } else {
          this.handleClose();
        }
      });
    this.handleTriggerSyncResolveMessage();
  }

  updateToolbarState(taskItems: TaskItem[]) {
    const allConversationsSeen = taskItems?.some((taskItem) =>
      taskItem.conversations?.every((conversation) => conversation.isSeen)
    );
    const relevantConversationIds = this.getRelevantConversationIds(
      taskItems,
      allConversationsSeen
    );

    if (relevantConversationIds) {
      ['inprogress', 'completed', 'deleted'].forEach((status) => {
        this.updateToolbarOption(
          status,
          allConversationsSeen,
          relevantConversationIds
        );
      });
    }
  }

  getRelevantConversationIds(
    taskItems: TaskItem[],
    allSeen: boolean
  ): string[] {
    return taskItems
      .filter((taskItem) =>
        taskItem?.conversations?.some((conversation) =>
          allSeen ? conversation.isSeen : !conversation.isSeen
        )
      )
      .map((taskItem) => taskItem.conversationId);
  }

  updateToolbarOption(
    status: string,
    allConversationsSeen: boolean,
    conversationIds: string[]
  ) {
    const toolbarOption = this.getToolbarOption(
      status,
      EInboxAction.MARK_AS_STATUS
    );
    if (toolbarOption) {
      this.setToolbarOptionProperties(
        toolbarOption,
        allConversationsSeen,
        conversationIds
      );
    }
  }

  getToolbarOption(status: string, actionKey: string) {
    return this.toolbarConfig[status]?.find((item) => item.key === actionKey);
  }

  setToolbarOptionProperties(
    option,
    allConversationsSeen: boolean,
    conversationIds: string[]
  ) {
    Object.assign(option, {
      icon: allConversationsSeen ? 'unreadEmail' : 'markAsReadSms',
      label: allConversationsSeen ? 'Mark as unread' : 'Mark as read',
      action: () =>
        this.handleMarkReadUnread(conversationIds, !allConversationsSeen)
    });
  }

  handleMarkReadUnread(conversationIds: string[], markAsRead: boolean) {
    this.setToolbarOptionsDisabled(true);
    const markAsReadOrUnread = markAsRead
      ? this.conversationService.markAsReadMultiConversation
      : this.conversationService.markAsUnreadMultiConversation;

    markAsReadOrUnread
      .call(this.conversationService, conversationIds, this.currentMailboxId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => this.setToolbarOptionsDisabled(false),
        error: () => this.setToolbarOptionsDisabled(false)
      });
  }

  setToolbarOptionsDisabled(state: boolean) {
    ['inprogress', 'completed', 'deleted'].forEach((status) => {
      const option = this.toolbarConfig[status]?.find(
        (item) => item.key === EInboxAction.MARK_AS_STATUS
      );
      if (option) {
        option.disabled = state;
      }
    });
    this.inboxToolbarService.getListToolbar(
      this.toolbarConfig,
      this.isDisabledSaveToRM,
      this.isDisabledSaveToPT
    );
  }

  filterExportConversationHistory(toolbarConfig) {
    if (this.isRMEnvironment) {
      const removeExportConversationHistory = (items) => {
        return items.filter(
          (item) => item.key !== EInboxAction.EXPORT_CONVERSATION_HISTORY
        );
      };

      toolbarConfig.inprogress = removeExportConversationHistory(
        toolbarConfig.inprogress
      );
      toolbarConfig.completed = removeExportConversationHistory(
        toolbarConfig.completed
      );
    }
  }

  filterAddToTask(toolbarConfig) {
    const removeAddToTask = (items) => {
      return items.filter((item) => item.key !== EInboxAction.ADD_TO_TASK);
    };

    toolbarConfig.inprogress = removeAddToTask(toolbarConfig.inprogress);
    toolbarConfig.completed = removeAddToTask(toolbarConfig.completed);
  }

  private updateToolbarVisibility() {
    const shouldHideSingleTaskOptions = this.inboxItems?.length <= 1;
    const shouldHideChildren = this.inboxItems?.length >= 2;
    const isVoicemailMessagesPath =
      this.activePath === EInboxQueryParams.VOICEMAIL_MESSAGES;
    const isAppMessagesPath = this.activePath === EInboxQueryParams.APP_MESSAGE;

    this.updateBulkCreateTasksVisibility(
      'inprogress',
      shouldHideSingleTaskOptions
    );
    this.updateBulkCreateTasksVisibility(
      'completed',
      shouldHideSingleTaskOptions
    );

    if (isVoicemailMessagesPath || isAppMessagesPath) {
      this.toolbarConfig.inprogress[0].hideChildren = shouldHideChildren;
      this.toolbarConfig.completed[0].hideChildren = shouldHideChildren;
    }
  }

  private updateBulkCreateTasksVisibility(
    status: 'inprogress' | 'completed',
    hide: boolean
  ) {
    const option = this.toolbarConfig[status]?.[0]?.children?.find(
      (item) => item.key === EInboxAction.BULK_CREATE_TASKS
    );

    if (option) {
      option.hideOption = hide;
    }
  }

  showCreateTaskSuccessToast() {
    if (this.createdTasks.length === 1) {
      const dataForToast = {
        taskId: this.createdTasks[0].taskId,
        isShowToast: true,
        type: SocketType.newTask,
        mailBoxId: this.currentMailboxId,
        taskType: TaskType.TASK,
        pushToAssignedUserIds: []
      };
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
      return;
    }
    this.toastService.success(
      `${this.createdTasks?.length} task${
        this.createdTasks?.length > 1 ? 's' : ''
      } created`
    );
  }

  showModalSendBulkMsg(value) {
    this.createdTasks = value;
    this.isShowPopupSendBulkMsg = true;

    if (this.createdTasks?.length) {
      const body = {
        tasks: this.createdTasks?.map((item) => ({
          taskId: item.newTaskId,
          propertyId: item.newPropertyId
        }))
      } as IGetInfoTasksForPrefillDynamicBody;
      this.taskApiService
        .getInfoTasksForPrefillDynamicParam(body)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.selectedCreatedTasksData = res;
            this.createdTasksData = res;
            this.isCreatePopupState = false;
          },
          error: () => {
            this.selectedCreatedTasksData = [];
            this.createdTasksData = [];
            this.isCreatePopupState = false;
          }
        });
    } else {
      this.isCreatePopupState = false;
    }
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setListToolbarConfig([]);
    this.inboxService.isBackToModalConvertToTask.next(false);
  }

  subscribeDropMessageToPortalInbox() {
    this.inboxService.dropMessageToPortalInbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(({ status, listThreadId }) => {
        this.handleMoveMessages(status, listThreadId);
      });
  }

  handleOnSendBulkMsg(value) {
    this.showModalSendBulkMsg(value);
    this.showCreateTaskSuccessToast();
  }

  handleBack() {
    this.selectedFolderId = '';
    this.isCreatePopupState = false;
    this.isShowModalCreateTask = true;
    this.inboxService.isBackToModalConvertToTask.next(true);
  }

  handleCancel() {
    this.selectedFolderId = '';
    this.showBackBtn = false;
  }

  private checkCurrentPath(url: string) {
    switch (true) {
      case url.includes(EInboxQueryParams.TASKS):
        this.activePath = EInboxQueryParams.TASKS;
        break;
      case url.includes(`/${EInboxQueryParams.MESSAGES}`):
      case url.includes(EInboxQueryParams.SETTINGS):
        this.activePath = EInboxQueryParams.MESSAGES;
        break;
      case url.includes(`/${EInboxQueryParams.APP_MESSAGE}`):
        this.activePath = EInboxQueryParams.APP_MESSAGE;
        break;
      case url.includes(`/${EInboxQueryParams.SMS_MESSAGES}`):
        this.activePath = EInboxQueryParams.SMS_MESSAGES;
        break;
      case url.includes(EInboxQueryParams.VOICEMAIL_MESSAGES):
        this.activePath = EInboxQueryParams.VOICEMAIL_MESSAGES;
        break;
      case url.includes(EInboxQueryParams.MESSENGER):
        this.activePath = EInboxQueryParams.MESSENGER;
        break;
      case url.includes(EInboxQueryParams.WHATSAPP):
        this.activePath = EInboxQueryParams.WHATSAPP;
        break;
      case url.includes(EInboxQueryParams.EMAIL):
        this.activePath = EInboxQueryParams.EMAIL;
        break;
      default:
        this.activePath = '.';
        break;
    }
    this.inboxTabs = this.inboxTabs.map((tab) => {
      if (tab.title !== 'Unassigned') {
        return {
          ...tab,
          link: this.activePath
        };
      } else {
        return {
          ...tab,
          link: 'messages'
        };
      }
    });
  }

  private handleOpen(): void {
    if (!this.componentRef) {
      this.attachToolbarInbox();
    }
    this.handleAddEventKeyup();
  }

  private handleClose(): void {
    if (this.componentRef) {
      this.componentRef.instance.isDropdownVisible = false;
      this.componentRef.instance.visible = false;
      this.handleRemoveEventKeyup();
    }
  }

  private handleAddEventKeyup(): void {
    const currentMailBoxId = this.getCurrentMailBoxIdByStatus();
    const routes: string[] = [
      ERouterLinkInbox.MSG_INPROGRESS,
      ERouterLinkInbox.MSG_COMPLETED,
      ERouterLinkInbox.OUT_LOOK_OR_GMAIL,
      ERouterLinkInbox.TASK_INPROGRESS
    ];
    const routesNotAllowDelete: string[] = [
      ERouterLinkInbox.MSG_DELETED,
      LABEL_EXTERNAL_ID_MAIL_BOX.TRASH,
      encodeURIComponent(
        getDeletedItemsFolderExternalId(
          this.folderService,
          this.folderService.getEmailFolderByMailBoxId(currentMailBoxId),
          currentMailBoxId
        )
      )
    ];
    if (
      routes.some((route) => this.router.url?.includes(route)) &&
      !routesNotAllowDelete.some((routeNotAllow) =>
        this.router.url?.includes(routeNotAllow)
      )
    ) {
      if (!this.keyupEvent) {
        this.keyupEvent = (event: KeyboardEvent) => {
          if (
            event.key === 'Delete' ||
            (event.key === 'Backspace' && getOS() === EPlatform.MACOS)
          ) {
            if (
              this.isShowModalForward ||
              this.isShowModalCreateTask ||
              this.isCreatePopupState ||
              this.isShowModalConfirmProperties ||
              this.isShowPopupSendBulkMsg ||
              this.popupState ||
              !this.modalManagementService.isEmpty()
            ) {
              return;
            }
            if (this.router.url?.includes(ERouterLinkInbox.OUT_LOOK_OR_GMAIL)) {
              this.handleDeleteOutLookOrGmailMessages();
            } else {
              this.handleConfirmDelete();
            }
          }
        };
        window.addEventListener('keyup', this.keyupEvent);
      }
    }
  }

  private handleRemoveEventKeyup() {
    window.removeEventListener('keyup', this.keyupEvent);
    this.keyupEvent = undefined;
  }

  private handleDeleteOutLookOrGmailMessages() {
    const listFolder = this.getListEmailFolder();
    const deleteFolder = listFolder?.find(
      (folder) =>
        folder.wellKnownName === LABEL_NAME_OUTLOOK.DELETED_ITEMS ||
        folder.externalId === LABEL_EXTERNAL_ID_MAIL_BOX.TRASH
    );
    const folderTarget = listFolder?.find(
      (item) => item.externalId === this.currentParams['externalId']
    );
    const currentLabelId = folderTarget?.internalId;
    const body = {
      newLabelId: deleteFolder.internalId,
      mailBoxId: this.currentMailboxIdEmailFolder,
      currentLabelId,
      threadIds: this.threadIds
    };
    this.showMovingToast(this.threadIds.length > 1);
    this.emailApiService
      .moveMailFolder(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
            this.currentMailboxIdEmailFolder
          );
          this.handleClearSelected();
        },
        error: (error) => {
          this.handleClearSelected();
          this.toastService.clear();
          this.toastService.error(
            error?.error?.message ?? 'Move to folder failed. Please try again.'
          );
        }
      });
  }

  private destroyToolbarInbox(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }

  private attachToolbarInbox(): void {
    this.destroyToolbarInbox();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(InboxToolbarComponent);
    this.componentRef = this.overlayRef.attach(componentPortal);
  }

  getListMessageSelectedFromToolbar() {
    this.inboxToolbarService.inboxItem$.subscribe(
      (listMessageSelected: TaskItem[]) => {
        if (listMessageSelected?.length) {
          this.listConversationSelected =
            this.handleGetListConversation(listMessageSelected);
          this.checkDisableSyncingStatus();
          this.inboxToolbarService.getListToolbar(
            this.toolbarConfig,
            this.isDisabledSaveToRM,
            this.isDisabledSaveToPT
          );
        }
      }
    );
  }

  showMovingToast(moreThanOne: boolean) {
    this.toastService.clear();
    this.toastService.show(
      moreThanOne ? MESSAGES_MOVING_TO_TASK : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
  }

  showToastError(error) {
    this.toastService.clear();
    this.toastService.error(
      error?.error?.message ?? 'Report spam failed. Please try again.'
    );
    this.handleClearSelected();
  }

  handleNotSpam() {
    this.emailViewService.setPreQuerryParamsMoveMessage(this.currentParams);
    this.showMovingToast(this.threadIds.length > 1);
    const body = {
      mailBoxId: this.currentMailboxIdEmailFolder,
      threadIds: this.threadIds
    };
    this.emailApiService
      .handleNotSpam(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.handleClearSelected();
        },
        error: (error) => {
          this.showToastError(error);
        }
      });
  }

  handleReportSpam(status: TaskStatusType) {
    this.emailViewService.setPreQuerryParamsMoveMessage(this.currentParams);
    this.showMovingToast(
      status === TaskStatusType.inprogress
        ? this.conversationIds.length > 1
        : this.threadIds.length > 1
    );
    const currentMailBoxId = this.getCurrentMailBoxIdByStatus();
    const body = {
      mailBoxId: currentMailBoxId,
      conversationIds:
        status === TaskStatusType.inprogress ? this.conversationIds : [],
      threadIds: status !== TaskStatusType.inprogress ? this.threadIds : [],
      currentLabelId: this.currentLabelId
    };
    this.emailApiService
      .reportSpamFolder(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.handleClearSelected();
        },
        error: () => {
          this.toastService.error(EToastSocketTitle.MESSAGE_SPAM_FAIL);
        }
      });
  }

  handleTriggerSyncResolveMessage() {
    this.syncResolveMessageService.triggerSyncResolveMessage$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        switch (res?.action) {
          case EActionSyncResolveMessage.SAVE_TO_RM_DROPDOWN_MENU:
            const listConversation = this.handleGetListConversation(
              res.messageResolve
            );
            this.handleSaveToCRM(listConversation);
            break;
        }
      });
  }

  subscribeTriggerSaveMessagePT() {
    this.syncMessagePropertyTreeService.triggerSyncMessagePT$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(({ messages, isDownloadPDFAction }) => {
        const listConversation = this.handleGetListConversation(messages);
        this.handleSaveToCRM(
          listConversation as PreviewConversation[],
          isDownloadPDFAction
        );
      });
  }

  private handleGetListConversation(listMessageResolve: TaskItem[]) {
    let listConverSation;
    if (!listMessageResolve) return;
    if (this.activePath === EInboxQueryParams.TASKS) {
      listConverSation =
        this.addPropertyInfoToConversations(listMessageResolve);
    } else {
      listConverSation = listMessageResolve.map((item) => ({
        ...item?.conversations?.[0],
        propertyId: item?.property?.id,
        streetline: item?.property?.streetline,
        property: item?.property
      }));
    }
    return listConverSation;
  }

  addPropertyInfoToConversations(listMessageResolve) {
    if (!listMessageResolve) return;
    return listMessageResolve
      .filter((item) => item?.conversations && item?.conversations?.length > 0)
      .map((item) => {
        if (!item.conversations.length) return;
        return item?.conversations?.map((conversation) => ({
          ...conversation,
          propertyId: item?.property?.id,
          streetline: item?.property?.streetline,
          title: item?.indexTitle || '',
          textContent: 'Resolved'
        }));
      })
      .flat();
  }

  private handleSaveToCRM(
    listConversation: PreviewConversation[],
    isDownloadPDFAction: boolean = false
  ) {
    this.isTriggeredDownloadPDFOption = isDownloadPDFAction;
    this.resetListConfirmProperties();
    if (!listConversation?.length) return;
    listConversation.forEach((item) => {
      if (item?.property?.isTemporary && !isDownloadPDFAction) {
        if (item.conversationType === EConversationType.MESSENGER) {
          const header = this.composeFacebookTitle(item);
          const isUserVerified =
            item.emailVerified &&
            item.isDetectedContact &&
            !item?.participants?.[0]?.isTemporary;
          item.name = isUserVerified
            ? `${item.name} • ${header?.title} ${
                header?.role ? '(' + header.role + ')' : ''
              }`
            : item.name;
        }
        this.listConversationConfirmProperties.listConversationNotMove.push(
          item
        );
      } else {
        this.listConversationConfirmProperties.listConversationMove.push(item);
      }
    });
    this.handleShowConfirmPropertiesModal();
  }

  private composeFacebookTitle(conversation: PreviewConversation) {
    const currentParticipant = conversation.participants?.[0] as IParticipant;
    const { isTemporary, id: propertyId } = conversation.property || {};
    if (!currentParticipant) return {};
    return {
      title: this.contactTitleByConversationPropertyPipe.transform(
        currentParticipant,
        {
          isNoPropertyConversation: isTemporary,
          isMatchingPropertyWithConversation:
            currentParticipant.propertyId === propertyId,
          skipClientName: true,
          showOnlyName: true
        }
      ),
      role: this.contactTitleByConversationPropertyPipe.transform(
        currentParticipant,
        {
          isNoPropertyConversation: isTemporary,
          isMatchingPropertyWithConversation:
            currentParticipant.propertyId === propertyId,
          showOnlyRole: true,
          showCrmStatus: true,
          showPrimaryText: true
        }
      )
    };
  }

  handleShowConfirmPropertiesModal() {
    if (this.listConversationConfirmProperties) {
      if (
        !this.listConversationConfirmProperties.listConversationNotMove
          ?.length ||
        this.isTriggeredDownloadPDFOption
      ) {
        this.listConversationConfirmProperties.listConversationMove.concat(
          this.listConversationConfirmProperties?.listConversationNotMove
        );
        this.dataConfirmedProperties =
          this.listConversationConfirmProperties.listConversationMove;
        this.onSyncMessageToCRM();
        this.isShowModalConfirmProperties = false;
      } else {
        this.isActionSyncConversationToRM = true;
        this.isShowModalConfirmProperties = true;
      }
    }
  }

  checkDisableSyncingStatus() {
    const currentListByCRM$ = this.isRMEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        const syncInprogress = [
          this.SYNC_TYPE.INPROGRESS,
          this.SYNC_TYPE.PENDING
        ];
        if (
          syncInprogress.includes(
            listMessageSyncStatus.status as SyncMaintenanceType
          ) ||
          syncInprogress.includes(
            listMessageSyncStatus.conversationSyncDocumentStatus as SyncMaintenanceType
          )
        ) {
          const isCheckSyncingStatus = this.listConversationSelected?.some(
            (conversation) =>
              listMessageSyncStatus?.conversationIds.includes(conversation.id)
          );
          this.handleDisableSaveToRm({
            isCheckSyncingStatus: isCheckSyncingStatus
          });
          this.handleDisableSaveToPT({
            isCheckSyncingStatus: isCheckSyncingStatus
          });
        } else {
          this.handleDisableSaveToRm({
            isCheckSyncingStatus: false
          });
          this.handleDisableSaveToPT({
            isCheckSyncingStatus: false
          });
        }
        if (this.inboxItems.length) {
          this.inboxToolbarService.getListToolbar(
            this.toolbarConfig,
            this.isDisabledSaveToRM,
            this.isDisabledSaveToPT
          );
        }
      });
  }

  onSyncMessageToCRM() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setListToolbarConfig([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    const payload = this.dataConfirmedProperties.map((conversation) => ({
      propertyId: conversation.propertyId,
      conversationId: conversation.id
    }));
    const listConverSationStatusSyncing = {
      conversationIds: payload.map((item) => item.conversationId),
      status: this.SYNC_TYPE.INPROGRESS
    };

    if (this.isRMEnvironment) {
      this.syncResolveMessageService.setListConversationStatus(
        listConverSationStatusSyncing
      );
      this.syncResolveMessageService.isSyncToRM$.next(true);
      this.syncResolveMessageService
        .syncResolveMessageNoteProperties(payload)
        .subscribe();
    } else {
      const exportPayload = {
        conversations: payload,
        mailBoxId: this.currentMailboxId
      };

      if (!this.isTriggeredDownloadPDFOption) {
        this.syncMessagePropertyTreeService.setListConversationStatus(
          listConverSationStatusSyncing
        );
        this.syncMessagePropertyTreeService.setIsSyncToPT(true);
      }

      this.syncMessagePropertyTreeService.setTriggerExportHistoryAction(
        exportPayload,
        this.isTriggeredDownloadPDFOption
      );
    }
  }

  resetListConfirmProperties() {
    this.listConversationConfirmProperties = {
      listConversationMove: [],
      listConversationNotMove: []
    };
    this.isShowModalConfirmProperties = false;
    this.isActionSyncConversationToRM = false;
  }

  handleCancelConfirmProperties(e) {
    this.isShowModalConfirmProperties = e;
    this.isActionSyncConversationToRM = e;
    this.resetListConfirmProperties();
  }

  handleConfirmProperties() {
    this.taskService
      .getListConfirmProperties()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.dataConfirmedProperties = [
          ...res.listConversationMove,
          ...res.listConversationNotMove.filter((item) => item.isChecked)
        ];
      });
    this.onSyncMessageToCRM();
  }

  private handleClearSelected(resetSelectMode: boolean = false) {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    resetSelectMode && this.sharedMessageViewService.setIsSelectingMode(false);
  }

  private handleConfirmDelete(event?: MouseEvent) {
    this.handleAction(TaskStatusType.deleted, event);
  }

  handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  private handleCreateNewTask(showBackBtn?: boolean) {
    this.openFrom = CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK;
    this.handleConvertMultipleTask(showBackBtn);
  }

  private handleBulkCreateTasks(showBackBtn?: boolean) {
    this.openFrom = CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK;
    this.handleConvertMultipleTask(showBackBtn);
  }

  showWarningAddToTask(callback: Function, args = []) {
    return this.addToTaskWarningService.showWarningAddToTask(
      callback,
      this,
      args,
      { isMultipleEmail: this.inboxItems?.length > 1 }
    );
  }

  private handleAddToTask() {
    if (this.inboxToolbarService.countSelectedItems > 1) {
      this.handleBulkCreateTasks();
    } else {
      this.inboxService.setIsOpenPopupAddToTaskBySingleMessage(true);
    }
  }

  handleBackCreateTaskOptionModal() {
    this.optionCreateTaskMultiple = null;
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_TASK
    );
  }

  handleOpenCreateTaskOptionModal() {
    this.openByModalExistingTask = true;
    if (this.inboxItems.length === 1) {
      this.handleSelectedOption(ECreatePopupOptionType.CREATE_NEW_TASK);
    } else {
      this.optionCreateTaskMultiple = null;
      this.inboxService.setPopupMoveToTaskState(
        EPopupMoveMessToTaskState.OPTION_MOVE_MESSAGE_TO_TASK
      );
    }
  }

  subscribeToggleMoveConversationSate() {
    this.taskService.triggerToggleMoveConversationSate
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.multipleMessages) {
          this.isCreatePopupState = false;
          if (this.inboxItems.length > 1) {
            this.inboxService.setPopupMoveToTaskState(
              EPopupMoveMessToTaskState.OPTION_MOVE_MESSAGE_TO_TASK
            );
          } else {
            this.inboxService.setPopupMoveToTaskState(
              EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_TASK
            );
          }
        }
      });
  }

  handleSelectedOption(value) {
    this.openByModalExistingTask = true;
    if (value === ECreatePopupOptionType.CREATE_NEW_TASK) {
      this.handleCreateNewTask(true);
    } else {
      this.handleBulkCreateTasks(true);
    }
    this.popupState = null;
  }

  handleChangeOption(value) {
    this.optionCreateTaskMultiple = value;
  }

  private handleConvertMultipleTask(showBackBtn: boolean = false) {
    this.isCreatePopupState = false;
    const listConversationId = this.taskService.listconversationId.getValue();
    const payload = { conversationIds: listConversationId };

    this.conversationService
      .convertMultipleTask(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: IListConvertMultipleTask) => {
        if (res) {
          this.dataConvert = res?.listConversationMove.concat(
            res?.listConversationNotMove
          );
          const currentProperty =
            this.propertiesService.listPropertyActiveStatus
              .getValue()
              .find((p) => p.id === this.dataConvert[0].propertyId);
          this.isFromVoiceMail =
            this.dataConvert.length === 1 &&
            currentProperty &&
            this.activePath === EInboxQueryParams.VOICEMAIL_MESSAGES;
          this.isCreatePopupState = true;
          this.showBackBtn = showBackBtn;
          this.listConversation = res;
        }
      });
  }

  private handleAction(status: TaskStatusType, event?: MouseEvent) {
    if (
      checkScheduleMsgCount(this.listConversationSelected) &&
      [TaskStatusType.completed, TaskStatusType.deleted].includes(status)
    ) {
      const isMessage = this.activePath === EInboxQueryParams.MESSAGES;
      const errorMsg =
        status === TaskStatusType.completed
          ? !!isMessage
            ? ErrorMessages.RESOLVE_CONVERSATION
            : ErrorMessages.RESOLVE_TASK
          : !!isMessage
          ? ErrorMessages.DELETE_CONVERSATION
          : ErrorMessages.DELETE_TASK;
      this.handleShowWarningMsg(errorMsg);
      return;
    }
    if (this.loadingAction) return;

    const taskIds = this.inboxItems.map((item) => item.id);
    const tasksData = this.inboxItems.map((item) => ({
      id: item.id,
      conversationId: item.conversationId || item.conversations?.[0]?.id,
      taskType: item.taskType
    }));
    const conversationIds = this.inboxItems.map(
      (item) => item.conversationId || item.conversations?.[0]?.id
    );
    switch (this.activePath) {
      case EInboxQueryParams.TASKS:
        if (status === TaskStatusType.deleted) {
          const confirmModalConfig = {
            title: `Are you sure you wish to delete ${
              this.inboxItems?.length > 1 ? 'these tasks' : 'this task'
            }?`,
            okText: 'Yes, delete',
            cancelText: 'No, keep it',
            subtitle: '',
            content: this.permanentlyDeleteConfirmModalContent,
            colorBtn: 'danger',
            iconName: 'warning',
            closable: false,
            className: 'permanently-delete-modal',
            modelWidth: 510,
            checkboxLabel: '',
            allowCheckbox: false,
            hiddenCancelBtn: false
          };

          this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
            if (!!res.result) {
              this.headerService.setConversationAction({
                option: ETaskMenuOption.DELETE,
                taskId: null,
                isTriggeredFromRightPanel: false,
                isTriggeredFromToolbar: true,
                messageIds: taskIds,
                conversationIds: conversationIds
              });
              this.handleConfirmPermanentlyDelete();
            }
          });
          return;
        }
        //if mark as resolve, pass taskGroupId of completed group in current folder
        const currentFolderId = this.currentParams[ETaskQueryParams.TASKTYPEID];
        const completedGroupId =
          this.taskFolderStoreService.getCurrentCompletedGroup()?.taskGroup?.id;
        this.updateTasksMultiple(
          taskIds,
          completedGroupId,
          status,
          currentFolderId,
          null,
          () => {
            this.fireworksTimeout = this.utilsService.openFireworksByMouseEvent(
              event,
              1000,
              () => {
                this.inboxToolbarService.setInboxItem([]);
              }
            );
          }
        );
        break;
      case EInboxQueryParams.MESSAGES:
        this.changeMessagesStatus(
          taskIds,
          status,
          conversationIds,
          undefined,
          tasksData
        );
        break;
      case EInboxQueryParams.APP_MESSAGE:
        this.changeMessagesStatus(
          taskIds,
          status,
          conversationIds,
          EConversationType.APP,
          tasksData
        );
        break;
      case EInboxQueryParams.VOICEMAIL_MESSAGES:
        this.changeMessagesStatus(
          taskIds,
          status,
          conversationIds,
          EConversationType.VOICE_MAIL,
          tasksData
        );
        break;
      case EInboxQueryParams.SMS_MESSAGES:
        const confirmModalConfig = {
          title: `Are you sure you want to resolve this message?`,
          okText: 'Confirm',
          cancelText: 'Cancel',
          subtitle:
            'To satisfy spam legislation, only the customer can re-open an SMS conversation once it has been resolved.',
          colorBtn: 'primary',
          closable: false,
          iconName: '',
          className: 'confirm-sms-resolve-modal',
          modelWidth: 470,
          checkboxLabel: '',
          allowCheckbox: false,
          hiddenCancelBtn: false
        };

        this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
          this.loadingAction = res?.result;
          if (!!res.result) {
            this.messageTaskLoadingService.onLoading();
            this.changeMessagesStatus(
              taskIds,
              status,
              conversationIds,
              EConversationType.SMS,
              tasksData
            );
          }
        });
        break;
      case EInboxQueryParams.MESSENGER:
        this.changeMessagesStatus(
          taskIds,
          status,
          conversationIds,
          EConversationType.MESSENGER,
          tasksData
        );
        break;
      case EInboxQueryParams.WHATSAPP:
        this.changeMessagesStatus(
          taskIds,
          status,
          conversationIds,
          EConversationType.WHATSAPP,
          tasksData
        );
        break;
      default:
        return;
    }
  }

  handleConfirmPermanentlyDelete() {
    const taskIds = this.inboxItems.map((item) => item.id) as string[];
    this.taskApiService.permanentlyDeleteTasks(taskIds).subscribe({
      next: (res) => {
        const currentFolder = this.taskFolders.find((folder) =>
          folder.taskGroups.some(
            (group) =>
              group.id === (this.inboxItems[0] as ITaskRow)?.taskGroupId
          )
        );
        this.updateTaskList(
          this.inboxItems as ITaskRow[],
          currentFolder?.id,
          null
        );
        const taskSelectedMess = `${taskIds.length} ${
          taskIds.length > 1 ? 'tasks' : 'task'
        }`;
        this.toatrService.success(`${taskSelectedMess} deleted`);
        this.inboxToolbarService.setInboxItem([]);
        this.router.navigate([], {
          queryParams: {
            taskId: null
          },
          queryParamsHandling: 'merge'
        });
      },
      error: () => {
        this.toatrService.error(`Deleted failed`);
      },
      complete: () => {
        this.triggerMenu.close();
        this.loadingAction = false;
        this.inboxToolbarService.setInboxItem([]);
        this.taskGroupService.setEditMode(false);
      }
    });
  }

  changeMessagesStatus(
    messageIds: string[],
    status: TaskStatusType,
    conversationIds: string[],
    conversationType?: EConversationType,
    tasksData: TaskDataPayloadChangeStatus[] = []
  ) {
    if (
      [
        TaskStatusType.completed,
        TaskStatusType.deleted,
        TaskStatusType.inprogress
      ].includes(status)
    ) {
      //clear inbox items then close inbox tool bar
      this.inboxToolbarService.setInboxItem([]);

      this.headerService.setConversationAction({
        option:
          status === TaskStatusType.completed
            ? EMessageMenuOption.RESOLVE
            : status === TaskStatusType.deleted
            ? EMessageMenuOption.DELETE
            : EMessageMenuOption.REOPEN,
        taskId: null,
        isTriggeredFromRightPanel: false,
        isTriggeredFromToolbar: true,
        messageIds,
        conversationIds
      });
    }
    this.taskService
      .changeTaskStatusMultiple(tasksData, status)
      .pipe(
        tap(() => {
          this.handleToastByStatus(
            messageIds,
            status,
            conversationIds,
            conversationType
          );
          this.taskService.removeTasks$.next(messageIds);
          this.inboxToolbarService.setFilterInboxList(true);
          this.taskService.setSelectedConversationList([]);
        }),
        mergeMap(() => this.statisticService.statisticTotalTask$),
        first(),
        finalize(
          () =>
            conversationType === EConversationType.SMS &&
            this.messageTaskLoadingService.stopLoading()
        )
      )
      .subscribe((_totalTask) => {
        this.statisticService.updateStatisticTotalTask(
          this.currentParams[ETaskQueryParams.TASKTYPEID] ||
            this.currentParams[EMessageQueryType.MESSAGE_STATUS],
          -messageIds.length
        );
        this.loadingAction = false;
      });
  }

  updateTasksMultiple(
    taskIds: string[],
    taskGroupId?: string,
    status?: TaskStatusType,
    taskFolderId?: string,
    taskFolderName?: string,
    callBackAfterSuccess?: () => void
  ) {
    this.taskService
      .updateTask({
        taskIds: taskIds,
        mailBoxId: this.currentMailboxId,
        taskGroupId: taskGroupId,
        status: status
      })
      .pipe(
        map((data) => {
          if (Object.keys(data).includes('isSuccessful')) return false;
          return data;
        })
      )
      .subscribe({
        next: (rs) => {
          if (rs) {
            this.updateTaskList(
              (this.inboxItems as ITaskRow[])
                .filter((task) => task.taskGroupId !== taskGroupId)
                .map((item) => ({ ...item, taskGroupId })),
              taskFolderId,
              taskGroupId
            );
            const taskSelectedMess = `${taskIds.length} ${
              taskIds.length > 1 ? 'tasks' : 'task'
            }`;
            if (status === TaskStatusType.inprogress) {
              if (!this.isSameFolder) {
                this.toatrService.success(
                  `${taskSelectedMess} moved to ${taskFolderName}`
                );
              }
              return;
            }
            if (taskIds.length === 1) {
              const dataForToast = {
                taskId: taskIds[0],
                isShowToast: true,
                type: SocketType.changeStatusTask,
                mailBoxId: this.currentMailboxId,
                taskType: TaskType.TASK,
                status: status,
                pushToAssignedUserIds: []
              };
              this.toastCustomService.openToastCustom(
                dataForToast,
                true,
                EToastCustomType.SUCCESS_WITH_VIEW_BTN
              );
              return;
            }
            this.toatrService.success(
              `${taskSelectedMess} ${status.toLocaleLowerCase()}`
            );
            return;
          }
        },
        error: () => {
          if (status === TaskStatusType.inprogress) {
            this.toatrService.error(`Move to failed`);
            return;
          }
          this.toatrService.error(
            `${status.toLowerCase().replace(/\b[a-z]/g, function (letter) {
              return letter.toUpperCase();
            })} failed`
          );
        },
        complete: () => {
          this.triggerMenu.close();
          this.loadingAction = false;
        }
      })
      .add(() => {
        if (callBackAfterSuccess) {
          callBackAfterSuccess();
        } else {
          this.inboxToolbarService.setInboxItem([]);
        }
      });
  }

  updateTaskList(tasks: ITaskRow[], taskFolderId: string, taskGroupId: string) {
    this.isSameFolder =
      this.currentParams[ETaskQueryParams.TASKTYPEID] &&
      taskFolderId &&
      this.currentParams[ETaskQueryParams.TASKTYPEID] === taskFolderId;
    this.inboxToolbarService.updateTasks({
      action: this.isSameFolder
        ? EUpdateMultipleTaskAction.CHANGE_POSITION
        : EUpdateMultipleTaskAction.DELETE,
      payload: {
        tasks: tasks,
        targetId: taskGroupId,
        isCompletedGroup: this.inboxSidebarService.isCompletedGroup(
          taskFolderId,
          taskGroupId
        )
      }
    });
  }

  handleMoveTasksToGroup(
    taskFolder: ITaskFolder,
    taskGroup: ITaskGroup,
    event: MouseEvent
  ): void {
    const { id: taskGroupId, isCompletedGroup } = taskGroup;
    const { id: taskFolderId, name: taskFolderName } = taskFolder;

    const taskIds = (this.inboxItems as ITaskRow[])
      .filter((item) => item.taskGroupId !== taskGroup.id)
      .map((item) => item.id);

    if (!taskIds?.length) {
      this.triggerMenu.close();
      return;
    }

    if (
      checkScheduleMsgCount(this.listConversationSelected) &&
      [TaskStatusType.completed, TaskStatusType.deleted].includes(
        taskGroup.name as TaskStatusType
      )
    ) {
      const isMessage = this.activePath === EInboxQueryParams.MESSAGES;
      const errorMsg =
        taskGroup.name === TaskStatusType.completed
          ? !!isMessage
            ? ErrorMessages.RESOLVE_CONVERSATION
            : ErrorMessages.RESOLVE_TASK
          : !!isMessage
          ? ErrorMessages.DELETE_CONVERSATION
          : ErrorMessages.DELETE_TASK;
      this.handleShowWarningMsg(errorMsg);
      return;
    }

    this.loadingAction = true;
    this.updateTasksMultiple(
      taskIds,
      taskGroupId,
      isCompletedGroup ? TaskStatusType.completed : TaskStatusType.inprogress,
      taskFolderId,
      taskFolderName,
      () => {
        if (isCompletedGroup) {
          this.fireworksTimeout =
            this.utilsService.openFireworksByQuerySelector(
              '#move-to-option',
              1000,
              () => {
                this.inboxToolbarService.setInboxItem([]);
              }
            );
        } else {
          this.inboxToolbarService.setInboxItem([]);
        }
      }
    );
  }

  public menuPosition = [POSITION_MAP.topLeft];

  openMenu(event: MouseEvent) {
    if (this.triggerMenu.menuTrigger) {
      this.triggerMenu.close();
    }
    if (this.activePath === EInboxQueryParams.TASKS) {
      this.triggerMenu.menuTrigger = this.folderMenu.templateRef;
    }
    if (this.activePath === EInboxQueryParams.MESSAGES) {
      this.triggerMenu.menuTrigger =
        this.triggerMenu.menuTrigger === this.moveToOptionMenu.templateRef
          ? this.folderMenu.templateRef
          : this.moveToOptionMenu.templateRef;
    }
    this.triggerMenu.dClicked(event);
  }

  private handleToastByStatus(
    messageIds: string[],
    status: TaskStatusType,
    conversationIds: string[],
    conversationType: EConversationType
  ) {
    let message = '';
    const messageSelected = `${conversationIds.length} ${
      conversationIds.length > 1 ? 'messages' : 'message'
    }`;

    if (conversationIds.length === 1) {
      const dataForToast = {
        conversationId: conversationIds?.[0],
        taskId: messageIds[0],
        isShowToast: true,
        type: SocketType.changeStatusTask,
        mailBoxId: this.currentMailboxId,
        taskType: TaskType.MESSAGE,
        status: status,
        pushToAssignedUserIds: [],
        isAppMessage: true,
        conversationType
      };

      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
      return;
    }

    switch (status) {
      case TaskStatusType.inprogress:
        message = MESSAGE_REOPENED.replace('Message', messageSelected);
        this.toatrService.success(message);
        break;
      case TaskStatusType.completed:
        message = MESSAGE_RESOLVED.replace('Message', messageSelected);
        this.toatrService.success(message);
        break;
      case TaskStatusType.deleted:
        message = MESSAGE_DELETED.replace('Message', messageSelected);
        this.toatrService.success(message);
        break;
      default:
        message = MESSAGE_MOVED.replace('Messages', messageSelected);
        this.toatrService.success(message);
        break;
    }
  }

  checkFromMailReminder(newQueryParams) {
    return newQueryParams['action'] === 'createTask';
  }

  getTotalTask() {
    this.statisticService.statisticTotalTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((total) => {
        if (total) {
          this.totalTask = total;
        }
      });
  }

  handlePopupState() {
    this.isShowModalForward = false;
  }

  handleConfirm() {
    this.taskService
      .getListConfirmProperties()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.dataConvert = res?.listConversationMove.concat(
          res?.listConversationNotMove.filter((item) => item.isChecked)
        );
      });
    this.isCreatePopupState = true;
    this.showBackBtn = true;
  }

  onCancelConfirmProperties(e) {
    this.isShowModalCreateTask = e;
    this.showBackBtn = false;
  }

  handleSelectBulkSendMethod(option: EBulkSendMethod) {
    this.resetFill();
    this.sendMessageConfigs = {
      ...this.defaultCreateNewConversationConfigs,
      'header.isChangeHeaderText': true,
      'header.viewRecipients': true,
      'body.prefillReceivers': false,
      'body.receiver.prefillSelectedTypeItem': true,
      'body.receiver.isShowContactType': true,
      'footer.buttons.showBackBtn': false,
      'footer.buttons.showConfirmRecipientBackBtn': true,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
      'otherConfigs.openFromBulkCreateTask':
        option === EBulkSendMethod.TRIGGER_STEP_FROM_TASK,
      'inputs.openFrom': TaskType.MESSAGE,
      'inputs.typeMessage': ETypeMessage.SCRATCH,
      'inputs.rawMsg': '',
      'inputs.isAppUser': false,
      'inputs.taskTemplate': this.taskTemplate,
      'inputs.selectedTasksForPrefill': this.selectedCreatedTasksData?.map(
        (item) => ({
          taskId: item.taskId,
          propertyId: item.property?.id
        })
      )
    };
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    this.handleOpenSendMsg(this.sendMessageConfigs);
  }

  onTriggerBulkSendMsg() {
    this.isShowBulkSendMethod = true;
  }

  updateArray(inbox, updatedItem) {
    return inbox?.map((item) =>
      item.id === updatedItem?.id ? { ...item, ...updatedItem } : item
    );
  }

  private handleSendMessage() {
    this.listDynamicFieldData = [];
    if (this.activePath === EInboxQueryParams.MESSAGES) {
      let receiverList = this.inboxItems.map((item) => ({
        id: item?.conversations[0]?.userId,
        propertyId: item?.property?.id
      }));
      this.listUser = (this.inboxItems as TaskItem[])
        .map((item: TaskItem) => {
          const checkName = !item?.conversations?.[0]?.email;
          const phoneNumber = this.phoneNumberFormatPipe.transform(
            item?.conversations[0]?.phoneNumber as string
          );
          return {
            id: item?.conversations[0]?.userId,
            isEmail: item?.conversations[0]?.email === '',
            email: checkName
              ? displayName(
                  item?.conversations[0]?.firstName,
                  item?.conversations[0]?.lastName,
                  phoneNumber,
                  true
                )
              : item?.conversations[0]?.email,
            propertyId: item?.property?.id,
            firstName: checkName ? '' : item?.conversations[0]?.firstName,
            lastName: item?.conversations[0]?.lastName,
            type:
              item?.conversations[0]?.messageComeFrom ===
                EMessageComeFromType.VOICE_MAIL &&
              item?.conversations[0]?.email === null &&
              item?.conversations[0]?.firstName === null &&
              item?.conversations[0]?.lastName === null
                ? EUserPropertyType.EXTERNAL
                : item?.conversations[0]?.propertyType,
            group: item?.conversations[0]?.propertyType,
            isPrimary: true,
            streetLine: item?.property?.streetline,
            shortenStreetline: item?.property?.shortenStreetline,
            isValid:
              item?.conversations[0]?.messageComeFrom ===
                EMessageComeFromType.VOICE_MAIL &&
              item?.conversations[0]?.email === null &&
              item?.conversations[0]?.firstName === null &&
              item?.conversations[0]?.lastName === null
                ? false
                : true,
            title: item?.title,
            messageComeFrom: item?.conversations[0]?.messageComeFrom,
            isTemporary: item?.property?.isTemporary,
            isAppUser:
              item?.conversations[0]?.inviteStatus === UserStatus.ACTIVE,
            contactType: item?.conversations[0]?.contactType,
            conversationId: item?.conversations[0]?.id,
            taskId: item?.id,
            participants: (
              (item?.conversations[0]?.participants as IParticipant[]) || []
            ).filter(
              (participant) =>
                ![
                  EUserPropertyType.AGENT,
                  EUserPropertyType.LEAD,
                  EUserPropertyType.MAILBOX
                ].includes(participant.type as EUserPropertyType) &&
                !!(participant.email || participant.originalEmailName)
            )
          };
        })
        ?.filter((user) => !!user.participants?.length);
      this.createNewConversationConfigs = {
        ...this.defaultCreateNewConversationConfigs,
        'header.isChangeHeaderText': true,
        'body.receiver.isShowContactType': false,
        'body.prefillReceivers': true,
        'body.prefillReceiversList': receiverList,
        'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_MESSAGES,
        'otherConfigs.isCreateMessageType': false,
        'header.viewRecipients': true,
        'inputs.listUser': this.listUser,
        'inputs.isAppUser': this.listUser?.some((user) => user?.isAppUser),
        'inputs.typeMessage': ETypeMessage.SCRATCH,
        'inputs.openFrom': EInboxAction.SEND_MESSAGE,
        'inputs.selectedTasksForPrefill': this.inboxItems?.map((item) => ({
          taskId: item.id,
          propertyId: item.property?.id
        })),
        'inputs.rawMsg': '',
        'otherConfigs.filterSenderForReply': true,
        'otherConfigs.isShowGreetingSendBulkContent': true
      };
      this.resetFill();
      this.handleOpenSendMsg(this.createNewConversationConfigs);
    } else {
      this.listUser = [];
      this.createNewConversationConfigs = {
        ...this.defaultCreateNewConversationConfigs,
        'header.isChangeHeaderText': true,
        'body.receiver.isShowContactType': true,
        'footer.buttons.showBackBtn': false,
        'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
        'body.prefillReceiversList': [],
        'otherConfigs.isCreateMessageType': false,
        'header.viewRecipients': true,
        'inputs.typeMessage': ETypeMessage.SCRATCH,
        'inputs.openFrom': TaskType.MESSAGE,
        'inputs.selectedTasksForPrefill': this.inboxItems?.map((item) => ({
          taskId: item.id,
          propertyId: item.property?.id
        })),
        'inputs.rawMsg': '',
        'otherConfigs.isShowGreetingSendBulkContent': true
      };
      this.handleOpenSendMsg(this.createNewConversationConfigs);
    }
  }

  handleOpenSendMsg(config) {
    this.messageFlowService
      .openSendMsgModal(config)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            break;
          case ESendMessageModalOutput.BackFromSelectRecipients:
            this.handleBackModalTrigger();
            break;
          case ESendMessageModalOutput.MessageSent:
            this.handleClosePopOverAfterSend(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.handleCloseModalSendMsg();
            break;
        }
      });
  }

  handleCloseModalSendMsg() {
    this.resetFill();
    this.selectedTasks = [];
    this.listUser = [];
    this.createdTasksData = [];
    this.selectedCreatedTasksData = [];
  }

  handleClosePopOverAfterSend({ data, event }: ISendMsgTriggerEvent) {
    this.handleClose();
    this.handleClearSelected();
    this.listUser = [];
    this.resetFill();
  }

  completeStepAfterSendBulkMessage(data) {
    let taskIds = [];
    if (Array.isArray(data) && data?.length) {
      taskIds = Array.from(
        new Set(data.map((mess) => mess?.emailMessage?.taskId).filter(Boolean))
      );
    }
    this.stepService
      .updateStepMultipleToTask(
        taskIds,
        this.prefillData?.id,
        this.prefillData?.action,
        TrudiButtonEnumStatus.COMPLETED,
        this.prefillData?.stepType
      )
      .subscribe();
  }

  resetFill() {
    this.prefillData = null;
    this.trudiDynamicParameterService.resetTemplate();
    this.sendMessageConfigs = {};
  }

  handleBackModalTrigger() {
    this.isShowBulkSendMethod = true;
    this.listDynamicFieldData = [];
    this.selectedTasks = [];
  }

  handleMoveMessToExistTask() {
    this.taskService.selectedTaskToMove.next(null);
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_TASK
    );
  }

  handleMoveMessToEmailFolder() {
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_EMAIL_FOLDER
    );
  }

  private processInboxItems(inboxItems: any[]) {
    this.threadIds = inboxItems.map((message) => {
      if (message?.threadId) {
        return message?.threadId;
      }
    });
    this.conversationIds = inboxItems.map((message) => {
      if (message?.conversationId) {
        return message?.conversationId;
      }
    });
    const listFolder = this.getListEmailFolder();
    const folderTarget = listFolder?.find(
      (item) => item.externalId === this.currentParams['externalId']
    );
    this.currentLabelId = folderTarget?.internalId;
  }

  handleMoveMessages(newStatus: TaskStatusType, listThreadId?: string[]) {
    this.toastService.clear();
    this.toastService.show(
      getTitleToastMovingProcessing(this.threadIds, newStatus),
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
    const externalId = this.currentParams[EMessageQueryType.EXTERNAL_ID];
    const currentMailBoxId = this.getCurrentMailBoxIdByStatus();
    const listMailFolder = this.getListEmailFolder();
    const currentLabelId = listMailFolder?.find(
      (folder) => folder.externalId === externalId
    )?.internalId;

    const payload = {
      mailBoxId: currentMailBoxId,
      threadIds: listThreadId?.length > 0 ? listThreadId : this.threadIds,
      currentLabelId,
      newStatus: newStatus,
      isValidateTask: newStatus === TaskStatusType.inprogress
    };
    this.emailApiService
      .moveMailFolder(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (res?.data?.length === 0) {
            this.inboxToolbarService.setInboxItem([]);
            this.inboxToolbarService.setFilterInboxList(false);
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              currentMailBoxId
            );
            this.sharedMessageViewService.setIsSelectingMode(false);
            this.conversationService.currentConversation.next(null);
          } else {
            this.toastService.clear();
            this.emailViewService.handleConfirmMoveMailToInbox.next({
              data: res?.data,
              payload
            });
          }
        },
        error: (error) => {
          this.visible = false;
          this.inboxToolbarService.setInboxItem([]);
          this.inboxToolbarService.setFilterInboxList(false);
          this.sharedMessageViewService.setIsSelectingMode(false);
          this.conversationService.currentConversation.next(null);
          this.toastService.clear();
          this.toastService.error(
            error?.error?.message ?? 'Move to folder failed. Please try again.'
          );
        }
      });
  }

  getCurrentMailBoxIdByStatus() {
    return this.currentParams[EMessageQueryType.MESSAGE_STATUS] ===
      TaskStatusType.mailfolder
      ? this.currentMailboxIdEmailFolder
      : this.currentMailboxId;
  }

  handleResetPopup() {
    this.selectedFolderId = '';
    this.popupState = null;
    this.inboxService.setPopupMoveToTaskState(null);
    this.taskService.selectedTaskToMove.next(null);
    this.openByModalExistingTask = false;
    this.optionCreateTaskMultiple = null;
    this.taskService.triggerToggleMoveConversationSate.next({
      singleMessage: false,
      multipleMessages: false
    });
  }

  handleNotifyToastWhenSendMessageDone() {
    this.subscribeToSocketNotifySendBulkMessageDone();
    this.subscribeToSocketNotifySendV3MessageDone();
    this.subscribeToSocketNotifySendBulkAndV3MessageDone();
    this.subscribeToSocketNotifySendManyEmailMessageDone();
  }

  getMessageContentWhenSendMessageDone(data) {
    if (data?.messages?.[0]?.isDraft) {
      return;
    }
    let messageLabel = '';
    if (data.status === SyncPropertyDocumentStatus.SUCCESS) {
      if (data.messageSended === 1) {
        const dataForToast = {
          conversationId: data.messages[0].conversationId,
          taskId: data.messages[0].taskId,
          isShowToast: true,
          type: data.type,
          mailBoxId: this.currentMailboxId,
          taskType: data.taskType || TaskType.MESSAGE,
          pushToAssignedUserIds: [],
          status: data.messages[0].status || TaskStatusType.inprogress
        };
        this.toastCustomService.openToastCustom(
          dataForToast,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
      } else {
        messageLabel = `${data.messageSended} messages sent`;
        this.toastService.success(messageLabel);
      }
    } else {
      let messageFailed = data.totalMessage - data.messageSended;
      messageLabel = `${messageFailed} ${
        messageFailed === 1 ? 'message' : 'messages'
      }`;
      this.toastService.error(
        `${data.totalMessage - data.messageSended} failed to send`
      );
    }
  }

  subscribeToSocketNotifySendBulkMessageDone() {
    this.websocketService.onSocketNotifySendBulkMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.getMessageContentWhenSendMessageDone(rs);
      });
  }

  subscribeToSocketNotifySendV3MessageDone() {
    this.websocketService.onSocketNotifySendV3MessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.getMessageContentWhenSendMessageDone(rs);
      });
  }

  subscribeToSocketNotifySendBulkAndV3MessageDone() {
    this.websocketService.onSocketNotifySendBulkAndV3MessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.getMessageContentWhenSendMessageDone(rs);
      });
  }

  subscribeToSocketNotifySendManyEmailMessageDone() {
    this.websocketService.onSocketNotifySendManyEmailMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.getMessageContentWhenSendMessageDone(rs);
      });
  }

  subscribeCheckMoveToFolder() {
    this.refetchCheckMoveToFolder$
      .pipe(
        switchMap(() => {
          let threadIdsParam = [];
          let conversationIdsParam = [];
          const currentStatus = this.currentParams[EInboxQueryParams.STATUS];
          if (currentStatus === TaskStatusType.mailfolder) {
            threadIdsParam = this.inboxItems.map((item) => item?.threadId);
          } else if (currentStatus === TaskStatusType.inprogress) {
            conversationIdsParam = this.inboxItems.map(
              (item) => item?.conversations[0]?.id
            );
          }
          const currentMailBoxId = this.getCurrentMailBoxIdByStatus();
          const payload = {
            mailBoxId: currentMailBoxId,
            threadIds: threadIdsParam,
            conversationIds: conversationIdsParam,
            ...(currentStatus === TaskStatusType.mailfolder
              ? { labelId: this.currentLabelId }
              : { status: currentStatus })
          };
          return this.emailApiService.checkMoveMailFolder(payload);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (res) {
          const emailFolders = res?.emailFolders.map((item) => item.id);
          this.emailApiService.setlistEmailFolder(emailFolders);
          this.isDisabledToolbar = res;
          this.toolbarConfig?.mailfolder[0]?.children.map((item) => {
            switch (item?.key) {
              case EInboxAction.MOVE_MESSAGE_TO_INBOX:
                item.disabled = !this.isDisabledToolbar.inbox;
                break;
              case EInboxAction.MOVE_MESSAGE_TO_EMAIL:
                item.disabled = false;
                break;
              case EInboxAction.MOVE_MESSAGE_TO_RESOLVED:
                item.disabled = !this.isDisabledToolbar.resolvedEnquiries;
                break;
              case EInboxAction.MOVE_MESSAGE_TO_DELETED:
                item.disabled = !this.isDisabledToolbar.deletedEnquiries;
                break;
            }
          });

          if (
            this.currentParams[EInboxQueryParams.STATUS] !==
            TaskStatusType.mailfolder
          ) {
            const disableMoveToFolder = (item) => {
              if (item.key === EInboxAction.MOVE_TO_FOLDER) {
                const hasMessageInTask = this.inboxItems.some(
                  (item) => item.isMessageInTask
                );
                item.disabled = !res?.emailFolders.length || hasMessageInTask;
                item.tooltip = hasMessageInTask
                  ? 'Unselect task emails to move'
                  : '';
              }
            };

            this.toolbarConfig.inprogress.forEach((item) => {
              disableMoveToFolder(item);

              if (item.label === 'More') {
                item.children.forEach(disableMoveToFolder);
              }
            });
          }

          if (!this.isDisabledToolbar?.emailFolders.length) {
            const newMailfolderConfig = this.toolbarConfig.mailfolder.map(
              (item) => {
                const config = item?.children?.filter(
                  (item) => item.key !== EInboxAction.MOVE_MESSAGE_TO_EMAIL
                );
                return {
                  ...item,
                  children: config
                };
              }
            );
            this.toolbarConfig.mailfolder = newMailfolderConfig;
          }
        }
      });
  }

  handleViewTasks() {
    this.isShowPopupSendBulkMsg = false;
    this.modalManagementService.open(EModalID.ViewTasks);
  }

  handleConfirmViewTasks(event: ITasksForPrefillDynamicData[]) {
    this.modalManagementService.pop();
    this.selectedCreatedTasksData = event;
    this.isShowPopupSendBulkMsg = true;
  }

  handleCancelViewTasks() {
    this.modalManagementService.pop();
    this.isShowPopupSendBulkMsg = true;
  }

  handleSyncTasksActivity(downloadPDFFile: boolean = false) {
    this.syncTaskActivityService.setListTasksActivity(
      (this.inboxItems as ITaskRow[]) || [],
      downloadPDFFile
    );
  }

  ngOnDestroy(): void {
    this.handleRemoveEventKeyup();
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.destroyToolbarInbox();
    this.componentRef = null;
    clearTimeout(this.fireworksTimeout);
    this.inboxToolbarService.destroy$.next();
    this.syncMessagePropertyTreeService.setTriggerSyncMessagePT(null);
  }

  private _splitUrl(url: string) {
    const [route, params] = url?.split('?');
    const paramsMap = !params
      ? {}
      : params?.split('&').reduce((prev, current) => {
          const [key, value] = current?.split('=');
          return {
            ...prev,
            [key]: value
          };
        }, {} as { [key: string]: string });
    return {
      route,
      paramsMap
    };
  }
}
