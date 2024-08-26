import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  merge,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { TaskService } from '@services/task.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { SharedService } from '@services/shared.service';
import { CHAR_WIDTH } from '@services/constants';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'email-view-row',
  templateUrl: './email-view-row.component.html',
  styleUrls: ['./email-view-row.component.scss']
})
export class EmailViewRowComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @Input() queryThreadId: string;
  @Input() gmail: EmailItem;
  @Input() search: string;
  @Input() isSelected: boolean;
  @Output() checkedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() currentMailboxId: string;
  @Input() index: number;
  @Input() activeGmailList: string[] = [];
  @Output() pressShiftClick = new EventEmitter();
  @Output() pressDelete = new EventEmitter<EmailItem>();
  @Output() removeActiveGmail = new EventEmitter();
  @Output() addSelectedGmail = new EventEmitter();
  @Output() unableRightClick = new EventEmitter();
  @Output() downKeyPressed = new EventEmitter();
  @Output() upKeyPressed = new EventEmitter();
  @ViewChild('participantContainer') participantContainer: ElementRef;
  public message: string;
  public senderName: string;
  public emailAddress: string;

  public arrMessage: EmailItem[] = [];
  public isShowEmailDetail: boolean = false;
  public isUnRead: boolean = false;
  public isShowMessageDetail: boolean = false;
  public isChecked: boolean = false;
  public isFocused: boolean = false;
  public readonly EDetailViewMode = EViewDetailMode;
  private destroy$ = new Subject<void>();
  public isMenuDisplayed: boolean = false;
  public isConsoleUser: boolean = false;
  public listParticipants: string[] = [];
  public displayParticipants: string[] = [];
  public remainingParticipants: string[] = [];
  public tooltipPlacement = ['top', 'bottom'];
  public tooltipEnterMouseDelay = 1;
  public maxWidthParticipantName: number;
  private resizeObserver: ResizeObserver;

  constructor(
    private taskService: TaskService,
    private inboxToolbarService: InboxToolbarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private elementRef: ElementRef,
    private sharedService: SharedService,
    private ngZone: NgZone,
    public inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((messageId) => {
        this.isMenuDisplayed = messageId === this.gmail.id;
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gmail']?.currentValue) {
      this.listParticipants = this.gmail?.participants?.map((participant) =>
        participant.firstName
          ? this.extractContentInsideAngleBrackets(participant.firstName)
          : this.extractContentInsideAngleBrackets(participant.email)
      );
      const textContent = this.gmail?.textContent
        ?.replace(/(?:\\[rn])+/g, '')
        .trim();
      this.message =
        textContent || this.gmail.attachments?.length
          ? ` ${textContent || ''}`
          : '';
      this.isUnRead = !this?.gmail?.isRead;
    }

    if (changes['queryThreadId']?.currentValue) {
      this.isFocused =
        changes['queryThreadId']?.currentValue === this.gmail.threadId;
      this.cdr.markForCheck();
    }

    if (changes['activeGmailList']?.currentValue) {
      const selectedItems = changes['activeGmailList']?.currentValue;
      if (selectedItems.length > 0) {
        this.isChecked = selectedItems.some((item) => {
          return item === this.gmail?.id;
        });
        if (
          (this.isChecked && !this.isSelected) ||
          (!this.isChecked && this.isSelected)
        ) {
          this.handleChangeSelected(!this.isSelected);
        }
      } else {
        this.isChecked = false;
        this.isSelected = false;
        this.isFocused = this.queryThreadId === this.gmail.threadId;
      }
    }
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      const clickEvent = fromEvent(document, 'click');
      const contextEvent = fromEvent(document, 'contextmenu');
      merge(clickEvent, contextEvent)
        .pipe(takeUntil(this.destroy$), debounceTime(300))
        .subscribe((event) => {
          if (
            !this.elementRef.nativeElement?.contains(event.target) &&
            this.sharedMessageViewService.isRightClickDropdownVisibleValue
          ) {
            this.resetRightClickSelectedState();
          }
        });
    });
    this.observeContainerResize();
  }

  private observeContainerResize(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { clientWidth } = entry.target as HTMLElement;
        if (!!clientWidth) {
          this.determineParticipantsToDisplay(clientWidth);
          this.maxWidthParticipantName = !!this.remainingParticipants.length
            ? clientWidth - CHAR_WIDTH * 4
            : clientWidth - CHAR_WIDTH * 2;
        }
      });
    });

    if (this.participantContainer?.nativeElement) {
      this.resizeObserver.observe(this.participantContainer.nativeElement);
    }
  }

  private extractContentInsideAngleBrackets(text: string) {
    const match = /<([^>]+)>/.exec(text);
    return match ? match[1] : text;
  }

  private determineParticipantsToDisplay(containerClientWidth: number) {
    let availableSpace = containerClientWidth - CHAR_WIDTH * 4;
    let currentCummulativeWidth = 0;
    const displayParticipants = [];
    const firstItemExceedAvailableSpace =
      this.listParticipants[0]?.length * CHAR_WIDTH > availableSpace;

    const processParticipant = (participant: string) => {
      const participantWidth = participant.length * CHAR_WIDTH;
      if (currentCummulativeWidth + participantWidth >= availableSpace) {
        return false;
      }
      currentCummulativeWidth += participantWidth + CHAR_WIDTH * 2;
      displayParticipants.push(participant);
      return true;
    };

    if (firstItemExceedAvailableSpace) {
      displayParticipants.push(this.listParticipants[0]);
    } else {
      for (const participant of this.listParticipants) {
        if (!processParticipant(participant)) {
          break;
        }
      }
    }

    this.displayParticipants = displayParticipants;
    this.remainingParticipants = this.listParticipants.slice(
      displayParticipants.length
    );

    this.cdr.markForCheck();
  }

  getNameAndEmail(inputString: string) {
    const nameRegex = /"?(.+?)"?\s*</;
    const emailRegex = /<(.+?)>/;
    const nameMatches = nameRegex.exec(inputString);
    const emailMatches = emailRegex.exec(inputString);

    let name = nameMatches ? nameMatches[1] : '';
    let email = emailMatches ? emailMatches[1] : '';

    if (!email && !name) {
      name = inputString;
    }

    return { name: name || email, email: email || name };
  }

  showMessageDetail() {
    this.taskService.setSelectedConversationList([]);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    this.router.navigate([], {
      queryParams: {
        threadId: this.gmail.threadId,
        emailMessageId: this.gmail.id
      },
      queryParamsHandling: 'merge'
    });
    this.resetRightClickSelectedState();
  }

  handleChangeSelected(value: boolean) {
    this.inboxToolbarService.inboxItem$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((inboxItems: EmailItem[]) => {
        let listMailId = inboxItems || [];
        this.isSelected = value;
        this.checkedChange.emit(value);
        if (value) {
          listMailId.push(this.gmail);
          this.addSelectedGmail.emit({
            currentGmailId: this.gmail?.id,
            currentGmailIndex: this.index
          });
          if (
            inboxItems.length > 1 &&
            this.sharedMessageViewService.isRightClickDropdownVisibleValue
          ) {
            this.unableRightClick.emit();
          }
        } else {
          listMailId = listMailId.filter((item) => item.id !== this.gmail?.id);
          this.removeActiveGmail.emit(this.gmail?.id);
        }
        this.inboxToolbarService.setInboxItem(listMailId);
      });
  }

  onShiftClick(event: MouseEvent) {
    window.getSelection().removeAllRanges();
    const isKeepShiftCtr =
      (event.ctrlKey && event.shiftKey) || (event.metaKey && event.shiftKey);
    this.pressShiftClick.emit({ isKeepShiftCtr, lastIndex: this.index });
  }

  onCtrClick() {
    this.handleChangeSelected(!this.isSelected);
  }

  handlePressDelete() {
    this.pressDelete.emit(this.gmail);
  }

  handleUpKeyPressed() {
    this.upKeyPressed.emit();
  }

  handleDownKeyPressed() {
    this.downKeyPressed.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetRightClickSelectedState() {
    if (
      this.sharedMessageViewService.rightClickSelectedMessageIdValue ===
      this.gmail.id
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }
}
