import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import { TaskService } from '@services/task.service';
import { Subject, takeUntil } from 'rxjs';

import { ConversationService } from '@services/conversation.service';
import { AgencyService } from '@services/agency.service';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';

import { MessageService } from '@services/message.service';
import { TaskItem, TaskName } from '@shared/types/task.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { CallTypeEnum, ImgPath } from '@shared/enum/share.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TaskType } from '@shared/enum/task.enum';
import { ListTrudiContact, TrudiResponse } from '@shared/types/trudi.interface';
import { ETrudiType } from '@shared/enum/trudi';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { EConfirmContactType } from '@shared/enum/contact-type';

@Component({
  selector: 'details-section',
  templateUrl: './details-section.component.html',
  styleUrls: ['./details-section.component.scss']
})
export class DetailsSectionComponent implements OnInit, OnChanges {
  @Input() email: string;
  @Input() senderName: string;
  @Input() requestDataCall: any;
  @Input() taskMsgDetail: TaskItem;
  @Input() task: TaskItem;
  @Input() conversation: UserConversation;
  @Input() appChatHeader: boolean = false;
  @Input() isLoading: boolean = false;
  @Output() onUserProfilePageChild = new EventEmitter<void>();
  @Output() requestToCallWithType = new EventEmitter<CallTypeEnum>();
  @Output() onInfoUserChild = new EventEmitter<void>();
  public userPropertyType = EUserPropertyType;
  public ImgPath = ImgPath;
  public callType = CallTypeEnum;
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
  public isDeletedOrArchived: boolean;

  constructor(
    public taskService: TaskService,
    public messageService: MessageService,
    private conversationService: ConversationService,
    private agencyService: AgencyService,
    private userService: UserService,
    private sharedService: SharedService,
    public shareService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setIsDeletedOrArchived();
  }

  requestToCall(type?: CallTypeEnum) {
    this.requestToCallWithType.emit(type);
  }

  onUserProfilePage() {
    this.onUserProfilePageChild.emit();
  }

  onInfoUser() {
    this.onInfoUserChild.emit();
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
  }) {
    const { id, type } = event;
    if (!id) return;
    this.unhappyPathLoading = true;

    if (
      this.isUnHappyPath &&
      [EConfirmContactType.TENANT, EConfirmContactType.LANDLORD].includes(
        type as EConfirmContactType
      )
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
        });
    } else if (
      this.isUnHappyPath &&
      [EConfirmContactType.OTHER, EConfirmContactType.SUPPLIER].includes(
        type as EConfirmContactType
      )
    ) {
      this.conversationService
        .confirmTrudiSupplierOrOtherContact(
          id,
          this.taskService.currentTask$.value.id,
          this.conversationService.currentConversation.value.id
        )
        .subscribe(() => {
          this.taskService.reloadTaskDetail.next(true);
        });
    }
  }

  handleOnSearchUnHappyPath(search: string) {
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
      // case tenant-landlord-supplier-other
      this.userService
        .getListTrudiContact(
          search,
          this.isUnindentifiedEmail
            ? ''
            : this.trudiResponse?.data[0]?.header.email
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.contactList = res.contacts.map((item) => {
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
                    item.userPropertyType?.toLowerCase()
                  ) + this.displayPropertyStreetline(item.property?.streetline)
              };
            });
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

  setIsDeletedOrArchived() {
    if (
      (this.conversation && this.conversation.crmStatus === 'DELETED') ||
      this.conversation.crmStatus === 'ARCHIVED'
    ) {
      this.isDeletedOrArchived = true;
    } else {
      this.isDeletedOrArchived = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
