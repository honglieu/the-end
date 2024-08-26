import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ChangeDetectionStrategy,
  OnChanges
} from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { CallType, ConfirmToCall } from '@shared/types/share.model';
import { CallTypeEnum, CheckBoxImgPath } from '@shared/enum/share.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import {
  AREA_CODE_PHONE_NUMBER,
  CALL_TYPE,
  VIDEO_CALL_DATA
} from '@services/constants';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import { ConversationService } from '@services/conversation.service';
import { CompanyService } from '@services/company.service';
import { MessageService } from '@services/message.service';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStatusType } from '@shared/enum';

@Component({
  selector: 'call-request',
  templateUrl: './call-request.component.html',
  styleUrls: ['./call-request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallRequestComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() typeOfCall: CallType;
  @Input() callTo: string;
  @Input() listPhoneNumber: string[] = [];
  @Input() userProperty: IUserPropertyV2;
  @Output() onCloseModal = new EventEmitter<boolean>();

  public selectedPhone = '';
  public callType = 'phone';
  public isSelectedPhoneNumber = true;
  public showListNumber = false;
  public isCalling = false;
  public isConsole = false;
  public numberSent = 1;
  public isPTEnvironment = false;
  private destroy$ = new Subject<void>();
  private currentConversation;

  readonly checkBoxImg = CheckBoxImgPath;
  readonly callTypeEnum = CallTypeEnum;
  constructor(
    private readonly phoneFormat: PhoneNumberFormatPipe,
    private readonly sharedService: SharedService,
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly companyService: CompanyService,
    private readonly voicemailInboxService: VoiceMailService,
    private router: Router,
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((company) => {
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
      });

    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([conversation, currentVoicemailConversation]) => {
        this.currentConversation = currentVoicemailConversation || conversation;
      });
  }

  ngOnChanges(): void {
    this.showListNumber = this.isMoreThanOneNumberVoiceCall();
    this.setCallType();
    this.setCallTo();
  }

  closeModal() {
    this.onCloseModal.emit();
  }

  startToCall() {
    if (this.isConsole) return;
    this.isCalling = true;
    if (this.typeOfCall === CallTypeEnum.videoCall) {
      if (this.currentConversation?.id) {
        this.onConfirmCall({ event: true, type: this.typeOfCall });
      }
    } else {
      if (
        this.listPhoneNumber.length &&
        this.typeOfCall === CallTypeEnum.voiceCall
      ) {
        if (
          this.listPhoneNumber.length &&
          this.typeOfCall === CallTypeEnum.voiceCall
        ) {
          if (this.listPhoneNumber.length > 1) {
            this.checkIsSelectedPhoneNumber();
            if (!this.selectedPhone) return;
            let selectedPhone = this.selectedPhone;
            if (selectedPhone.startsWith('0')) {
              selectedPhone =
                AREA_CODE_PHONE_NUMBER +
                selectedPhone.slice(1).replace(/\s/g, '');
            }
            this.onConfirmCall({
              event: true,
              type: this.typeOfCall,
              phone: selectedPhone
            });
          } else {
            let selectedPhone = this.listPhoneNumber?.[0] || '';
            if (selectedPhone.startsWith('0')) {
              selectedPhone =
                AREA_CODE_PHONE_NUMBER +
                selectedPhone.slice(1).replace(/\s/g, '');
            }
            this.onConfirmCall({
              event: true,
              type: this.typeOfCall,
              phone: selectedPhone
            });
          }
        }
      }
    }
  }

  formatPhoneNumber(phone: string): string {
    if (phone.startsWith('0')) {
      return AREA_CODE_PHONE_NUMBER + phone.slice(1).replace(/\s/g, '');
    }
    return phone;
  }

  checkIsSelectedPhoneNumber() {
    return (this.isSelectedPhoneNumber = !!this.selectedPhone);
  }

  onConfirmCall({ event, type, phone }: ConfirmToCall) {
    this.messageService.isActiveCallMessage.next(
      this.messageService.isActiveCallMessage.getValue() + 1
    );
    localStorage.setItem(CALL_TYPE, type);
    phone && localStorage.setItem('VOICE_CALL_NUMBER', phone);

    if (event) {
      const fullNameRemote = {
        firstName: this.currentConversation.firstName,
        lastName: this.currentConversation.lastName
      };
      localStorage.setItem('remoteName', JSON.stringify(fullNameRemote));
      localStorage.setItem(
        'remoteAvt',
        this.userService.selectedUser.value.googleAvatar
      );
      localStorage.setItem('userId', this.userService.selectedUser.value.id);
      const path = type === CallTypeEnum.voiceCall ? 'voice-call' : 'call';

      if (type === CallTypeEnum.videoCall) {
        const body = {
          conversationId: this.currentConversation.id,
          userPropertyId: this.userProperty.id
        };
        this.apiService
          .postAPI(conversations, 'start-call', body)
          .subscribe((res) => {
            localStorage.setItem(
              VIDEO_CALL_DATA,
              JSON.stringify({
                ...res?.message,
                userPropertyId: this.userProperty.id
              })
            );
            if (
              res?.conversation?.id !==
              this.activatedRoute.snapshot.queryParams?.['conversationId']
            ) {
              this.handleNavigateToVideoConversation(res);
            }
            window.open(
              `/${path}/${this.currentConversation.id}/${this.userProperty.userId}/${this.userProperty?.propertyId}?isPTEnvironment=${this.isPTEnvironment}`,
              '_blank'
            );
          });
      } else {
        window.open(
          `/${path}/${this.currentConversation.id}/${this.userProperty.userId}/${this.userProperty?.propertyId}?isPTEnvironment=${this.isPTEnvironment}`,
          '_blank'
        );
      }
    }
    this.closeModal();
  }

  handleNavigateToVideoConversation(data) {
    const statusUrl = {
      [TaskStatusType.inprogress]: 'all',
      [TaskStatusType.completed]: 'resolved',
      [TaskStatusType.deleted]: 'deleted'
    };
    const { status, id: taskId } = data?.task;
    const { id: conversationId } = data?.conversation || {};
    this.router.navigate(
      [
        'dashboard/inbox/app-messages',
        status ? statusUrl[status] : statusUrl[TaskStatusType.inprogress]
      ],
      {
        queryParams: {
          status,
          taskId,
          conversationId
        },
        queryParamsHandling: 'merge'
      }
    );
    this.conversationService.triggerGoToAppMessage$.next(true);
  }

  selectPhone(phone: string) {
    this.isCalling = false;
    this.selectedPhone = phone;
    this.isSelectedPhoneNumber = !!phone;
  }

  isOneNumberVoiceCall(): boolean {
    return (
      this.listPhoneNumber.length === 1 &&
      this.typeOfCall === CallTypeEnum.voiceCall
    );
  }

  private isMoreThanOneNumberVoiceCall(): boolean {
    return (
      this.listPhoneNumber.length > 1 &&
      this.typeOfCall === CallTypeEnum.voiceCall
    );
  }

  private setCallType() {
    this.callType =
      this.typeOfCall === CallTypeEnum.videoCall ? 'video' : 'phone';
  }

  private setCallTo() {
    if (this.isOneNumberVoiceCall()) {
      this.callTo = this.phoneFormat.transform(this.listPhoneNumber[0]);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
