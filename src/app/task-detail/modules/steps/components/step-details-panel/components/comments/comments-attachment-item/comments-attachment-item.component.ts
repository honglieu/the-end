import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { RxWebsocketService } from '@/app/services';
import { FilesService } from '@/app/services/files.service';
import { ModalPopupPosition } from '@/app/shared/components/modal-popup/modal-popup';
import { FileCarousel, SyncPropertyDocumentStatus } from '@/app/shared/types';
import { CommentsApiService } from '@/app/task-detail/modules/steps/services/comments-api.service';
import { CommentsCarouselService } from '@/app/task-detail/modules/steps/services/comments-carousel.service';
import {
  CommentsStore,
  IContextData
} from '@/app/task-detail/modules/steps/services/comments-store.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  IFileComment,
  IUpdateSyncStatusPayload
} from '@/app/task-detail/modules/steps/utils/comment.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { EMPTY, filter, map, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'comments-attachment-item',
  templateUrl: './comments-attachment-item.component.html',
  styleUrl: './comments-attachment-item.component.scss'
})
export class CommentsAttachmentComponent implements OnInit, OnDestroy {
  private commentsStore = inject(CommentsStore);
  private fileService = inject(FilesService);
  private commentsApiService = inject(CommentsApiService);
  private messageFlowService = inject(MessageFlowService);
  private commentsCarouselService = inject(CommentsCarouselService);
  private websocketService = inject(RxWebsocketService);
  private stepService = inject(StepService);

  @Input() attachment: IFileComment;
  @Input() canRemove: boolean = false;
  @Input() isUploading = false;
  @Output() triggerUpdateSyncStatus =
    new EventEmitter<IUpdateSyncStatusPayload>();
  @Output() triggerRemoveFile = new EventEmitter<IFileComment>();
  private unsubscribe = new Subject<void>();
  public showRemoveAction: boolean = false;
  public isShowCarousel: boolean = false;
  public initialIndex: number = 1;
  public listImageCarousel: FileCarousel[] = [];
  public isShowImage = false;
  public imageDetailUrl = '';
  public popupModalPosition = ModalPopupPosition;
  public selectedFiles = [];
  public contentText: string = '';
  readonly ESyncStatus = SyncPropertyDocumentStatus;

  createNewConversationConfigs = {
    'header.hideSelectProperty': false,
    'header.title': '',
    'header.showDropdown': false,
    'body.prefillReceivers': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.disableSendBtn': false,
    'otherConfigs.isCreateMessageType': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER
  };
  contextData = {} as IContextData;
  vm$ = this.commentsStore.vm$;
  ngOnInit(): void {
    this.vm$.subscribe((vm) => (this.contextData = { ...vm.contextData }));
    this.subscribeSocketSyncFileToPt();
  }

  subscribeSocketSyncFileToPt() {
    this.websocketService.onSocketNotifySyncPropertyDocumentToPT
      .pipe(filter(this.filterSocketSyncToPT), takeUntil(this.unsubscribe))
      .subscribe((data) => {
        const syncPTStatus = data?.status;
        this.attachment = {
          ...this.attachment,
          syncPTStatus
        };
        this.triggerUpdateSyncStatus.emit({
          attachmentId: this.attachment?.id,
          syncPTStatus
        });
      });
  }

  filterSocketSyncToPT = (data) => {
    return this.attachment?.id === data?.propertyDocumentId;
  };

  removeMediaFiles(file) {
    this.triggerRemoveFile.emit(file);
  }

  manageCarouselState(event) {
    if (!event) {
      this.isShowCarousel = false;
      this.initialIndex = null;
      return;
    }

    this.getListFileByInternalNote();
  }

  getListFileByInternalNote() {
    this.commentsApiService
      .getListFileInternalNote(this.contextData.taskId, this.contextData.stepId)
      .pipe(
        tap((listImageCarousel) => {
          this.listImageCarousel = listImageCarousel
            .map((file) =>
              this.commentsCarouselService.mapToImageCarouselItem(file)
            )
            .filter((file) =>
              this.commentsCarouselService.filterSupportedCarouselFiles(file)
            );
          this.handleShowCarouselOrDownload();
        }),
        switchMap(() => this.getThumbnailDocument()),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  findInitialIndexOfSelected(selectedId: string) {
    return this.listImageCarousel.findIndex((item) => item.id === selectedId);
  }

  handleShowCarouselOrDownload() {
    this.initialIndex = this.findInitialIndexOfSelected(this.attachment?.id);
    if (this.initialIndex !== -1) {
      this.isShowCarousel = true;
    } else {
      this.handleDownloadFile(this.attachment?.id);
    }
  }

  handleDownloadFile(selectedId: string) {
    const fileDownload = this.listImageCarousel?.find(
      (item) => item?.propertyDocumentId === selectedId
    );
    if (!fileDownload) return;
    this.fileService.downloadResource(
      fileDownload?.mediaLink,
      fileDownload?.fileName || fileDownload?.name
    );
  }

  mapThumbnailDocument(document) {
    document.forEach((element) => {
      const index = this.listImageCarousel.findIndex(
        (i) => i.id === element.id
      );
      if (index >= 0) {
        this.listImageCarousel[index].thumbMediaLink = element.thumbMediaLink;
      }
    });
  }

  getThumbnailDocument() {
    const payLoad = this.getPayLoadThumbnail();
    if (!payLoad.length) {
      return EMPTY;
    }
    this.listImageCarousel = this.listImageCarousel.map((file) => ({
      ...file,
      thumbMediaLink: this.commentsCarouselService.getThumbnailLink(file)
    }));
    return this.commentsApiService.getThumbnailDocument(payLoad).pipe(
      filter(Boolean),
      map((document) => this.mapThumbnailDocument(document))
    );
  }

  getPayLoadThumbnail() {
    return this.listImageCarousel
      .filter((item) => !item.thumbMediaLink || !item.mediaLink)
      .map((i) => i.propertyDocumentId);
  }

  handleFileEmit(file) {
    const newFile = this.mapSelectedFileData(file);
    this.selectedFiles.push({
      ...newFile,
      isHideRemoveIcon: true
    });
    this.replaceMessageFile();
    this.isShowCarousel = false;
    this.stepService.updateShowStepDetailPanel(false);
    this.stepService.setCurrentStep(null);
    this.setStateTrudiSendMsg();
  }

  mapSelectedFileData(file) {
    const {
      createdAt,
      fileType,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    } = file;
    return {
      createdAt,
      fileType,
      icon: fileType?.icon,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    };
  }

  replaceMessageFile() {
    const fileName = this.selectedFiles[0]?.name?.split('.')[0];
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
  }
  setStateTrudiSendMsg() {
    this.messageFlowService
      .openSendMsgModal({
        ...this.createNewConversationConfigs,
        'inputs.listOfFiles': this.selectedFiles,
        'inputs.rawMsg': this.contentText,
        'inputs.isInternalNote': true
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.Quit) {
          this.onQuitMessageModal();
        }
      });
  }
  onQuitMessageModal() {
    this.selectedFiles = [];
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
