import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CallType, ConfirmToCall } from '@shared/types/share.model';
import { CallTypeEnum, CheckBoxImgPath } from '@shared/enum/share.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { AREA_CODE_PHONE_NUMBER } from '@services/constants';
import { SharedService } from '@services/shared.service';
import { IUserParticipant } from '@shared/types/user.interface';
import { UserTypeInPTPipe } from '@shared/pipes/user-type-in-pt.pipe';
import { CompanyService } from '@services/company.service';
@Component({
  selector: 'app-confirm-calling-request',
  templateUrl: './confirm-calling-request.component.html',
  styleUrls: ['./confirm-calling-request.component.scss']
})
export class ConfirmCallingRequestComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() typeOfCall: CallType;
  @Input() numberSent: number;
  @Input() selectedUser: IUserParticipant;
  @Input() selectedRole: string;
  @Input() conversationId: string;
  @Input() listPhoneNumber: string[] = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isConfirmToCall = new EventEmitter<ConfirmToCall>();
  @Output() isOpenQuitConfirmModal = new EventEmitter<boolean>();
  private unsubscribe = new Subject<void>();
  public checkBoxImg = CheckBoxImgPath;
  public selectedPhone = '';
  public callType: string = 'phone';
  public callTo = '';
  public callTypeEnum = CallTypeEnum;
  public showListNumber: boolean = false;
  public isSelectedPhoneNumber: boolean = true;
  public isCalling: boolean = false;
  public isConsole: boolean;
  public isPTEnvironment: boolean = false;

  constructor(
    private phoneFormat: PhoneNumberFormatPipe,
    private sharedService: SharedService,
    private userTypeInPTPipe: UserTypeInPTPipe,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['typeOfCall'] && this.typeOfCall) {
      switch (this.typeOfCall) {
        case CallTypeEnum.videoCall:
          this.callType = 'video';
          break;
        case CallTypeEnum.voiceCall:
          this.callType = 'phone';
          break;
        default:
          break;
      }
    }

    this.showListNumber = this.isMoreThanOneNumberVoiceCall();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
      });
    if (changes['listPhoneNumber'] && this.isOneNumberVoiceCall()) {
      this.callTo = this.phoneFormat.transform(this.listPhoneNumber[0]);
    } else {
      if (this.selectedRole.includes('landlord')) {
        this.selectedRole = this.selectedRole.replace('landlord', 'owner');
      }

      this.callTo =
        (this.selectedUser?.generateUserName || '') +
        ' (' +
        this.userTypeInPTPipe.transform(
          this.selectedRole,
          this.isPTEnvironment,
          {
            contactType: this.selectedUser?.userPropertyContactType?.type,
            type: this.selectedUser?.userPropertyType,
            isPrimary: this.selectedUser?.isPrimary
          }
        ) +
        ')';
    }
  }

  checkIsSelectedPhoneNumber() {
    return (this.isSelectedPhoneNumber = !!this.selectedPhone);
  }

  isOneNumberVoiceCall(): boolean {
    return (
      this.listPhoneNumber.length === 1 &&
      this.typeOfCall === CallTypeEnum.voiceCall
    );
  }

  isMoreThanOneNumberVoiceCall(): boolean {
    return (
      this.listPhoneNumber.length > 1 &&
      this.typeOfCall === CallTypeEnum.voiceCall
    );
  }

  ngOnInit() {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public closeModal(status) {
    this.isCloseModal.next(status);
  }

  public startToCall() {
    if (this.isConsole) return;
    this.isCalling = true;
    if (this.typeOfCall === CallTypeEnum.videoCall) {
      if (this.conversationId) {
        this.isConfirmToCall.emit({ event: true, type: this.typeOfCall });
      }
    } else {
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
          this.isConfirmToCall.emit({
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
          this.isConfirmToCall.emit({
            event: true,
            type: this.typeOfCall,
            phone: selectedPhone
          });
        }
      }
    }
  }

  selectPhone(phone: string) {
    if (!phone) return;
    this.isCalling = false;
    this.selectedPhone = phone;
    this.checkIsSelectedPhoneNumber();
  }
}
