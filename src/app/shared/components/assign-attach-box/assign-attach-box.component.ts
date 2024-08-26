import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Agent, InviteStatus } from '@shared/types/agent.interface';
import { UserService } from '@services/user.service';
import { trudiUserId } from '@services/constants';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Router } from '@angular/router';

export const trudiAgent: Agent = {
  firstName: 'Trudi® Assistant',
  googleAvatar: '/assets/icon/trudi_avt.svg',
  id: trudiUserId,
  lastName: '',
  phoneNumber: '',
  title: '',
  isMeetTheTeam: false,
  isEmergencyContact: false,
  email: '',
  type: '',
  pods: [],
  isAdministrator: true,
  inviteStatus: InviteStatus.ACTIVE
};

@Component({
  selector: 'assign-attach-box',
  templateUrl: './assign-attach-box.component.html',
  styleUrls: ['./assign-attach-box.component.scss']
})
export class AssignAttachBoxComponent implements OnInit, OnDestroy {
  @Input() selectingUserIds: string[];
  @Input() onTop?: boolean = true;
  @Input() left?: boolean = true;
  @Input() propertyId: string = '';
  @Input() showTrudiAgent: boolean = false;
  @Output() itemsSelected = new EventEmitter<Agent>(null);

  readonly trudiUserId = trudiUserId;
  private unsubscribe = new Subject<void>();
  public originAgentList: Agent[] = [];
  public listAgentId: String[] = [];
  public showClearIcon: boolean = false;
  searchFormControl$ = new FormControl('');
  allAgent: Agent[];
  agentList: Agent[];
  public defaultAgentList: Agent[];
  public listInviteStatus: typeof InviteStatus = InviteStatus;
  public totalItem = 0;
  public vitrualHeight = 320;

  constructor(
    private readonly elr: ElementRef,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((mailboxId) => {
          // If in task index page, or task detail, we need to get all agents
          const mailBoxId =
            this.router.url.includes('dashboard/inbox/messages') ||
            this.router.url.includes('dashboard/inbox/app-messages') ||
            this.router.url.includes('dashboard/inbox/voicemail-messages')
              ? mailboxId
              : null;
          return this.userService.getListAgentPopup(mailBoxId);
        })
      )
      .subscribe((res) => {
        if (res) {
          if (this.showTrudiAgent) {
            res = [...res, trudiAgent];
            !this.selectingUserIds.includes(trudiUserId) &&
              this.selectingUserIds.push(trudiUserId);
          }
          this.allAgent = [...res];
          this.defaultAgentList = this.allAgent.filter(
            (el) => this.showTrudiAgent || el.id !== trudiUserId
          );
          this.setAgentList(this.allAgent);
          this.originAgentList = this.allAgent
            .filter((el) => this.showTrudiAgent || el.id !== trudiUserId)
            .map((el) => ({
              ...el,
              selected: Boolean(
                this.selectingUserIds?.some((id) => id === el.id)
              )
            }));
          this.listAgentId = this.originAgentList
            .filter((item) => item.selected)
            .map((agent) => agent.id);
          this.handleCheckLastItem();
          this.vitrualHeight = this.getStyle();
          this.cdr.markForCheck();
        }
      });

    this.searchFormControl$.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev.trim() === current.trim();
        }),
        debounceTime(500),
        switchMap((searchKey) => {
          this.showClearIcon = !!searchKey;
          return of(searchKey);
        })
      )
      .subscribe((searchKey) => {
        const regex = new RegExp(searchKey, 'i');
        this.setAgentList(
          this.allAgent.filter(
            (user) => regex.test(user.firstName) || regex.test(user.lastName)
          )
        );
        this.handleCheckLastItem();
        this.vitrualHeight = this.getStyle();
        this.cdr.markForCheck();
      });

    if (!this.onTop) {
      this.elr.nativeElement.style.top = 'unset';
      this.elr.nativeElement.style.bottom = '-100%';
    }
    if (this.left) {
      this.elr.nativeElement.style.left = 'unset';
      this.elr.nativeElement.style.right = '100%';
    }
  }

  handleClearSearch() {
    this.searchFormControl$.setValue('');
  }

  getStyle() {
    const limitedItems = 8;
    const itemSize = 47;
    const maxHeight = 320;
    return this.totalItem < limitedItems
      ? this.totalItem * itemSize
      : maxHeight;
  }

  setAgentList(agentList: Agent[]) {
    let list = agentList;
    const userId = this.userService.userInfo$.value?.id;
    this.agentList = list
      .filter((el) => this.showTrudiAgent || el.id !== trudiUserId)
      .map((el) => ({
        ...el,
        selected: Boolean(this.selectingUserIds?.some((id) => id === el.id))
      }))
      .sort((x, y) => {
        if (x.id === trudiUserId) return -1;
        if (y.id === trudiUserId) return 1;
        if (x.selected && !y.selected) return -1;
        if (!x.selected && y.selected) return 1;
        return 0;
      });

    if (this.agentList[0]?.id !== userId) {
      // move user to first in array
      list.sort(function (x, y) {
        return x.id === userId ? -1 : y.id === userId ? 1 : 0;
      });
    }
    this.totalItem = this.agentList.length;
  }

  onSearch(e: Event) {
    e.stopPropagation();
  }

  handleCheckbox(i: number) {
    if (
      (!this.agentList[i].selected &&
        this.agentList[i].inviteStatus === InviteStatus.DEACTIVATED) ||
      this.agentList[i].id === trudiUserId
    )
      return;
    this.agentList[i].selected = !this.agentList[i].selected;

    if (this.agentList[i].selected)
      this.listAgentId = [...this.listAgentId, this.agentList[i].id];
    else
      this.listAgentId = this.listAgentId.filter(
        (agent) => agent !== this.agentList[i].id
      );

    const selectedItems = this.agentList[i];
    this.itemsSelected.emit(selectedItems);
    this.handleCheckLastItem();
  }

  handleCheckLastItem() {
    const hasSingleResult = this.listAgentId.length === 1;
    this.agentList.forEach((agent) => {
      if (agent.id === this.listAgentId[0]) {
        agent.isLastItem = hasSingleResult;
      }
    });
  }

  onClickPopup(e: Event) {
    e.stopPropagation();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
