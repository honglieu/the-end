import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService, TaskService } from '@/app/services';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@/app/services/constants';
import { UserService } from '@/app/services/user.service';
import { SyncPropertyDocumentStatus } from '@/app/shared';
import { Agent, InviteStatus } from '@/app/shared/types/agent.interface';
import { CommentsAttachmentStore } from '@/app/task-detail/modules/steps/services/comments-attachment-store.service';
import { CommentsAttachmentService } from '@/app/task-detail/modules/steps/services/comments-attachment.service';
import { CommentsEditorService } from '@/app/task-detail/modules/steps/services/comments-editor.service';
import {
  CommentsStore,
  IContextData
} from '@/app/task-detail/modules/steps/services/comments-store.service';
import { UnSupportEmojiIds } from '@/app/task-detail/modules/steps/utils/comment.enum';
import {
  IComment,
  ICommentRequest,
  IFileComment,
  IMention
} from '@/app/task-detail/modules/steps/utils/comment.interface';
import {
  blobUrlToFile,
  base64ToFile,
  createFileListFromFiles,
  decodeHTMLEntities
} from '@/app/task-detail/modules/steps/utils/functions';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { EventObj } from '@tinymce/tinymce-angular/editor/Events';
import { differenceWith, isEqual } from 'lodash-es';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { combineLatest, map, Subject, switchMap, takeUntil } from 'rxjs';
import { Editor, RawEditorOptions } from 'tinymce';

const MAX_CHARACTERS = 2000;
const ALLOWED_KEY_CODES = [
  'backspace',
  'enter',
  'delete',
  'arrowleft',
  'arrowup',
  'arrowright',
  'arrowdown'
];
const REMOVE_HTML_TAGS_REGEX = /<\/?[^>]+(>|$)/g;
const REMOVE_HTML_lEADING = /^((<br\s*\/?>\s*)+)|(<p>\s*(<br\s*\/?>\s*)+)/i;
const REMOVE_HTML_TRAILING = /((<br\s*\/?>\s*)+<\/p>)$/i;

@Component({
  selector: 'comments-editor',
  templateUrl: './comments-editor.component.html',
  styleUrl: './comments-editor.component.scss'
})
export class CommentsEditorComponent implements OnInit, OnDestroy {
  // dependencies
  private fb = inject(FormBuilder);
  private inboxService = inject(InboxService);
  private userService = inject(UserService);
  private commentsEditorService = inject(CommentsEditorService);
  private commentsStore = inject(CommentsStore);
  private commentsAttachmentService = inject(CommentsAttachmentService);
  private taskService = inject(TaskService);
  private commentsAttachmentStoreService = inject(CommentsAttachmentStore);
  private sharedService = inject(SharedService);

  // inputs
  @Input() action: 'edit' | 'create' = 'create';
  @Input() commented: IComment;

  // outputs
  @Output() triggerEventEscape = new EventEmitter();

  // tiny init config
  readonly initConfig: RawEditorOptions = {
    ...this.commentsEditorService.getBasicConfig('.emoji-btn,.attach-btn'),
    setup: (editor: Editor) => {
      editor.ui.registry.addAutocompleter('trudi-mentions', {
        trigger: '@',
        minChars: 0,
        columns: 1,
        maxResults: 6,
        highlightOn: ['char_name'],
        fetch: (pattern) => {
          return new Promise((resolve) => {
            const suggestions = this.commentsEditorService.filterSuggestions(
              this.mentionsSuggestions,
              pattern,
              [...new Set(this.selectedMentions)]
            );
            this.isMentionActive = !!suggestions.length;
            resolve(suggestions as any);
          });
        },
        onAction: (autocompleteApi, rng, value) => {
          const parseValue: { userId: string; name: string } =
            JSON.parse(value);

          const mentioned =
            this.commentsEditorService.createMention(parseValue);

          editor.selection.setRng(rng);
          editor.insertContent(mentioned);

          this.selectedMentions.push(parseValue.userId);
          autocompleteApi.hide();
        }
      });
      editor.on('init', () => {
        this.moveAuxElement();
        this.handleEditAction(editor);
      });
      editor.on('keydown', (event) => {
        const count = editor.getContent({ format: 'text' }).length;
        const key = event.key;
        if (ALLOWED_KEY_CODES.indexOf(key.toLowerCase()) !== -1) {
          return;
        }
        if (count >= MAX_CHARACTERS) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      editor.on('PastePreProcess', () => {
        const id = setTimeout(() => {
          this.limitPasteContent(editor);
          this.extractImagesFromPastedContent(editor);
        }, 0);
        this.timeoutIds.push(id);
      });
      editor.on('AutocompleterStart', () => {
        this.isMentionActive = true;
        this.emojiPopover.hide();
      });
      editor.on('AutocompleterEnd', () => {
        this.isMentionActive = false;
      });
      editor.on('remove', () => {
        if (this.commentInputWrapperElRef?.nativeElement) {
          this.commentInputWrapperElRef.nativeElement.remove();
        }
      });
    }
  };
  mentionsSuggestions: IMention[] = [];
  selectedMentions: string[] = [];
  isFocused = false;
  isShowEmojiPicker = false;
  controlName: string = 'text';
  contextData = {} as IContextData;
  successComment: boolean = false;
  createdFiles: IFileComment[] = [];
  updatedFiles: IFileComment[] = [];
  isNewFileUploading = false;
  isUpdateFileUploading = false;
  isNewFileInvalid = false;
  isUpdateFileInvalid = false;
  isConsoleUser = false;
  originalCommentText = '';
  isOnlySpaces = true;

  /**
   * Flag to track whether the mentions autocompleter is currently active.
   * Used to prevent Enter key from submitting while selecting a mention
   */
  isMentionActive = false;

  private destroy$ = new Subject<void>();

  // view model
  vm$ = this.commentsStore.vm$;
  attachmentVm$ = this.commentsAttachmentStoreService.vm$;

  readonly ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;

  private timeoutIds: NodeJS.Timeout[] = [];

  /**
   * Flag to indicate whether an emoji is currently being inserted.
   * This is used to prevent the blur event from firing during emoji insertion.
   *
   * - Set to true just before inserting an emoji.
   * - Set back to false shortly after the insertion is complete.
   */
  private isInsertingEmoji = false;

  // access reference to element
  @ViewChild('commentInputElRef') commentInputElRef: EditorComponent;
  @ViewChild('inputSelectFileRef')
  inputSelectFileRef: ElementRef<HTMLInputElement>;
  @ViewChild('commentInputWrapperElRef')
  commentInputWrapperElRef: ElementRef<HTMLDivElement>;
  @ViewChild('emojiPopover') emojiPopover: NzPopoverDirective;

  // form controls
  commentEditorForm = this.fb.group({});

  get commentEditorControl() {
    return this.commentEditorForm.get(this.controlName);
  }

  ngOnInit(): void {
    // Add a new form control for the comment editor
    this.commentEditorForm.addControl(this.controlName, new FormControl(''));

    // Check if the user is a console user
    this.isConsoleUser = this.sharedService.isConsoleUsers();

    // If the action is 'edit', populate the form with the existing comment text
    if (this.action === 'edit') {
      this.commentEditorControl.patchValue(this.commented.text);
      this.originalCommentText = this.commented.text;
      if (this.commented.text) this.isOnlySpaces = false;
    }

    // Fetch mention suggestions for the comment editor
    this.getMentionSuggestions();

    // Subscribe to view model updates and update context data
    this.vm$.pipe(takeUntil(this.destroy$)).subscribe((vm) => {
      this.contextData = { ...vm.contextData };
    });

    // Combine latest values from new and updated file upload view models and update component state
    combineLatest({
      new: this.attachmentVm$.pipe(map((vm) => vm.newCommentFileUpload)),
      update: this.attachmentVm$.pipe(map((vm) => vm.updateCommentFileUpload))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ new: newUpload, update: updateUpload }) => {
        // Update the state for new file uploads
        this.isNewFileUploading = newUpload.isUploading;
        this.isNewFileInvalid = newUpload.isInvalidFiles;
        this.createdFiles = newUpload.files;

        // Update the state for updated file uploads
        this.isUpdateFileUploading = updateUpload.isUploading;
        this.isUpdateFileInvalid = updateUpload.isInvalidFiles;
        this.updatedFiles = updateUpload.files;
      });

    // Subscribe to changes in the comment editor control value
    this.commentEditorControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        // Check if the input value contains only spaces
        this.isOnlySpaces = this.checkIfOnlySpaces(value);
        // Clear selected mentions if the input value is empty
        if (!value) {
          this.selectedMentions = [];
          this.isOnlySpaces = true;
        }
      });
  }

  emojiFilter = (emoji) => {
    const emojiId = emoji?.unified || emoji;
    return !UnSupportEmojiIds.includes(emojiId);
  };

  removeLeadingAndTrailingBr(html: string): string {
    html = html.replace(REMOVE_HTML_lEADING, '<p>');
    html = html.replace(REMOVE_HTML_TRAILING, '</p>');
    return html;
  }

  private checkIfOnlySpaces(value: string): boolean {
    if (!value) return false;
    const text = value
      .replace(REMOVE_HTML_TAGS_REGEX, '')
      .replace(/&nbsp;/g, '')
      .trim();
    return text.length === 0;
  }

  filterActiveUsers(users: Agent[]) {
    return users.filter((user) => user.inviteStatus === InviteStatus.ACTIVE);
  }

  addFullNameToUsers(users: Agent[]) {
    return users.map((user) => ({
      ...user,
      fullName: `${user?.firstName} ${user?.lastName}`
    }));
  }

  transformUsersForDropdown(users: Agent[]): IMention[] {
    return users.map((user) => ({
      id: user.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      text: user?.fullName,
      value: JSON.stringify({ userId: user.id, name: `@${user?.fullName}` }),
      image: user?.googleAvatar
    }));
  }

  getMentionSuggestions() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        switchMap(() => this.userService.getListAgentPopup('', true)),
        map(this.filterActiveUsers),
        map(this.addFullNameToUsers),
        map(this.transformUsersForDropdown)
      )
      .subscribe((data) => (this.mentionsSuggestions = data));
  }

  handleOnKeyDown(eventObj: EventObj<KeyboardEvent>) {
    this.isShowEmojiPicker = false;
    const { event } = eventObj;
    if (event.key === 'Enter' && !event.shiftKey && !this.isMentionActive) {
      event.preventDefault();
      this.onSubmit();
    }
    if (event.key === 'Escape') this.triggerEventEscape.emit();
  }

  changeEmojiPicker(value: boolean) {
    if (!value) {
      this.isInsertingEmoji = false;
      const id = setTimeout(() => {
        this.commentInputElRef?.editor.focus();
      }, 100);
      this.timeoutIds.push(id);
    }
  }

  // add emoji into editor
  addEmoji(event) {
    const emoji = event.emoji.native;
    this.isInsertingEmoji = true;
    this.isShowEmojiPicker = false;
    this.commentInputElRef.editor.insertContent(emoji + ' ');
  }

  handleFormKeydown(event: KeyboardEvent) {
    event.preventDefault();
    this.onSubmit();
  }

  openSelectFile() {
    if (this.isConsoleUser) return;
    this.inputSelectFileRef.nativeElement.click();
  }

  handleFileSelection(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    this.commentsAttachmentService.handleFileSelection(fileList, this.action);
    if (this.action === 'edit') {
      this.commentInputElRef?.editor?.focus();
    }
  }

  handleResetFileSelected(event) {
    const input = event.target as HTMLInputElement;
    input.value = '';
  }

  focusEditor() {
    this.isFocused = true;
    this.isShowEmojiPicker = false;
  }

  blurEditor() {
    this.isFocused = false;
  }

  onSubmit(): void {
    if (
      this.isConsoleUser ||
      (this.isNewFileUploading && this.action === 'create') ||
      (this.isUpdateFileUploading && this.action === 'edit') ||
      (this.isNewFileInvalid && this.action === 'create') ||
      (this.isUpdateFileInvalid && this.action === 'edit')
    )
      return;

    if (
      this.isOnlySpaces &&
      !this.createdFiles.length &&
      !this.updatedFiles.length
    ) {
      return;
    }

    const payload = this.getPayload();

    // create comment
    if (this.action === 'create') {
      this.createComment(payload);
    }

    // update comment
    if (this.action === 'edit') {
      this.updateComment(payload);
    }
    this.isOnlySpaces = true;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnd(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isConsoleUser) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      this.commentsAttachmentService.handleFileSelection(files, this.action);
    }
  }

  ngOnDestroy(): void {
    this.timeoutIds.forEach((id) => clearTimeout(id));
    if (this.commentInputElRef) this.commentInputElRef.editor.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Move the '.tox-tinymce-aux' element into another element,
   * to prevent closing the popover when clicking on it
   * Purpose:
   *  - Prevent click events on '.tox-tinymce-aux' from propagating outward and causing unwanted popover closure.
   *  - By moving '.tox-tinymce-aux' into a different parent element,
   *    we can better control the handling of click events.
   */
  private moveAuxElement() {
    const auxElement = document.querySelector('body > .tox-tinymce-aux');
    if (auxElement) {
      const targetElement = document.querySelector('.step-details-panel');
      targetElement.appendChild(auxElement);
    }
  }

  private handleEditAction(editor: Editor) {
    if (this.action === 'edit') {
      editor.focus();
      this.moveCursorToEndline(editor);
    }
  }

  private getPayload(): ICommentRequest {
    let text = this.commentEditorForm.value[this.controlName];
    if (text) {
      text = this.removeLeadingAndTrailingBr(text)
        .replace(/&nbsp;/g, '')
        .trim();
    }
    const mentionUsers = this.extractMentionedUsers(text);
    const mentionUserIds = mentionUsers.map((user) => user.id);
    return {
      text,
      taskId: this.contextData.taskId,
      stepId: this.contextData.stepId,
      mentionUserIds
    };
  }

  private extractMentionedUsers(text: string) {
    const regex = /data-userid="([^"]*)">([^<]*)<\/strong>/g;
    const users = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      users.push({
        id: match[1],
        name: decodeHTMLEntities(match[2].replace('@', '').trim())
      });
    }

    return users;
  }

  onPaste(event) {
    event?.event.preventDefault();
    const currentContent = this.commentInputElRef.editor
      .getContent({ format: 'text' })
      .trim();
    let contentPaste = (event?.event as any).clipboardData.getData(
      'text/plain'
    );
    const combinedLength = currentContent.length + contentPaste.length;
    if (combinedLength > MAX_CHARACTERS) {
      contentPaste = contentPaste.slice(
        0,
        MAX_CHARACTERS - currentContent.length
      );
    }
    const tempElement = contentPaste?.replace(/(\r\n|\n|\r)/gm, '<br>');
    this.commentInputElRef.editor.execCommand(
      'mceInsertContent',
      false,
      tempElement
    );
  }

  private limitPasteContent(editor: Editor) {
    let content = editor.getContent({ format: 'text' });
    // remove breakline characters
    content = content.replace(/(\r\n|\n|\r)/gm, '');
    const count = content.trim().length;
    if (count > MAX_CHARACTERS) {
      editor.setContent(content.substring(0, MAX_CHARACTERS));
    }
  }

  private async extractImagesFromPastedContent(editor: Editor) {
    const content = editor.getContent();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const images = tempDiv.getElementsByTagName('img');
    const imageList = Array.from(images);
    const filesToProcess = [];

    // Collect all images and remove them from the content
    for (const image of imageList) {
      const src = image.getAttribute('src');
      if (src.startsWith('data:image')) {
        // Handle base64 url
        filesToProcess.push(base64ToFile(src));
        image.parentNode.removeChild(image);
      } else if (src.startsWith('blob:')) {
        // Handle Blob URLs
        const file = await blobUrlToFile(src);
        filesToProcess.push(file);
        image.parentNode.removeChild(image);
      } else {
        // If it's not a data URL, it might be an external image URL, so we keep it
        image.removeAttribute('width');
        image.removeAttribute('height');
        image.style.maxWidth = '100%';
      }
    }

    // Update the paste content without the images
    editor.setContent(tempDiv.innerHTML);
    this.moveCursorToEndline(editor);

    // Process collected images
    if (filesToProcess.length > 0) {
      const fileList = createFileListFromFiles(filesToProcess);
      this.commentsAttachmentService.handleFileSelection(fileList, this.action);
    }
  }

  private moveCursorToEndline(editor: Editor) {
    editor.selection.select(editor.getBody(), true);
    editor.selection.collapse(false);
  }

  private createComment(payload: ICommentRequest) {
    const payloadForCreateRequest = { ...payload };
    payloadForCreateRequest.files = [...this.createdFiles];

    const assignedMessage = this.getNewAssignedUsersMessage();

    // call api create comment
    this.commentsStore.createCommentThread({
      payload: payloadForCreateRequest,
      assignedMessage
    });

    // reset data after create comment
    this.commentsAttachmentStoreService.setNewCommentFileUpload({
      isUploading: false,
      files: [],
      isInvalidFiles: false
    });
    this.selectedMentions = [];
    this.commentEditorForm.reset();
    this.commentInputElRef.editor.fire('blur');
    this.commentsAttachmentService.resetTempCreatedFiles();
  }

  private updateComment(payload: ICommentRequest) {
    const payloadForUpdateRequest = { ...payload };

    const mapToFilesComment = () => {
      return this.updatedFiles
        .filter(
          (file) => file?.syncPTStatus !== SyncPropertyDocumentStatus.SUCCESS
        )
        .map((file) => ({
          name: file.name,
          fileName: file.name,
          mediaLink: file?.mediaLink,
          type: file.type,
          extension: file.extension,
          localId: file.localId,
          localThumb: file.localThumb,
          size: file.size
        }));
    };

    const isContentChanged = this.isContentChanged();
    const syncedFiles = this.updatedFiles.filter(
      (file) => file?.syncPTStatus === SyncPropertyDocumentStatus.SUCCESS
    );

    const reset = () => {
      this.commentsAttachmentStoreService.setUpdateCommentFileUpload({
        isUploading: false,
        files: [],
        isInvalidFiles: false
      });
      this.selectedMentions = [];
      this.commentsAttachmentService.resetTempUpdateFile();
    };

    // check if edit content changed then will call api update
    if (isContentChanged) {
      payloadForUpdateRequest.id = this.commented.id;
      payloadForUpdateRequest.files = [...syncedFiles, ...mapToFilesComment()];

      const assignedMessage = this.getNewAssignedUsersMessage();

      // call api update comment
      this.commentsStore.updateCommentThread({
        payload: payloadForUpdateRequest,
        assignedMessage
      });

      // reset data after update
      reset();
    } else {
      this.commentsStore.updateEditedCurrentCommentId(null);
      reset();
    }
  }

  private isContentChanged = (): boolean => {
    const currentText = this.commentEditorForm.get(this.controlName).value;
    if (currentText !== this.originalCommentText) return true;
    const updatedFiles = this.updatedFiles.map((item) => item.file);
    const currentUploadedFiles = this.commented.children.map(
      (item) => item.internalNoteFile
    );
    return (
      differenceWith(updatedFiles, currentUploadedFiles, isEqual).length > 0 ||
      updatedFiles.length !== currentUploadedFiles.length
    );
  };

  private getNewAssignedUsersMessage() {
    const text = this.commentEditorForm.value[this.controlName];
    const mentionUsers = this.extractMentionedUsers(text);

    const assignedUserNames = mentionUsers
      .filter((user) => this.hasNotAssignTask(user))
      .map((user) => user.name);

    if (!assignedUserNames.length) {
      return '';
    }

    const assignedUserNamesToShow = assignedUserNames.join(', ');

    const assignMessageSuffix = assignedUserNames.length === 1 ? 'is' : 'are';

    const message = `${assignedUserNamesToShow} ${assignMessageSuffix} assigned to this task.`;

    return message;
  }

  private hasNotAssignTask(user) {
    const currentTask = this.taskService.currentTask$.getValue();
    return !currentTask?.assignToAgents?.find((agent) => agent.id === user.id);
  }
}
