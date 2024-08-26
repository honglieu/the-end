import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  debounceTime,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { AgencyService } from '@services/agency.service';
import { ApiService } from '@services/api.service';
import { ConversationService } from '@services/conversation.service';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectComponent } from '@ng-select/ng-select';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EMAIL_PATTERN, UserType } from '@services/constants';
import {
  ASSIGN_TO_MESSAGE,
  FORWARD_EMAIL_SUCCESSFULLY
} from '@services/messages.constants';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { HeaderService } from '@services/header.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { TaskType } from '@shared/enum/task.enum';
import { userType } from '@trudi-ui';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';

type UserConversationOption = Partial<UserConversation>;
export interface Email {
  id: string;
  email: string;
  address: string;
  userPropertyType: string;
  userType: string;
  userTypeName: string;
  propertyId: string;
  valid?: boolean;
  personUserType?: string;
  inviteSent?: string;
  lastActivity?: string;
  offBoardedDate?: string;
  trudiUserId?: string | null;
}

@Component({
  selector: 'app-forward-via-email',
  templateUrl: './forward-via-email.component.html',
  styleUrls: ['./forward-via-email.component.scss']
})
export class ForwardViaEmailComponent implements OnInit {
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;
  @Input() show: boolean;
  @Input() isCreateMessageType: boolean;
  @Input() conversation: UserConversationOption;
  @Output() isQuitModal = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public listEmail: Email[] = [];
  public currentSearch: string = '';
  public selectedEmail: Email[] = [];
  public selected: string[] = [];
  public loading: boolean = false;
  public isDirty: boolean = false;
  public isOpenDropdown: boolean = false;
  public disabledForwardButton: boolean = false;
  public pipeType: string = userType.DEFAULT;
  private agencyId: string;
  public isPortalUser: boolean = true;
  public isRmEnvironment: boolean = false;
  public userPropertyType = EUserPropertyType;
  public isArchiveMailbox: boolean = false;
  public isDisconnectMailbox: boolean = false;
  public currentMailBoxId: string;
  public isConsole: boolean;
  public validateEmail: boolean = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private userService: UserService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboardService,
    private conversationService: ConversationService,
    private route: ActivatedRoute,
    private toastService: ToastrService,
    private headerService: HeaderService,
    private sharedService: SharedService,
    private sendMessageService: SendMessageService,
    public emailSignatureService: CompanyEmailSignatureService,
    private toastCustomService: ToastCustomService,
    public inboxService: InboxService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversation']?.currentValue) {
      this.conversation = changes['conversation']?.currentValue;
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (mailBoxId) this.currentMailBoxId = mailBoxId;
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));

    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.isDisconnectMailbox = data;
      });

    this.searchValue
      .pipe(
        tap(() => (this.loading = true)),
        debounceTime(500),
        switchMap((searchQuery) => {
          return !!searchQuery
            ? this.userService.getSearchByEmail(searchQuery)
            : of([]);
        })
      )
      .subscribe(
        (res) => {
          const mapDataEmail = (res || []).map((e) => ({
            ...e,
            userTypeName: this.getUserPropertyType(e)
          }));
          (this.listEmail = [
            ...mapDataEmail.filter((e) => e.userTypeName != 'Property Manager'),
            ...this.removeDuplicateObjects(
              mapDataEmail.filter((e) => e.userTypeName == 'Property Manager'),
              'email'
            )
          ]),
            (this.loading = false);
        },
        (err) => {
          console.error(err);
          this.loading = false;
        }
      );
    this.userService
      .checkIsPortalUser()
      .then((user) => (this.isPortalUser = user));

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
  }

  reload() {
    // run when in task detail
    if (this.route.snapshot.paramMap.get('taskId')) {
      this.conversationService.reloadConversationList.next(true);
    }
  }

  removeDuplicateObjects(arr: Email[], property) {
    return [...new Map(arr.map((obj) => [obj[property], obj])).values()];
  }

  addEmail = (email) => {
    const emailPattern = EMAIL_PATTERN;
    return {
      id: uuid4(),
      email,
      valid: emailPattern.test(email) ? false : true,
      userPropertyType: EUserPropertyType.EXTERNAL
    };
  };
  onSubmit(e: Event) {
    let validEmail = this.selectedEmail.some((value) => value.valid);
    if (validEmail) {
      this.validateEmail = true;
      return;
    }
    if (this.isArchiveMailbox) return;
    if (this.router.url.includes('inboxType=UNASSIGNED')) {
      this.conversation.taskId = null;
    }
    if (this.selectedEmail.length) {
      this.disabledForwardButton = true;
      this.isDirty = false;
      const message = {
        categoryId: this.conversation.categoryId,
        status: this.conversation.status,
        userId: this.userService.selectedUser.getValue()?.id,
        contentMessage: this.removeEmailSignature(this.conversation.message),
        options: null,
        fileIds: [],
        taskId: this.isCreateMessageType
          ? null
          : this.taskService.currentTaskId$.getValue(),
        categoryMessage:
          this.conversation.conversationTitle ||
          this.taskService.currentTask$.getValue()?.title
      };
      const selectedEmail = this.selectedEmail.map((e) =>
        e.propertyId ? e.propertyId : this.conversation.propertyId
      );
      const file = (this.conversation.options || []).map((e) => ({
        documentTypeId: e?.documentTypeId,
        title: e?.title,
        fileName: e?.name,
        fileType: e?.fileType?.name,
        fileSize: e?.size,
        mediaLink: e?.mediaLink,
        propertyId: selectedEmail?.[0],
        propertyIds: Array.from(new Set(selectedEmail))
      }));
      const body = {
        task: [],
        summary: '',
        message: this.selectedEmail.map((e) => ({
          ...message,
          personUserId: e.id,
          personUserEmail: e.email,
          personUserType: e.userPropertyType,
          isSendFromEmail: !this.userService.checkAppUser(e),
          propertyId: e.propertyId ? e.propertyId : this.conversation.propertyId
        })),
        actionLink: [],
        file: file || [],
        isResolveConversation: false,
        isCreateMessageType: this.isCreateMessageType,
        mailBoxId: this.currentMailBoxId
      };
      this.sendMessageService.sendBulkMessage(body).subscribe(
        (res) => {
          this.validateEmail = false;
          this.disabledForwardButton = false;
          this.onQuitModal(e);
          this.reload();
          this.taskService.updateTaskItems$.next({
            listTaskId: [this.taskService.currentTaskId$.getValue()]
          });
          this.toastService.success(FORWARD_EMAIL_SUCCESSFULLY);
          const myTasK = this.router.url.includes(
            '/inbox/tasks?inboxType=MY_TASK'
          );
          if (
            this.taskService.currentTask$.getValue()?.taskType !==
              TaskType.TASK &&
            !myTasK
          ) {
            this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
          }
        },
        (err) => {
          this.conversationService.reloadConversationList.next(true),
            this.reload();
          console.error(err);
        }
      );
    } else {
      this.validateEmail = false;
      this.isDirty = true;
    }
  }

  handleClickSelected() {
    this.isDirty = false;
    this.validateEmail = false;
  }

  private removeEmailSignature(htmlString: string): string {
    const regex =
      /<br\/?>\s*<div id='email-signature'[^>]*>[\s\S]*?<\/table><\/div>/g;
    return htmlString?.replace(regex, '');
  }

  onSearchEmail({ term }: { term: string; items: any[] }) {
    this.currentSearch = term;
    this.isOpenDropdown = this.currentSearch !== '';
    this.searchValue.next(term);
    this.isDirty = false;
  }

  onBlur($event: Event) {
    if (this.currentSearch) {
      this.ngSelectComponent.searchTerm = '';
      this.currentSearch = '';
      this.searchValue.next('');
      this.isOpenDropdown = false;
    }
  }

  changeSelectedEmail(email) {
    this.selectedEmail = email;
    const params = this.selectedEmail.map((item) => item.id).join('&userId=');
    this.userService.checkUserInviteStatus(params).subscribe((data) => {
      if (!data?.length) return;
      const userStatusList = new Map();
      data.forEach((user) => {
        userStatusList.set(user.userId, user.inviteStatus === 'ACTIVE');
        this.emailSignatureService.userStatusList.next(userStatusList);
      });
    });
    this.isDirty = false;
    this.validateEmail = false;
    this.isOpenDropdown = false;
  }

  onQuitModal(e: Event) {
    this.isQuitModal.emit();
    this.currentSearch = '';
    this.selectedEmail = [];
    this.listEmail = [];
    this.selected = [];
    this.loading = false;
    this.isDirty = false;
    this.validateEmail = false;
    this.isOpenDropdown = false;
    this.ngSelectComponent.handleClearClick();
    e.stopPropagation();
  }

  getUserPropertyType(v: Email) {
    if (v.userType === UserType.LEAD) return 'Property Manager';
    return (v.userPropertyType || v.userType)
      ?.toLowerCase()
      ?.split(' ')
      ?.map((e) => e.charAt(0).toUpperCase() + e.slice(1))
      .join(' ');
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.searchValue.unsubscribe();
  }
}
