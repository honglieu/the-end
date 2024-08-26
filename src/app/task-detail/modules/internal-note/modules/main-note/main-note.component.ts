import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  map,
  mergeMap,
  of,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FileCarousel } from '@shared/types/file.interface';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { InternalNoteService } from '@/app/task-detail/modules/internal-note/services/internal-note.service';
import {
  ENoteType,
  ENoteTypePayload
} from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import {
  IInternalNote,
  IListNoteGroup
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { FilesService } from '@services/files.service';
import { ErrorService } from '@services/error.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { AgentFileProp } from '@shared/types/user-file.interface';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationExtras,
  Router
} from '@angular/router';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@services/constants';
import { EFileExtension } from '@shared/enum/extensionFile.enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { TaskType } from '@/app/shared/enum';

enum EBehaviorScroll {
  SMOOTH = 'smooth',
  AUTO = 'auto'
}

@Component({
  selector: 'main-note',
  templateUrl: './main-note.component.html',
  styleUrls: ['./main-note.component.scss']
})
export class MainNoteComponent implements OnInit, OnDestroy {
  @ViewChild('scrollDown', { static: false }) private scrollDown: ElementRef;
  @ViewChild('redLineNew', { static: false }) private redLineNew: ElementRef;
  @ViewChild('parentDropList', { static: true }) parentDropList:
    | string
    | CdkDropList
    | (string | CdkDropList);
  scrollBottomTimeOut: NodeJS.Timeout = null;
  scrollContentTimeOut: NodeJS.Timeout = null;
  public isFirstLoadScrollDownContainerEl: boolean = true;
  public isHasNewNote: boolean = false;
  public showScrollToBottomButton: boolean = false;
  public isViewMostRecent: boolean = false;
  public friendlyId = null;
  public maxFriendlyId = '';
  public currentNoteViewedId = '';
  public friendlyIdBefore = '';
  public friendlyIdAfter = '';
  public availableScrollDown = false;
  public type = '';
  public existNoteBefore = false;
  public existNoteAfter = false;
  EBehaviorScroll = EBehaviorScroll;
  private unsubscribe = new Subject<void>();
  readonly ENoteType = ENoteType;
  readonly ENoteTypePayload = ENoteTypePayload;
  public getMoreData$: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public isEditNote: boolean = false;
  public listNotesGroup: IListNoteGroup;
  public listNotes: IInternalNote[] = [];
  public isFirstLoadData = true;
  public currentCompany: ICompany;
  public crmSystemId: string = '';
  public isShowCarousel: boolean = false;
  public listImageCarousel: FileCarousel[] = [];
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
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
    'inputs.openFrom': ''
  };
  public headerTitle: string = '';
  public selectedFiles = [];
  public contentText: string = '';
  public popupModalPosition = ModalPopupPosition;
  public currentTaskId: string = '';
  public showRedLine: boolean = false;
  public minId;
  public maxId;
  public isHideRedLineNew: boolean = false;
  public taskId: string = '';
  public initialIndex: number = 1;
  public existNotePm = false;
  public isErrorMailbox = false;
  public connectedChild: string | CdkDropList | (string | CdkDropList)[];
  public isShowImage = false;
  public imageDetailUrl = '';
  public isLoading = true;
  public isFirstRender = true;

  get scrollDownContainerEl() {
    return this.scrollDown?.nativeElement;
  }
  constructor(
    private internalNoteService: InternalNoteService,
    private rxWebsocketService: RxWebsocketService,
    private internalNoteApiService: InternalNoteApiService,
    private userService: UserService,
    private taskService: TaskService,
    public loadingService: LoadingService,
    public fileService: FilesService,
    private errorService: ErrorService,
    public dropService: DragDropFilesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private companyService: CompanyService,
    private messageFlowService: MessageFlowService
  ) {}

  ngOnInit(): void {
    this.dropService.handleConnect({
      element: this.parentDropList,
      unsubscribe: this.unsubscribe,
      connectedElement: this.connectedChild,
      type: 'parent'
    });

    this.internalNoteService.isLoading.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const queryParams = this.activatedRoute.snapshot.queryParams;
        if (queryParams['reload']) {
          this.reloadComponent(res['url']);
        }
      });
    const navigationExtras: NavigationExtras = {
      queryParams: {},
      queryParamsHandling: '',
      skipLocationChange: true
    };
    this.router.navigate([], navigationExtras);

    this._subscriberNewNoteSocket();
    this._subscriberEditInternalNote();
    this._getCurrentCompany();
    this._errorMailboxLoading();
    this._getImageInNote();

    combineLatest([
      this.internalNoteService.getCurrentViewNote.pipe(
        takeUntil(this.unsubscribe),
        take(1)
      ),
      this.taskService.currentTask$.pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        debounceTime(1000),
        tap(() => {
          this.isLoading = true;
          this.loadingService.onLoading();
        })
      )
    ]).subscribe(([socket, currentTask]) => {
      if (!this.isFirstRender) {
        this.isLoading = false;
        return;
      }
      this.isFirstRender = false;
      const parts = this.router.url.split('/');
      const taskIdInURL = parts[parts.length - 2];
      this.currentTaskId = currentTask.id;
      if (this.currentTaskId !== taskIdInURL) return;
      const task = currentTask?.currentNoteViewed;

      this.headerTitle = currentTask.property?.streetline || 'No property';

      if (socket && socket.isExistInternalNote) {
        this.friendlyId = socket?.internalNote?.friendlyId;
        this.currentNoteViewedId = socket?.internalNote?.id;
        this.type = ENoteTypePayload.AROUND;
      } else if (task && task.isExistInternalNote) {
        this.friendlyId = task?.internalNote?.friendlyId;
        this.currentNoteViewedId = task?.internalNote?.id;
        this.type = ENoteTypePayload.AROUND;
      }
      this._loadMoreData();
    });

    this.internalNoteService.listNote
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((notes) => {
        const newNotes = notes.data;
        if (this.listNotes?.length && !this.isEditNote) {
          this.listNotes = [...newNotes, ...this.listNotes];
        } else {
          this.listNotes = newNotes;
          this.isEditNote = false;
        }

        if (this.existNotePm) {
          this.listNotes = this.listNotes.map((note) => ({
            ...note,
            isLastReadMessage: false
          }));
        } else {
          this.listNotes = this.listNotes.map((note) => {
            if (note.id === this.currentNoteViewedId && this.showRedLine) {
              return {
                ...note,
                isLastReadMessage: true
              };
            }
            return note;
          });
        }

        this.listNotesGroup = this.internalNoteService
          .groupNoteByDate(this.listNotes)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
      });
  }

  private _subscriberEditInternalNote() {
    this.rxWebsocketService.onSocketEditNoteMention
      .pipe(
        takeUntil(this.unsubscribe),
        filter((note) => Boolean(note) && note.taskId === this.currentTaskId)
      )
      .subscribe((value) => {
        const data = {
          data: this.listNotes.map((note) => {
            if (note.id === value.note.id) {
              return value.note;
            }
            return note;
          }),
          total: this.internalNoteService.listNoteValue?.total
        };
        this.isEditNote = true;
        this.internalNoteService.setListNote(data);
      });
  }
  private _subscriberNewNoteSocket() {
    const userInfo = this.userService.userInfo$.getValue();
    let isNoteOfPm: boolean = false;
    this.rxWebsocketService.onSocketNewNoteMention
      .pipe(
        takeUntil(this.unsubscribe),
        filter((note) => Boolean(note) && note.taskId === this.currentTaskId),
        mergeMap((data) => {
          isNoteOfPm = data.notes[0].createdBy.id === userInfo.id;
          if (!this.existNoteAfter && !isNoteOfPm) {
            this.friendlyId = this.listNotes[0].friendlyId;
            return this.internalNoteApiService.getListInternalNoteByTask(
              this.currentTaskId,
              this.friendlyId,
              ENoteTypePayload.AFTER
            );
          } else {
            return of({
              data: [...data.notes],
              total: this.internalNoteService.listNoteValue?.total
            });
          }
        })
      )
      .subscribe((data) => {
        this.internalNoteService.setListNote(data);
        this.internalNoteService.setRefreshNote(true);
        if (isNoteOfPm) {
          this.existNotePm = true;
          this.showRedLine = false;
          this._autoScrollToBottom(EBehaviorScroll.SMOOTH);
        } else {
          this.existNotePm = false;
          this.showScrollToBottomButton = !this._isScrolledDown();
          this.isHasNewNote = true;
        }
      });
  }

  private _getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((company) => {
        this.currentCompany = company;
        this.crmSystemId = company.CRM;
      });
  }

  reloadComponent(url) {
    const currentUrl = decodeURIComponent(url);
    this.router
      .navigateByUrl('/empty', { skipLocationChange: true })
      .then(() => {
        this.router.navigateByUrl(currentUrl);
      });
  }

  private _loadMoreData() {
    return this.getMoreData$
      .asObservable()
      .pipe(
        switchMap(() => {
          return this.internalNoteApiService.getListInternalNoteByTask(
            this.currentTaskId,
            this.friendlyId,
            this.type
          );
        })
      )
      .subscribe((note) => {
        const { previous, next, data } = note || {};
        if (data?.length) {
          if (data[0].friendlyId > this.maxId || !this.maxId) {
            this.maxId = data[0].friendlyId;
            this.existNoteAfter = !!next;
          }

          if (data[data.length - 1].friendlyId < this.minId || !this.minId) {
            this.minId = data[data.length - 1].friendlyId;
            this.existNoteBefore = !!previous;
          }
        }

        const findIndex = data?.findIndex(
          (item) => item?.id === this.currentNoteViewedId
        );
        this.showRedLine = findIndex !== -1 && findIndex > 0;

        this.internalNoteService.setListNote(note);
        this._handleScrollToContent();
        this.internalNoteService.setRefreshNote(true);
        this.loadingService.stopLoading();
        this.isLoading = false;
      });
  }

  private _handleScrollToContent() {
    if (this.isFirstLoadData) {
      this.isFirstLoadData = false;
      if (this.showRedLine) {
        this._autoScrollRedLine();
      } else {
        this._autoScrollToBottom();
      }
    }
  }

  refreshNoteData() {
    this.getMoreData$.next(null);
  }

  handleScrollUp() {
    if (this.existNoteBefore) {
      this.type = ENoteTypePayload.BEFORE;
      this.friendlyId = this.minId;
      this.refreshNoteData();
    }
  }

  handleScrollNoteArea(event: Event) {
    if (!event || !event.target) return;
    const targetElement = event.target as HTMLElement;
    const headerElement =
      document.querySelector('.wrapper-header').clientHeight;
    const yScrollTop = targetElement.scrollTop;
    const timeStamps = document.querySelectorAll('.wrap-order-day');
    const distanceNoteToHeader = 30;

    timeStamps.forEach((el) => {
      const yCoordinates = el.getBoundingClientRect().y;
      if (
        yCoordinates >= headerElement &&
        yCoordinates <= headerElement + distanceNoteToHeader &&
        yScrollTop > 0
      ) {
        el.classList.add('wrap-timeStamp');
      } else {
        el.classList.remove('wrap-timeStamp');
      }
    });

    if (!this.scrollDownContainerEl) return;
    this.showScrollToBottomButton =
      !this._isScrolledDown() && this.isHasNewNote;
    if (this.existNoteAfter && this._isScrolledDown()) {
      this.friendlyId = this.maxId;
      this.type = ENoteTypePayload.AFTER;
      this.refreshNoteData();
    }
    if (this._isScrolledDown()) {
      this.isHasNewNote = false;
      this.showScrollToBottomButton = false;
    }
  }

  private _errorMailboxLoading() {
    this.errorService.ishowMailBoxPermissionWarning$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isErrorMailbox = isShow;
      });
  }

  private _isScrolledDown(): boolean {
    if (!this.scrollDownContainerEl) return false;
    const scrollPosition =
      this.scrollDownContainerEl.scrollHeight -
      this.scrollDownContainerEl.clientHeight;
    return this.scrollDownContainerEl.scrollTop + 80 >= scrollPosition;
  }

  handleViewMostRecent(behavior: EBehaviorScroll) {
    this.isViewMostRecent = true;
    this._autoScrollToBottom(behavior);
  }

  private _autoScrollToBottom(behavior?: EBehaviorScroll): void {
    this.scrollBottomTimeOut = setTimeout(() => {
      if (this.scrollDownContainerEl) {
        this.scrollDownContainerEl.scrollTo({
          top: this.scrollDownContainerEl.scrollHeight,
          behavior: behavior || EBehaviorScroll.AUTO
        });
      }
    }, 0);
  }

  private _autoScrollRedLine() {
    this.scrollContentTimeOut = setTimeout(() => {
      if (!this.redLineNew?.nativeElement) return;
      this.redLineNew?.nativeElement.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: 'start'
      });
    }, 0);
  }

  noteTrackBy(_: number, note: IInternalNote) {
    return note.id;
  }

  dateTrackBy(_: number, note: IListNoteGroup) {
    return note.date;
  }

  handleFileEmit(file) {
    const {
      createdAt,
      fileType,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink
    } = file;
    const newFiles = {
      createdAt,
      fileType,
      icon: fileType?.icon,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink
    };
    this.selectedFiles.push({ ...newFiles, isHideRemoveIcon: true });
    this.replaceMessageFile();
    this.isShowCarousel = false;
    this.setStateTrudiSendMsg();
  }

  setStateTrudiSendMsg() {
    this.messageFlowService
      .openSendMsgModal({
        ...this.createNewConversationConfigs,
        'inputs.listOfFiles': this.selectedFiles,
        'inputs.rawMsg': this.contentText,
        'inputs.isInternalNote': true,
        'inputs.openFrom': TaskType.INTERNAL_NOTE
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            break;
          case ESendMessageModalOutput.MessageSent:
            break;
          case ESendMessageModalOutput.Quit:
            this.onQuitMessageModal();
            break;
        }
      });
  }

  replaceMessageFile() {
    const fileName = this.selectedFiles[0]?.name?.split('.')[0];
    const companyName = this.currentCompany.name;
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
  }

  manageCarouselState(event) {
    if (!event) {
      this.isShowCarousel = false;
      this.initialIndex = null;
      return;
    }
    this.getListFileByInternalNote(event?.imageId);
  }

  getListFileByInternalNote(selectedId: string) {
    this.taskId = this.taskService.currentTask$.getValue().id;
    this.internalNoteApiService
      .getListFileInternalNote(this.taskId)
      .pipe(
        switchMap((listImageCarousel) => {
          this.listImageCarousel = listImageCarousel
            .map((el) => ({
              ...el,
              fileType: this.fileService.getFileTypeDot(
                el?.name || el?.fileName
              ),
              extension: this.fileService.getFileExtensionWithoutDot(
                el.fileName || el.name
              ),
              isUnsupportedFile: !ACCEPT_ONLY_SUPPORTED_FILE.includes(
                this.fileService.getFileExtensionWithoutDot(
                  el.fileName || el.name
                )
              )
            }))
            .filter((el) => {
              return !listCalendarTypeDot
                .map((item) => item?.replace(/\./g, ''))
                .includes(el?.extension);
            });

          this.initialIndex = this.listImageCarousel.findIndex(
            (item) => item.id === selectedId
          );

          if (this.initialIndex === -1) {
            const fileDownload = listImageCarousel?.find(
              (item) => item?.propertyDocumentId === selectedId
            );
            this.fileService.downloadResource(
              fileDownload?.mediaLink,
              fileDownload?.fileName || fileDownload?.name
            );
          } else {
            this.isShowCarousel = true;
          }
          return this.getThumbnailDocument();
        })
      )
      .subscribe();
  }

  mapExtensionCarousel() {
    this.listImageCarousel = this.listImageCarousel.map((item) => {
      const parts = item?.mediaLink.split('.');
      const extension = parts[parts.length - 1];
      return { ...item, extension };
    });
  }

  getPayLoadThumbnail() {
    return this.listImageCarousel
      .filter((item) => {
        return !item.thumbMediaLink || !item.mediaLink;
      })
      .map((i) => i.propertyDocumentId);
  }

  getThumbnailDocument() {
    const payLoad = this.getPayLoadThumbnail();
    if (!payLoad.length) {
      return EMPTY;
    }
    this.listImageCarousel = this.listImageCarousel.map((img) => ({
      ...img,
      thumbMediaLink:
        !img?.thumbMediaLink && img?.extension === EFileExtension.PDF
          ? 'assets/icon/thumbnail-loading.svg'
          : img?.thumbMediaLink
    }));
    return this.internalNoteApiService.getThumbnailDocument(payLoad).pipe(
      map((res) => {
        if (!res) {
          return;
        }
        res.forEach((element) => {
          const index = this.listImageCarousel.findIndex(
            (i) => i.propertyDocumentId === element.id
          );
          if (index >= 0) {
            this.listImageCarousel[index].thumbMediaLink =
              element.thumbMediaLink;
          }
        });
      })
    );
  }

  onQuitMessageModal() {
    this.selectedFiles = [];
  }

  drop(event: CdkDragDrop<AgentFileProp[]>) {
    this.fileService.dragDropFile.next(event);
  }

  private _getImageInNote() {
    this.internalNoteService
      .getImageDetail()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((value) => {
        this._openImageDetail(value);
      });
  }

  private _openImageDetail(event) {
    if (event?.target instanceof HTMLImageElement) {
      const imgSrc = event.target.src;
      this.isShowImage = true;
      this.imageDetailUrl = imgSrc;
    }
  }

  handleCloseImageDetail() {
    this.isShowImage = false;
    this.imageDetailUrl = '';
  }

  editStatusChange({ id, editing }) {
    const newData = {
      data: this.listNotes.map((note) => ({
        ...note,
        isEditing: note.id === id ? editing : false
      })),
      total: this.internalNoteService.listNoteValue?.total
    };
    this.isEditNote = true;
    this.internalNoteService.setListNote(newData);
  }

  ngOnDestroy() {
    this.fileService.dragDropFile.next(null);
    this.internalNoteService.setListNote(null);
    this.internalNoteService.setCurrentViewNote(null);
    this.internalNoteService.setImageDetail(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.scrollBottomTimeOut);
    clearTimeout(this.scrollContentTimeOut);
  }
}
