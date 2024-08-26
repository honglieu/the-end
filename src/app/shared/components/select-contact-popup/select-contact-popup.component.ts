import { USER_TYPE_IN_RM } from './../../../dashboard/utils/constants';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  ListTrudiContact,
  OnSearchValueEmitter,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { ETrudiType } from '@shared/enum/trudi';
import { TaskService } from '@services/task.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskItem, TaskName } from '@shared/types/task.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { ConversationService } from '@services/conversation.service';
import { AgencyService } from '@services/agency.service';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { TaskType } from '@shared/enum/task.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { MessageService } from '@services/message.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'select-contact-popup',
  templateUrl: './select-contact-popup.component.html',
  styleUrls: ['./select-contact-popup.component.scss']
})
export class SelectContactPopupComponent implements OnInit, OnChanges {
  @Input() email: string;
  @Input() task: TaskItem;
  @Input() conversation: UserConversation;
  @Input() appChatHeader: boolean = false;
  private unsubscribe = new Subject<void>();
  readonly TaskType = TaskType;
  public trudiResponse: TrudiResponse;
  public typeTrudi: string;
  public TYPE_TRUDI = ETrudiType;
  public contactList: ListTrudiContact[] = [];
  public propertyList: PropertyContact[];
  public taskNameList: TaskName[];
  public isUnindentifiedEmail = false;
  public isUnindentifiedProperty = false;
  public unhappyStatus: UnhappyStatus;
  public isUnHappyPath = false;
  public isSuperHappyPath = false;
  public overlayDropdown: boolean;
  public placeHolderTrudiUnhappy = '';
  public showPopup: boolean = false;
  public isConfirmContactUser: boolean = false;
  public unhappyPathLoading: boolean = false;
  public showPopover: boolean = false;
  public totalPageContactList?: number;
  public isRmEnvironment: boolean = false;
  public isConsole: boolean;

  constructor(
    public taskService: TaskService,
    public messageService: MessageService,
    private conversationService: ConversationService,
    private agencyService: AgencyService,
    private userService: UserService,
    private sharedService: SharedService,
    public shareService: SharedService,
    private cdr: ChangeDetectorRef,
    private agencyDashboardService: AgencyDashboardService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] || changes['conversation']) {
      if (changes['conversation']) {
        this.getPlaceholderTrudiUnhappy(
          this.conversation?.trudiResponse?.data[0]?.body?.text
        );
        this.handleSetTrudiResponse(this.conversation?.trudiResponse);
      }
      if (!!this.task && !!this.conversation) {
        this.isConfirmContactUser =
          !!this.task?.unhappyStatus?.isConfirmContactUser;
        if (
          this.task.taskType === TaskType.MESSAGE ||
          this.trudiResponse?.type !== ETrudiType.unhappy_path
        ) {
          this.isUnHappyPath = this.task?.isUnHappyPath;
          this.unhappyStatus = this.task?.unhappyStatus;
          this.isSuperHappyPath = this.task?.isSuperHappyPath;
          !this.unhappyPathLoading &&
            (this.isUnindentifiedEmail = this.task?.isUnindentifiedEmail);
          this.isUnindentifiedProperty = this.task?.isUnindentifiedProperty;
        } else if (this.trudiResponse?.type === ETrudiType.unhappy_path) {
          this.isUnHappyPath = true;
          this.unhappyStatus = this.trudiResponse?.data[0]?.body?.unhappyStatus;
          this.isSuperHappyPath =
            this.trudiResponse?.data[0]?.body?.isSuperHappyPath;
          this.isUnindentifiedEmail =
            this.trudiResponse?.data[0]?.body?.isUnindentifiedEmail;
          this.isUnindentifiedProperty =
            this.trudiResponse?.data[0]?.body?.isUnindentifiedProperty;
        }
      }
    }
  }

  getPlaceholderTrudiUnhappy(title: string) {
    if (title?.includes('property')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for property';
    } else if (title?.includes('contact')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for contact';
    } else if (title?.includes('task')) {
      this.overlayDropdown = false;
      this.placeHolderTrudiUnhappy = 'Search for task';
    }
  }

  handleConfirmSelectContact(event: {
    id: string;
    type: string;
    enquiries?: boolean;
    streetline?: string;
  }) {
    const { id, type, streetline } = event;
    if (!id) return;
    this.unhappyPathLoading = true;

    const validUserTypes = [
      EConfirmContactType.TENANT,
      EConfirmContactType.LANDLORD,
      EConfirmContactType.OWNER,
      EConfirmContactType.TENANT_UNIT,
      EConfirmContactType.LANDLORD_PROSPECT,
      EConfirmContactType.TENANT_PROPERTY
    ];

    if (
      this.isUnHappyPath &&
      ((validUserTypes.includes(type as EConfirmContactType) &&
        streetline &&
        this.isRmEnvironment) ||
        (validUserTypes.includes(type as EConfirmContactType) &&
          !this.isRmEnvironment))
    ) {
      this.conversationService
        .confirmTrudiContact(
          this.conversationService.currentConversation.value.id,
          this.taskService.currentTask$.value.id,
          id,
          this.conversationService.currentConversation.value.agencyId
        )
        .subscribe(() => {
          this.taskService.reloadTaskDetail.next(true);
          this.unhappyPathLoading = false;
          this.showPopover = false;
          this.cdr.markForCheck();
        });
    } else if (
      (!streetline && this.isRmEnvironment) ||
      (this.isUnHappyPath &&
        [
          EConfirmContactType.OTHER,
          EConfirmContactType.SUPPLIER,
          EConfirmContactType.OWNER_PROSPECT,
          EConfirmContactType.TENANT_PROSPECT
        ].includes(type as EConfirmContactType))
    ) {
      this.conversationService
        .confirmTrudiSupplierOrOtherContact(
          id,
          this.taskService.currentTask$.value.id,
          this.conversationService.currentConversation.value.id
        )
        .subscribe(() => {
          this.taskService.reloadTaskDetail.next(true);
          this.conversationService.reloadConversationList.next(true);
          this.unhappyPathLoading = false;
          this.showPopover = false;
          this.cdr.markForCheck();
        });
    }
  }

  handleOnSearchUnHappyPath({ search, page, limit }: OnSearchValueEmitter) {
    if (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus?.confirmContactType as EConfirmContactType
      ) &&
      !this.unhappyStatus?.isConfirmProperty
    ) {
      this.userService
        .getListTrudiProperties(search)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.propertyList = res.map((item) => {
              return {
                ...item,
                fullName: this.sharedService.displayName(
                  item.user.firstName,
                  item.user.lastName
                )
              };
            });
          }
        });
    } else if (
      !this.unhappyStatus.confirmContactType &&
      !this.unhappyStatus.isConfirmContactUser
    ) {
      if (this.totalPageContactList && page > this.totalPageContactList) return;
      // case tenant-landlord-supplier-other
      this.userService
        .getListTrudiContact(
          search,
          this.isUnindentifiedEmail
            ? ''
            : this.trudiResponse?.data[0]?.header.email,
          page,
          limit
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            const contacts = res.contacts.map((item) => {
              if (
                [
                  EConfirmContactType.SUPPLIER,
                  EConfirmContactType.OTHER
                ].includes(item.userType as EConfirmContactType)
              ) {
                return {
                  ...item,
                  fullName: this.sharedService.displayName(
                    item.firstName,
                    item.lastName
                  ),
                  propertyTypeOrAddress:
                    item.userType === EConfirmContactType.OTHER
                      ? this.shareService.displayAllCapitalizeFirstLetter(
                          item.contactType?.split('_').join(' ').toLowerCase()
                        )
                      : this.sharedService.displayCapitalizeFirstLetter(
                          item.userType?.toLowerCase()
                        )
                };
              }
              return {
                ...item,
                fullName: this.sharedService.displayName(
                  item.firstName,
                  item.lastName
                ),
                propertyTypeOrAddress:
                  this.sharedService.displayCapitalizeFirstLetter(
                    USER_TYPE_IN_RM[item.userPropertyType]?.toLowerCase() ||
                      item.userPropertyType?.toLowerCase()
                  ) +
                  (item.userPropertyType !== EUserPropertyType.TENANT_PROSPECT
                    ? this.displayPropertyStreetline(item.property?.streetline)
                    : '')
              };
            });
            this.totalPageContactList = res.totalPage;
            this.contactList = [...this.contactList, ...contacts];
            this.cdr.markForCheck();
          }
        });
    } else if (!this.unhappyStatus.isAssignNewTask) {
      this.taskService
        .getTaskNameList(search, TaskType.TASK)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.taskNameList = res;
        });
    }
  }

  displayPropertyStreetline(streetline: string) {
    if (!streetline) {
      return '';
    }
    return ' • ' + streetline;
  }

  handleSetTrudiResponse(trudiResponse: TrudiResponse) {
    this.trudiResponse = JSON.parse(JSON.stringify(trudiResponse));
    this.typeTrudi = this.trudiResponse?.type;
    this.getPlaceholderTrudiUnhappy(this.trudiResponse?.data[0]?.body?.text);
  }

  handleNzPopover(): void {
    this.showPopover = true;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  setEmptyContactList() {
    this.contactList = [];
  }
}
