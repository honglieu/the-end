import { TaskService } from '@services/task.service';
import { SharedService } from '@services/shared.service';
import {
  takeUntil,
  switchMap,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  forwardRef,
  NgZone,
  AfterViewInit
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroup,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE,
  MAX_TEXT_MESS_LENGTH,
  PLAIN_LINK_REGEX
} from '@services/constants';
import {
  replaceImageLoading,
  setHeightCommunicationWrapper
} from '@shared/components/tiny-editor/utils/functions';
import {
  IEditNoteConfig,
  INoteToolbarBtn
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import {
  CRM_CHECK,
  ENotePopup,
  ENoteToolbarAction,
  ENoteToolbarTooltip
} from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import { UserService } from '@services/user.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, combineLatest } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Agent, InviteStatus } from '@shared/types/agent.interface';
import { TrudiMentionDirective } from '@trudi-ui';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { AttachAction } from '@shared/components/tiny-editor/tiny-editor.component';
import {
  validateFileExtension,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { FilesService } from '@services/files.service';
import { TinyEditorFileControlService } from '@services/tiny-editor-file-control.service';
import { IFile } from '@shared/types/file.interface';
import { FileUploadService } from '@services/fileUpload.service';
import { SendMessageService } from '@services/send-message.service';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  GetListUserPayload,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { isCheckedReceiversInList } from '@/app/trudi-send-msg/utils/helper-functions';
import { GetListUserResponse } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ToastrService } from 'ngx-toastr';
import { TaskItem } from '@shared/types/task.interface';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { PropertiesService } from '@services/properties.service';
import { CompanyService } from '@services/company.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { EContactCardOpenFrom } from '@shared/enum';

import uuid4 from 'uuid4';

const providers = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ChatNoteComponent),
  multi: true
};

@Component({
  selector: 'chat-note',
  templateUrl: './chat-note.component.html',
  styleUrls: ['./chat-note.component.scss'],
  providers: [providers, TinyEditorFileControlService]
})
export class ChatNoteComponent
  implements OnInit, ControlValueAccessor, AfterViewInit
{
  @ViewChild(TrudiMentionDirective, { static: true })
  mention: TrudiMentionDirective;
  @ViewChild('chatNoteContainer', { static: true })
  chatNoteContainer: ElementRef<HTMLDivElement>;
  @ViewChild('editor', { static: true }) editor: ElementRef<HTMLDivElement>;
  @ViewChild('tinyEditor', { static: false }) tinyEditor: EditorComponent;

  @Input() disabled: boolean;
  @Input() styleEditNote: string = '';
  @Input() configEditNote: IEditNoteConfig = {
    toolbar: true,
    character: true,
    height: '',
    width: '',
    focusOnInit: false
  };
  @Output() triggerEventInput = new EventEmitter<string>();
  @Output() triggerEventBlur = new EventEmitter<string>();
  @Output() triggerEventFocus = new EventEmitter();

  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  readonly ENoteToolbarAction = ENoteToolbarAction;
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  readonly ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  readonly ModalPopupPosition = ModalPopupPosition;
  readonly ENotePopup = ENotePopup;
  readonly noteId = uuid4();
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;

  public mentionList = [];
  public mentionConfig = { triggerChar: '@' };
  private unsubscribe$ = new Subject<void>();
  private windowHandlerClick: () => void;
  public TinyMCEConfig = {
    selector: 'textarea',
    base_url: '/tinymce',
    suffix: '.min',
    content_css: '/assets/styles/tiny-editor.css',
    toolbar_sticky: true,
    menubar: false,
    statusbar: false,
    toolbar: false,
    plugins: 'lists autoresize wordcount link shortlink',
    convert_urls: false,
    inline_boundaries_selector: 'code',
    notifications: false,
    object_resizing: false,
    visual: false,
    autoresize_overflow_padding: 0,
    autoresize_bottom_margin: 15,
    min_height: 72,
    max_height: 400,
    paste_preprocess: (_, args) => {
      args.content = args.content.replace(/<img.*?>/gi, '');
      args.content = this.formatBeforeEmitValue(args.content, true);
    },
    setup: (editor) => {
      editor.on('drop', (e) => {
        e.preventDefault();
      });
      editor.on('init', () => {
        if (this.configEditNote.focusOnInit) {
          this.setCursorToLast();
        }
        this.mention.setIframe(editor.iframeElement);
        setHeightCommunicationWrapper();
      });

      editor.on('keydown', (e) => {
        let frame = <any>window.frames[editor.iframeElement.id];
        let contentEditable = frame.contentDocument.getElementById('tinymce');
        this._zone.run(() => {
          this.mention.keyHandler(e, contentEditable);
        });
      });

      this.windowHandlerClick = this.rd2.listen(window, 'click', (e) => {
        const editorContainer = this.chatNoteContainer.nativeElement;
        if (!editorContainer.contains(e.target as Node)) {
          editor.getBody()?.setAttribute('spellcheck', false);
        } else {
          editor.getBody()?.setAttribute('spellcheck', true);
        }
      });
    }
  };
  public attachOption = [
    {
      text: 'Upload from computer',
      action: AttachAction.Computer,
      disabled: false
    },
    {
      text: 'Create via REI Form Live',
      action: AttachAction.REIForm,
      disabled: false
    },
    {
      text: 'Add contact card',
      action: AttachAction.ContactCard,
      disabled: false
    }
  ];
  public listToolbarButton: INoteToolbarBtn[] = [
    {
      action: ENoteToolbarAction.MENTION,
      defaultIcon: 'tagIcon',
      selectedIcon: 'tagIconSelected',
      tooltip: ENoteToolbarTooltip.MENTION,
      selected: false
    },
    {
      action: ENoteToolbarAction.ATTACH,
      defaultIcon: 'attachV2',
      selectedIcon: 'attachSelectedV2',
      tooltip: ENoteToolbarTooltip.ATTACH,
      selected: false,
      popup: {
        position: 'topCenter',
        popupList: this.attachOption
      }
    }
  ];
  public addContactCardConfig = {
    'footer.buttons.showBackBtn': false
  };
  public fileTypes;

  private _value: string;
  onChange: (_: string) => void = () => {};
  onTouched: () => void = () => {};
  public noteFocus: boolean;
  public rawText: string;
  public listAgent: Agent[] = [];
  public remainingCharacter: number = MAX_TEXT_MESS_LENGTH;
  public disabledSendBtn: boolean = true;
  public isResizing: boolean = false;
  public currentTask: TaskItem;
  public selectedFile: FileList | File[];
  public listFileUpload = [];
  public listOfFiles: IFile[] = [];
  public currentAgencyId: string;
  public popupState: ENotePopup | null;
  public selectedContactCard: ISelectedReceivers[];
  public isConsole: boolean;
  public currentProperty;
  public overFileSize: boolean;
  public unSupportFile: boolean;
  public isMentionBtnClicked: boolean = false;
  public isUploadingAttachment: boolean = false;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  public readonly EContactCardOpenFrom = EContactCardOpenFrom;

  constructor(
    private rd2: Renderer2,
    private _zone: NgZone,
    private userService: UserService,
    private agencyService: AgencyService,
    private inboxService: InboxService,
    private sharedService: SharedService,
    private taskService: TaskService,
    private internalNoteApiService: InternalNoteApiService,
    private filesService: FilesService,
    private tinyEditorFileControlService: TinyEditorFileControlService,
    private fileUploadService: FileUploadService,
    private sendMessageService: SendMessageService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private trudiSendMsgService: TrudiSendMsgService,
    private toastrService: ToastrService,
    private uploadFromCRMService: UploadFromCRMService,
    private propertyService: PropertiesService,
    private companyService: CompanyService,
    private preventButtonService: PreventButtonService
  ) {
    this.currentCompanyCRMSystemName$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((crmName) => {
        if (crmName) {
          const item = {
            text: `Upload from ${CRM_CHECK[crmName]}`,
            action: AttachAction.CRM,
            disabled: false
          };
          const crmOption = this.attachOption.findIndex(
            (option) => option.action === AttachAction.CRM
          );
          if (crmOption === -1) {
            this.attachOption.splice(1, 0, item);
          }
        }
      });
  }

  get sendMsgPopupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get value() {
    return this._value;
  }

  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  set value(val: string) {
    this._value = val;
    this.checkToDisableSendBtn();
    this.onChange(this._value);
    this.onTouched();
    this.getRawText();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: string): void {
    this.value = value;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  ngOnInit(): void {
    const formDefaultValue = {
      selectedSender: null,
      msgTitle: '',
      selectedReceivers: [],
      listOfFiles: [],
      attachMediaFiles: [],
      selectedContactCard: []
    };
    this.trudiSendMsgFormService.buildForm(formDefaultValue);
    this.isConsole = this.sharedService.isConsoleUsers();
    this.subscribeDragDropFile();
    this.getDataFromOtherService();
    this.getListOfAgent();
    this.subscribeFileService();
    this.subscribeGetCurrentProperty();
    this.getRawText();
    this.tinyEditorFileControlService.invalidFile$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ unSupportFile, overFileSize }) => {
        this.unSupportFile = unSupportFile;
        this.overFileSize = overFileSize;
        this.checkToDisableSendBtn();
      });
  }

  ngAfterViewInit() {
    this.mention.setEditorInstance(this.tinyEditor.editor);
  }

  subscribeGetCurrentProperty() {
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
        } else {
          this.currentProperty = null;
        }
      });
  }

  getDataFromOtherService() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((company) => {
        const isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.setAttachmentOptions(isRmEnvironment);
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((task) => (this.currentTask = task));

    this.trudiAddContactCardService.selectedContactCard$
      .pipe(
        takeUntil(this.unsubscribe$),
        map((cards) =>
          cards?.filter(
            (card) => card?.openFrom === EContactCardOpenFrom.INTERNAL_NOTE
          )
        )
      )
      .subscribe((cards) => {
        this.selectedContactCard = cards ?? [];
      });
  }

  subscribeDragDropFile() {
    this.filesService.dragDropFile
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe$))
      .subscribe((value) => {
        if (value) {
          this.onFocus(true);
          this.onDrop(value, true);
        }
      });
  }

  async handleUploadFile() {
    try {
      this.isUploadingAttachment = true;
      const listFileCanUpload = this.listOfFiles.filter(
        (file) => file.canUpload
      );
      const infoFileAfterUpload = await this.sendMessageService.uploadFileS3(
        listFileCanUpload
      );
      this.listFileUpload = infoFileAfterUpload;
      const listFileUpdated = this.listOfFiles.map((file) => {
        const fileAfterUpload = infoFileAfterUpload.find(
          (f) => f.localId === (file.localId || file[0]?.localId)
        );
        if (fileAfterUpload) {
          file.canUpload = true;
          file.uploaded = true;
          file?.[0] && (file[0].mediaLink = fileAfterUpload?.mediaLink);
          return file;
        }
        return file;
      });
      this.listOfFiles = listFileUpdated;
      this.checkToDisableSendBtn();
      this.isUploadingAttachment = false;
    } catch (error) {}
  }

  handleAddFile(files: IFile[]) {
    this.overFileSize = false;
    this.unSupportFile = false;
    this.isUploadingAttachment = false;
    let listFiles = [];
    for (let i = 0; i < files.length; i++) {
      const fileCheck = files[i][0];
      const validFileType = validateFileExtension(fileCheck, FILE_VALID_TYPE);
      const isOverFileSize =
        (fileCheck?.size || fileCheck?.fileSize) / 1024 ** 2 > MAX_FILE_SIZE;
      if (!validFileType && !files[i]?.mediaLink) {
        this.unSupportFile = true;
      } else if (isOverFileSize) {
        this.overFileSize = true;
      }
      if (!files[i]?.mediaLink && !fileCheck?.mediaLink) {
        files[i][0].localId = uuid4();
        listFiles.push({
          ...files[i],
          uploaded: false,
          canUpload: !isOverFileSize && validFileType
        });
      } else {
        listFiles.push({
          ...files[i],
          localId: uuid4(),
          uploaded: true,
          canUpload: true
        });
      }
    }
    this.listOfFiles = listFiles;
    this.handleUploadFile();
  }

  subscribeFileService() {
    this.tinyEditorFileControlService.getListFileType(this.fileTypes);
    let fileLenBefore = 0;
    combineLatest([
      this.tinyEditorFileControlService.listOfFiles$,
      this.tinyEditorFileControlService.showPopupInvalidFile$
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([listOfFiles, showPopupInvalidFile]) => {
        this.handleAddFile(listOfFiles);

        if (fileLenBefore === listOfFiles.length && showPopupInvalidFile) {
          this.setPopupState(ENotePopup.INVALID_FILE);
        }
        fileLenBefore = listOfFiles.length;
        this.checkToDisableSendBtn();
      });
  }

  getListOfAgent() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(() => this.userService.getListAgentPopup('', true))
      )
      .subscribe((allPM) => {
        this.listAgent = allPM
          .filter((agent) => agent.inviteStatus === InviteStatus.ACTIVE)
          .map((agent) => ({
            ...agent,
            fullName: this.sharedService.displayName(
              agent.firstName,
              agent.lastName
            )
          }));
        this.mentionList = this.listAgent.map((agent) => ({
          label: agent?.fullName,
          value: this.getMentionValue(agent),
          avatar: agent?.googleAvatar,
          item: agent
        }));
      });
  }

  setAttachmentOptions(isRM: boolean) {
    this.attachOption = this.attachOption.filter(
      (option) => option.action !== AttachAction.REIForm || !isRM
    );

    this.listToolbarButton.find(
      (btn) => btn.action === ENoteToolbarAction.ATTACH
    ).popup.popupList = this.attachOption;
  }

  formatBeforeEmitValue(value: string, isPaste: boolean = false) {
    if (value && !value.startsWith('<p')) {
      value = '<p>' + value + '</p>';
    }
    value = value?.replace(
      /<(p|li)(\s+[^>]*)?>(.*?)<\/(p|li)>/g,
      (match, content) => this.addAnchorTagToLink(match, content)
    );

    if (!isPaste) {
      value = value?.replace(/"/g, "'");
      value = value?.replace(/<br>/g, '<br/>');
      value = value?.replace(/\n/gm, '');
    }

    return value;
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

  getRawText() {
    this.rawText = this.value
      ? this.tinyEditor?.editor?.getContent({ format: 'text' }) || ''
      : '';
    if (
      !this.rawText &&
      this.tinyEditor?.editor?.getContent().includes('<img')
    ) {
      this.rawText = '<image>';
    }
    this.remainingCharacter = MAX_TEXT_MESS_LENGTH - this.rawText.length;
    this.rawText = this.rawText.replace(/<image>/g, '');
  }

  onResize(e) {
    this.mention.stopSearch();
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
    const chatNoteHeight =
      document.querySelector('chat-note').parentElement.clientHeight;
    const headerConversationHeight =
      document.querySelector('header-left')?.clientHeight;

    const maxHeight =
      bodyHeight -
      headerConversationHeight -
      146 -
      (chatNoteHeight - parentEditorElm.clientHeight);

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

  handleClickOutsideMention() {
    if (this.isMentionBtnClicked) {
      this.isMentionBtnClicked = false;
      return;
    }
    this.mention.stopSearch();
  }

  handleToolbarAction(btn: INoteToolbarBtn) {
    switch (btn.action) {
      case ENoteToolbarAction.MENTION:
        this.isMentionBtnClicked = true;
        if (btn.selected) {
          btn.selected = false;
          this.mention.stopSearch();
          return;
        }
        this.onFocus(true);
        const keyPressEvent = new KeyboardEvent('keydown', {
          key: '@',
          keyCode: 50,
          which: 50
        });
        const frame = <any>(
          window.frames[this.tinyEditor.editor.iframeElement.id]
        );
        const contentEditable = frame.contentDocument.getElementById('tinymce');
        this._zone.run(() => {
          this.mention.keyHandler(keyPressEvent, contentEditable);
        });
        this.tinyEditor.editor.insertContent('@');
        btn.selected = true;
        break;
      default:
        break;
    }
  }

  handleAttachAction(action: AttachAction) {
    switch (action) {
      case AttachAction.Computer:
        this.handleAddFileComputer();
        break;
      case AttachAction.CRM:
        this.handleAddFileFromCrm();
        break;
      case AttachAction.REIForm:
        this.handleAddREIForm();
        break;
      case AttachAction.ContactCard:
        this.handleAddContactCards();
        break;
    }
  }

  handleAddFileComputer() {
    const button = document.querySelector(
      `#upload-internal-note-${this.noteId}`
    ) as HTMLDivElement;
    button?.click();
  }

  shouldHandleProcess(buttonKey): boolean {
    return this.preventButtonService.shouldHandleProcess(
      buttonKey,
      EButtonType.TASK
    );
  }

  handleAddFileFromCrm() {
    if (!this.shouldHandleProcess(EButtonTask.ADD_FILE_FROM_CRM)) return;
    this.uploadFromCRMService.setSelectedProperty(this.currentProperty);
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRMOutside: true,
      handleCallback: (files) => {
        const newFileList = [...this.listOfFiles, ...files];
        this.tinyEditorFileControlService.setListOfFiles(newFileList);
        if (newFileList.length > 0) this.onFocus(true);
      }
    });
  }

  handleAddContactCards() {
    if (!this.shouldHandleProcess(EButtonTask.ADD_CONTACT_CARD)) return;
    this.trudiSendMsgFormService.setSelectedContactCard([]);
    if (this.selectedContactCard?.length === 0)
      this.trudiAddContactCardService.resetSelectedContactCard();
    let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
    if (this.selectedContactCard.length > 0) {
      this.trudiSendMsgUserService
        .getListUserApi({
          limit: this.selectedContactCard.length,
          page: 1,
          search: '',
          email_null: true,
          isContactCard: true,
          userDetails: this.selectedContactCard.map((user) => ({
            id: user.id,
            propertyId: user.propertyId
          }))
        } as GetListUserPayload)
        .pipe(map((rs) => (rs ? (rs as GetListUserResponse).users : [])))
        .subscribe((rs: ISelectedReceivers[]) => {
          const values = rs
            .filter((receiver) => {
              return this.selectedContactCard.some((contactCard) =>
                isCheckedReceiversInList(receiver, contactCard, 'id')
              );
            })
            .map((receiver) => ({
              ...receiver,
              openFrom: EContactCardOpenFrom.INTERNAL_NOTE
            }));
          values?.length > 0 &&
            this.trudiSendMsgFormService.sendMsgForm
              .get('selectedContactCard')
              ?.setValue(values);
          this.trudiAddContactCardService.setSelectedContactCard(values);
        });
    }
    this.setPopupState(ENotePopup.ADD_CONTACT_CARD);
  }

  handleAddREIForm() {
    if (!this.shouldHandleProcess(EButtonTask.ADD_REI_FORM)) return;
    this.trudiSendMsgService.setPopupState({
      addReiFormOutside: true,
      selectDocument: true,
      handleCallback: (files) => {
        const newFileList = [...this.listOfFiles, ...files];
        this.tinyEditorFileControlService.setListOfFiles(newFileList);
        if (newFileList.length > 0) this.onFocus(true);
      }
    });
  }

  onCloseUploadFromCRM() {
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRMOutside: false
    });
  }

  onTriggerAddFilesFromCrm() {
    if (this.uploadFromCRMService.getPopupState().uploadFileFromCRMOutside) {
      if (this.selectedFilesFromCMS)
        this.uploadFromCRMService
          .getPopupState()
          .handleCallback([...this.selectedFilesFromCMS]);

      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRMOutside: false,
        handleCallback: null
      });
    }
  }

  onTriggerAddContactCard() {
    this.onFocus(true);
    this.setPopupState(null);
    this.checkToDisableSendBtn();
  }

  fileBrowseHandler(event) {
    this.tinyEditorFileControlService.fileBrowseHandler(event);
  }

  async uploadImage(file) {
    const uuid = uuid4();
    let content = '';
    const templateLoading = `<img id="${uuid}" class="image-loading" src="/assets/images/loading-iframe.gif">`;
    this.tinyEditor.editor.insertContent(`<p>${templateLoading}</p><p></p>`);
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
        ?.replace(`<p>${templateLoading}</p>`, '');
    }
    const tinyBookmark = this.tinyEditor.editor.selection.getBookmark(2);
    this.tinyEditor.editor.setContent(content);
    this.value = content;
    this.tinyEditor.editor.selection.moveToBookmark(tinyBookmark);
    this.getRawText();
  }

  uploadFile(files) {
    let otherFiles = [];
    const filesValid =
      this.tinyEditorFileControlService.handleCheckValidateFilesDrop(files);
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
    if (otherFiles.length)
      this.tinyEditorFileControlService.previewFileAttachment(otherFiles);
  }

  getMentionValue(agent: Agent) {
    return `<strong data-user-id="${agent?.id}" contenteditable="false">${this.mentionConfig.triggerChar}${agent?.fullName}</strong> `;
  }

  setToolbarSelected(action: ENoteToolbarAction, value: boolean) {
    this.listToolbarButton.find((btn) => btn.action === action).selected =
      value;
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFocus(focus: boolean, $event: Event = null) {
    if ($event) {
      $event?.stopPropagation && $event.stopPropagation();
      focus && this.tinyEditor.editor.focus();
    }

    this.triggerEventFocus.emit(this.value);
    this.noteFocus = focus;
  }

  setCursorToLast() {
    if (this.tinyEditor && this.tinyEditor.editor) {
      const editor = this.tinyEditor.editor;
      editor.focus();
      editor.selection.select(editor.getBody(), true);
      editor.selection.collapse(false);
    }
  }

  onClick(event) {
    // manually trigger click event for other components to handle click outside
    if (this.chatNoteContainer && this.chatNoteContainer.nativeElement) {
      this.chatNoteContainer.nativeElement.click();
    }
  }

  async onPaste({ event, editor }) {
    const clipboardData =
      event?.clipboardData || (window as any)?.clipboardData;
    const files = [...clipboardData?.files];
    if (files.length) {
      this.uploadFile(files);
    }
    let pastedData = clipboardData?.getData('text');

    if (pastedData?.length > this.remainingCharacter) {
      event.preventDefault();
      event.stopPropagation();
      const cursoPos = editor.selection?.getRng()?.startOffset;
      pastedData =
        this.remainingCharacter > 0
          ? pastedData.substring(0, this.remainingCharacter)
          : '';
      this.value =
        (this.value?.slice(0, cursoPos) ?? '') +
        pastedData +
        (this.value?.slice(cursoPos) ?? '');
    }
    this.checkToDisableSendBtn();
  }

  async onDrop(event, isAttachment: boolean = false) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
      const files = [...(event as any).dataTransfer.files];
      if (files?.length < 1) return;
      if (isAttachment) {
        this.tinyEditorFileControlService.previewFileAttachment(files);
      } else {
        this.uploadFile(files);
      }
    } else {
      if (
        this.tinyEditorFileControlService.isImage([
          event.previousContainer.data[event.previousIndex]
        ])
      ) {
        event.previousContainer.data[event.previousIndex].localThumb =
          event.previousContainer.data[event.previousIndex].mediaLink;
      }

      if (
        this.tinyEditorFileControlService.isVideo([
          event.previousContainer.data[event.previousIndex]
        ])
      ) {
        event.previousContainer.data[event.previousIndex].localThumb =
          event.previousContainer.data[event.previousIndex].thumbMediaLink ||
          'assets/images/icons/video.svg';
      }

      this.tinyEditorFileControlService.prepareFilesList([
        event.previousContainer.data[event.previousIndex]
      ]);
      this.tinyEditorFileControlService.handleOnSubmitUploadAttachments();
    }
    this.checkToDisableSendBtn();
  }

  onKeyDown(event) {
    const isAlphabet = /^[a-zA-Z]$/.test(event?.key);
    const isNumber = /^[0-9]$/.test(event?.key);
    const isSymbol = /^[^a-zA-Z0-9]$/.test(event?.key);
    const functionKey = [
      event.ctrlKey && event.key === 'x',
      event.ctrlKey && event.key === 'c',
      event.ctrlKey && event.key === 'f',
      event.metaKey && event.key === 'x',
      event.metaKey && event.key === 'c',
      event.metaKey && event.key === 'f'
    ].some((key) => key);

    if (
      this.rawText.trim().length >= MAX_TEXT_MESS_LENGTH &&
      (isAlphabet || isNumber || isSymbol) &&
      !functionKey
    ) {
      event?.preventDefault();
      event?.stopPropagation();
    }
  }

  onBlur(event) {
    this.noteFocus = false;
    this.triggerEventBlur.emit(this.value);
  }

  setPopupState(state: ENotePopup | null) {
    this.popupState = state;
  }

  checkToDisableSendBtn() {
    const haveAttach =
      this.listOfFiles.length || this.selectedContactCard.length;
    const noValue = !this.value || validateWhiteSpaceHtml(this.value);
    const isHasFileUploading = this.listOfFiles.some(
      (file) => !file.uploaded && file.canUpload
    );
    this.disabledSendBtn =
      (!haveAttach && noValue) ||
      this.unSupportFile ||
      this.overFileSize ||
      isHasFileUploading;
  }

  getMentionUsers(value: string) {
    let mentionUsers = [];

    if (value) {
      const pattern =
        /<strong contenteditable="false" data-user-id="([^"]+)">@([^<]+)<\/strong>/g;

      let match;
      while ((match = pattern.exec(value)) !== null) {
        const userId = match[1];
        const username = match[2];
        const notDuplicate = mentionUsers.every((user) => user.id !== userId);
        notDuplicate &&
          mentionUsers.push({
            id: userId,
            name: username.trim(),
            notInMailbox: this.listAgent.find((agent) => agent.id === userId)
              .notInMailbox
          });
      }
    }

    return mentionUsers;
  }

  replaceInternalNoteValue(value: string, mentionUsers = []) {
    mentionUsers?.forEach((user) => {
      const pattern = new RegExp(`>@${user?.name || ''} <`, 'g');
      if (pattern) {
        value = value.replace(pattern, `>@<${user?.id || ''}> <`);
      }
    });

    value = replaceImageLoading(value);
    value = this.formatBeforeEmitValue(value)
      .replace(/(<p>(?:&nbsp;\s*)+<\/p>)+$/, '')
      .replace(/(&nbsp; )+/, '');

    return value;
  }

  async getPayload() {
    const mentionUsers = this.getMentionUsers(this.value);
    const data = {
      text: this.value
        ? this.replaceInternalNoteValue(this.value, mentionUsers)
        : '',
      files: this.listFileUpload,
      contactCards: this.selectedContactCard.map((card) => ({
        ...card,
        address: card.streetLine
      })),
      mentionUserIds: mentionUsers.map((user) => user.id),
      taskId: this.currentTask?.id
    };
    return data;
  }

  getNewAssignedUsers() {
    const mentionUsers = this.getMentionUsers(this.value);
    const newAssignedUsers = mentionUsers
      .filter(
        (user) =>
          !this.currentTask?.assignToAgents?.some(
            (agent) => agent.id === user.id
          ) && !user.notInMailbox
      )
      .map((user) => user.name);
    let newAssignedUsersName: string = '';
    if (newAssignedUsers.length) {
      const name = newAssignedUsers.join(', ');
      newAssignedUsersName =
        name +
        (newAssignedUsers.length === 1 ? ' has been ' : ' have been ') +
        'assigned to this task.';
    }
    return newAssignedUsersName;
  }

  async sendNote() {
    if (this.disabledSendBtn || this.isConsole || this.isUploadingAttachment)
      return;
    const newAssignedUsersName = this.getNewAssignedUsers();
    const data = await this.getPayload();

    this.internalNoteApiService.sendInternalNote(data).subscribe((data) => {
      if (newAssignedUsersName) {
        this.toastrService.info(newAssignedUsersName);
      }
    });
    this.resetAllValue();
  }

  resetAllValue() {
    this.value = '';
    this.tinyEditorFileControlService.resetAllValue();
    const input = document.querySelector(
      `#upload-internal-note-${this.noteId}`
    ) as HTMLInputElement;
    input.value = null;
    this.tinyEditorFileControlService.setListOfFiles([]);
    this.trudiSendMsgFormService.sendMsgForm
      .get('selectedContactCard')
      .reset([]);
    this.trudiAddContactCardService.setSelectedContactCard([]);
  }

  ngOnDestroy(): void {
    this.windowHandlerClick();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
