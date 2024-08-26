import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Host,
  Inject,
  Injector,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import {
  Subject,
  combineLatest,
  of,
  Observable,
  Subscription,
  BehaviorSubject
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { hasSomeParentTheClass } from '@core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { REGEX_PARAM_TASK_EDITOR } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { EDynamicType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  AgencyService as AgencyDashboardService,
  AgencyService
} from '@/app/dashboard/services/agency.service';
import {
  ChatGptService,
  EBoxMessageType,
  IStatusType
} from '@services/chatGpt.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  ALLOWED_TYPES,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE,
  MAX_TEXT_MESS_LENGTH,
  SIGNATURE_HTML,
  PLAIN_LINK_REGEX,
  RemiderTooltip,
  TIME_FORMAT,
  listFileDisplayThumbnail,
  trudiUserId,
  MAX_INPUT_URL_LENGTH
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService, LocalFile } from '@services/files.service';
import { HelpCentreService } from '@services/help-centre.service';
import { NotificationService } from '@services/notification.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import {
  CheckBoxImgPath,
  ETinyEditorToolbarPosition,
  ImgPath
} from '@shared/enum/share.enum';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  GetListUserPayload,
  GetListUserResponse,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  extractQuoteAndMessage,
  isCheckedReceiversInList
} from '@/app/trudi-send-msg/utils/helper-functions';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  IFromUserMailBox,
  IReceiver,
  ISelectedReceivers,
  ITrudiSendMsgAttachBtnConfig
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { IconType } from '@trudi-ui';
import { fileLimit, showAIReplyFeature } from 'src/environments/environment';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType, UserStatus } from '@shared/enum/user.enum';
import {
  combineNames,
  getThumbnailForVideo,
  processFile,
  validateFileExtension,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import { EAvailableFileIcon, IFile } from '@shared/types/file.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import {
  AISETTING_PLACEMENT,
  AITitle,
  AiGenerateMsgCopyComponent
} from './ai-generate-msg-copy/ai-generate-msg-copy.component';
import './plugins/shortlink/main';
import './plugins/custom-link/main';
import { hasProtocol } from './plugins/shortlink/core/utils';
import {
  sendOptionModel,
  sendOptionType
} from './send-option-control/send-option-control.component';
import {
  findMatchingElement,
  handleSelectionContentHasNonEditable,
  hasElementInDocument,
  IMAGE_LOADING_REGEX,
  initializeImageErrorHandler,
  removeImageErrorHandler,
  removeLineHeight,
  replaceImageLoading,
  setHeightCommunicationWrapper
} from './utils/functions';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { Property } from '@shared/types/property.interface';
import { EFileType } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import { IActiveLink } from './plugins/custom-link/api/types';
import { isAnchor } from './plugins/custom-link/core/utils';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import * as HTMLParser from 'node-html-parser';
import { InsertLinkComponent } from './insert-link/insert-link.component';
import { InsertLinkService } from './insert-link/services/insert-link.service';
import { OutOfOfficeService } from '@/app/mailbox-setting/services/out-of-office-state.service';
import { OutOfOffice } from '@shared/types/profile-setting.interface';
import {
  generateThreeDotsButton,
  QUOTE_CLASS,
  removeReplyQuote
} from '@shared/components/tiny-editor/utils/hiddenQuote';
import { IMailboxSetting } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { trudiInfo } from '@/app/mailbox-setting/utils/out-of-office-config';
import { TrudiSendMsgV2Component } from '@/app/trudi-send-msg/trudi-send-msg-v2.component';
import { CompanyService } from '@services/company.service';
import { EMailBoxStatus } from '@shared/enum';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { TrudiSendMsgV3Component } from '@/app/trudi-send-msg/trudi-send-msg-v3.component';
import { EDataE2ESend } from '@shared/enum/E2E.enum';
import { CurrentUser } from '@shared/types/user.interface';
import { TrudiBulkSendMsgComponent } from '@/app/trudi-send-msg/trudi-bulk-send-msg.component';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { EGreeting, ERecipient } from '@/app/mailbox-setting/utils/enum';
import { TinyEditorFileControlService } from '@services/tiny-editor-file-control.service';
import { TrudiDynamicParameterDataService } from '@/app/trudi-send-msg/services/trudi-dynamic-parameter-data.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { EDeleteInLineType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import uuid4 from 'uuid4';
import { FontFamilyComponent } from './font-family/font-family.component';
import { FontSizeComponent } from './font-size/font-size.component';
import { TrudiService } from '@services/trudi.service';
import { Bookmark, Editor } from 'tinymce';
import {
  createHtmlCardItem,
  createHtmlCardItemForMessenger
} from '@/app/trudi-send-msg/utils/build-html-contact-card';
import { TextColorComponent } from './text-color/text-color.component';
import { TextBackgroundColorComponent } from './text-background-color/text-background-color.component';
import { CdkScrollable, Overlay } from '@angular/cdk/overlay';
import { ICompany } from '@shared/types/company.interface';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import {
  AgencyEmailFontSettingService,
  FontSetting
} from '@services/agency-email-font-setting.service';
import { AIDetectPolicyService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-detect-policy.service';

import buildCustomSelection, {
  EOverLayRef,
  createPolicyDetailPanel,
  destroyOverlayRef,
  injectServiceToSelectionPlugin,
  valueInputsChangeToBuildCustomSelection
} from './plugins/selection-popup/plugin';
import { AiInteractiveBuilderService } from '@shared/components/tiny-editor/services/ai-interactive-builder.service';
import {
  APPLY_CUSTOM_FONT_EVENT,
  CUSTOMIZE_FONT_STYLE_CLASS,
  defaultFontFamily,
  defaultFontSize
} from './utils/font-utils';
import { Router } from '@angular/router';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import { DOCUMENT } from '@angular/common';
import {
  focusElement,
  replaceParamVariables
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import dayjs from 'dayjs';
import { UnorderedListComponent } from '@/app/shared/components/tiny-editor/unordered-list/unordered-list.component';
import { OrderedListComponent } from '@/app/shared/components/tiny-editor/ordered-list/ordered-list.component';
import { AnimationOptions } from 'ngx-lottie';

export enum TinyEditorOpenFrom {
  SendMessage = 'SendMessage',
  AppChat = 'AppChat',
  OutOfOffice = 'OutOfOffice',
  SMS = 'SMS'
}

enum ToolbarAction {
  Bold = 'Bold',
  Italic = 'Italic',
  Underline = 'Underline',
  NumList = 'Numbered list',
  BullList = 'Bullet list',
  Attach = 'Attachments',
  More = 'More formatting',
  Tag = 'Tag',
  Emoji = 'Emoji',
  EmailSignature = 'Email signature',
  AISetting = 'AI generate message',
  Code = 'Insert',
  InsertLink = 'mceLink',
  mceInsertLink = 'mceInsertLink',
  AIGenerateTemplateSetting = 'AI setting',
  FontFamily = 'Font Family',
  FontSize = 'Font Size',
  TextColor = 'Text Color',
  HighLightColor = 'Highlight  Color'
}

export enum AttachAction {
  Computer = 'Computer',
  REIForm = 'REI Form',
  ContactCard = 'Contact Card',
  CRM = 'CRM'
}

enum EditorValue {
  Internal = 'Internal note',
  ReplyViaApp = 'Reply via app',
  ReplyViaEmail = 'Reply via email'
}

export enum SendOption {
  Send = 'Send',
  SendResolve = 'Send & resolve',
  ScheduleForSend = 'Schedule for send',
  Resend = 'Resend'
}

export const CRM_CHECK = {
  [ECRMSystem.PROPERTY_TREE]: 'Property Tree',
  [ECRMSystem.RENT_MANAGER]: 'Rent Manager'
};

const DEBOUNCE_TIME_MS = 1000;

export const EMAIL_SIGNATURE_REGEX =
  /<div id=["']{1}email-signature["']{1}>[^]*<\/div>/g;

export const GREETING_AI_SUMMARY_CONTENT_REGEX =
  /<span id="ai-summary-greeting">.*?<\/span>/s;

export const RECIPIENT_ELEMENT_REGEX =
  /<span id="recipient-element".*?<\/span>/s;

export const GREETING_ELEMENT_REGEX =
  /<span id="greeting-element">.*?<\/span>/s;

export const GREETING_CONTAINER_REGEX =
  /<p id="select-user-container">.*?<\/p>/s;
export const GREETING_AI_SUMMARY_REGEX =
  /<p id="ai-summary-container">.*?<\/p>/s;

export const GREETING_SELECT_USER_CONTENT_REGEX =
  /<span id="select-user-greeting">.*?<\/span>/s;

const EMIT_STYLE_SIGNATURE_ID = 'emit-style-signature';

interface IToolbarButton {
  value: ToolbarAction;
  selected?: boolean;
  icon?: keyof typeof IconType;
  id?: string;
  selectedIcon?: keyof typeof IconType;
  show: boolean;
  attachOptions?: any;
  divider?: boolean;
  showPopup?: boolean;
  component?: unknown;
  tooltip?: string;
  moreList?: Array<{
    tooltip?: string;
    value: ToolbarAction;
    icon: string;
    selected: boolean;
    show?: boolean;
    inputs?: {
      [key: string]: any;
    };
    outputs?: {
      [key: string]: any;
    };
    component?: unknown;
    attachOptions?: unknown;
    codeOptions?: unknown;
    disabled: boolean;
  }>;
  disabled?: boolean;
  inputs?: {
    [key: string]: any;
  };
  outputs?: {
    [key: string]: any;
  };
}

export interface IAiInteractiveBubbleConfigs {
  enableAiInteractiveReply: boolean;
  enableAiDetectsPolicy: boolean;
}

const defaultAiInteractiveBubbleConfig: IAiInteractiveBubbleConfigs = {
  enableAiInteractiveReply: true,
  enableAiDetectsPolicy: true
};

@DestroyDecorator
@Component({
  selector: 'tiny-editor',
  templateUrl: './tiny-editor.component.html',
  styleUrls: ['./tiny-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrudiSendMsgUserService, TrudiDynamicParameterDataService]
})
export class TinyEditorComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  // TODO implements ControlValueAccessor
  @Input() disabled = false;
  @Input() inlineMessage: boolean = false;
  @Input() text: string = '';
  @Input() from: TinyEditorOpenFrom = TinyEditorOpenFrom.AppChat;
  @Input() small = {
    smallUI: false,
    smallDropdown: false
  };
  @Input() maxHeight: number = null;
  @Input() isEmailSignature: boolean = true;
  @Input() hasError: boolean = false;
  @Input() listReceivers = [];
  @Input() attachBtnConfig: ITrudiSendMsgAttachBtnConfig =
    defaultConfigs.body.tinyEditor.attachBtn;
  @Input() scheduledDate: string;
  @Input() listCodeOptions = [];
  @Input() isShowEmbedCodeOptionsFunction: boolean = false;
  @Input() isForwardConversation: boolean = false;
  @Input() isForwardOrReplyMsg: boolean = false;
  @Input() disabledAutoSimilarReply: boolean = false;
  @Input() isScheduleForSend: boolean = false;
  @Input() enableAiGenerateMsgCopy: boolean = false;
  @Input() currentProperty: Property;
  @Input() isShowPreviewAttachment: boolean = false;
  @Input() showInsertLink: boolean = true;
  @Input() allowFontFamily: boolean = true;
  @Input() allowTextColor: boolean = false;
  @Input() allowTextBackgroundColor: boolean = false;
  @Input() allowTextStyle: boolean = true;
  @Input() scrolled: boolean = false;
  @Input() showAddPolicyPopover: boolean = true;

  // show hide email signature on editor
  @Input() isShowEmailSignature: boolean = true;
  @Input() isShowUploadAttachments: boolean = true;
  @Input() fromCommunicationStep = false;
  @Input() fromCheckListStep: boolean = false;
  @Input() toFieldLength: number = 0;
  @Input() isShowNegative: boolean = false;
  @Input() isShowSidebarRight: boolean = false;
  @Input() outOfOfficeDefaultSetting: OutOfOffice;
  @Input() toolbarPosition: ETinyEditorToolbarPosition =
    ETinyEditorToolbarPosition.TOP;
  @Input() isDisabledSendBtn: boolean = true;
  @Input() isShowSendActionTpl = true;
  @Input() isShowSendAction: boolean = false;
  @Input() isShowBackBtn: boolean = false;
  @Input() replyQuote: string = null;
  @Input() isEditMessageDraft: boolean = false;
  @Input() maxRemainCharacter: number = 0;
  @Input() countCharacterUp: boolean = true;
  @Input() openFrom: string = '';
  @Input() openFromBulkCreateTask: boolean = false;
  @Input() createMessageFrom: ECreateMessageFrom = null;
  @Input() isAppReply = false;
  @Input() allowFontSize: boolean = true;
  @Input() isStep = false;
  @Input() enableSetPreview: boolean = true;
  @Output() value = new EventEmitter<string>();
  @Output() originContent = new EventEmitter<string>();
  @Output() sendTypeChanges = new EventEmitter<SendOption>();
  @Output() addFileComputer = new EventEmitter();
  @Output() addFileCRM = new EventEmitter();
  @Output() addContactCard = new EventEmitter();
  @Output() addReiForm = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Output() submitSend = new EventEmitter<{
    value: string;
    resolved: boolean;
    isApp: boolean;
    listOfFiles: any;
    contactInfos: any;
    reminderTimes?: string;
    sendType: sendOptionType;
    isTrudi: boolean;
    typeBtn?: SendOption;
  }>();
  // TODO: remove disabledAttachBtn after apply trudi-send-msg
  @Input() disabledAttachBtn: boolean = true;
  @Input() isHandleStyleDynamicParamByCondition: boolean = false;
  @Input() isHandleFreeText: boolean = false;
  @Input() isCustomToolbar: boolean = false;
  @Input() minHeight: number = 0;
  @Input() placeholder: string = '';
  @Input() isReplaceDynamicParamWithData: boolean = false;
  @Input() deleteInlineType: EDeleteInLineType;
  @Input() allowInsertContactCardToContent: boolean = false;
  @Input() prefillContactCard: ISelectedReceivers[] = [];
  @Input() prefillPropertiesFromSendBulk;
  @Input() autoFocus = false;
  @Input() isInlineMessenger: boolean = false;
  @Input() sendOptionsToRemove: SendOption[] = [];
  @Input() aiInteractiveBubbleConfigs: IAiInteractiveBubbleConfigs =
    defaultAiInteractiveBubbleConfig;
  @Output() onFocus = new EventEmitter<boolean>(false);
  @Output() dropFile = new EventEmitter<any>(null);
  @Output() onChangeSendOption = new EventEmitter<SendOption>();
  @Output() contentHeightChange = new EventEmitter<number>(null);
  @Output() valueChanges = new EventEmitter<string>(null);
  @Output() onBlur = new EventEmitter<boolean>(null);
  @Output() showEmailSignature = new EventEmitter<boolean>(true);
  @Output() onChangeSelectViaOption = new EventEmitter<sendOptionModel>();
  @Output() triggerSignatureFromToolbar = new EventEmitter<boolean>(false);
  @Output() isInvalidAttachment = new EventEmitter<boolean>(false);
  @ViewChild('editorContainer', { static: true })
  editorContainer: ElementRef<HTMLDivElement>;
  @ViewChild('editor', { static: true }) editor: ElementRef<HTMLDivElement>;
  @ViewChild('listFile', { static: true }) listFile: ElementRef<HTMLDivElement>;
  @ViewChild('tinyEditor', { static: false }) tinyEditor: EditorComponent;
  @ViewChild('toolbarTemp', { static: false })
  toolbar: ElementRef<HTMLDivElement>;
  @ViewChild('sendActionBtn', { static: false })
  sendActionBtn: ElementRef<HTMLElement>;

  @Input() set defaultSelectedSendOption(defaultSelectedSendOption: number) {
    if (typeof defaultSelectedSendOption === 'number') {
      this.defaultSelectedSendOption$.next(defaultSelectedSendOption);
    } else {
      this.defaultSelectedSendOption$.next(EDefaultBtnDropdownOptions.Send);
    }
  }
  public greetingText: string = '';
  readonly showAIReplyFeature = showAIReplyFeature;

  public options: AnimationOptions = {
    path: '/assets/animations/ai_loading.json'
  };

  private unsubscribe = new Subject<boolean>();
  private readonly defaultSelectedSendOption$ = new BehaviorSubject<number>(2);
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  readonly TinyEditorOpenFrom = TinyEditorOpenFrom;
  readonly ImgPath = ImgPath;
  readonly CheckBoxImgPath = CheckBoxImgPath;
  readonly EditorValue = EditorValue;
  readonly RemiderTooltip = RemiderTooltip;
  readonly ToolbarAction = ToolbarAction;
  readonly editorId = uuid4();
  readonly moreOptionButtons: ToolbarAction[] = [
    ToolbarAction.Attach,
    ToolbarAction.Code
  ];

  private _currentContentHeight: number = 0;
  private crmSub: Subscription;
  public currentDirectionScrollToolbar: 'left' | 'right' = 'left';
  public isShowBtnScrollToolbar = false;
  public isMouseUp: boolean = false;
  public nodeChangeTimeout: NodeJS.Timeout;
  public bubbleClosed: boolean = true;
  public TinyMCEConfig = {
    selector: 'textarea',
    base_url: '/tinymce',
    suffix: '.min',
    content_css: `/assets/styles/tiny-editor.css?rd=${dayjs().format(
      'YYYY-MM-DD-HH'
    )}`,
    toolbar_sticky: true,
    menubar: false,
    statusbar: false,
    toolbar: false,
    contextmenu: 'customLink',
    convert_urls: false,
    plugins: 'lists autoresize wordcount customLink buildCustomSelection',
    inline_boundaries_selector: 'code',
    notifications: false,
    object_resizing: false,
    visual: false,
    format_empty_lines: true,
    noneditable_class: 'nonedit',
    autoresize_overflow_padding: 0,
    autoresize_bottom_margin: 15,
    min_height: 212,
    extended_valid_elements:
      'svg[id|class|style|width|height|viewBox|fill|xmlns]',
    // placeholder: 'Type Message here...',
    paste_preprocess: (_, args) => {
      args.content = args.content.replace(/<img.*?>/gi, '');
      args.content = this.formatBeforeEmitValue(args.content, true);
    },
    block_unsupported_drop: false,
    custom_elements: '~ai,~human',
    setup: (editor) => {
      editor.on('keydown', (e) => {
        this.processPressEnterOnGreeting(editor, e);
        const channelEditors = [
          ECreateMessageFrom.MESSENGER,
          ECreateMessageFrom.SMS_MESSAGES,
          ECreateMessageFrom.WHATSAPP
        ];
        if (!channelEditors.includes(this.createMessageFrom)) return;
        if (e.keyCode === 13 && !e.shiftKey) {
          e.preventDefault();
          editor.execCommand('InsertLineBreak');
        }
      });
      editor.on('drop', (e) => {
        e.preventDefault();
      });
      editor.on('init', () => {
        setHeightCommunicationWrapper();
        initializeImageErrorHandler(editor);

        this.zone.runOutsideAngular(() => {
          handleSelectionContentHasNonEditable(editor);
        });

        if (
          !this.chatGptService.checkEnableSetting() &&
          !this.currentConversation?.isLastMessageDraft &&
          this.appMessageListService.triggerAutoGenChatGpt$.getValue()
        ) {
          editor?.focus();
          this.appMessageListService.triggerAutoGenChatGpt$.next(false);
        }

        this.applyCustomFontStyle(editor);
        this.handleShowAiBubble();
        if (this.autoFocus) editor?.focus();
        if (this.editorControl.value) {
          this.getRawText();
        }
      });
      editor.on('postRender', () => {
        this.handleCheckMaxHeight();
      });
      editor.on('paste', (e) => {
        const fromWhatsApp =
          this.createMessageFrom === ECreateMessageFrom.WHATSAPP;
        const fromMessenger =
          this.createMessageFrom === ECreateMessageFrom.MESSENGER;
        if (this.inlineSMSMessage || fromWhatsApp || fromMessenger) return;
        const clipboardData = e.clipboardData;
        let modifiedText = '';
        const rawValue = clipboardData.getData('text/html');
        if (!rawValue.includes('<!-- x-tinymce/html -->')) {
          e.preventDefault();
          const pastedData = clipboardData.getData('text/plain');
          modifiedText = replaceParamVariables(
            pastedData,
            this.currentCompanyCRMSystemName as ECRMSystem
          )
            .split('\n')
            .join('<br>');
          const selectedText = this.editorInstance.selection.getContent({
            format: 'text'
          });

          if (selectedText) {
            this.editorInstance.selection.setContent(modifiedText);
          } else {
            this.editorInstance.insertContent(modifiedText);
          }
        }
      });
      editor.on('contextmenu', (e) => {
        const targetElement = e.target as HTMLElement;
        if (targetElement.tagName.toLowerCase() !== 'a') {
          const contextMenu = editor.plugins.contextmenu as any;
          if (contextMenu) {
            const linkOption = contextMenu.buildItem('link');
            linkOption.items = linkOption.items.filter(
              (item: any) => item !== 'insertlink'
            );
            contextMenu.replace('link', linkOption);
          }
        }
      });
      editor.on('ExecCommand', (event) => {
        if (event.command === 'mceEditLink') {
          this.insertLinkService.setIsEditLink(true);
          this.insertLinkService.setCurrenLink(event.value?.link);
          if (this.small.smallUI) {
            this.showSmallNestedComponent = true;
          }
          this.cdr.markForCheck();
        }
      });

      this.windowHandlerClick2 = this.zone.runOutsideAngular(() => {
        return this.rd2.listen(window, 'click', (e) => {
          const editorContainer = this.editorContainer?.nativeElement;
          const elementTarget = e.target as HTMLElement;
          const exceptionClassnames = [
            'float-button',
            'trudi-ui-textarea',
            'suggestion-button',
            'interactive-bubble',
            'wrapper__ai--interactive',
            'ai__interactive',
            'reply__stop',
            'typing_fake',
            'ai__interactive--typing',
            'ai-interactive-resize-wrapper',
            'ai-interactive-suggestion-list',
            'ai-detect-policy-popover-overlay',
            'ai-detect-policy-title',
            'ai-detect-footer',
            'ai-policy-view-btn',
            'ant-tooltip',
            'policy-detail-panel-drawer',
            'trudi-send-msg-header',
            'trudi-send-msg-footer'
          ];
          const allowedClassnames = ['send-btn-container'];
          const allowedOverlayClassnames = ['.policy-detail-panel-drawer'];

          const allowedElements = findMatchingElement(
            elementTarget,
            allowedClassnames
          );

          const skipElements = findMatchingElement(
            elementTarget,
            exceptionClassnames
          );

          const outsideEditorAreaSelectors = [
            'select-receiver-container',
            'receivers-info-wrapper-content',
            'trudi-send-msg-header'
          ];

          const isOutside = findMatchingElement(
            elementTarget,
            outsideEditorAreaSelectors
          );

          // when the screen is displaying some special modals/drawer, click events on these modals/drawer will not be considered click outside.
          const isHasSkipOverlay = hasElementInDocument(
            allowedOverlayClassnames
          );

          if (
            !isHasSkipOverlay &&
            ((!editorContainer?.contains(e.target as Node) &&
              !skipElements?.length) ||
              allowedElements?.length)
          ) {
            /* This code will impact to font-size and font-family(TTT-22645) because it will remove the caret element */
            // const bookmark = editor.selection?.getBookmark(2, true);
            // editor.selection?.moveToBookmark(bookmark);
            editor.selection?.collapse(true);
            if (
              (!elementTarget?.closest('tiny-editor') &&
                this.enableAiGenerateMsgCopy &&
                !this.bubbleClosed) ||
              allowedElements?.length ||
              isOutside
            ) {
              this.aiInteractiveBuilder.setShowInteractiveBubble(false);
            }
            editor.getBody()?.setAttribute('spellcheck', false);
          } else {
            editor.getBody()?.setAttribute('spellcheck', true);
          }
        });
      });
      editor.on('focus', () => {
        if (!this.bubbleClosed) {
          this.aiInteractiveBuilder.setShowInteractiveBubble(true);
        }
      });
      editor.on('remove', function () {
        removeImageErrorHandler(editor);
      });
      editor.on('NodeChange ', () => {
        this.prevBookmark = editor.selection.getBookmark(2, true);
      });
    }
  };
  effect = 'scrollx';

  public editorControl = new FormControl();
  public sendOptionControl = new FormControl();
  public editorText: string;
  public rawText: string = '';
  public editorFocus: boolean = false;
  public fromAppChat: boolean = false;
  public showListType: boolean = false;
  public sendOptionValue: Array<{
    icon: keyof typeof IconType;
    text: SendOption;
    dataE2e: EDataE2ESend;
    id: number;
  }> = [
    {
      icon: 'timeIcon',
      text: SendOption.ScheduleForSend,
      dataE2e: EDataE2ESend.SEND_AND_RESCHEDULE,
      id: 0
    },
    {
      icon: 'completeIconOutline',
      text: SendOption.SendResolve,
      dataE2e: EDataE2ESend.SEND_AND_RESOLVE,
      id: 1
    },
    {
      icon: 'sendArrowBlank',
      text: SendOption.Send,
      dataE2e: EDataE2ESend.SEND,
      id: 2
    }
  ];
  public selectedSendOption =
    this.sendOptionValue[this.sendOptionValue.length - 1];
  public showListSendOption: boolean = false;
  public attachOption = [];
  public listToolbarButton: Array<IToolbarButton[]> = [];
  public currentListToolbar: Array<IToolbarButton[]> = [];
  public smallToolBtnList: IToolbarButton[] = [];
  public DynamicType = EDynamicType;
  public showSmallNestedComponent: boolean = false;
  public userInfo: CurrentUser;
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;
  public currentCompanyCRMSystemName = '';
  public isVisiblePopover = {
    insert: false,
    attach: false
  };
  public ETinyEditorToolbarPosition = ETinyEditorToolbarPosition;
  public currentMailBoxSetting = null;
  currentCompany: ICompany;
  setAttachOption() {
    if (!this.crmSub) {
      this.crmSub = this.currentCompanyCRMSystemName$.subscribe((name) => {
        if (name) {
          this.currentCompanyCRMSystemName = name;
        }
      });
    }
    this.attachOption = [
      {
        text: 'Upload from computer',
        action: AttachAction.Computer,
        dataE2e: 'upload-from-computer-btn',
        disabled: this.attachBtnConfig.attachOptions.disabledUpload
      },
      {
        text: `Upload from ${CRM_CHECK[this.currentCompanyCRMSystemName]}`,
        action: AttachAction.CRM,
        dataE2e: `upload-from-${
          CRM_CHECK[this.currentCompanyCRMSystemName]
        }-btn`,
        disabled: this.attachBtnConfig.attachOptions.disabledUpload
      },
      {
        text: 'Create via REI Form Live',
        action: AttachAction.REIForm,
        dataE2e: 'create-rei-form-live-btn',
        disabled: this.attachBtnConfig.attachOptions.disabledCreateReiForm
      },
      {
        text: 'Add contact card',
        action: AttachAction.ContactCard,
        dataE2e: 'add-contact-card-btn',
        disabled: this.attachBtnConfig.attachOptions.disabledAddContact
      }
    ];

    this.listToolbarButton = [
      [
        {
          value: ToolbarAction.FontFamily,
          component: FontFamilyComponent,
          inputs: {
            editor: this.tinyEditor?.editor
          },
          show: this.allowFontFamily
        },
        {
          value: ToolbarAction.FontSize,
          component: FontSizeComponent,
          inputs: {
            editor: this.tinyEditor?.editor
          },
          show: this.allowFontSize
        }
      ],
      [
        {
          value: ToolbarAction.Bold,
          selected: false,
          icon: 'bold',
          selectedIcon: 'boldSelected',
          disabled: false,
          show: this.allowTextStyle
        },
        {
          value: ToolbarAction.Italic,
          selected: false,
          icon: 'italic',
          selectedIcon: 'italicSelected',
          disabled: false,
          show: this.allowTextStyle
        },
        {
          value: ToolbarAction.Underline,
          selected: false,
          icon: 'underline',
          selectedIcon: 'underlineSelected',
          disabled: false,
          show: this.allowTextStyle
        }
      ],
      [
        {
          value: ToolbarAction.NumList,
          selected: false,
          icon: 'numlist',
          selectedIcon: 'numlistSelected',
          disabled: false,
          show: this.allowTextStyle,
          component: OrderedListComponent,
          inputs: {
            editor: this.tinyEditor?.editor,
            disabled: false
          }
        },
        {
          value: ToolbarAction.BullList,
          selected: false,
          icon: 'bulllist',
          selectedIcon: 'bulllistSelected',
          disabled: false,
          show: this.allowTextStyle,
          component: UnorderedListComponent,
          inputs: {
            editor: this.tinyEditor?.editor,
            disabled: false
          }
        }
      ],
      [
        {
          value: ToolbarAction.TextColor,
          component: TextColorComponent,
          inputs: {
            editor: this.tinyEditor?.editor
          },
          show: this.allowTextColor
        },
        {
          value: ToolbarAction.HighLightColor,
          component: TextBackgroundColorComponent,
          inputs: {
            editor: this.tinyEditor?.editor
          },
          show: this.allowTextBackgroundColor
        }
      ],
      [
        {
          value: ToolbarAction.Code,
          id: 'insertDynamic',
          selected: false,
          icon: 'code',
          disabled: false,
          show: this.isShowEmbedCodeOptionsFunction
        },
        {
          value: ToolbarAction.EmailSignature,
          selected: true,
          icon: 'emailSignature',
          selectedIcon: 'emailSignatureSelected',
          divider: false,
          disabled: false,
          show: true
        }
      ],
      [
        {
          value: ToolbarAction.Attach,
          selected: false,
          icon: 'attach',
          selectedIcon: 'attachSelected',
          disabled: false,
          show: true,
          attachOptions: this.attachOption,
          tooltip: this.fromCheckListStep ? 'Attach up to 5 files' : ''
        },
        {
          value: ToolbarAction.InsertLink,
          tooltip: 'Add link',
          selected: false,
          icon: 'linkV2',
          selectedIcon: 'linkSelected',
          disabled: false,
          show: this.showInsertLink,
          component: InsertLinkComponent,
          inputs: {
            from: this.from
          },
          outputs: {
            onSelect: () => this.handleSelectionChange(),
            onSave: (link: IActiveLink) => this.handleClickSave(link)
          }
        }
      ]
    ];

    this.smallToolBtnList = [
      {
        value: ToolbarAction.Bold,
        selected: false,
        icon: 'bold',
        disabled: false,
        show: true
      },
      {
        value: ToolbarAction.Italic,
        selected: false,
        icon: 'italic',
        selectedIcon: 'italicSelected',
        disabled: false,
        show: true
      },
      {
        value: ToolbarAction.More,
        selected: false,
        showPopup: false,
        icon: 'textEditorMore',
        selectedIcon: 'textEditorMoreSelected',
        moreList: [
          {
            value: ToolbarAction.Underline,
            icon: 'underline',
            selected: false,
            show: true,
            disabled: false
          },
          {
            value: ToolbarAction.NumList,
            icon: 'numlist',
            selected: false,
            show: true,
            disabled: false,
            component: OrderedListComponent,
            inputs: {
              editor: this.tinyEditor?.editor,
              disabled: false
            }
          },
          {
            value: ToolbarAction.BullList,
            icon: 'bulllist',
            selected: false,
            show: true,
            disabled: false,
            component: UnorderedListComponent,
            inputs: {
              editor: this.tinyEditor?.editor,
              disabled: false
            }
          },
          {
            value: ToolbarAction.Code,
            selected: false,
            icon: 'code',
            disabled: false,
            show: this.isShowEmbedCodeOptionsFunction
          },
          {
            value: ToolbarAction.EmailSignature,
            selected: true,
            icon: 'emailSignature',
            disabled: false,
            show: false
          },
          {
            value: ToolbarAction.Attach,
            selected: false,
            icon: 'attach',
            attachOptions: this.attachOption,
            disabled: false,
            show: true,
            tooltip: this.fromCheckListStep ? 'Attach up to 5 files' : ''
          },
          {
            tooltip: 'Add link',
            value: ToolbarAction.InsertLink,
            selected: false,
            icon: 'linkV2',
            disabled: false,
            show: this.showInsertLink,
            component: InsertLinkComponent,
            inputs: {
              from: this.from,
              fromMore: true
            },
            outputs: {
              onSelect: () => this.handleSelectionChange(),
              onSave: (link: IActiveLink) => this.handleClickSave(link),
              hidePopover: () => this.AIhidePopover()
            }
          }
        ],
        disabled: false,
        show: true,
        component: AiGenerateMsgCopyComponent,
        inputs: {
          placement: AISETTING_PLACEMENT.INLINE_MESSAGE,
          label: AITitle[0],
          fromMore: true
        },
        outputs: {
          hidePopover: () => this.AIhidePopover()
        }
      }
    ];

    this.currentListToolbar = this.listToolbarButton;
  }
  public contentSelected: string;
  public SMSReminder: boolean = false;
  public remainingCharacter: number = MAX_TEXT_MESS_LENGTH;
  public isSendViaEmail: boolean = false;
  public reachedMaxHeight: boolean = false;
  public isAppUser: boolean = false;
  public listFileUpload = [{ title: '', listFile: [] }];
  @Input() listOfFiles: IFile[] | File[] = [];
  @Input() isSendForward: boolean = false;
  @Input() isShowGreetingContent: boolean = false;
  @Input() isShowGreetingSendBulkContent: boolean = false;
  public overFileSize = false;
  public isUnSupportFile = false;
  public selectedFile: FileList | File[] | IFile[];
  public fileTypes;
  public unsupportFile: boolean;
  public FILE_VALID_TYPE = FILE_VALID_TYPE;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public hasInvite: boolean = false;
  public canSend: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public selectedContactCard: ISelectedReceivers[] = [];
  public cancelChatGpt: boolean = false;
  public isEditorImgLoadingClicked: boolean = false;
  public showSchedulePopup: boolean = false;
  public iconType = IconType;
  public datFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => `${TIME_FORMAT}, ${format}`)
  );
  private currentConversationId: string = null;
  public disableSendButton: boolean = true;
  public isResizing: boolean = false;
  public activeMobileApp = false;
  public taskType?: TaskType;
  public TaskTypeEnum = TaskType;
  public focusEvent = new Subject<boolean>();
  public AIState = {
    onGenerated: false,
    onLoading: false,
    message: ''
  };
  public isConsole: boolean;
  public isDisconnected: boolean = false;
  public isArchiveMailbox: boolean = false;
  public showPopupInvalidFile = false;
  public errorMessage = '';

  private timeOut1: NodeJS.Timeout = null;
  private setMinHeightTimeOut: NodeJS.Timeout = null;

  private windowHandlerClick: () => void;
  private windowHandlerClick2: () => void;

  private observer: ResizeObserver = null;
  private isUploadImage = false;
  public selectedBtn: number = 0;

  public currentTextContent: string = '';
  public emailSignatureMailbox: string = '';
  public sendOptionType: sendOptionType;
  public countEnableMailSignature: number = 0;
  public existingEmailSignature: boolean = false;
  public existingReplyQuote: boolean = false;
  public sendOptionMsgModal: sendOptionType = sendOptionType.APP;
  public emailSignatureOutOfOffice: string = '';
  public ESendOptionType = sendOptionType;
  public canUseAI: boolean = false;
  public trackUserChange = false;
  public listUser: IReceiver[] = [];
  public mailboxSetting: IMailboxSetting;
  public strUser: string = '';
  public contentInput: string = '';
  public greetingSetting: string = '';
  public recipientSetting: string = '';
  public contentInlineGreeting: string = '';
  public msgBodyBlank = false;
  public currentConversation;
  public isShowRemainCharacter = false;
  public triggerAutoGenChatGpt: NodeJS.Timeout = null;
  public listUsers = [];

  @Input() errorMsg: boolean = false;
  @Input() timeSecond: number;
  @Input() date: number;
  private prevBookmark: Bookmark = null;
  private isFilledContactCard: boolean = false;
  private customFontSetting: FontSetting = null;
  private editorInstance: Editor;
  public inlineSMSMessage: boolean = false;
  public isParameterInserted: boolean = true;
  constructor(
    private rd2: Renderer2,
    protected cdr: ChangeDetectorRef,
    private conversationService: ConversationService,
    public companyEmailSignatureService: CompanyEmailSignatureService,
    private fileService: FilesService,
    public chatGptService: ChatGptService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private userService: UserService,
    private readonly agencyDashboardService: AgencyDashboardService,
    public taskService: TaskService,
    public helpCentreService: HelpCentreService,
    public notificationService: NotificationService,
    private inboxService: InboxService,
    private sharedService: SharedService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private fileUploadService: FileUploadService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private agencyDateFormatService: AgencyDateFormatService,
    private agencyService: AgencyService,
    private uploadFromCRMService: UploadFromCRMService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private mailboxSettingService: MailboxSettingService,
    private insertLinkService: InsertLinkService,
    private outOfOfficeService: OutOfOfficeService,
    private companyService: CompanyService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private communicationStepFormService: CommunicationStepFormService,
    private tinyEditorFileControlService: TinyEditorFileControlService,
    private trudiDynamicParameterDataService: TrudiDynamicParameterDataService,
    private filesService: FilesService,
    @Optional() private trudiSendMsgV2Component: TrudiSendMsgV2Component,
    @Optional() public trudiSendMsgV3Component: TrudiSendMsgV3Component,
    @Optional() public trudiBulkSendMsgComponent: TrudiBulkSendMsgComponent,
    private readonly zone: NgZone,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private appMessageListService: AppMessageListService,
    private trudiService: TrudiService,
    private agencyEmailFontSettingService: AgencyEmailFontSettingService,
    public elementRef: ElementRef<HTMLElement>,
    private aiDetectPolicyService: AIDetectPolicyService,
    public injector: Injector,
    private aiInteractiveBuilder: AiInteractiveBuilderService,
    public overlay: Overlay,
    public router: Router,
    public aiPolicyService: AiPolicyService,
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Host() public scrollContainer: CdkScrollable
  ) {
    this.setAttachOption();
    this.getEmailSignatureMailboxSetting();
    injectServiceToSelectionPlugin(
      overlay,
      zone,
      router,
      aiPolicyService,
      companyService,
      aiInteractiveBuilder
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sendOptionsToRemove']?.currentValue) {
      this.sendOptionValue = this.sendOptionValue.filter(
        (option) =>
          !this.sendOptionsToRemove.includes(option.text as SendOption)
      );
    }
    if (changes['isEditMessageDraft']?.currentValue) {
      this.existingReplyQuote = true;
    }
    if (changes['placeholder']?.currentValue.trim()) {
      this.TinyMCEConfig['placeholder'] = this.placeholder;
    }
    if (changes['attachBtnConfig']?.currentValue) {
      this.attachBtnConfig = {
        ...this.attachBtnConfig,
        ...changes['attachBtnConfig'].currentValue
      };
      this.setAttachOption();
    }

    if (changes['enableAiGenerateMsgCopy']?.currentValue != null) {
      this.setAttachOption();
    }

    if (changes['scrolled']?.currentValue) {
      this.isVisiblePopover.attach = false;
    }

    if (changes['minHeight']?.currentValue) {
      this.TinyMCEConfig['min_height'] = this.minHeight;
      clearTimeout(this.setMinHeightTimeOut);
      this.setMinHeightTimeOut = setTimeout(() => {
        if (this.tinyEditor?.editor?.iframeElement) {
          this.tinyEditor.editor.iframeElement.style.minHeight = `${this.minHeight}px`;
        }
        this.cdr.markForCheck();
      }, 1000);
    }

    if (changes['from']?.currentValue) {
      this.fromAppChat = this.from === TinyEditorOpenFrom.AppChat;
      if (this.fromAppChat) {
        this.toggleButtonControl(ToolbarAction.AISetting, this.inlineMessage);
      }
    }

    if (changes['text']?.currentValue) {
      // prop [default value] change
      this.editorText = this.replaceDefaultValue(this.text || '');
      if (this.isHandleStyleDynamicParamByCondition) {
        this.editorText = this.updateStyleParamByStatus(this.editorText);
      }
      this.currentTextContent = this.editorText;
      const { msgContent, quote, button } = extractQuoteAndMessage(
        this.currentTextContent
      );
      this.existingEmailSignature = !!msgContent.match(EMAIL_SIGNATURE_REGEX);
      const tagEmpty = this.generatePTags(1);
      let contentAndSignature = msgContent;
      if (this.isForwardConversation || this.isForwardOrReplyMsg) {
        if (this.isShowEmailSignature && !this.existingEmailSignature) {
          contentAndSignature = `${msgContent}${tagEmpty.tag}${
            tagEmpty.tag
          }${this.buildMailboxSignature()}`;
          this.existingEmailSignature = true;
        }
        const newContent = !this.existingReplyQuote
          ? this.handleAddReplyQuote(contentAndSignature, quote, button)
          : `${msgContent}${button}${quote}`;

        this.editorControl.setValue(this.handlePrefillContactCards(newContent));
      } else {
        if (this.isShowEmailSignature && !this.existingEmailSignature) {
          contentAndSignature = `${msgContent}${tagEmpty.tag}${
            tagEmpty.tag
          }${this.buildMailboxSignature()}`;
          this.existingEmailSignature = true;
        }
        this.editorControl.setValue(
          this.handlePrefillContactCards(contentAndSignature)
        );
      }
      this.getRawText();
      this.cdr.markForCheck();
    }

    if (changes['listOfFiles']?.currentValue && this.fromCheckListStep) {
      const findIndex = this.listToolbarButton.findIndex((options) => {
        return options.some((option) => option.value === ToolbarAction.Attach);
      });
      this.listToolbarButton[findIndex].forEach((btn) => {
        if (btn.value === ToolbarAction.Attach) {
          btn.attachOptions = this.attachOption.map((item) => ({
            ...item,
            disabled:
              this.listOfFiles?.length >= 5 &&
              [
                AttachAction.Computer,
                AttachAction.CRM,
                AttachAction.REIForm
              ].includes(item.action)
          }));
        }
      });
      if (this.listOfFiles.length >= 5) {
        this.listOfFiles = this.listOfFiles.slice(0, 5);
      }
    }

    this.setStateAttachBtn();
    if (changes['isCancel']?.currentValue) {
      this.editorControl.setValue(this.text);
      this.getRawText();
    }

    if (changes['inlineMessage']) {
      if (this.chatGptService.checkEnableSetting()) {
        this.toggleButtonControl(ToolbarAction.AISetting, this.inlineMessage);
      }
      if (this.inlineMessage)
        this.TinyMCEConfig['placeholder'] = 'Type your message here...';
    }

    if (changes['disabled']?.currentValue) {
      this.listToolbarButton = [...this.listToolbarButton].map((buttons) =>
        buttons.map((button) => ({
          ...button,
          disabled: true
        }))
      );

      if (this.small) {
        this.smallToolBtnList = [...this.smallToolBtnList].map((button) => ({
          ...button,
          disabled: true
        }));
      }
      this.editorControl.disable();
    }

    if (changes['disabled'] && !changes['disabled'].currentValue) {
      this.editorControl.enable();
    }

    if (changes['isShowEmailSignature']?.currentValue != null) {
      this.toggleButtonControl(
        ToolbarAction.EmailSignature,
        this.isShowEmailSignature
      );
    }

    // if (changes['toFieldLength']) {
    //   if (this.toFieldLength === 0) {
    //     this.handleSelectedEmailSignature(true);
    //     this.toggleButtonEmailSignature();
    //     this.triggerEnableEmailSignature();
    //   }
    // }

    if (changes['listCodeOptions']?.currentValue) {
      this.chatGptService.codeOptions.next(this.listCodeOptions);
      this.aiInteractiveBuilder.setDynamicVariable(this.listCodeOptions);
    }

    if (changes['isShowEmbedCodeOptionsFunction']?.currentValue) {
      this.toggleButtonControl(
        ToolbarAction.Code,
        this.isShowEmbedCodeOptionsFunction
      );
    }

    if (changes['replyQuote']?.currentValue) {
      if (!this.existingReplyQuote) {
        this.editorControl.setValue(
          this.handleAddReplyQuote(this.editorControl.value, this.replyQuote)
        );
      }
    }

    if (changes['createMessageFrom']?.currentValue) {
      this.inlineSMSMessage =
        this.createMessageFrom === ECreateMessageFrom.SMS_MESSAGES;
      if (!this.inlineSMSMessage) return;
      this.handleFilterListToolbarButton();
      this.sendOptionValue = this.sendOptionValue.filter(
        (sendOption) => sendOption.text !== SendOption.ScheduleForSend
      );
      this.selectedSendOption =
        this.sendOptionValue[this.sendOptionValue.length - 1];
      this.TinyMCEConfig['placeholder'] = 'Type your message here...';
    }
    this.getCurrentProperties();
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get emailSignature(): AbstractControl {
    return this.trudiSendMsgFormService.sendMsgForm?.get('emailSignature');
  }

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

  get fromUserMailBox(): AbstractControl {
    return this.sendMsgForm?.get('selectedSender');
  }

  get selectedProperty(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get listOfFilesUpload() {
    return this.sendMsgForm?.get('listOfFiles');
  }

  ngOnInit(): void {
    this.aiDetectPolicyService.policyPanelData$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((data) => {
        createPolicyDetailPanel('', data, false);
      });

    this.isConsole = this.sharedService.isConsoleUsers();
    this.fromAppChat && (this.TinyMCEConfig.min_height = 72);
    //Hot fix
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        const isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        this.handleSetAttachmentOptions(isRmEnvironment);
        this.currentCompany = company;
        if (!company?.isAISetting) {
          this.bubbleClosed = true;
          this.aiInteractiveBuilder.destroyAiBubble();
        }
        if (
          this.createMessageFrom === ECreateMessageFrom.SMS_MESSAGES &&
          isRmEnvironment
        ) {
          this.attachBtnConfig['attachOptions'].disabledCreateReiForm = true;
        }
      });

    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((userInfo) => {
        this.userInfo = userInfo;
      });

    this.selectedProperty?.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.getListUser(this.selectedReceivers.value);
      });
    this.selectedReceivers?.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listReceivers) => {
        this.listUsers = listReceivers;
        this.getListUser(listReceivers);
      });

    this.getStrUserForInlineMessage();
    this.setAIRepyAsMeByDefault();
    this.subscribeCurrentTask();
    this.triggerSendTypeOption();
    this.triggerEnableEmailSignature();
    this.checkDisableSendButton();
    //No need to check mobile app for signature
    // this.subscribeCurrentConversationMobileStatus();
    this.subscribeEditorValueChanges();
    this.getListFileType();
    this.handleClickOutsideEditor();
    this.getListFileType();
    this.subscribeDragDropFile();
    this.subscribeSelectedEmailSignature();
    this.subscribeCancelChatGpt();
    this.subscribeOnLoadingGenerateChatGPT();
    this.getRawText();
    this.setStateEmbedCodeBtn();
    this.checkToEnableSuggestReply();
    this.initEmailSignature();
    this.subscribeReplyContent();
    this.subscribeInsertTinyEditor();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });
    this.observer = new ResizeObserver((entries) => {
      if (this.isUploadImage && this.inlineMessage) {
        const height = entries[0].contentRect.height;
        this.updateHeightEditor(height);
        this.isUploadImage = false;
      }
    });
    this.observer.observe(this.editor.nativeElement.parentElement);
    if (!this.isHandleFreeText) {
      this.editor.nativeElement.parentElement.setAttribute(
        'style',
        'max-height: 400px'
      );
    }

    if (this.from === TinyEditorOpenFrom.SendMessage) {
      // signature will be init beforehand. If you want to remove it, you should check after the signature has been init.
      if (!this.isScheduleForSend) {
        //Todo check whether if this logic still exist
        // this.selectedReceiversValueChanges(); // scheduled can't change receiver
        this.getListReceiversPreFill();
      } else {
        const listUser = this.selectedReceivers?.value;
        const optionType = listUser?.some((user) => user.isAppUser)
          ? sendOptionType.APP
          : sendOptionType.EMAIL;
        this.sendOptionMsgModal = optionType;
      }
      this.sendOptionMsgModalValueChanges();
    }
    this.subscribeResetOutOfOfficeContent();
    this.subscribeSelectedSender();
    this.getGreetingForSendMessage();
    this.subscribeGetListCard();
    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentConversation = res;
          this.cancelChatGpt = res.isLastMessageDraft;
        }
      });
    this.appMessageListService.triggerAutoGenChatGpt$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          if (
            this.chatGptService.checkEnableSetting() &&
            !this.currentConversation?.isLastMessageDraft
          ) {
            this.handleFocus(true);
            this.appMessageListService.triggerAutoGenChatGpt$.next(false);
          }
        }
      });

    if (this.fromAppChat) {
      this.patchButtonInputs(ToolbarAction.AISetting, {
        showGeneratedOptions: this.isAppReply,
        label: this.isAppReply ? AITitle[0] : AITitle[1]
      });
    }

    this.defaultSelectedSendOption$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (this.inlineSMSMessage) return;
        this.selectedSendOption =
          this.sendOptionValue.find((option) => option.id === res) ||
          this.sendOptionValue[this.sendOptionValue.length - 1];
      });

    //get font settings
    if (this.allowFontFamily || this.allowFontSize) {
      this.agencyEmailFontSettingService
        .getFontSettings()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((fontSetting) => {
          if (fontSetting) {
            this.customFontSetting = fontSetting;
            this.applyCustomFontStyle();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.isCustomToolbar) {
      this.trudiSendMsgV2Component?.setTemplateContext(this.toolbar, this);
      this.trudiSendMsgV3Component?.setTemplateContext(this.toolbar, this);
      this.trudiBulkSendMsgComponent?.setTemplateContext(
        this.toolbar,
        this.sendActionBtn,
        this
      );
    }
    this.editorInstance = this.tinyEditor?.editor;
    if (this.aiInteractiveBubbleConfigs?.enableAiInteractiveReply) {
      this.aiDetectPolicyService.setEditorInstance(
        this.editorInstance,
        this.editorControl
      );
    }
  }

  subscribeGetListCard() {
    combineLatest([
      this.trudiAddContactCardService.selectedContactCard$,
      this.trudiAddContactCardService.popupState$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([cards, popupState]) => {
        if (!this.allowInsertContactCardToContent) {
          this.selectedContactCard = [...cards];
          this.cdr.markForCheck();
        } else {
          if (
            cards &&
            cards.length > 0 &&
            !popupState.addContactCard &&
            popupState.isClickedAddButton
          ) {
            this.handleInsertContactCardToContent(cards);
          }
        }
      });
  }

  subscribeResetOutOfOfficeContent() {
    this.outOfOfficeService.resetOutOfOfficeContent$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        const { includeSignature, message } =
          this.outOfOfficeDefaultSetting || {};
        const defaultMessage = this.replaceDefaultValue(message);
        this.setAllBtnToDefault();
        if (typeof includeSignature === 'boolean') {
          this.handleSelectedEmailSignature(includeSignature);
          this.editorControl.setValue(defaultMessage);
        } else {
          this.setDefaultOutOfOfficeSignature(defaultMessage);
        }
      });
  }

  setDefaultOutOfOfficeSignature(defaultMessage: string) {
    if (!this.isShowEmailSignature) {
      this.handleSelectedEmailSignature(true);
    }

    if (defaultMessage.includes('email-signature')) {
      this.editorControl.setValue(defaultMessage);
    } else {
      this.editorControl.setValue(
        `${defaultMessage}${
          this.generatePTags(2).tag
        }${this.buildOutOfOfficeSignature()}`
      );
    }
  }

  public subscribeSelectedSender() {
    let selectedSenderMailBox: IFromUserMailBox = null;
    if (this.from === TinyEditorOpenFrom.SendMessage) {
      const selectedUserMailbox$ = this.fromUserMailBox.valueChanges.pipe(
        filter((selectedUserMailbox) => Boolean(selectedUserMailbox)),
        startWith(this.fromUserMailBox.value),
        tap((user) => {
          selectedSenderMailBox = user;
        })
      ) as Observable<IFromUserMailBox>;
      const mailboxStatus$ = this.inboxService.currentMailBox$.pipe(
        map((mailbox) => mailbox?.status)
      );

      combineLatest([
        selectedUserMailbox$,
        this.mailboxSettingService.mailboxSetting$,
        mailboxStatus$
      ])
        .pipe(takeUntil(this.unsubscribe))
        .pipe(
          switchMap(
            ([selectedUserMailbox, currentMailboxSetting, mailboxStatus]) => {
              const isNotArchiveOrDisconnected = [
                EMailBoxStatus.ARCHIVE,
                EMailBoxStatus.DISCONNECT
              ].includes(mailboxStatus);
              if (
                selectedUserMailbox.mailBoxId ===
                  currentMailboxSetting.mailBoxId &&
                !isNotArchiveOrDisconnected
              ) {
                return of(currentMailboxSetting);
              }
              return this.mailboxSettingApiService.getMailboxSetting(
                selectedUserMailbox.mailBoxId
              );
            }
          )
        )
        .pipe(
          map((mailboxSetting: IMailboxSetting) => {
            this.currentMailBoxSetting = mailboxSetting;
            const userTitle = mailboxSetting.mailSignature.memberRole.value;
            const userName = mailboxSetting.mailSignature.memberName.value;
            const isTrudiUser = selectedSenderMailBox?.id === trudiUserId;
            const trudiTitle = trudiInfo[0].title;
            const trudiName = trudiInfo[0].name;
            const signature = isTrudiUser
              ? mailboxSetting.htmlStringSignature
                  .replace(userTitle, trudiTitle)
                  .replace(userName, trudiName)
              : mailboxSetting.htmlStringSignature;
            return {
              ...mailboxSetting,
              currentSignature: signature
            };
          })
        )
        .subscribe((mailboxSetting) => {
          if (mailboxSetting) {
            this.mailboxSetting = mailboxSetting;
            const isShowMailSignature =
              mailboxSetting?.mailSignature?.enableSignature;
            const imageSignature =
              isShowMailSignature && this.userInfo?.imageSignature?.mediaLink
                ? `<img id='signature__image--mailbox'
                    style="width: ${this.userInfo?.imageSignature?.imageSize?.width}px;
                    height: ${this.userInfo?.imageSignature?.imageSize?.height}px; transform-origin: top left;"
                    src="${this.userInfo?.imageSignature?.mediaLink}"/>
                   <div style="height: 16px;" id="signature__image--spacing"></div>
                  `
                : '';
            this.emailSignatureMailbox =
              mailboxSetting.currentSignature +
              imageSignature +
              (mailboxSetting?.agencyContent || '');
            this.getListUser(this.listUsers);
            this.recomposeGreetingContent();
            this.recomposeContent();
          }
        });
    }
  }

  isNotShowGreetingContent() {
    return (
      this.inlineMessage ||
      this.isSendForward ||
      [
        TaskType.SHARE_CALENDAR_INVITE,
        TaskType.SEND_FILES,
        TaskType.INTERNAL_NOTE
      ].includes(this.openFrom as TaskType)
    );
  }

  recomposeGreetingContent() {
    this.greetingSetting =
      EGreeting[this.mailboxSetting?.mailSignature?.greeting];
    this.recipientSetting = this.mailboxSetting?.mailSignature?.recipient;
    const recipientParam =
      this.mailboxSetting?.mailSignature?.recipient === ERecipient.FIRST_NAME
        ? 'user_first_name'
        : 'user_full_name';
    const { msgContent, button, quote } = extractQuoteAndMessage(
      this.editorControl.value
    );
    let newContent = msgContent;
    if (this.isShowGreetingSendBulkContent) {
      const matchGreetingElement =
        msgContent.match(GREETING_ELEMENT_REGEX) || [];
      const matchRecipientElement =
        msgContent.match(RECIPIENT_ELEMENT_REGEX) || [];
      const newGreetingElement = `<span id="greeting-element">${this.greetingSetting}</span>`;
      const newRecipientElement =
        this.generateHTMLForParamSendBulkMsg(recipientParam);
      newContent = matchGreetingElement[0]?.length
        ? newContent.replace(matchGreetingElement[0], newGreetingElement)
        : newGreetingElement;
      newContent = matchRecipientElement[0]?.length
        ? newContent.replace(matchRecipientElement[0], newRecipientElement)
        : newRecipientElement;
    }

    if (this.isShowGreetingContent) {
      const matchGreetingSelectUser =
        msgContent?.match(GREETING_CONTAINER_REGEX) || [];
      const regex = /<p id="select-user-container">([^<>]*)<\/p>/;
      const match = matchGreetingSelectUser[0]?.match(regex) || [];
      this.contentInput = match[1] ? ` ${match[1]}` : '';
      const matchGreetingAISummary =
        msgContent?.match(GREETING_AI_SUMMARY_REGEX) || [];
      const matchGreetingSelectUserContent =
        msgContent?.match(GREETING_SELECT_USER_CONTENT_REGEX) || [];
      const matchGreetingAISummaryContent =
        msgContent?.match(GREETING_AI_SUMMARY_CONTENT_REGEX) || [];

      const greetingFromSelectUserContainer = this.generateHTMLGreeting(
        'select-user-greeting',
        true
      );
      const greetingFromSelectUserContent = `<span id="select-user-greeting">${this.greetingSetting} ${this.strUser}</span>`;
      const greetingFromAISummaryContent = `<span id="ai-summary-greeting">${this.greetingSetting} ${this.strUser}</span>`;
      if (matchGreetingAISummary?.length) {
        newContent = msgContent
          ?.replace(matchGreetingSelectUser[0], '')
          ?.replace(
            matchGreetingAISummaryContent[0],
            greetingFromAISummaryContent
          );
      } else {
        newContent = matchGreetingSelectUser?.length
          ? msgContent?.replace(
              matchGreetingSelectUserContent[0],
              greetingFromSelectUserContent
            )
          : `${greetingFromSelectUserContainer}${msgContent}`;
        if (match.length) {
          newContent = `${greetingFromSelectUserContainer}${msgContent.replace(
            match[0],
            ''
          )}`;
        }
        if (
          this.createMessageFrom !== ECreateMessageFrom.SCRATCH &&
          this.createMessageFrom !== ECreateMessageFrom.TASK_HEADER
        ) {
          newContent = matchGreetingSelectUser?.length
            ? msgContent?.replace(matchGreetingSelectUser[0], '')
            : `${msgContent}`;
        }
      }
    }
    const updateQuote = this.removeQuoteFontInline(quote);

    this.editorControl.setValue(
      `${newContent}${button}${this.isForwardOrReplyMsg ? updateQuote : quote}`
    );
  }

  formatGreeting(data) {
    const recipient = this.mailboxSetting?.mailSignature?.recipient;
    const names = data.map((item) => {
      const isValidRecipient =
        this.createMessageFrom === ECreateMessageFrom.WHATSAPP
          ? !item?.isTemporary
          : true;

      if (
        recipient === ERecipient.FIRST_NAME &&
        item.firstName &&
        isValidRecipient
      ) {
        return item?.firstName ?? '';
      }

      if (
        recipient === ERecipient.FULL_NAME &&
        item.fullName &&
        isValidRecipient
      ) {
        return item?.fullName ?? '';
      }

      return '';
    });
    const listRemoveItemEmpty = names.filter((item) => item !== '');
    const lastItem =
      listRemoveItemEmpty.length > 0 ? listRemoveItemEmpty.pop() : '';
    if (listRemoveItemEmpty.length > 0) {
      return listRemoveItemEmpty.join(', ') + ' and ' + lastItem;
    }
    return lastItem;
  }

  getGreetingForSendMessage() {
    this.greetingSetting =
      EGreeting[this.mailboxSetting?.mailSignature?.greeting];
    this.recipientSetting = this.mailboxSetting?.mailSignature?.recipient;
    if (!this.isShowGreetingSendBulkContent) return;
    this.prefillGreetingForSendBulkMsg();
  }

  prefillGreetingForSendBulkMsg() {
    const { msgContent, button, quote } = extractQuoteAndMessage(
      this.editorControl.value
    );
    let newContent = msgContent;
    const recipientParam =
      this.mailboxSetting?.mailSignature?.recipient === ERecipient.FIRST_NAME
        ? 'user_first_name'
        : 'user_full_name';
    const greetingText =
      EGreeting[this.mailboxSetting?.mailSignature?.greeting];
    this.greetingText = `<p id="send-bulk-msg"><span id="greeting-element">${greetingText}</span>&nbsp;${this.generateHTMLForParamSendBulkMsg(
      recipientParam
    )},</p>`;
    newContent = `${this.greetingText}${msgContent}`;
    this.editorControl.setValue(`${newContent}${button}${quote}`);
  }

  generateHTMLForParamSendBulkMsg(value: string) {
    return `<span id="recipient-element" style="color: var(--fg-brand, #28ad99);" contenteditable="false">${value}</span>`;
  }

  generateHTMLGreeting(id: string, isSelectUser: boolean) {
    return `<p id="${
      isSelectUser ? 'select-user-container' : 'ai-summary-container'
    }"><span id="${id}">${this.greetingSetting}${
      this.strUser ? ' ' + this.strUser : ''
    }</span><span>,</span><span id="contentInput">${
      this.contentInput
    }&nbsp;</span></p>`;
  }

  getListUser(listUsers) {
    const selectedProperty = this.selectedProperty.value;
    const formatUserList = (listUsers || []).map((item) => {
      let fullName = '';
      let firstName = '';
      if ([item?.type, item?.userType].includes(EUserPropertyType.SUPPLIER)) {
        firstName = item?.firstName;
        fullName =
          item?.fullName || combineNames(item.firstName, item.lastName);
      } else if (
        [item?.type, item?.userType].includes(EUserPropertyType.OTHER)
      ) {
        firstName = item?.sendFrom || item?.firstName;
        fullName =
          item?.sendFrom ||
          item?.fullName ||
          combineNames(item.firstName, item.lastName);
      } else {
        const hasSelectedProperty =
          selectedProperty && selectedProperty.id === item?.propertyId;
        const hasFirstName = item?.firstName;
        const hasLastName = item?.lastName;
        if (hasSelectedProperty) {
          firstName = hasFirstName ? item.firstName : '';
          fullName =
            hasFirstName || hasLastName
              ? combineNames(item.firstName, item.lastName)
              : '';
        } else {
          firstName =
            item?.secondaryEmail?.email ||
            item?.secondaryEmail?.originalEmailName ||
            item?.originalEmailName ||
            item?.email ||
            '';
          fullName = firstName;
        }
      }
      return {
        ...item,
        firstName: firstName,
        fullName: fullName
      };
    });
    this.strUser = this.formatGreeting(formatUserList);
    this.recomposeGreetingContent();
  }

  recomposeContent() {
    if (this.inlineMessage) return;
    const { msgContent, button, quote } = extractQuoteAndMessage(
      this.editorControl.value
    );
    const matches = msgContent.match(EMAIL_SIGNATURE_REGEX);
    let newContent = msgContent;
    const signatureDiv = this.buildMailboxSignature();
    const activeSignature = this.listToolbarButton
      .flat()
      ?.find((button) => button.value === ToolbarAction.EmailSignature);
    if (matches?.length) {
      newContent = msgContent.replace(matches[0], signatureDiv);
    }
    if (!!activeSignature?.selected && !matches?.length) {
      const pTag = this.generatePTags(1);
      newContent = `${newContent}${pTag.tag}${signatureDiv}`;
    }
    this.editorControl.setValue(`${newContent}${button}${quote}`);
  }

  getEmailSignatureMailboxSetting() {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxSetting) => {
        if (mailboxSetting) {
          this.mailboxSetting = mailboxSetting;
          const htmlStringSignature = SIGNATURE_HTML.replace(
            '#email',
            mailboxSetting.mailSignature.mailboxEmailAddress.value
          );
          const enabledMembers = Object.keys(
            mailboxSetting.mailSignature
          ).filter(
            (memberKey) => mailboxSetting.mailSignature[memberKey].isEnabled
          );
          this.countEnableMailSignature = enabledMembers.length;
          this.emailSignatureMailbox =
            mailboxSetting.htmlStringSignature +
            (mailboxSetting?.agencyContent || '');
          this.emailSignatureOutOfOffice =
            htmlStringSignature + mailboxSetting?.agencyContent;
        }
      });
  }

  getListReceiversPreFill() {
    const listUser = this.selectedReceivers.value;
    this.removeOrInitSignatureMsgModal(listUser);
  }

  selectedReceiversValueChanges() {
    this.selectedReceivers.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((users) => this.removeOrInitSignatureMsgModal(users));

    this.bccReceivers.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((users) => this.removeOrInitSignatureMsgModal(users));

    this.ccReceivers.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((users) => this.removeOrInitSignatureMsgModal(users));
  }

  removeOrInitSignatureMsgModal(listReceivers) {
    const tagEmpty = this.countTagEmpty(this.countEnableMailSignature);
    const optionType = listReceivers?.some((user) => user.isAppUser)
      ? sendOptionType.APP
      : sendOptionType.EMAIL;
    // Comment to disable remove email-signature when select app user
    // if (optionType === sendOptionType.APP) {
    //   this.handleAppOptionType(tagEmpty);
    // }

    if (optionType === sendOptionType.EMAIL) {
      this.handleEmailOptionType(tagEmpty);
    }
  }

  handleAppOptionType(tagEmpty) {
    if (
      this.sendOptionMsgModal !== sendOptionType.APP ||
      this.isForwardOrReplyMsg
    )
      return;

    this.removeSignature(tagEmpty.count);
    this.toggleButtonControl(ToolbarAction.EmailSignature, false);
    this.newListToolBarActionSendMsg();
    this.existingEmailSignature = false;
  }

  handleEmailOptionType(tagEmpty) {
    if (this.existingEmailSignature || !this.isShowEmailSignature) return;

    if (this.isForwardConversation) {
      this.setValueCaseForwardMsg();
    } else {
      const emailContent = this.generateEmailContent(tagEmpty);
      this.editorControl.setValue(emailContent);
    }
    this.listToolbarButton = this.currentListToolbar;
    this.toggleButtonControl(ToolbarAction.EmailSignature, true);
    this.existingEmailSignature = true;
  }

  handleAddReplyQuote(content: string, quote: string = '', button = '') {
    const pTag = this.generatePTags(this.isEditMessageDraft ? 0 : 1);
    if (quote?.length > 0 && !this.existingReplyQuote) {
      const hideQuoteContent = generateThreeDotsButton(quote);
      this.existingReplyQuote = true;
      return `${content}${pTag.tag}${hideQuoteContent}`;
    }
    if (this.existingReplyQuote)
      return `${content}${pTag.tag}${button}${quote}`;
    return content;
  }

  generateEmailContent(tagEmpty) {
    const contentToAdd = this.currentTextContent.trim()
      ? this.generatePTags(1).tag
      : tagEmpty.tag;
    return `${
      this.currentTextContent
    }${contentToAdd}${this.buildMailboxSignature()}`;
  }

  removeSignature(pTagRemove) {
    let htmlContentToString = '';
    const { msgContent, quote, button } = extractQuoteAndMessage(
      this.currentTextContent
    );
    const htmlContent = HTMLParser.parse(msgContent);
    const hasSignature = htmlContent?.querySelector('#email-signature');
    this.removePreviousParagraphs(pTagRemove, hasSignature);
    htmlContentToString = htmlContent.toString();
    const newContent = this.handleAddReplyQuote(
      htmlContentToString,
      quote,
      button
    );
    this.editorControl.setValue(newContent);
  }

  sendOptionMsgModalValueChanges() {
    this.sendOption.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((option) => {
        this.sendOptionMsgModal = option;
        let hasEmailSignature = option === sendOptionType.EMAIL;
        const tagEmpty = this.countTagEmpty(this.countEnableMailSignature);
        if (!hasEmailSignature) {
          hasEmailSignature = this.selectedReceivers.value?.some(
            (item) => !item.isAppUser
          );
        }
        if (hasEmailSignature) {
          if (!this.existingEmailSignature) {
            if (this.isForwardConversation) {
              this.setValueCaseForwardMsg();
            } else {
              this.editorControl.setValue(
                `${this.currentTextContent}${
                  this.currentTextContent.trim()
                    ? this.generatePTags(1).tag
                    : tagEmpty.tag
                }${this.buildMailboxSignature()}`
              );
            }
            this.listToolbarButton = this.currentListToolbar;
            this.toggleButtonControl(ToolbarAction.EmailSignature, true);
            this.existingEmailSignature = true;
          }
        }
        if (option === sendOptionType.APP) {
          const tagEmpty = this.countTagEmpty(this.countEnableMailSignature);
          this.removeSignature(tagEmpty.count);
          this.toggleButtonControl(ToolbarAction.EmailSignature, false);
          this.newListToolBarActionSendMsg();
          this.existingEmailSignature = false;
        }
      });
  }

  newListToolBarActionSendMsg() {
    const newListToolbar = this.listToolbarButton.filter((groups) =>
      groups.some((item) => item.show)
    );
    this.listToolbarButton = newListToolbar;
  }

  handleSetAttachmentOptions(isRmEnvironment: boolean) {
    const attachOptions = [
      {
        text: 'Upload from computer',
        action: AttachAction.Computer,
        dataE2e: 'upload-from-computer-btn',
        disabled: this.attachBtnConfig.attachOptions.disabledUpload
      },
      {
        text: `Upload from ${CRM_CHECK[this.currentCompanyCRMSystemName]}`,
        action: AttachAction.CRM,
        dataE2e: `upload-from-${
          CRM_CHECK[this.currentCompanyCRMSystemName]
        }-btn`,
        disabled: this.attachBtnConfig.attachOptions.disabledUpload
      },
      !isRmEnvironment
        ? {
            text: 'Create via REI Form Live',
            action: AttachAction.REIForm,
            dataE2e: 'create-rei-form-live-btn',
            disabled: this.attachBtnConfig.attachOptions.disabledCreateReiForm
          }
        : null,
      {
        text: 'Add contact card',
        action: AttachAction.ContactCard,
        dataE2e: 'add-contact-card-btn',
        disabled: this.attachBtnConfig.attachOptions.disabledAddContact
      }
    ].filter(Boolean);

    this.attachOption = attachOptions;

    if (this.fromCheckListStep) {
      this.listToolbarButton = this.listToolbarButton.map((item) => {
        return item.map((e) =>
          e.value === ToolbarAction.Attach
            ? {
                ...e,
                attachOptions: this.attachOption.map((item) => ({
                  ...item,
                  disabled:
                    this.listOfFiles?.length >= 5 &&
                    [
                      AttachAction.Computer,
                      AttachAction.CRM,
                      AttachAction.REIForm
                    ].includes(item.action)
                }))
              }
            : e
        );
      });
    }

    this.smallToolBtnList = this.smallToolBtnList.map((item) => {
      if (item.value === ToolbarAction.More) {
        item.moreList = item.moreList?.map((moreItem) =>
          moreItem.value === ToolbarAction.Attach
            ? { ...moreItem, attachOptions: [...attachOptions] }
            : moreItem
        );
      }
      return item;
    });
  }

  checkToEnableSuggestReply() {
    combineLatest([
      this.inboxService.isArchiveMailbox$,
      ChatGptService.enableSuggestReplySetting
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([isArchive, status]) => {
        this.canUseAI = status;
        this.isArchiveMailbox = isArchive;
        const enable = !isArchive && status;
        const AISettingBtn = this.smallToolBtnList
          .find((btn) => btn.value === ToolbarAction.More)
          .moreList.find((btn) => btn.value === ToolbarAction.AISetting);
        if (AISettingBtn) {
          AISettingBtn.disabled = !enable;
          AISettingBtn.icon = enable ? 'frame' : 'frameUnactive';
        }
        !enable && this.hideSmallBtnList(ToolbarAction.AISetting);
        this.cdr.markForCheck();
      });
  }

  setAIRepyAsMeByDefault() {
    const gernerateBody = this.chatGptService.generateBody;
    gernerateBody.next({
      ...gernerateBody.value,
      currentUserId:
        localStorage.getItem('userId') ||
        this.userService.userInfo$.getValue()?.id
    });
  }

  triggerSendTypeOption() {
    this.sendTypeChanges.emit(this.sendOptionControl.value);
    this.sendOptionControl.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((option) => {
        this.sendOptionType = option;
        this.toggleChangeSendEmail(option === sendOptionType.EMAIL);
        this.sendTypeChanges.emit(option);
      });
  }

  toggleChangeSendEmail(toEmail: boolean) {
    this.toggleButtonControl(ToolbarAction.EmailSignature, toEmail);
    if (!toEmail) {
      const twoPtagRemove = 2;
      this.removeSignature(twoPtagRemove);
    } else {
      if (this.isShowEmailSignature) {
        //init signature default inline messages
        this.editorControl.setValue(
          `${this.currentTextContent}${
            !this.currentTextContent.trim()
              ? this.generatePTags(2).tag
              : this.generatePTags(1).tag
          }${this.buildMailboxSignature()}`
        );
      } else {
        this.editorControl.setValue(this.currentTextContent);
      }
    }
  }

  subscribeCurrentConversationMobileStatus() {
    combineLatest([
      this.companyService.getActiveMobileApp(),
      this.conversationService.currentConversation
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((prev, curr) => {
          return (
            prev?.length > 1 &&
            curr?.length > 1 &&
            prev[0] === curr[0] &&
            prev[1]?.id === curr[1]?.id
          );
        })
      )
      .subscribe(([status, res]) => {
        if (!res || !Object.keys(res).length) return;
        this.activeMobileApp = status;
        if (
          this.currentConversationId &&
          res?.id !== this.currentConversationId
        ) {
          this.editorControl.setValue('');
          this.selectedSendOption =
            this.sendOptionValue[this.sendOptionValue.length - 1];
        }
        this.currentConversationId = res?.id;
        this.isSendViaEmail = res?.isSendViaEmail;
        this.isAppUser =
          this.activeMobileApp &&
          res?.inviteStatus === UserStatus.ACTIVE &&
          !res?.secondaryEmail;
        this.toggleButtonEmailSignature();
        this.cdr.markForCheck();
      });
  }

  checkDisableSendButton() {
    this.userService
      .checkIsPortalUser()
      .then((isPortalUser) => (this.disableSendButton = !isPortalUser));
  }

  subscribeInsertTinyEditor() {
    this.aiInteractiveBuilder.onInsertTinyEditor$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.trackUserChange = true;
      });
  }

  subscribeEditorValueChanges() {
    this.editorControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        // debounceTime(100),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        this.handleDisableAIReply(value);
        this.canSend = !validateWhiteSpaceHtml(value);
        this.chatGptService.updateEnableGenerate(
          this.canSend,
          this.inlineMessage
            ? EBoxMessageType.INLINE_MESSAGE
            : EBoxMessageType.POPUP
        );
        this.currentTextContent = value;
        this.emitValue(value);
        // this.checkMsgForPolicies();
        if (this._currentContentHeight) {
          this.checkMaxHeight();
        }
        this.cdr.markForCheck();
        this.getRawText();
        this.aiInteractiveBuilder.setContentTinyEditor(value);
        if (this.trackUserChange && (value?.length ? this.canSend : true)) {
          this.trackUserChangeContent();
        }
      });
  }

  handleCheckMaxHeight() {
    setTimeout(() => {
      this.checkMaxHeight();
    }, 200);
  }

  handleDisableAIReply(value) {
    const regexPattern = /<p>(&nbsp;|\s)*<\/p>/;
    const regexPatternAIReply =
      /<div id="ai-summary-content"><\/div>\s*(<p>(&nbsp;|\s)*<\/p>\s*)+/;
    const removeReplyMsg = removeReplyQuote(value);
    this.msgBodyBlank = this.canUseAI
      ? regexPatternAIReply.test(removeReplyMsg)
      : regexPattern.test(removeReplyMsg);
  }

  private emitValue(value: string) {
    const newValue = this.replaceFakeCaret(replaceImageLoading(value));
    if (
      IMAGE_LOADING_REGEX.test(value) &&
      (!newValue || newValue == '<p>&nbsp;</p>')
    )
      return;
    this.value.emit(
      this.inlineMessage
        ? this.checkAndWrapCustomStyle(newValue)
        : this.formatBeforeEmitValue(newValue)
    );
    /// Emit content height when change value - resize box
    this.checkMaxHeight();
  }

  subscribeDragDropFile() {
    this.fileService.dragDropFile
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value) {
          this.handleFocus(true);
          this.onDrop(value, true);
        }
      });
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.taskType = res.taskType;
      });
  }

  triggerEnableEmailSignature() {
    if (!this.inlineMessage) {
      this.companyEmailSignatureService.hasSignature.next(
        this.isEmailSignature
      );
    }
    this.companyEmailSignatureService.enableSignatureButton.next(true);
  }

  initEmailSignature() {
    if (this.isShowEmailSignature) {
      switch (this.from) {
        case TinyEditorOpenFrom.OutOfOffice:
          if (this.companyEmailSignatureService.existingSignature.getValue()) {
            // check duplicate;
            this.editorControl.setValue(
              `${this.currentTextContent}${
                this.generatePTags(2).tag
              }${this.buildOutOfOfficeSignature()}`
            );
          }
          break;
        case TinyEditorOpenFrom.SendMessage:
          if (this.isScheduleForSend || this.existingEmailSignature) return; // keep current text content. if init will duplicate signature
          const tagEmpty = this.countTagEmpty(this.countEnableMailSignature);
          this.editorControl.setValue(
            `${this.currentTextContent}${
              this.generatePTags(1).tag
            }${this.buildMailboxSignature()}`
          );
          this.existingEmailSignature = true;
          break;
        default:
          break;
      }
    } else {
      this.editorControl.setValue(this.currentTextContent);
    }
  }

  subscribeSelectedEmailSignature() {
    if (this.from === TinyEditorOpenFrom.SendMessage) {
      if (this.inlineMessage) {
        this.companyEmailSignatureService.selectedButtonInline
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((selected) => {
            this.handleSelectedEmailSignature(selected);
          });
      } else {
        this.companyEmailSignatureService.selectedButton
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((selected) => {
            this.handleSelectedEmailSignature(selected);
          });
      }
    }
    if (this.from === TinyEditorOpenFrom.OutOfOffice) {
      this.companyEmailSignatureService.selectedButtonInline
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((selected) => {
          this.handleSelectedEmailSignature(selected);
        });
    }
  }

  subscribeReplyContent() {
    combineLatest([
      this.chatGptService.replyFrom,
      this.chatGptService.replyContent
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        filter(([replyFrom]) => {
          const replyType = this.inlineMessage
            ? EBoxMessageType.INLINE_MESSAGE
            : EBoxMessageType.POPUP;
          return replyFrom === replyType;
        }),
        map(([_, message]) => {
          return message;
        })
      )
      .subscribe(
        (message) => {
          if (!message || this.cancelChatGpt) return;
          const isHasEmailSignature =
            this.editorValue.includes('email-signature');
          let messageParsed = this.editorValue;
          const { msgContent, quote, button } =
            extractQuoteAndMessage(messageParsed);
          if (msgContent.includes('ai-summary-content')) {
            const newDOC = new DOMParser().parseFromString(
              msgContent,
              'text/html'
            );

            const aiSummaryContentDoc = newDOC.querySelector(
              '#ai-summary-content'
            );
            if (aiSummaryContentDoc) {
              aiSummaryContentDoc.parentNode.removeChild(aiSummaryContentDoc);
            }
            messageParsed = newDOC.body.innerHTML + button + quote;
          }
          messageParsed = this.replaceSpaceContent(messageParsed);
          const regexGreetingParam = /<p>Hi user_first_name,<\/p>/;
          const resultGreetingParam = message?.match(regexGreetingParam) || [];
          const summaryGreetingFromAIContainer = this.generateHTMLGreeting(
            'ai-summary-greeting',
            false
          );
          const greetingsProcessed = message?.replace(
            resultGreetingParam?.[0],
            summaryGreetingFromAIContainer
          );
          const msgGenerated = greetingsProcessed + messageParsed;
          let msgUpdate = '';
          this.aiDetectPolicyService.setPreviousText(msgGenerated);
          if (this.isShowEmailSignature) {
            switch (this.from) {
              case TinyEditorOpenFrom.SendMessage:
                const listUser = this.selectedReceivers.value;
                const optionType = listUser?.some((user) => user.isAppUser)
                  ? sendOptionType.APP
                  : sendOptionType.EMAIL;
                if (
                  optionType === sendOptionType.APP &&
                  this.sendOptionMsgModal === sendOptionType.APP
                ) {
                  msgUpdate = msgGenerated;
                } else {
                  msgUpdate = isHasEmailSignature
                    ? msgGenerated
                    : msgGenerated +
                      `${
                        this.generatePTags(2).tag
                      }${this.buildMailboxSignature()}`;
                }
                this.editorControl.setValue(
                  this.handlePrefillContactCards(msgUpdate)
                );
                this.currentTextContent = msgUpdate;
                break;
              case TinyEditorOpenFrom.AppChat:
                if (this.sendOptionType === sendOptionType.EMAIL) {
                  msgUpdate = isHasEmailSignature
                    ? msgGenerated
                    : msgGenerated +
                      `${
                        this.generatePTags(2).tag
                      }${this.buildMailboxSignature()}`;
                } else {
                  msgUpdate = msgGenerated;
                }
                this.editorControl.setValue(
                  this.handlePrefillContactCards(msgUpdate)
                );
                this.currentTextContent = msgUpdate;
                break;
              default:
                break;
            }
          } else {
            this.editorControl.setValue(
              this.handlePrefillContactCards(msgGenerated)
            );
            this.currentTextContent = msgGenerated;
          }

          this.trudiSaveDraftService.setTrackControlChange('msgContent', true);
          this.chatGptService.replyContent.next(null);
          this.chatGptService.replyFrom.next(null);
          this.recomposeGreetingContent();
          this.recomposeContent();
          this.resetAIState();
        },
        (error) => {
          this.trudiSaveDraftService.setTrackControlChange('msgContent', true);
        }
      );
  }

  replaceSpaceContent(messageParsed: string): string {
    messageParsed = messageParsed?.trim();
    while (true) {
      if (messageParsed?.startsWith('<p>&nbsp;</p>')) {
        messageParsed = messageParsed?.replace('<p>&nbsp;</p>', '').trim();
        continue;
      }
      if (messageParsed?.startsWith('<p></p>')) {
        messageParsed = messageParsed?.replace('<p></p>', '').trim();
        continue;
      }
      break;
    }
    return messageParsed;
  }

  subscribeCancelChatGpt() {
    this.chatGptService.cancelChatGpt
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((cancel) => {
        this.cancelChatGpt = cancel;
      });
  }

  setAIState(state: string, data: IStatusType) {
    if (!data) return;
    if (data.type === EBoxMessageType.INLINE_MESSAGE && this.inlineMessage) {
      this.AIState[state] = data.status;
    }
    if (data.type === EBoxMessageType.POPUP && !this.inlineMessage) {
      this.AIState[state] = data.status;
    }
    this.AIState.message = this.getMessageLoadingAI[state];
    if (data.type === EBoxMessageType.TASK_EDITOR) {
      this.AIState[state] = data.status;
      this.AIState.message = 'AI is generating template...';
    }
  }

  private get getMessageLoadingAI() {
    return {
      onLoading: this.inlineMessage
        ? 'AI is generating reply message...'
        : 'AI is generating message...',
      onGenerated: 'AI-generated reply. Check before sending.'
    };
  }

  resetAIState() {
    this.chatGptService.onGenerated.next(null);
    this.AIState.message = '';
    this.AIState.onGenerated = false;
    this.AIState.onLoading = false;
  }

  subscribeOnLoadingGenerateChatGPT() {
    this.chatGptService.onLoading
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((loading) => {
        this.handleSetAIState('onLoading', loading);
      });

    this.chatGptService.onGenerated
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((generated) => {
        this.handleSetAIState('onGenerated', generated);
      });
  }

  handleSetAIState(state: string, statusType: IStatusType) {
    this.cdr.markForCheck();
    if (state) {
      this.setAIState(state, statusType);
    }
    if (statusType?.status) {
      clearTimeout(this.timeOut1);
      this.timeOut1 = setTimeout(() => {
        this.focus();
      }, 100);
    }
  }

  toggleButtonEmailSignature() {
    if (!this.isShowEmailSignature) {
      this.toggleButtonControl(ToolbarAction.EmailSignature, false);
      return;
    }
    // check send from app mobile - email and more case
    const signatureContent =
      this.companyEmailSignatureService.signatureContent?.value;
    const enableSignatureButton =
      this.companyEmailSignatureService.enableSignatureButton?.value;
    let enableBtn = false;

    const conditions = {
      default:
        !this.activeMobileApp || this.from === TinyEditorOpenFrom.OutOfOffice,
      enableSignatureButton: enableSignatureButton
    };
    if (this.inlineMessage) {
      enableBtn =
        signatureContent &&
        this.fromAppChat &&
        this.isSendViaEmail &&
        !this.isAppUser;
    } else {
      enableBtn =
        signatureContent &&
        Object.values(conditions).some((condition) => condition);
    }
    this.toggleButtonControl(ToolbarAction.EmailSignature, enableBtn);
  }

  getRawText() {
    this.rawText =
      this.tinyEditor?.editor?.getContent({ format: 'text' }) || '';
    if (
      !this.rawText.trim() &&
      this.tinyEditor?.editor
        ?.getContent()
        .includes('<img class="image-detail"')
    ) {
      this.rawText = '<image>';
    }
    this.remainingCharacter = MAX_TEXT_MESS_LENGTH - this.rawText.length;
    this.rawText = this.rawText.replace(/<image>/g, '');
    if (
      this.fromCheckListStep ||
      this.inlineSMSMessage ||
      this.isInlineMessenger
    ) {
      this.rawText = this.rawText.slice(0, this.maxRemainCharacter);
    }
    this.originContent.emit(this.rawText);
  }

  setState(action: ToolbarAction, ...args: any[]) {
    if (this.small?.smallUI) {
      this.smallToolBtnList.forEach((item) => {
        if (item.value !== ToolbarAction.More) {
          if (item.value === action) {
            item.selected = args.length ? args[0] : !item.selected;
          }
        } else {
          item.moreList.forEach((child) => {
            if (child.value === action) {
              child.selected = args.length ? args[0] : !child.selected;
              child.selected && (item.selected = true);
            }
          });
        }
      });
    } else {
      this.listToolbarButton.forEach((item) => {
        item.forEach((child) => {
          if (child.value === action) {
            child.selected = args.length ? args[0] : !child.selected;
          }
        });
      });
    }
  }

  handleBack() {
    this.onBack.emit();
  }

  handleSendMessage() {
    if (this.selectedSendOption?.text === SendOption.ScheduleForSend) {
      this.trudiService.isConfirmSchedule$.next(true);
    }
    this.chatGptService.onGenerate.next(null);
    const message = replaceImageLoading(this.editorValue);
    if (
      this.overFileSize ||
      this.isUnSupportFile ||
      (this.selectedSendOption?.text === SendOption.ScheduleForSend &&
        (this.errorMsg || this.timeSecond === undefined || !this.date))
    )
      return;

    this.submitSend.next({
      value:
        this.formatBeforeEmitValue(message) === '<p>&nbsp;</p>'
          ? ''
          : this.formatBeforeEmitValue(message),
      resolved: this.selectedSendOption?.text === SendOption.SendResolve,
      isApp: this.isAppUser,
      listOfFiles: this.listOfFiles.map((el) => {
        return {
          ...el,
          ...(el.name && { fileName: el.name }),
          ...(el.size && { fileSize: el.size })
        };
      }),
      contactInfos: this.selectedContactCard,
      reminderTimes: this.scheduledDate,
      sendType: this.sendOptionControl.value,
      isTrudi:
        ChatGptService.enableSuggestReplySetting.value &&
        this.chatGptService.generateBody.value.currentUserId === trudiUserId &&
        Boolean(this.chatGptService.generateBody.value.message),
      typeBtn: this.selectedSendOption?.text
    });
  }

  hideSmallBtnList(action: ToolbarAction) {
    const moreBtn = this.smallToolBtnList.find(
      (item) => item.value === ToolbarAction.More
    );
    switch (action) {
      case ToolbarAction.More:
        moreBtn.showPopup = !moreBtn.showPopup;
        break;
      case ToolbarAction.AISetting:
        moreBtn.showPopup = false;
        break;
      case ToolbarAction.Attach:
        return;
      case ToolbarAction.Code:
        return;
      default:
        for (const btn of this.smallToolBtnList) {
          btn.showPopup = false;
        }
        break;
    }
    moreBtn.moreList.forEach((item) => {
      if (
        [
          ToolbarAction.Attach,
          ToolbarAction.AISetting,
          ToolbarAction.Code,
          ToolbarAction.InsertLink
        ].includes(item.value)
      ) {
        item.selected = false;
      }
    });
  }

  handleSelectedPopover(event, data: IToolbarButton) {
    data.selected = event;
  }

  getSelectedMoreBtn(action: ToolbarAction) {
    return this.smallToolBtnList[2].moreList?.findIndex(
      (item) => item.value === action
    );
  }

  handleSelectionChange() {
    const selected = this.tinyEditor.editor.selection.getNode();
    let payload = {
      url: '',
      title: ''
    };
    this.contentSelected = this.tinyEditor.editor.selection.getContent({
      format: 'html'
    });
    if (isAnchor(selected) && this.contentSelected.length > 0) {
      payload = {
        url: selected.getAttribute('href'),
        title: selected.innerText
      };
    } else {
      payload = {
        ...payload,
        title: this.contentSelected
      };
    }
    this.insertLinkService.setCurrenLink(payload);
  }

  handleToolbarBtn(action: ToolbarAction, event?: MouseEvent) {
    this.trackUserChange = true;
    this.hideSmallBtnList(action);
    switch (action) {
      case ToolbarAction.Bold:
      case ToolbarAction.Italic:
      case ToolbarAction.Underline:
        this.tinyEditor.editor.execCommand(action);
        break;
      case ToolbarAction.InsertLink:
        this.handleSelectionChange();
        this.showSmallNestedComponent = !this.showSmallNestedComponent;
        this.selectedBtn = this.getSelectedMoreBtn(action);
        break;
      case ToolbarAction.EmailSignature:
        this.isShowEmailSignature = !this.isShowEmailSignature;
        this.existingEmailSignature = this.isShowEmailSignature;
        this.triggerSignatureFromToolbar.emit(this.isShowEmailSignature);
        if (event) event.stopPropagation();
        const tagEmpty = this.countTagEmpty(this.countEnableMailSignature);
        const twoPtagRemove = 2; // generatePTags(2)
        switch (this.from) {
          case TinyEditorOpenFrom.OutOfOffice:
            if (!this.isShowEmailSignature) {
              this.removeSignature(twoPtagRemove);
            } else {
              if (this.currentTextContent.includes('email-signature')) {
                this.editorControl.setValue(this.currentTextContent);
              } else {
                this.editorControl.setValue(
                  `${this.currentTextContent}${
                    this.generatePTags(2).tag
                  }${this.buildOutOfOfficeSignature()}`
                );
              }
            }
            break;
          case TinyEditorOpenFrom.SendMessage:
            if (this.isForwardConversation) {
              //case ForwardConversation
              if (!this.isShowEmailSignature) {
                this.removeSignature(tagEmpty.count);
              } else {
                this.setValueCaseForwardMsg();
              }
            } else {
              if (!this.isShowEmailSignature) {
                this.removeSignature(tagEmpty.count);
              } else {
                const { msgContent, quote, button } = extractQuoteAndMessage(
                  this.currentTextContent
                );
                const contentAndSignature = `${msgContent}${
                  !msgContent.trim()
                    ? this.generatePTags(tagEmpty.count).tag
                    : this.generatePTags(1).tag
                }${this.buildMailboxSignature()}`;
                const newContent = this.handleAddReplyQuote(
                  contentAndSignature,
                  quote,
                  button
                );
                this.editorControl.setValue(newContent);
              }
            }
            break;
          default:
            if (!this.isShowEmailSignature) {
              this.removeSignature(twoPtagRemove);
            } else {
              this.editorControl.setValue(
                `${this.currentTextContent}${
                  !this.currentTextContent.trim()
                    ? this.generatePTags(2).tag
                    : this.generatePTags(1).tag
                }${this.buildMailboxSignature()}`
              );
            }
            break;
        }
        this.cdr.markForCheck();
        break;
      case ToolbarAction.AISetting:
        if (this.inlineMessage) {
          this.showSmallNestedComponent = !this.showSmallNestedComponent;
          this.selectedBtn = this.getSelectedMoreBtn(action);
        }
        break;
      case ToolbarAction.Attach:
        if (this.fromCommunicationStep) {
          this.handleAddFileComputer();
        }
        break;
    }
  }

  generatePTags(count: number): { tag: string; count: number } {
    const pTag = `<p></p>`;
    const obj = { tag: pTag.repeat(count), count: count };
    return obj;
  }

  countTagEmpty(countEnableMailSignature: number): {
    tag: string;
    count: number;
  } {
    let tagEmpty: { tag: string; count: number };
    switch (countEnableMailSignature) {
      case 1:
        tagEmpty = this.generatePTags(6);
        break;
      case 2:
        tagEmpty = this.generatePTags(5);
        break;
      case 3:
        tagEmpty = this.generatePTags(4);
        break;
      case 4:
        tagEmpty = this.generatePTags(3);
        break;
      case 5:
        tagEmpty = this.generatePTags(2);
        break;
      case 6:
        tagEmpty = this.generatePTags(1);
        break;
      default:
        tagEmpty = this.generatePTags(8);
        break;
    }

    return tagEmpty;
  }

  removePreviousParagraphs(n, hasSignature) {
    let count = n;
    let currentParagraph = hasSignature?.previousElementSibling;

    while (
      count > 0 &&
      currentParagraph &&
      currentParagraph.rawTagName === 'p' &&
      !currentParagraph.textContent.trim() &&
      !currentParagraph?.classNames
    ) {
      const previousParagraph = currentParagraph;
      currentParagraph = currentParagraph.previousElementSibling;
      previousParagraph.remove();
      count--;
    }

    if (hasSignature) {
      hasSignature.remove();
    }
  }

  handleEmbedCodeOption(codeOption) {
    if (codeOption?.disabled) return;
    this.isParameterInserted = false;
    if (codeOption?.param?.includes('landlord')) {
      codeOption.param = codeOption.param.replace('landlord', 'owner');
    }
    let codeOptionParam = codeOption.param;
    let valueToInsert = this.isReplaceDynamicParamWithData
      ? this.trudiDynamicParameterDataService.generateValueToInsert(
          codeOptionParam
        )
      : `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${codeOptionParam}</span>`;
    // auto fill request summary photos when request summary dynamic is added
    // in case of bulk send message request summary photos will be added when send
    if (
      codeOption?.title.includes('Request summary') &&
      !this.trudiBulkSendMsgComponent
    ) {
      const listOfFiles =
        this.trudiDynamicParameterService.inlineDynamicParameters.get(
          'request_summary_photos'
        );
      let listOfFormatFiles = listOfFiles ? JSON.parse(listOfFiles) : [];
      listOfFormatFiles = listOfFormatFiles?.map((file) => {
        const fileTypeDot = this.fileService.getFileTypeDot(file.name);
        if (fileTypeDot?.indexOf(EFileType.VIDEO) > -1) {
          file.isSupportedVideo = true;
          file.localThumb = file.thumbMediaLink;
        } else if (fileTypeDot?.indexOf(EFileType.PHOTO) > -1) {
          file.localThumb = file.mediaLink;
        }
        return {
          ...file,
          icon: file?.fileType?.icon
        };
      });
      this.listOfFiles = [...this.listOfFiles, ...listOfFormatFiles];
      const listOfFilesControl = this.sendMsgForm?.get('listOfFiles');
      listOfFilesControl?.setValue([
        ...(listOfFilesControl.value || []),
        ...listOfFormatFiles
      ]);
    }

    const editorInstance = this.tinyEditor.editor;
    editorInstance.execCommand('mceInsertContent', false, valueToInsert);
    editorInstance.fire('change');
    this.isParameterInserted = true;
  }

  generateTitleCodeOption(codeOption): string {
    if (codeOption.subTitle) {
      return `${codeOption.title}-${codeOption.subTitle}`;
    }
    return codeOption.title;
  }

  handleAttachOption(action: AttachAction, event?) {
    switch (action) {
      case AttachAction.Computer:
        if (this.addFileComputer.observed) {
          this.addFileComputer.emit();
          return;
        }

        this.handleAddFileComputer();
        break;

      case AttachAction.ContactCard:
        if (this.addContactCard.observed) {
          this.addContactCard.emit();
          return;
        }
        this.trudiSendMsgFormService.setSelectedContactCard([]);
        if (this.selectedContactCard.length > 0) {
          this.trudiSendMsgUserService
            .getListUserApi({
              limit: this.selectedContactCard.length,
              page: 1,
              search: '',
              email_null: true,
              userDetails: this.selectedContactCard.map((user) => ({
                id: user.id,
                propertyId: user.propertyId
              }))
            } as GetListUserPayload)
            .pipe(map((rs) => (rs ? (rs as GetListUserResponse).users : [])))
            .subscribe((rs: ISelectedReceivers[]) => {
              const values = rs.filter((receiver) => {
                return this.selectedContactCard.some((contactCard) =>
                  isCheckedReceiversInList(receiver, contactCard, 'id')
                );
              });
              values?.length > 0 &&
                this.trudiSendMsgFormService.sendMsgForm
                  .get('selectedContactCard')
                  ?.setValue(values);
              this.trudiAddContactCardService.setSelectedContactCard(values);
            });
        }
        this.trudiAddContactCardService.setPopupState({
          addContactCardOutside: true,
          handleCallback: (cards) => {
            if (!this.allowInsertContactCardToContent) {
              this.selectedContactCard = [...cards];
              if (this.selectedContactCard.length > 0) this.handleFocus(true);
              if (this.inlineMessage) {
                this.cdr.markForCheck();
              }
            } else {
              this.handleInsertContactCardToContent(cards);
            }
            this.handleFocus(true);
          }
        });
        break;

      case AttachAction.CRM:
        this.uploadFromCRMService.setSelectedProperty(this.currentProperty);
        if (this.addFileCRM.observed) {
          this.addFileCRM.emit();
          return;
        }
        this.uploadFromCRMService.setPopupState({
          uploadFileFromCRMOutside: true,
          handleCallback: (res) => {
            this.listOfFiles = [...this.listOfFiles, ...res];
            if (this.listOfFiles.length > 0) {
              this.validateFileSize();
              this.handleFocus(true);
            }
          }
        });

        break;

      case AttachAction.REIForm:
        if (this.addReiForm.observed) {
          this.addReiForm.emit();
          return;
        }

        this.trudiSendMsgService.setPopupState({
          addReiFormOutside: true,
          selectDocument: true,
          handleCallback: (res) => {
            const listOfFilesControl = this.sendMsgForm?.get('listOfFiles');
            this.listOfFiles = [...this.listOfFiles, ...res];
            listOfFilesControl?.setValue([
              ...(listOfFilesControl.value || []),
              ...res
            ]);
            if (this.listOfFiles.length > 0) this.handleFocus(true);
          }
        });

        break;
      default:
        break;
    }
    this.checkIsBtnMoreSelected();
    event?.stopPropagation();
  }

  handleBlur() {
    this.isShowRemainCharacter = false;
    this.editorFocus = false;
    this.onBlur.emit(true);
    this.focusEvent.next(false);
  }

  onFocusToolBar() {
    this.focusEvent.next(true);
  }

  handleClickOutsideEditor() {
    this.windowHandlerClick = this.zone.runOutsideAngular(() => {
      return this.rd2.listen(window, 'click', (event) => {
        this.zone.runOutsideAngular(() => {
          if (this.fromAppChat && this.editorValue) return;
          if (this.isResizing) {
            this.isResizing = false;
            return;
          }

          const elementTarget = event?.target as HTMLElement;
          if (!elementTarget) return;

          const classNames = (elementTarget as HTMLDivElement)?.className?.split
            ? (elementTarget as HTMLDivElement).className.split(' ')
            : [];
          const skips = [
            'delete-file',
            'editor-control',
            'btn-control-editor',
            'float-button'
          ];
          if (skips.some((item) => classNames.includes(item))) return;

          if (hasSomeParentTheClass(elementTarget, 'modal-container')) return;

          if (this.popupState.addReiForm || this.popupState.addReiFormOutside)
            return;

          const editorControl = document.getElementById('ai-setting-control');

          if (editorControl && editorControl?.contains(elementTarget)) return;
          if (
            this.editorFocus &&
            !this.editorContainer?.nativeElement?.contains(elementTarget)
          ) {
            if (this.isEditorImgLoadingClicked) {
              this.handleFocus(true);
              this.isEditorImgLoadingClicked = false;
            } else {
              this.chatGptService.cancelChatGpt.next(false);
              !this.fromCheckListStep && this.handleFocus(false);
            }
          }
        });
      });
    });
  }

  onClick(event) {
    if (this.chatGptService.showPopover$.value) {
      this.chatGptService.showPopover$.next(false);
    }
    this.showListType = false;
    this.showListSendOption = false;

    if (!(this.attachBtnConfig.disabled && this.disabledAttachBtn)) {
      const findIndex = this.listToolbarButton.findIndex((options) => {
        return options.some((option) => option.value === ToolbarAction.Code);
      });
      this.listToolbarButton[findIndex][0].selected = false;
    }

    event?.event.stopPropagation();

    const commandMap = {
      [ToolbarAction.Bold]: 'bold',
      [ToolbarAction.Italic]: 'italic',
      [ToolbarAction.Underline]: 'underline'
    };

    Object.entries(commandMap).forEach(([action, command]) => {
      const checkQuery = this.tinyEditor.editor.queryCommandState(command);
      this.setState(action as ToolbarAction, checkQuery);
    });

    // manually trigger click event for other components to handle click outside
    if (this.editorContainer && this.editorContainer.nativeElement) {
      this.editorContainer.nativeElement.click();
    }
  }

  addAnchorTagToLink(match: string, content: string): string {
    const temp = content;
    const filteredPlainLinks = content?.match(PLAIN_LINK_REGEX);
    filteredPlainLinks?.forEach((link) => {
      const originalLink = link.trim().replace(/<[^>]*>/, '');
      link = originalLink.startsWith('www')
        ? `https://${originalLink}`
        : originalLink;
      if (!link.startsWith('http')) {
        return;
      }
      const shortenLinks = link.match(/.+\/([^\?\/]+)/);
      let shortenLink = link;
      if (shortenLinks && shortenLinks.length > 1) {
        shortenLink = shortenLinks[1];
      }
      const anchorTag = `<a href="${link}" target="_blank">${shortenLink}</a>`;
      const escapedLink = originalLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const excludeInsideAnchorTagRegex = new RegExp(
        `(?<!<[aA]\\b[^>]*?)(?:https?:\\/\\/)?${escapedLink}(?![^<]*?<\\/a\\b)`,
        'g'
      );
      content = content.replace(excludeInsideAnchorTagRegex, anchorTag);
    });
    return match.replace(temp, content);
  }

  onKeyDown(event: KeyboardEvent) {
    this.trackUserChange = true;
    if (
      (this.fromCheckListStep ||
        this.createMessageFrom === ECreateMessageFrom.WHATSAPP ||
        this.createMessageFrom === ECreateMessageFrom.SMS_MESSAGES ||
        this.createMessageFrom === ECreateMessageFrom.MESSENGER) &&
      this.rawText?.length >= this.maxRemainCharacter &&
      event.key !== 'Backspace'
    ) {
      event.preventDefault();
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      focusElement('#aiMutationBtn', this.document);
    }
  }

  trackUserChangeContent() {
    this.trudiSaveDraftService.setTrackControlChange('msgContent', true);
  }

  uploadFile(files) {
    let otherFiles = [];
    const filesValid = this.handleCheckValidateFilesDrop(files);
    if (filesValid.length)
      for (let i = 0; i < filesValid.length; i++) {
        if (filesValid[i].type.indexOf('image') > -1) {
          this.uploadImage(filesValid[i]);
        } else {
          otherFiles.push(
            new File([filesValid[i]], filesValid[i].name, {
              type: filesValid[i].type
            })
          );
        }
      }
    if (otherFiles.length) this.previewFileAttachment(otherFiles);
    this.isUploadImage = true;
  }

  async onPaste({ event, editor }) {
    const clipboardData =
      event?.clipboardData || (window as any)?.clipboardData;

    const files = [...clipboardData?.files];
    if (files.length) {
      if (this.isInlineMessenger || this.inlineSMSMessage) {
        await this.handleDropAndPasteFile(files);
        return;
      }
      this.uploadFile(files);
    }

    if (this.inlineSMSMessage || this.isInlineMessenger) {
      const htmlContent = clipboardData.getData('text/html');
      const plainTextContent = clipboardData.getData('text/plain');
      const isTinyMCEHtml = clipboardData
        .getData('text/html')
        .includes('<!-- x-tinymce/html -->');

      event.preventDefault();
      event.stopPropagation();

      if (isTinyMCEHtml) {
        const sanitizedHtml = this.processHtml(htmlContent);
        this.tinyEditor.editor.execCommand(
          'mceInsertContent',
          false,
          sanitizedHtml
        );
      } else {
        let pastedText = replaceParamVariables(
          plainTextContent,
          this.currentCompanyCRMSystemName as ECRMSystem
        )
          .split('\n')
          .join('<br>');
        pastedText = this.addText(pastedText);
        this.tinyEditor.editor.execCommand(
          'mceInsertContent',
          false,
          pastedText
        );
      }
      return;
    }
    if (!this.fromCheckListStep) return;
    const remain = MAX_INPUT_URL_LENGTH - this.rawText?.length;
    let pastedData = clipboardData?.getData('text');
    if (pastedData?.length <= remain || !pastedData?.length) return;
    event.preventDefault();
    event.stopPropagation();
    pastedData = remain > 0 ? pastedData.substring(0, remain) : '';
    const text =
      this.editorControl.value + this.generatePastedDataToHtml(pastedData);
    this.editorControl.setValue(text);
    this.getRawText();
  }

  generatePastedDataToHtml(pastedData: string) {
    if (!pastedData) return '';
    return `<p style="white-space: pre-wrap;">${pastedData}</p>`;
  }

  checkIsBtnMoreSelected() {
    this.smallToolBtnList[2].selected = this.smallToolBtnList[2].moreList.some(
      (btn) => btn.selected
    );
  }

  checkMaxHeight() {
    if (!this.fromAppChat) return;
    let contentHeightAfterChanged =
      this.tinyEditor?.editor.getBody()?.clientHeight;
    if (contentHeightAfterChanged !== this._currentContentHeight) {
      const hasRemainingCharacter =
        this.isInlineMessenger || this.inlineSMSMessage;
      hasRemainingCharacter && (contentHeightAfterChanged += 26);
      this.contentHeightChange.emit(contentHeightAfterChanged);
      this._currentContentHeight = contentHeightAfterChanged;
    }
  }

  get editorValue() {
    return this.editorControl.value || '';
  }

  get wordcount() {
    return this.tinyEditor?.editor?.plugins['wordcount'][
      'body'
    ]?.getCharacterCount();
  }

  setAllBtnToDefault() {
    const isHasSignature = this.companyEmailSignatureService.hasSignature.value;
    this.smallToolBtnList.forEach((btn) => {
      btn.selected = false;
      if (btn.value === ToolbarAction.More) {
        btn.moreList.forEach((moreBtn) => {
          if (moreBtn.value === ToolbarAction.EmailSignature) {
            moreBtn.selected = this.isShowEmailSignature;
          } else {
            moreBtn.selected = false;
          }
        });
      }
    });

    this.listToolbarButton.forEach((btn) => {
      btn.forEach((item) => {
        if (item.value === ToolbarAction.EmailSignature) {
          item.selected = this.isShowEmailSignature;
        } else {
          item.selected = false;
        }
      });
    });
  }

  resetToDefault() {
    this.text = '';
    this.trackUserChange = false;
    // if (this.from === TinyEditorOpenFrom.AppChat) {
    //   this.editorControl.setValue('');
    // }
    this.remainingCharacter = MAX_TEXT_MESS_LENGTH;
    this.listOfFiles = [];
    this.setAllBtnToDefault();
    const input = document.querySelector(
      `#btn-upload-tiny-${this.editorId}`
    ) as HTMLInputElement;
    input.value = null;
    this.selectedContactCard = [];
    this.scheduledDate = '';
    this.AIState.onLoading = false;
    this.AIState.onGenerated = false;
    this.chatGptService.onGenerated.next(null);
    this.defaultSelectedSendOption$.next(EDefaultBtnDropdownOptions.Send);
  }

  focus() {
    this.tinyEditor?.editor?.focus();
  }

  handleFocus(focus: boolean, $event: Event = null) {
    if (this.enableSetPreview) {
      this.trudiSendMsgService.setShowPreview(true);
    }
    if ($event) {
      $event?.stopPropagation && $event.stopPropagation();
      focus && this.focus();
    }

    this.editorFocus = focus;
    this.onFocus.emit(focus);
    this.cdr.markForCheck();
    if (
      focus &&
      this.inlineMessage &&
      !this.chatGptService.onGenerated.value?.status &&
      this.isAppReply &&
      !this.editorControl.value &&
      !this.cancelChatGpt &&
      this.isParameterInserted
    ) {
      this.chatGptService.enableGenerate.next(true);
      this.chatGptService.onGenerate.next({
        enable: true,
        skipValidate: false,
        show: true
      });
    }
    this.isShowRemainCharacter = focus ? this.maxRemainCharacter > 0 : false;
    this.handleCloseSidebar();
  }

  handleCloseSidebar() {
    if (this.helpCentreService.getValueIsShowHelpCentre()) {
      this.helpCentreService.handleCloseZendeskWidget();
    }

    if (this.notificationService.getValueIsShowNotification()) {
      this.notificationService.setIsShowNotification(false);
    }
  }

  async fileBrowseHandler(event) {
    const [file] = event.target?.files || [];
    this.overFileSize = null;
    this.isUnSupportFile = null;
    this.selectedFile = null;
    if (!file) return;
    let files: File[] = [];
    const length = event.target.files.length;
    for (let index = 0; index < length; index++) {
      const file = event.target.files[index];
      const fileExtension = this.fileService.getFileExtension(file.name);
      await processFile(file, fileExtension);
      files.push(file);
    }
    this.prepareFilesList(files);
    this.trudiSendMsgService.setListFilesReiForm(files);
    this.handleOnSubmitUploadAttachments();
    this.dropFile.emit(this.listOfFiles);
    event.target.value = null;
    this.cdr.markForCheck();
  }

  handleOnSubmitUploadAttachments() {
    let additionalFiles = this.listFileUpload.flatMap((item) => item.listFile);
    additionalFiles = additionalFiles.map((item) => {
      return {
        '0': item,
        icon:
          item.icon === EAvailableFileIcon.Audio
            ? EAvailableFileIcon.voiceMailAudio
            : item.icon
      };
    });
    this.listOfFiles = [...this.listOfFiles, ...additionalFiles];
    this.tinyEditorFileControlService.setListOfFiles(
      this.listOfFiles as IFile[]
    );
    this.listFileUpload = [];
    this.validateFileSize();
    this.cdr.markForCheck();
    if (this.inlineMessage) {
      this.cdr.markForCheck();
    }
  }
  prepareFilesList(file: FileList | File[]) {
    this.selectedFile = file;
    this.mapInfoListFile(this.selectedFile);
    this.listFileUpload = [];
    for (let index = 0; index < this.selectedFile.length; index++) {
      this.listFileUpload.push({
        title: ``,
        listFile: [this.selectedFile[index]]
      });
    }
  }
  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      if (!fileList[index]) return;
      fileList[index].icon = fileList[index].fileType
        ? fileList[index].fileType.icon
        : this.fileService.getFileIcon(fileList[index].name);
      fileList[index].fileName = this.fileService.getFileName(
        fileList[index].name
      );
      fileList[index].extension = this.fileService.getFileExtension(
        fileList[index].name
      );
      if (fileList[index].isFromAttachmentWidget) {
        fileList[index].isSupportedVideo = !!fileList[index].thumbMediaLink;
      } else {
        fileList[index].isSupportedVideo =
          (fileList[index].fileType?.name || fileList[index].type)?.indexOf(
            'video'
          ) > -1 &&
          listFileDisplayThumbnail.includes(fileList[index].extension);
      }
    }
  }
  getFileType(file): string {
    const splitFileNameArray = file.name.split('.');
    const fileExtension = splitFileNameArray[splitFileNameArray.length - 1];
    if (fileExtension === 'avi') {
      return 'video/avi';
    }
    if (file.type) {
      return file.type;
    }
    return '';
  }
  getListFileType() {
    const listFileType = localStorage.getItem('listFileType');
    if (listFileType) {
      this.fileTypes = JSON.parse(listFileType);
    } else {
      this.fileService.getListFileTye().subscribe((res) => {
        this.fileTypes = res;
        localStorage.setItem('listFileType', JSON.stringify(res));
      });
    }
  }

  removeFile(index) {
    this.listOfFiles = this.listOfFiles.filter((_, i) => i !== index);
    const input = document.querySelector(
      `#btn-upload-tiny-${this.editorId}`
    ) as HTMLInputElement;
    input.value = null;
    this.validateFileSize();
    this.dropFile.emit(this.listOfFiles);
    this.cdr.markForCheck();
  }

  setStateAttachBtn() {
    if (
      this.attachBtnConfig.disabled &&
      this.disabledAttachBtn &&
      this.from === TinyEditorOpenFrom.SendMessage
    ) {
      this.listToolbarButton = this.listToolbarButton.map((buttons) =>
        buttons.filter((btn) => btn.value !== ToolbarAction.Attach)
      );
    } else if (!this.isShowUploadAttachments) {
      const findIndex = this.listToolbarButton.findIndex((option) => {
        return option.some((o) => o.value === ToolbarAction.Attach);
      });
      this.listToolbarButton[findIndex].forEach((btn) => {
        if (btn.value === ToolbarAction.Attach) {
          btn.show = false;
        }
      });
    } else if (this.listToolbarButton.length === 2) {
      this.listToolbarButton.push([
        {
          value: ToolbarAction.Attach,
          selected: false,
          icon: 'attach',
          selectedIcon: 'attachSelected',
          attachOptions: this.attachOption,
          show: true
        }
      ]);
    }
  }
  setStateEmbedCodeBtn() {
    const findIndex = this.listToolbarButton.findIndex((options) => {
      return options.some((option) => option.value === ToolbarAction.Code);
    });
    this.listToolbarButton[findIndex].forEach((btn) => {
      if (btn.value === ToolbarAction.Code) {
        btn.show = this.isShowEmbedCodeOptionsFunction;
      }
    });
  }

  validateFileSize() {
    if (!this.listOfFiles?.length) {
      this.isUnSupportFile = false;
      this.overFileSize = false;
      this.communicationStepFormService.isDisabledAddStep.next(false);
      this.isInvalidAttachment.emit(false);
      return;
    }
    this.isUnSupportFile = this.listOfFiles?.some(
      (item) => !validateFileExtension(item[0] || item, this.FILE_VALID_TYPE)
    );
    this.overFileSize = this.listOfFiles?.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > MAX_FILE_SIZE
    );
    this.communicationStepFormService.isDisabledAddStep.next(
      this.isUnSupportFile || this.overFileSize
    );
    this.isInvalidAttachment.emit(this.isUnSupportFile || this.overFileSize);
  }

  isImage(file) {
    if (
      ((file[0]?.type && file[0].type?.includes('image')) ||
        file[0]?.fileTypeDot === 'photo') &&
      validateFileExtension(file[0], this.FILE_VALID_TYPE)
    ) {
      return true;
    }

    return false;
  }

  isVideo(file) {
    if (
      ((file[0]?.type && file[0].type?.includes('video')) ||
        file[0]?.fileTypeDot === 'video') &&
      validateFileExtension(file[0], this.FILE_VALID_TYPE)
    ) {
      return true;
    }

    return false;
  }

  isInvalidFile(file) {
    const fileCheck = file[0] ? file[0] : file;
    return (
      !validateFileExtension(fileCheck, this.FILE_VALID_TYPE) ||
      fileCheck?.size / 1024 ** 2 > fileLimit
    );
  }

  async previewFileAttachment(files) {
    let validFiles = [];
    const filesAttachment = files?.map((file) => (file[0] ? file[0] : file));
    for (let i = 0; i < filesAttachment.length; i++) {
      // skip svg
      if (filesAttachment[i].type.indexOf('svg') > -1) return;
      if (ALLOWED_TYPES.indexOf(filesAttachment[i].type) > -1) {
        if (
          filesAttachment[i].type.indexOf('video') > -1 &&
          listFileDisplayThumbnail.includes(
            filesAttachment[i].extension ||
              this.fileService.getFileExtension(filesAttachment[i].name)
          )
        ) {
          const fileUrl = URL.createObjectURL(filesAttachment[i]);
          filesAttachment[i].localThumb = await getThumbnailForVideo(fileUrl);
          filesAttachment[i].isSupportedVideo = true;
        } else if (filesAttachment[i].type.indexOf('video') > -1) {
          filesAttachment[i].localThumb = 'assets/images/icons/video.svg';
        }
        if (filesAttachment[i].type.indexOf('image') > -1) {
          filesAttachment[i].localThumb = URL.createObjectURL(
            filesAttachment[i]
          );
        }
        validFiles.push(filesAttachment[i]);
      }
    }
    this.prepareFilesList(validFiles);
    this.handleOnSubmitUploadAttachments();
    this.dropFile.emit([...this.listOfFiles].slice(-validFiles?.length));
    const attachmentsWrapper = this.editorContainer.nativeElement.querySelector(
      '#attachments-wrapper'
    );
    const contactAttachmentsWrapper =
      this.editorContainer.nativeElement.querySelector(
        '#contact-attachments-wrapper'
      );
    if (attachmentsWrapper) {
      attachmentsWrapper.scrollLeft += 9999;
    }
    if (contactAttachmentsWrapper) {
      contactAttachmentsWrapper.scrollLeft += 9999;
    }
    this.cdr.markForCheck();
  }

  async onDrop(event, isAttachment: boolean = false) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
      const files = [...(event as any).dataTransfer.files];
      if (files?.length < 1) return;
      if (isAttachment) {
        this.previewFileAttachment(files);
      } else {
        if (this.isInlineMessenger || this.inlineSMSMessage) {
          await this.handleDropAndPasteFile(files);
          return;
        }
        this.uploadFile(files);
      }
    } else {
      if (this.isImage([event.previousContainer.data[event.previousIndex]])) {
        event.previousContainer.data[event.previousIndex].localThumb =
          event.previousContainer.data[event.previousIndex].mediaLink;
      }

      if (this.isVideo([event.previousContainer.data[event.previousIndex]])) {
        event.previousContainer.data[event.previousIndex].localThumb =
          event.previousContainer.data[event.previousIndex].thumbMediaLink ||
          'assets/images/icons/video.svg';
      }

      this.prepareFilesList([
        event.previousContainer.data[event.previousIndex]
      ]);
      this.handleOnSubmitUploadAttachments();
      if (!this.listOfFiles[this.listOfFiles.length - 1]['error']) {
        this.dropFile.emit([this.listOfFiles[this.listOfFiles.length - 1]]);
      }
      const attachmentsWrapper =
        this.editorContainer.nativeElement.querySelector(
          '#attachments-wrapper'
        );
      if (attachmentsWrapper) {
        attachmentsWrapper.scrollLeft += 9999;
      }
      this.cdr.markForCheck();
    }
  }

  handleShowThumbnailImage(path: string) {
    return {
      'background-image': `url('${path}')`
    };
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  clickOutSidePopover(btn: IToolbarButton) {
    if (!btn?.value) return;
    switch (btn.value) {
      case ToolbarAction.More:
        btn.showPopup = false;
        this.showSmallNestedComponent = false;
        break;
      case ToolbarAction.Attach:
      case ToolbarAction.Code:
        btn.selected = false;
        break;
      default:
        break;
    }
  }

  showInlineEditor() {
    this.editorFocus = true;
    if (this.chatGptService.checkEnableSetting()) {
      this.chatGptService.reset();
      this.chatGptService.enableGenerate.next(true);
      this.chatGptService.onGenerate.next({
        enable: true,
        skipValidate: false,
        show: false
      });
    }
  }
  onClearContact(indexContact: number) {
    if (this.selectedContactCard.length > 0) {
      const selectedContactCard = this.selectedContactCard.filter(
        (_it, index) => index !== indexContact
      );
      this.selectedContactCard = selectedContactCard;
      this.trudiSendMsgFormService.sendMsgForm
        .get('selectedContactCard')
        ?.setValue(selectedContactCard);
      this.trudiAddContactCardService.setSelectedContactCard(
        selectedContactCard
      );
    }
  }
  toggleButtonControl(action: ToolbarAction, show: boolean) {
    let largeBtn = this.listToolbarButton
      .flat()
      .find((item) => item.value === action);
    largeBtn && (largeBtn.show = show);
    let smallBtn = [
      ...this.smallToolBtnList,
      ...this.smallToolBtnList.find((btn) => btn.value === ToolbarAction.More)
        .moreList
    ].find((item) => item.value === action);
    smallBtn && (smallBtn.show = show);
  }

  patchButtonInputs(action: ToolbarAction, inputs: Object) {
    let largeBtn = this.listToolbarButton
      .flat()
      .find((item) => item.value === action);
    largeBtn && (largeBtn.inputs = { ...largeBtn.inputs, ...inputs });
    let smallBtn = [
      ...this.smallToolBtnList,
      ...this.smallToolBtnList.find((btn) => btn.value === ToolbarAction.More)
        .moreList
    ].find((item) => item.value === action);
    smallBtn && (smallBtn.inputs = { ...(smallBtn.inputs || {}), ...inputs });
  }

  handleAddFileComputer() {
    const button = document.querySelector(
      `#btn-upload-tiny-${this.editorId}`
    ) as HTMLDivElement;
    button?.click();
  }

  onResize(e) {
    const initClientY = e.clientY;
    const initHeight = this.editor.nativeElement.parentElement.clientHeight;
    this.isResizing = true;
    const handleMouseMove = ((e) => {
      e.preventDefault();
      this.updateHeightEditor(initHeight - (e.clientY - initClientY));
    }).bind(this);

    const handleMouseUp = (() => {
      e.preventDefault();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }).bind(this);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    this.tinyEditor.editor.on('mouseup', handleMouseUp);
  }

  updateHeightEditor(currentHeight?: number) {
    const parentEditorElm = this.editor.nativeElement.parentElement;
    const bodyHeight = document.querySelector('body').clientHeight;
    const dropdownElements = document.querySelectorAll(
      '.toolbar .dropdown-list'
    );
    const tinyEditorHeight =
      document.querySelector('tiny-editor').parentElement.clientHeight;
    const headerConversationHeight =
      this.taskType === this.TaskTypeEnum.TASK ? 56 : 0;

    const maxHeight =
      bodyHeight -
      headerConversationHeight -
      146 -
      (tinyEditorHeight - parentEditorElm.clientHeight);

    const height = Math.max(
      Math.min(currentHeight || parentEditorElm.clientHeight, maxHeight),
      72
    );
    parentEditorElm.setAttribute('style', `height: ${height}px`);

    if (height > maxHeight * 0.9) {
      dropdownElements.forEach((element) =>
        element.classList.add('dropdown-list-bottom')
      );
    } else {
      dropdownElements.forEach((element) =>
        element.classList.remove('dropdown-list-bottom')
      );
    }
  }

  onCloseSuggestedChatGpt() {
    this.isEditorImgLoadingClicked = true;
    this.chatGptService.cancelChatGpt.next(true);
    this.chatGptService.chatGptSubscription.unsubscribe();
  }

  onSelectOptionSend(option) {
    this.selectedSendOption = option;
    this.showListSendOption = false;
    this.onChangeSendOption.emit(option.text);
  }

  isScheduleForSendOption() {
    return this.selectedSendOption.text === SendOption.ScheduleForSend;
  }

  handleSelectedEmailSignature(selected: boolean) {
    let largeBtn = this.listToolbarButton
      .flat()
      .find((item) => item.value === ToolbarAction.EmailSignature);
    largeBtn && (largeBtn.selected = selected);
    let smallBtn = this.smallToolBtnList.find(
      (item) => item.value === ToolbarAction.EmailSignature
    );
    smallBtn && (smallBtn.selected = selected);
    this.isEmailSignature = selected;
    this.isShowEmailSignature = selected;
    this.showEmailSignature.emit(selected);
    this.cdr.markForCheck();
  }

  replaceDefaultValue(text: string) {
    const newLine = /(\r\n|\n|\r)/gm;
    const space =
      /\s (?! ({owner name}|{tenant name}|{receiver name}|{landlord name}|{supplier name}))/gm;
    if (!this.inlineMessage) {
      text = text?.replace(newLine, '</p><p>');
      text = text?.replace(/\n/gm, '<br/>');
    }
    if (this.from !== TinyEditorOpenFrom.OutOfOffice) {
      text = text?.replace(space, '&nbsp;');
    }

    text = removeLineHeight(text);

    this.text = '';
    return text || '';
  }

  formatBeforeEmitValue(value: string, isPaste: boolean = false) {
    if (
      !!value?.trim() &&
      !value.includes(EMIT_STYLE_SIGNATURE_ID) &&
      !this.inlineMessage &&
      this.from !== TinyEditorOpenFrom.OutOfOffice &&
      !this.inlineSMSMessage &&
      !this.isInlineMessenger
    )
      value = `<span id="${EMIT_STYLE_SIGNATURE_ID}" style="font-weight: 400; color: #3D3D3D; font-size: ${
        this.customFontSetting ? this.customFontSetting.fontSize : '11pt'
      }; line-height: normal;">${value}</span>`;

    value = value?.replace(
      /<(p|li)(\s+[^>]*)?>(.*?)<\/(p|li)>/g,
      (match, tag, attributes, content) =>
        this.addAnchorTagToLink(match, content)
    );
    if (!isPaste) {
      // value = value?.replace(/"/g, "'"); //Impact font-family
      value = value?.replace(/<br>/g, '<br/>');
      value = value?.replace(/\n/gm, '');

      //add default font settings
      value = this.checkAndWrapCustomStyle(value);
    } else {
      value = removeLineHeight(value);
    }
    return value;
  }

  handleShowAiBubble() {
    if (!this.currentCompany?.isAISetting) return;
    if (!this.bubbleClosed) return;
    if (!this.enableAiGenerateMsgCopy) return;
    this.bubbleClosed = false;
    this.aiInteractiveBuilder
      .createAiInteractiveBubble(this, this.inlineMessage)
      .subscribe(() => {
        this.bubbleClosed = true;
      });
  }

  updateStyleParamByStatus(editorText) {
    if (!editorText) {
      return '';
    }

    const listEditorParams = editorText.match(REGEX_PARAM_TASK_EDITOR) || [];
    if (listEditorParams?.length < 1) {
      return editorText;
    }

    const listDefaultCodeOptions = [
      ...PT_LIST_DYNAMIC_PARAMETERS,
      ...RM_LIST_DYNAMIC_PARAMETERS
    ]
      .map((item) => item.menu.map((p) => p.param))
      .flat();
    const listReceiveCodeOptions = this.listCodeOptions
      .map((item) => item.menu.map((p) => p.param))
      .flat();
    let updatedText = listEditorParams.reduce((text, p) => {
      const oldValidDynamic = `<span style='color: var(--trudi-primary, #00aa9f);' contenteditable='false'>${p}</span>`;
      const validDynamic = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${p}</span>`;
      const inValidDynamic = `<span style="color: var(--danger-500, #fa3939);" contenteditable="false">${p}</span>`;
      const validDynmicCopy = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${p}</span>`;
      const inValidDynmicCopy = `<span style="color: var(--danger-500, #fa3939);" contenteditable="false">${p}</span>`;

      if (
        !listReceiveCodeOptions.includes(p) ||
        !listDefaultCodeOptions.includes(p)
      ) {
        if (text.includes(oldValidDynamic)) {
          text = text.replaceAll(oldValidDynamic, inValidDynamic);
        }
        if (text.includes(validDynamic)) {
          text = text.replaceAll(validDynamic, inValidDynamic);
        }
        if (text.includes(validDynmicCopy)) {
          text = text.replaceAll(validDynmicCopy, inValidDynmicCopy);
        }
      }

      if (
        listReceiveCodeOptions.includes(p) &&
        listDefaultCodeOptions.includes(p)
      ) {
        if (text.includes(inValidDynamic)) {
          text = text.replaceAll(inValidDynamic, validDynamic);
        }
        if (text.includes(inValidDynmicCopy)) {
          text = text.replaceAll(inValidDynmicCopy, validDynmicCopy);
        }
      }
      return text;
    }, editorText);
    return updatedText;
  }

  async uploadImage(file) {
    const uuid = uuid4();
    let content = '';
    const templateLoading = `<img id="${uuid}" class="image-loading" src="/assets/images/loading-iframe.gif">`;
    this.tinyEditor.editor.insertContent(
      `<p class="captureImage">${templateLoading}</p><p></p>`
    );
    try {
      const data = await this.fileUploadService.uploadFile(
        new File([file], file.name, { type: file.type })
      );
      content = this.tinyEditor.editor
        .getContent()
        .replace(
          templateLoading,
          '<img class="image-detail" src="' + data.Location + '" >'
        );
    } catch {
      content = this.tinyEditor.editor
        .getContent()
        ?.replace(`<p class="captureImage">${templateLoading}</p>`, '');
    }
    const tinyBookmark = this.tinyEditor.editor.selection.getBookmark(2);
    this.tinyEditor.editor.setContent(content);
    this.editorControl.setValue(content);
    this.tinyEditor.editor.selection.moveToBookmark(tinyBookmark);
    this.getRawText();
  }

  handleCheckValidateFilesDrop(files) {
    const filesUpload = files?.map((file) => (file[0] ? file[0] : file));
    const filesValid = filesUpload.filter((file) => !this.isInvalidFile(file));
    this.showPopupInvalidFile = filesValid.length < files.length;
    return filesValid;
  }

  handleClickConfirm() {
    this.showPopupInvalidFile = false;
    this.errorMessage = '';
  }

  AIhidePopover() {
    this.showSmallNestedComponent = false;
    this.hideSmallBtnList(ToolbarAction.More);
    this.checkIsBtnMoreSelected();
  }

  trackByItems(index: number, item: LocalFile) {
    return item?.lastModified;
  }

  handleClickSave(link: IActiveLink) {
    const { url, title } = link;
    const externalURL = hasProtocol(url) ? url : `https://${url}`;
    const shortLink = title ? title : externalURL;
    this.trackUserChange = true;
    if (this.insertLinkService.isEditLink) {
      const payload = { title: shortLink, url: externalURL };
      this.tinyEditor.editor.execCommand('mceUpdateLink', false, payload);
      this.insertLinkService.setIsEditLink(false);
    } else {
      if (this.contentSelected?.length) {
        this.tinyEditor.editor.execCommand(ToolbarAction.mceInsertLink, false, {
          href: externalURL,
          text: shortLink,
          target: '_blank',
          class: 'tinymce-link'
        });
      } else {
        const valueToInsert = `<a class="tinymce-link" href="${externalURL}" target="_blank">${shortLink}</a>`;
        this.tinyEditor.editor.execCommand(
          'mceInsertContent',
          false,
          valueToInsert
        );
      }
    }
  }

  setValueCaseForwardMsg() {
    const parsedInput: any = HTMLParser.parse(this.currentTextContent);
    const numberOfPtag = parsedInput?.childNodes.filter(
      (item) => item.rawTagName === 'p'
    );
    const newPtag = this.countTagEmpty(
      this.countEnableMailSignature + numberOfPtag.length > 6
        ? 6
        : this.countEnableMailSignature + numberOfPtag.length
    ); // if > 6 return 1 p tagEmpty
    const { msgContent, quote, button } = extractQuoteAndMessage(
      this.currentTextContent
    );
    const temp = `${msgContent}${newPtag.tag}${this.buildMailboxSignature()}`;
    const newMsgContent = this.handleAddReplyQuote(temp, quote, button);
    this.editorControl.setValue(newMsgContent);
  }

  handleDeleteFromInline(deleteInlineType) {
    this.conversationService.triggerDeleteFromInline.next(deleteInlineType);
  }

  onClearContactById(cardId: string) {
    if (!this.selectedContactCard?.length) return;
    const selectedContactCard = this.selectedContactCard.filter(
      (card) => card.id !== cardId
    );
    this.selectedContactCard = selectedContactCard;
    this.trudiSendMsgFormService.sendMsgForm
      .get('selectedContactCard')
      ?.setValue(selectedContactCard);
    this.trudiAddContactCardService.setSelectedContactCard(selectedContactCard);
  }

  buildDynamicInputs(btn: IToolbarButton) {
    if (
      [
        ToolbarAction.FontFamily,
        ToolbarAction.FontSize,
        ToolbarAction.TextColor,
        ToolbarAction.HighLightColor,
        ToolbarAction.NumList,
        ToolbarAction.BullList
      ].includes(btn.value)
    ) {
      return {
        ...btn?.inputs,
        editor: this.tinyEditor?.editor
      };
    }

    return btn?.inputs;
  }

  getCurrentProperties() {
    const propertyIds = [];
    switch (this.createMessageFrom) {
      case ECreateMessageFrom.MULTI_MESSAGES:
      case ECreateMessageFrom.CONTACT:
        this.prefillPropertiesFromSendBulk.prefillReceiversList?.forEach(
          (item) => {
            propertyIds.push(item.propertyId);
          }
        );
        break;
      case ECreateMessageFrom.MULTI_TASKS:
        this.prefillPropertiesFromSendBulk.selectedTasksForPrefill?.forEach(
          (item) => {
            propertyIds.push(item.propertyId);
          }
        );
        break;
      case ECreateMessageFrom.MESSENGER:
      case ECreateMessageFrom.APP_MESSAGE:
      case ECreateMessageFrom.SMS_MESSAGES:
      case ECreateMessageFrom.WHATSAPP:
        propertyIds.push(this.selectedReceivers?.value?.[0]?.propertyId);
        break;
      default:
        propertyIds.push(this.selectedProperty?.value?.id);
        break;
    }
    valueInputsChangeToBuildCustomSelection(
      propertyIds,
      this.createMessageFrom,
      this.showAddPolicyPopover
    );
  }

  getStrUserForInlineMessage() {
    if (
      this.selectedReceivers?.value?.length &&
      !this.strUser &&
      this.inlineMessage
    ) {
      this.getListUser(this.selectedReceivers.value);
    }
  }

  handleInsertContactCardToContent(cards: ISelectedReceivers[]) {
    if (cards.length === 0) return;
    const transformItems =
      this.trudiSendMsgService.transformContactCardInfo(cards);
    const htmlCardItems = transformItems
      .map((contact, index) =>
        this.isInlineMessenger || this.inlineSMSMessage
          ? createHtmlCardItemForMessenger(
              contact,
              this.trudiSendMsgService.market,
              index
            )
          : createHtmlCardItem(contact, this.trudiSendMsgService.market)
      )
      .join(' ');
    if (this.prevBookmark !== null) {
      this.tinyEditor?.editor.selection.moveToBookmark(this.prevBookmark);
    } else {
      //move cursor to the end of the content
      this.tinyEditor?.editor.selection.select(
        this.tinyEditor?.editor.getBody(),
        true
      );
      this.tinyEditor?.editor.selection.collapse(false);
    }

    const currentContent = this.tinyEditor?.editor?.getContent();
    const isSpecialProvider = this.isInlineMessenger || this.inlineSMSMessage;
    const updatedContent =
      isSpecialProvider && currentContent
        ? '<br>' + htmlCardItems
        : htmlCardItems;

    this.tinyEditor?.editor.undoManager.transact(() => {
      this.tinyEditor?.editor.execCommand(
        'mceInsertContent',
        false,
        updatedContent
      );
    });

    //set cursor location
    setTimeout(() => {
      const lastItemId = cards[cards.length - 1].id;
      const cardNodes = this.tinyEditor?.editor.dom.select(
        `.card[data-id="${lastItemId}"]`
      );
      if (cardNodes && cardNodes.length > 0) {
        this.tinyEditor?.editor.selection.setCursorLocation(
          cardNodes[0].nextSibling,
          0
        );
        this.tinyEditor?.editor.focus();
        this.editorFocus = true;
        this.cdr.markForCheck();
      }
    }, 500);

    //Reset selected values to avoid display on trudi-add-contact-card again
    this.trudiAddContactCardService.resetSelectedContactCard();
  }

  handlePrefillContactCards(htmlContent: string) {
    if (this.allowInsertContactCardToContent && !this.isFilledContactCard) {
      let listContactCardInForm = [];
      if (this.prefillContactCard && this.prefillContactCard.length > 0) {
        listContactCardInForm =
          this.trudiSendMsgService.transformContactCardInfo(
            this.prefillContactCard
          );
      } else {
        listContactCardInForm =
          this.trudiSendMsgService.transformContactCardInfo(
            this.trudiSendMsgFormService.sendMsgForm?.get('selectedContactCard')
              ?.value
          );
      }

      if (listContactCardInForm && listContactCardInForm.length > 0) {
        try {
          const htmlCardItems = listContactCardInForm
            .map((contact) =>
              createHtmlCardItem(contact, this.trudiSendMsgService.market)
            )
            .join('');

          const rootEl = HTMLParser.parse(htmlContent);
          const signatureEl = rootEl?.querySelector('#email-signature');
          if (signatureEl) {
            //Insert contact cards before the signature element
            signatureEl.replaceWith(
              htmlCardItems + '<p></p>' + signatureEl.outerHTML
            );
          } else {
            rootEl.appendChild(HTMLParser.parse('<p></p>' + htmlCardItems));
          }

          //Mark filled contact card to avoid insert again.
          this.isFilledContactCard = true;

          return rootEl.toString();
        } catch (error) {
          console.warn(
            'handle prefill contact cards: ',
            listContactCardInForm,
            ' error. ',
            error.message
          );
        }
      }
    }
    return htmlContent;
  }

  buildMailboxSignature() {
    return `<div id='email-signature'>${this.removeSignatureFontInline(
      this.emailSignatureMailbox
    )}</div>`;
  }

  buildOutOfOfficeSignature() {
    return `<div id='email-signature'>${this.removeSignatureFontInline(
      this.emailSignatureOutOfOffice
    )}</div>`;
  }

  applyCustomFontStyle(editor = null) {
    if (this.inlineSMSMessage || this.isInlineMessenger) return;
    if (this.customFontSetting) {
      //Set style inline for editor body, because we can't use execCommand here
      const editorBody = editor
        ? editor.getBody()
        : this.tinyEditor?.editor.getBody();
      if (editorBody) {
        editorBody.style.fontFamily = this.customFontSetting.fontStyle;
        editorBody.style.fontSize = this.customFontSetting.fontSize;

        //remove wrap custom style element that matches styles
        editorBody
          .querySelectorAll(`.${CUSTOMIZE_FONT_STYLE_CLASS}`)
          .forEach((el) => {
            if (
              el.style.fontFamily === this.customFontSetting.fontStyle &&
              el.style.fontSize === this.customFontSetting.fontSize
            ) {
              el.outerHTML = el.innerHTML;
            }
          });
      }
      //Fire event to set active font on font family and font size
      if (editor) {
        editor.dispatch(APPLY_CUSTOM_FONT_EVENT, this.customFontSetting);
      } else {
        this.tinyEditor?.editor.dispatch(
          APPLY_CUSTOM_FONT_EVENT,
          this.customFontSetting
        );
      }
    }
  }

  removeQuoteFontInline(htmlContent) {
    if (htmlContent) {
      try {
        const doc = HTMLParser.parse(htmlContent);
        const replyQuote = doc.querySelector('.gmail_quote');

        if (replyQuote) {
          doc.querySelectorAll('.gmail_quote').forEach((replyQuote) => {
            replyQuote.removeAttribute('id');
          });
          doc.querySelectorAll('.gmail_quote *').forEach((element) => {
            let inlineStyle = element.getAttribute('style');
            if (inlineStyle) {
              inlineStyle = inlineStyle
                .replace(/font-family\s*:\s*[^;]+[;]?/gi, '')
                .replace(/font-size\s*:\s*[^;]+[;]?/gi, '');

              if (inlineStyle.trim() === '') {
                element.removeAttribute('style');
              } else {
                element.setAttribute('style', inlineStyle);
              }
            }
          });
          doc.querySelectorAll('table').forEach((tb) => {
            const inlineStyle = tb.getAttribute('style');
            if (inlineStyle) {
              tb.setAttribute(
                'style',
                "font-family: 'Inter', sans-serif; font-size: 10px;" +
                  inlineStyle
              );
            } else {
              tb.setAttribute(
                'style',
                "font-family: 'Inter', sans-serif; font-size: 10px;"
              );
            }
          });
        }

        return doc.innerHTML;
      } catch (error) {
        console.warn('Reformat signature error:', error);
      }
    }
    return htmlContent;
  }

  removeSignatureFontInline(htmlContent: string) {
    if (htmlContent) {
      try {
        const doc = HTMLParser.parse(htmlContent);
        //Remove font-family and font-size on the sign-off signature
        doc.querySelectorAll('span').forEach((spanEl) => {
          let inlineStyle = spanEl.getAttribute('style');
          if (inlineStyle) {
            inlineStyle = inlineStyle
              .replace(/(font-family):\s*([^;]*)[;'][;"]/g, '')
              .replace(/(font-size)\s*?:.*?(;|(?=""|'|;))/g, '');
            spanEl.setAttribute('style', inlineStyle);
          }
        });

        //Add font-family for email signature to avoid effect font from content wrap
        doc.querySelectorAll('table').forEach((tb) => {
          const inlineStyle = tb.getAttribute('style');
          if (inlineStyle) {
            tb.setAttribute(
              'style',
              "font-family: 'Inter', sans-serif;" + inlineStyle
            );
          } else {
            tb.setAttribute('style', "font-family: 'Inter', sans-serif;");
          }
        });

        return doc.innerHTML;
      } catch (error) {
        console.warn('reformat signature error: ', error);
      }
    }
    return htmlContent;
  }

  checkAndWrapCustomStyle(content: string) {
    //do not wrap style in case content is empty
    if (
      this.inlineSMSMessage ||
      this.isInlineMessenger ||
      !content ||
      content.trim().length === 0 ||
      content === '<p>&nbsp;</p>'
    )
      return content;

    const fontStyle =
      this.customFontSetting && this.customFontSetting.fontStyle
        ? this.customFontSetting.fontStyle
        : defaultFontFamily.format;
    const fontSize =
      this.customFontSetting && this.customFontSetting.fontSize
        ? this.customFontSetting.fontSize
        : defaultFontSize.format;

    let result = content;

    try {
      const rootEl = HTMLParser.parse(content);
      const checkMatchStyle = (el: HTMLParser.HTMLElement) => {
        const inlineStyle = el.getAttribute('style');
        if (
          inlineStyle &&
          inlineStyle.indexOf(fontStyle) !== -1 &&
          inlineStyle.indexOf(fontSize) !== -1
        ) {
          return true;
        }

        return false;
      };

      //content is empty text we need  to remove the font wrap element
      //to return real value to validate empty content on the form control
      if (
        !rootEl.innerText ||
        rootEl.innerText.replace(/&nbsp;/g, '').trim().length === 0
      ) {
        rootEl
          .querySelectorAll(`.${CUSTOMIZE_FONT_STYLE_CLASS}`)
          .forEach((el) => {
            el.replaceWith(el.innerHTML);
          });

        rootEl.querySelectorAll(`#${EMIT_STYLE_SIGNATURE_ID}`).forEach((el) => {
          el.replaceWith(el.innerHTML);
        });

        return rootEl.innerHTML;
      }

      rootEl
        ?.querySelectorAll(`.${CUSTOMIZE_FONT_STYLE_CLASS}`)
        .forEach((wrapEl) => {
          if (
            (wrapEl.parentNode === null ||
              wrapEl.parentNode === rootEl ||
              (wrapEl.parentNode &&
                wrapEl.parentNode.id === 'emit-style-signature')) &&
            checkMatchStyle(wrapEl)
          ) {
            if (
              wrapEl.nextElementSibling &&
              wrapEl.nextElementSibling.classList.contains(
                CUSTOMIZE_FONT_STYLE_CLASS
              )
            ) {
              wrapEl.replaceWith(`${wrapEl.innerHTML}<br />`);
            } else {
              wrapEl.replaceWith(wrapEl.innerHTML);
            }
          }
        });

      result = rootEl.innerHTML;
    } catch (error) {
      console.warn('parse HTML to wrap custom style error: ', error);
    }
    return `<div class="${CUSTOMIZE_FONT_STYLE_CLASS}" style="font-family:${fontStyle};font-size:${fontSize};">${result}</div>`;
  }

  handleFilterListToolbarButton() {
    const requiredValues = [
      ToolbarAction.Code,
      ToolbarAction.Attach,
      ToolbarAction.InsertLink
    ];

    this.listToolbarButton = [
      this.listToolbarButton.flatMap((group) =>
        group.filter((item) => requiredValues.includes(item.value))
      )
    ];
  }

  replaceFakeCaret(content: string) {
    try {
      if (!content) return content;
      let result = content.replace(
        /<div[^>]*class="fake_caret--line"[^>]*>([\s\S]*?)<\/div>([\s\S]*?)<\/div>/g,
        ''
      );
      result = result.replace(
        /<div[^>]*class="fake_caret"[^>]*>([\s\S]*?)<\/div>/g,
        ''
      );
      result = result.replace(
        /<span[^>]*class="fake-selection-start"[^>]*>(.*?)<\/span>/g,
        ''
      );
      result = result.replace(
        /<span[^>]*class="fake-selection-end"[^>]*>(.*?)<\/span>/g,
        ''
      );
      return result;
    } catch (ex) {
      console.log('replace fake caret error: ', ex);
    }

    return content;
  }

  processHtml(html: string): string {
    const div = this.rd2?.createElement('div');
    div.innerHTML = html;

    this.processElement(div);

    return div.innerHTML;
  }

  processElement(element: HTMLElement, depth: number = 0): void {
    if (depth > this.maxRemainCharacter) return;
    if (element.hasAttribute('style')) {
      element.removeAttribute('style');
    }

    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = this.addText(child.textContent);
        child.textContent = text;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        this.processElement(child as HTMLElement, depth + 1);
      }
    });
  }

  addText(text: string): string {
    const remainingLength = this.maxRemainCharacter - this.rawText.length;
    const textToAdd = text.slice(0, remainingLength);
    this.rawText += textToAdd;
    return textToAdd;
  }

  processPressEnterOnGreeting(editor, e) {
    const currentNode = editor?.selection?.getNode();
    if (!currentNode) return;
    const isElementSendMessageModal = currentNode.id === 'select-user-greeting';
    const isElementSendBulkModal = [
      'send-bulk-msg',
      'greeting-element'
    ].includes(currentNode.id);
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      (isElementSendBulkModal || isElementSendMessageModal)
    ) {
      e.preventDefault();
      // Create a new paragraph after greeting
      const newParagraph = editor.dom.create('p', {}, '<br>');
      if (isElementSendMessageModal) {
        editor.dom.insertAfter(
          newParagraph,
          currentNode.closest('#select-user-container')
        );
      }
      if (isElementSendBulkModal) {
        editor.dom.insertAfter(
          newParagraph,
          currentNode.closest('#send-bulk-msg')
        );
      }

      // Move the cursor to the new paragraph
      editor.selection.setCursorLocation(newParagraph, 0);
    }
  }

  async handleDropAndPasteFile(files) {
    const list: [] = this.listOfFilesUpload.value || [];
    let listFileResponse = [];
    this.trudiSaveDraftService.isLoadingUploadFile = true;
    files.forEach((file) => {
      file.localThumb = URL.createObjectURL(file);
      file.canUpload =
        validateFileExtension(file, this.FILE_VALID_TYPE) &&
        (file.size || file?.fileSize) / 1024 ** 2 <= fileLimit;
      file.ignoreUpload = true;
    });
    this.listOfFilesUpload.setValue([...list, ...files]);
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      const canUpload =
        validateFileExtension(file, this.FILE_VALID_TYPE) &&
        (file.size || file?.fileSize) / 1024 ** 2 <= fileLimit;
      let uploadedData = null;
      if (canUpload) {
        uploadedData = await this.fileUploadService.uploadFile(
          new File([file], file.name, { type: file.type })
        );
      }

      listFileResponse.push({
        title: file?.name,
        fileName: file?.name,
        fileSize: file?.fileSize || file?.size,
        mediaLink: uploadedData?.Location,
        fileType: file?.type || file?.fileType,
        type: file?.type,
        icon: this.fileService.getFileIcon(file?.name),
        isSupportedVideo: file?.isSupportedVideo,
        mediaType: this.fileService.getFileTypeSlash(file?.type),
        name: file?.name,
        localThumb: file.localThumb,
        canUpload
      });
    }
    this.listOfFilesUpload.setValue([...list, ...listFileResponse]);
    const isUploading = this.listOfFilesUpload.value?.some(
      (file) => !file.uploaded && file.canUpload
    );
    this.trudiSaveDraftService.isLoadingUploadFile = isUploading;
    return;
  }

  ngOnDestroy(): void {
    this.tinyEditor?.editor.destroy();
    this.aiDetectPolicyService.disconnect();
    this.windowHandlerClick && this.windowHandlerClick();
    this.windowHandlerClick2 && this.windowHandlerClick2();
    this.chatGptService.replyContent.next(null);
    clearTimeout(this.timeOut1);
    clearTimeout(this.setMinHeightTimeOut);
    clearTimeout(this.nodeChangeTimeout);
    if (this.crmSub) {
      this.crmSub.unsubscribe();
    }
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
    this.focusEvent.complete();
    this.observer?.unobserve(this.editor.nativeElement.parentElement);
    this.aiInteractiveBuilder.destroyAiBubble();
  }
}
