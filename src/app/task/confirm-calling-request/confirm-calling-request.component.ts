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
import { Subject } from 'rxjs';
import { CallType, ConfirmToCall } from '@shared/types/share.model';
import { CallTypeEnum, CheckBoxImgPath } from '@shared/enum/share.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { AREA_CODE_PHONE_NUMBER } from '@services/constants';
import { SharedService } from '@services/shared.service';

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
  @Input() selectedUser: string;
  @Input() selectedRole: string;
  @Input() conversationId: string;
  @Input() listPhoneNumber: string[] = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isConfirmToCall = new EventEmitter<ConfirmToCall>();
  @Output() isOpenQuitConfirmModal = new EventEmitter<boolean>();
  private unsubscribe = new Subject<void>();
  public checkBoxImg = CheckBoxImgPath;
  public selectedPhone = '';
  public phoneCallIcon = 'assets/icon/icon-phone-circle.svg';
  public videoCallIcon = 'assets/icon/video_call.svg';
  public callType = 'Audio';
  public callTo = '';
  public callTypeEnum = CallTypeEnum;
  public showListNumber: boolean = false;
  public isConsole: boolean;

  constructor(
    private phoneFormat: PhoneNumberFormatPipe,
    private sharedService: SharedService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['typeOfCall'] && this.typeOfCall) {
      switch (this.typeOfCall) {
        case CallTypeEnum.videoCall:
          this.callType = 'Video';
          break;
        case CallTypeEnum.voiceCall:
          this.callType = 'Phone';
          break;
        default:
          break;
      }
    }

    this.showListNumber = this.isMoreThanOneNumberVoiceCall();

    if (changes['listPhoneNumber'] && this.listPhoneNumber?.length > 0) {
      this.convertListPhoneNumber();
    }

    if (changes['listPhoneNumber'] && this.isOneNumberVoiceCall()) {
      this.callTo = this.phoneFormat.transform(this.listPhoneNumber[0]);
    } else {
      this.callTo = this.selectedUser + ' (' + this.selectedRole + ')';
    }
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

  convertListPhoneNumber() {
    this.listPhoneNumber = this.listPhoneNumber.map((number) => {
      if (number.startsWith('0')) {
        return AREA_CODE_PHONE_NUMBER + number.slice(1).replace(/\s/g, '');
      }
      return number;
    });
  }

  public closeModal(status) {
    this.isCloseModal.next(status);
  }

  public startToCall() {
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
          if (!this.selectedPhone) return;
          this.isConfirmToCall.emit({
            event: true,
            type: this.typeOfCall,
            phone: this.selectedPhone
          });
        } else {
          this.isConfirmToCall.emit({
            event: true,
            type: this.typeOfCall,
            phone: this.listPhoneNumber[0]
          });
        }
      }
    }
  }

  selectPhone(phone: string) {
    if (!phone) return;
    this.selectedPhone = phone;
  }
}
