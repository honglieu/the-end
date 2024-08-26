import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { UserConversation } from '@shared/types/conversation.interface';
import { TaskService } from './../../services/task.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectComponent } from '@ng-select/ng-select';
import { UserType } from '@services/constants';
import { FORWARD_EMAIL_SUCCESSFULLY } from '@services/messages.constants';
import { HeaderService } from '@services/header.service';
import { SendMessageService } from '@services/send-message.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

type UserConversationOption = Partial<UserConversation>;
interface Email {
  id: string;
  email: string;
  address: string;
  userPropertyType: string;
  userType: string;
  userTypeName: string;
  propertyId: string;
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
  public disabledForwardButton: boolean = true;
  public currentMailBoxId: string;

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private conversationService: ConversationService,
    private route: ActivatedRoute,
    private toastService: ToastrService,
    private headerService: HeaderService,
    private sendMessageService: SendMessageService,
    public emailSignatureService: CompanyEmailSignatureService,
    private inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (mailBoxId) this.currentMailBoxId = mailBoxId;
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
      .then((isPortalUser) => (this.disabledForwardButton = !isPortalUser));
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

  onSubmit(e: Event) {
    if (this.selectedEmail.length) {
      this.disabledForwardButton = true;
      this.isDirty = false;
      const message = {
        categoryId: this.conversation.categoryId,
        status: this.conversation.status,
        userId: this.userService.selectedUser.getValue()?.id,
        contentMessage: this.conversation.message,
        options: null,
        fileIds: [],
        taskId: this.isCreateMessageType
          ? null
          : this.taskService.currentTaskId$.getValue(),
        categoryMessage: this.conversation.conversationTitle
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
          this.disabledForwardButton = false;
          this.onQuitModal(e);
          this.reload();
          this.taskService.updateTaskItems$.next({
            listTaskId: [this.taskService.currentTaskId$.getValue()]
          });
          this.toastService.success(FORWARD_EMAIL_SUCCESSFULLY);
        },
        (err) => {
          this.conversationService.reloadConversationList.next(true),
            this.reload();
          console.error(err);
        }
      );
    } else {
      this.isDirty = true;
    }
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
