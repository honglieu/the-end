import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { AgencyService } from '@services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { PopupService } from '@services/popup.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { EMessageType } from '@shared/enum/index.enum';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import SwiperCore, {
  FreeMode,
  Navigation,
  SwiperOptions,
  Thumbs,
  Mousewheel,
  Swiper
} from 'swiper';
import { FilesService } from '@services/files.service';
import { FileCarousel } from '@shared/types/file.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EFileExtension } from '@shared/enum/extensionFile.enum';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { CompanyService } from '@services/company.service';
import { SwiperComponent } from 'swiper/angular';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
SwiperCore.use([FreeMode, Navigation, Thumbs, Mousewheel]);

@Component({
  selector: 'app-images-carousel',
  templateUrl: './images-carousel.component.html',
  styleUrls: ['./images-carousel.component.scss']
})
export default class ImagesCarouselComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() imageUrlList: FileCarousel[] = [];
  @Input() initialIndex: number;
  @Input() open = false;
  @Input() isSyncing: boolean;
  @Input() isInternalNote: boolean = false;
  @Input() hideSendButton: boolean = false;
  @Input() hideSyncButton: boolean = false;
  @Output() showCarousel = new EventEmitter<boolean>();
  @Output() showSelectPeoplePopup = new EventEmitter<boolean>();
  @Output() fileEmit = new EventEmitter<any>();
  @Output() updateThumbnail = new EventEmitter<Array<FileCarousel>>();
  private unsubscribe = new Subject<void>();
  public selectedFileToEdit: any;
  public popupModalPosition = ModalPopupPosition;
  public fileIdDropdown: string;
  public conversationId: string = '';
  public listofConversationFiles: Array<any> = [];
  public fileSelected: any;
  public arrayImageCarousel: FileCarousel[] = [];
  public isDisconnected: boolean = false;
  public isConsole: boolean;
  public dataLoaded: boolean = false;
  public readonly EFileExtension = EFileExtension;
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;

  thumbsSwiper: Swiper;
  showingItemIndex = 0;
  swiperConfig: SwiperOptions = {
    navigation: true,
    lazy: {
      loadPrevNext: true
    }
  };
  public currentCompanyName: ECRMSystem;
  constructor(
    public fileService: FilesService,
    private agencyService: AgencyService,
    private popupService: PopupService,
    private activatedRoute: ActivatedRoute,
    public conversationService: ConversationService,
    public agentUserService: AgentUserService,
    public userService: UserService,
    public dropService: DragDropFilesService,
    public taskService: TaskService,
    public filesService: FilesService,
    public agencyDashboardService: AgencyDashboardService,
    private inboxService: InboxService,
    private internalNoteApiService: InternalNoteApiService,
    private websocketService: RxWebsocketService,
    private sharedService: SharedService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private readonly voicemailInboxService: VoiceMailService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (Array.isArray(changes['imageUrlList']?.currentValue)) {
      this.setFileType();
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.getFileByConversation();

    this.popupService.isResetFile$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          this.isSyncing = false;
          this.cdr.detectChanges();
        }
      });

    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentCompanyName = res;
        }
      });

    this.fileService.getSyncedWidget
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((idSelected) => {
        const isSelected = this.imageUrlList?.find(
          (item) => item?.propertyDocumentId === idSelected
        );
        if (isSelected) {
          this.isSyncing = true;
        }
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.getThumbnailDocument();
    this._subscriberSocketSyncDocument();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      this.closeCarousel();
    } else if (event.key === 'ArrowRight' || event.keyCode === 39) {
      this.swiper.swiperRef.slideNext(100);
    } else if (event.key === 'ArrowLeft' || event.keyCode === 37) {
      this.swiper.swiperRef.slidePrev(100);
    }
  }

  getFileByConversation() {
    this.activatedRoute.queryParamMap
      .pipe(
        takeUntil(this.unsubscribe),
        map((queryParam) => queryParam?.get('conversationId')),
        filter(Boolean),
        switchMap((conversationId) => {
          this.conversationId = conversationId;
          return this.fileService.getListFileConversation(conversationId);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.listofConversationFiles = res;
        this.mapFileProperites();
      });
  }

  mapFileProperites() {
    this.mapFileTypeDot();
  }

  mapFileTypeDot() {
    this.listofConversationFiles = this.listofConversationFiles?.map((item) => {
      item.fileTypeDot = this.fileService.getFileTypeDot(item.name);
      item.thumbnail = this.fileService.getThumbnail(item);
      return item;
    });
  }

  handleSwipe(e) {
    this.showingItemIndex = e.activeIndex;
    this.stopPlayback(e.slides, e.previousIndex);
  }

  stopPlayback(slides: HTMLElement[], previousIndex: number): void {
    const previousSlide = slides?.[previousIndex];

    // Stop playback if the previous slide exists and contains audio or video
    if (previousSlide) {
      const mediaElement = previousSlide.querySelector<
        HTMLAudioElement | HTMLVideoElement
      >('audio, video');
      mediaElement?.pause();
    }
  }

  handleClickThumbnail(event: Event, currentThumbIndex: number) {
    // some time swipe not working, so we need to check if current thumb index is not equal to showing item index
    if (event && currentThumbIndex != this.showingItemIndex) {
      this.swiper?.swiperRef?.slideTo(currentThumbIndex);
    }
  }

  closeCarousel() {
    this.showCarousel.emit(false);
  }
  closeCarouselOutsideFile(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    const wrapperClass = 'close-carousel';
    if (clickedElement?.className?.toLowerCase()?.includes(wrapperClass)) {
      this.showCarousel.emit(false);
    }
  }
  setFileType() {
    this.imageUrlList.forEach((item) => {
      if (!item.fileTypeName && !item.fileTypeDot) {
        return item;
      }
      item.fileType = item?.fileTypeName
        ? this.fileService.getFileTypeSlash(item.fileTypeName)
        : this.fileService.getFileTypeDot(item?.fileName || item?.name);

      item.extension = this.fileService.getFileExtensionWithoutDot(
        item.fileName || item.name
      );
      return item;
    });
  }
  onSendFile(file) {
    this.popupService.isResetFile$.next(false);
    // if (this.taskService.checkIfCurrentTaskDeleted()) return;
    this.fileSelected = file;
    // this.selectedFiles.push(file);
    const {
      createdAt,
      fileType,
      fileTypeName,
      mediaLink,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline
    } = file;
    const item = {
      createdAt,
      fileType: fileTypeName || fileType,
      icon: fileType.icon,
      id: file?.propertyDocumentId,
      mediaLink,
      name: file?.fileName || file?.name,
      size,
      thumbMediaLink,
      isForward: true,
      propertyId,
      isTemporaryProperty,
      propertyStreetline
    };
    this.fileEmit.emit({ file: item, messageType: EMessageType.file });
    this.showSelectPeoplePopup.emit(true);
  }

  handleSync(file) {
    if (this.isInternalNote) {
      this._syncDocumentInternalNote(file);
    } else {
      const payload = {
        conversationId: !file.isUserUpload ? this.conversationId : null,
        propertyDocumentId: file.propertyDocumentId,
        agencyId:
          this.taskService.currentTask$?.getValue()?.agencyId ||
          this.voicemailInboxService.currentVoicemailTaskValue$?.agencyId,
        taskId:
          this.taskService.currentTask$?.getValue()?.id ||
          this.voicemailInboxService.currentVoicemailTaskValue$?.id
      };
      if (this.currentCompanyName === ECRMSystem.PROPERTY_TREE) {
        this.filesService
          .syncToPropertyTree(payload)
          .pipe(
            switchMap((res) => {
              if (res) {
                this.fileService.setSyncedWidget(file.propertyDocumentId);
                this.isSyncing = true;
                this.cdr.detectChanges();
              }
              return of({});
            })
          )
          .subscribe();
      } else {
        this.filesService
          .syncToRentManager(payload)
          .pipe(
            switchMap((res) => {
              if (res) {
                this.fileService.setSyncedWidget(file.propertyDocumentId);
                this.isSyncing = true;
                this.cdr.detectChanges();
              }
              return of({});
            })
          )
          .subscribe();
      }
    }
  }

  private _subscriberSocketSyncDocument() {
    this.websocketService.onSocketNotifySyncPropertyDocumentToPT
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.isSyncing = false;
        this.cdr.markForCheck();
      });
  }

  private _syncDocumentInternalNote(file) {
    this.isSyncing = true;
    const payload = this._getPayloadToSyncDocument(file);
    this.internalNoteApiService.syncDocumentInternalNote(payload).subscribe();
  }

  private _getPayloadToSyncDocument(file) {
    const taskId =
      this.taskService.currentTask$.getValue()?.id ||
      this.voicemailInboxService.currentVoicemailTaskValue$?.id;
    const agencyId =
      this.taskService.currentTask$.getValue()?.agencyId ||
      this.voicemailInboxService.currentVoicemailTaskValue$?.agencyId;
    return {
      taskId,
      syncDocumentInput: {
        internalFileId: file.id,
        agencyId,
        syncPTType: 'Property'
      }
    };
  }

  onDocumentLoad() {
    this.dataLoaded = true;
  }

  getPayLoadThumbnail() {
    return this.imageUrlList
      .filter((item) => !item.thumbMediaLink || !item.mediaLink)
      .map((i) => ({
        propertyDocumentId: i.propertyDocumentId || null,
        mediaLink: i.propertyDocumentId
          ? null
          : { link: i.mediaLink, type: i.fileTypeName || null },
        thumbMediaLink: i.thumbMediaLink || null
      }))
      .filter((item) => item.propertyDocumentId || item.mediaLink);
  }

  getThumbnailDocument() {
    const payLoad = this.getPayLoadThumbnail();
    if (!payLoad.length || this.isInternalNote) return;

    this.imageUrlList = this.imageUrlList.map((img) => ({
      ...img,
      thumbMediaLink:
        !img?.thumbMediaLink && img?.extension === EFileExtension.PDF
          ? 'assets/icon/thumbnail-loading.svg'
          : img?.thumbMediaLink
    }));

    const propertyDocumentIds = payLoad
      .filter((item) => item.propertyDocumentId)
      .map((item) => item.propertyDocumentId);

    const mediaLinks = payLoad
      .filter((item) => item.mediaLink && !item.thumbMediaLink)
      .map((item) => item.mediaLink);

    this.fileService
      .getThumbnailDocument(propertyDocumentIds, mediaLinks)
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        res.forEach((element) => {
          const index = this.imageUrlList.findIndex(
            (i) =>
              (element?.id && i.propertyDocumentId === element.id) ||
              (!i.propertyDocumentId && i.mediaLink === element.mediaLink)
          );
          if (index >= 0 && element.thumbMediaLink) {
            this.imageUrlList[index].thumbMediaLink = element.thumbMediaLink;
          }
        });
        this.updateThumbnail.emit(this.imageUrlList);
      });
  }

  onSwiperThumbInit(swiperInstance: Swiper) {
    this.thumbsSwiper = swiperInstance;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
