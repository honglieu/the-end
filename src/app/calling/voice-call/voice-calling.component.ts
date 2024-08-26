import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Call, Device } from '@twilio/voice-sdk';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { CallingService } from '@services/calling.service';
import { PropertiesService } from '@services/properties.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { CallType } from '@shared/types/share.model';
import { CALL_TYPE } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { LoadingService } from '@services/loading.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';

enum VoiceCallState {
  initiated = 'initiated',
  ringing = 'ringing',
  inProgress = 'in-progress',
  completed = 'completed',
  busy = 'busy',
  noAnswer = 'no-answer',
  failed = 'failed'
}

@Component({
  selector: 'app-voice-calling',
  templateUrl: './voice-calling.component.html',
  styleUrls: ['./voice-calling.component.scss']
})
export class VoiceCallingComponent implements OnInit, OnDestroy {
  public UserType = EUserPropertyType;
  private unsubscribe = new Subject<void>();
  public isConnecting = true;
  public isWaiting = false;
  public isCalling = false;
  public isMouseMoving = true;
  private timeOutMouseMove: NodeJS.Timer;
  private timeOutMicChange: NodeJS.Timer;
  private intervalTimeRecorded: NodeJS.Timer;
  private intervalTimeCall: NodeJS.Timeout;
  private intervalCallingTime: NodeJS.Timer;
  public isMicLocalUserOff = false;
  public isMicParticipantOff = false;
  public isMicChange = false;
  public isRecord = false;
  public token: string;
  public messageCallId: string;
  public messageCall: any;
  public receiver;
  public conversationId: string;
  public userId: string;
  public remoteAvt: string;
  public localAvt: string;
  public localInfo;
  public urlCalling: string;
  public propertyId: string;
  public timeRecorded: string;
  public isShowRecordVideoPopup = false;
  public popupModalPosition = ModalPopupPosition;
  public remain15sRecord = false;
  public getCallTime: any;
  public device: Device;
  public call: Call;
  public isShowDisclaimAnnouce = true;
  public participantTalking = false;
  public localUserTalking = false;
  public callSid = '';
  public isEndCall = false;
  public phoneNumber = '';
  public disableRecord = true;
  public joinedVoiceCall = false;
  public callingTime: number = 0;
  public receiverFullName: string = '';
  public receiverTypeOrPrimary: string = '';
  public receiverType: 'landlord' | 'supplier' | 'tenant' | '';
  public isDefaultType: boolean = false;
  public localFirstName: string = '';
  public localLastName: string = '';
  public receiverId: string;
  public isPTEnvironment: boolean = false;

  constructor(
    private router: Router,
    private websocketService: RxWebsocketService,
    public userService: UserService,
    public callingService: CallingService,
    private propertyService: PropertiesService,
    private loadingService: LoadingService,
    public shareService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private activatedRoute: ActivatedRoute
  ) {
    combineLatest([
      this.userService.checkUser(),
      this.userService.getSelectedUser()
    ]).subscribe(([user, res]) => {
      if (user && res?.id) {
        this.websocketService.connect(res);
      }
    });
  }

  ngOnInit() {
    const callType = this.getCallType();
    const url = this.router.url;
    const parts = url.split('/');
    this.phoneNumber = this.getPhoneNumber();
    this.conversationId = parts[parts.length - 3];
    this.receiverId = parts[parts.length - 2];
    this.propertyId = parts[parts.length - 1].split('?')[0];
    this.urlCalling = url;
    this.startCall();

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((param) => {
        this.isPTEnvironment = param['isPTEnvironment'];
      });

    this.websocketService.onSocketVoiceStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.status) {
          switch (res?.status) {
            case VoiceCallState.initiated:
              this.onNextToWaiting();
              break;
            case VoiceCallState.ringing:
              break;
            case VoiceCallState.inProgress:
              if (this.joinedVoiceCall) return;
              this.intervalCallingTime = setInterval(() => {
                this.callingTime += 1;
              }, 1000);
              this.onNextToCall();
              break;
            case VoiceCallState.completed:
              this.onEndCall();
              break;
            case VoiceCallState.busy:
              this.onEndCall();
              break;
            case VoiceCallState.noAnswer:
              this.onEndCall();
              break;
            case VoiceCallState.failed:
              this.onEndCall();
              break;
            default:
              this.onEndCall();
              break;
          }
        }
      });
  }

  getCallType(): CallType {
    return localStorage.getItem(CALL_TYPE) as CallType;
  }

  getPhoneNumber(): string {
    return localStorage.getItem('VOICE_CALL_NUMBER')?.trim();
  }

  startCall() {
    this.loadingService.onLoading();
    this.callingService
      .startVoiceCall(
        this.conversationId,
        `${this.urlCalling}`,
        this.receiverId,
        this.propertyId
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            this.loadingService.stopLoading();
            this.messageCall = res.messageCall;
            // 5 minutes
            this.intervalTimeCall = setInterval(() => {
              this.getCallTime = this.callingService.getCallTime(
                this.messageCall
              );
            }, 1000);
            const options = JSON.parse(res.options);
            this.receiver = res.receiver;

            this.receiverType = this.callingService.getReceiverType(
              this.receiver?.type
            );

            this.receiverFullName = this.shareService.displayName(
              this.receiver.firstName,
              this.receiver?.lastName
            );

            let userType = {
              owner: EUserPropertyType.OWNER,
              receiverType:
                USER_TYPE_IN_RM[this.receiver?.type] || this.receiver?.type
            };

            if (this.receiver?.isPrimary) {
              userType = {
                owner: userType.owner.toLowerCase() as EUserPropertyType,
                receiverType: userType.receiverType.toLowerCase()
              };
            }

            this.receiverTypeOrPrimary =
              this.shareService.displayName(
                this.receiver.isPrimary ? 'Primary' : '',
                this.receiver?.type === EUserPropertyType.LANDLORD
                  ? userType.owner
                  : userType.receiverType
              ) || '';

            if (
              (this.receiver?.type !== EUserPropertyType.LANDLORD &&
                USER_TYPE_IN_RM[this.receiver?.type]) ||
              (this.receiver?.type && this.receiver?.isPrimary)
            ) {
              this.isDefaultType = true;
            }

            if (!this.receiver.googleAvatar) {
              this.receiver.textAvatar =
                this.receiver?.firstName?.charAt(0) ||
                '' + ' ' + this.receiver?.lastName?.charAt(0);
            }
            this.token = options.token;
            this.messageCallId = res.messageCall.id;
            this.localAvt = res.googleAvatar;
            this.localFirstName = res.firstName;
            this.localLastName = res.lastName;
            this.userId = res.user.uid;
            this.propertyService.currentProperty.next({ id: res.propertyId });
            this.joinPhoneCall();
          }
        },
        error: (error) => {
          this.loadingService.stopLoading();
        }
      });
  }

  async joinPhoneCall() {
    if (this.token) {
      this.device = new Device(this.token);

      this.device.on('error', () => {
        this.onEndCall();
      });

      await this.device
        .connect({
          params: {
            To: this.phoneNumber,
            MessageCallId: this.messageCallId,
            UserId: this.userId
          },
          rtcConstraints: {
            audio: true
          }
        })
        .then((call: Call) => {
          if (!call || !Object.keys(call).length) return;

          call.on('disconnect', (call) => {
            this.onEndCall();
          });

          call.on('volume', () => {
            if (!this.callSid) {
              this.callSid = call?.parameters['CallSid'];
            }
            call.mute(this.isMicLocalUserOff);
          });

          call.on('sample', (sample) => {
            if (!this.isWaiting && !this.isConnecting) {
              this.localUserTalking = sample.audioInputLevel > 8500;
              this.participantTalking = sample.audioOutputLevel > 3500;
            }
          });

          call.on('error', () => {
            this.onEndCall();
          });
        });
    }
  }

  onNextToWaiting() {
    this.isConnecting = false;
    this.isWaiting = true;
  }

  onNextToCall() {
    this.joinedVoiceCall = true;
    this.isWaiting = false;
    this.isCalling = true;
    this.disableRecord = false;
    this.callingService
      .joinVoiceCall({
        messageCallId: this.messageCallId,
        userId: this.receiver?.id,
        propertyId: this.propertyId
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {},
        error: (err) => {
          this.closeCallWindow();
        }
      });
  }

  onChangeLocalUserMic() {
    this.isMicLocalUserOff = !this.isMicLocalUserOff;
    this.isMicChange = true;
    clearTimeout(this.timeOutMicChange);
    this.timeOutMicChange = setTimeout(() => {
      this.isMicChange = false;
    }, 2000);
  }

  onChangeMouseEvent() {
    if (this.isCalling) {
      this.isMouseMoving = true;
      clearTimeout(this.timeOutMouseMove);
      this.timeOutMouseMove = setTimeout(() => {
        this.isMouseMoving = false;
      }, 5000);
    }
  }

  onEndCall() {
    if (this.isEndCall) return;
    this.isEndCall = true;
    this.callingService
      .endVoiceCall(this.callSid, this.messageCallId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.closeCallWindow();
        },
        error: (err) => {
          this.closeCallWindow();
        }
      });
  }

  public handleRecord() {
    if (this.isRecord) {
      this.onRecord();
    } else {
      this.isShowRecordVideoPopup = true;
    }
  }

  onRecord() {
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    const body = {
      callSid: this.callSid,
      isRecord: !this.isRecord,
      propertyId: this.propertyId,
      tenantId: this.receiver.type === 'TENANT' ? this.receiver.id : '',
      userId: this.userId,
      clientTimeZone: tz?.value,
      time: this.callingTime,
      messageCallId: this.messageCallId
    };
    this.loadingService.stopLoading();
    window.loader.ajaxindicatorstart(
      body.isRecord ? 'Start recording' : 'Stop recording'
    );

    this.callingService
      .recordVoiceCall(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stopLoading();
          window.loader.ajaxindicatorstop();
          if (!this.isRecord) {
            const timeRecord = 60 * 2.5 - 1; // 2.5 minutes
            this.startTimer(timeRecord);
          }
          this.isRecord = !this.isRecord;
        },

        error: (err) => {
          this.closeCallWindow();
        }
      });
  }

  onStartRecord(status: boolean) {
    this.isShowRecordVideoPopup = false;
    if (status) {
      this.onRecord();
    }
  }

  startTimer(duration: number) {
    clearInterval(this.intervalTimeRecorded);
    this.timeRecorded = '';
    let timer = duration;
    let minutes: number | string, seconds: number | string;
    this.intervalTimeRecorded = setInterval(() => {
      minutes = parseInt((timer / 60).toString(), 10);
      seconds = parseInt((timer % 60).toString(), 10);

      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;

      if (--timer < 15) {
        this.remain15sRecord = true;

        if (timer < 0) {
          clearInterval(this.intervalTimeRecorded);
          this.remain15sRecord = false;
          this.isRecord && this.onRecord();
        }
      }

      this.timeRecorded = minutes + ':' + seconds;
    }, 1000);
  }

  showPopupRecord() {
    if (this.disableRecord) return;
    if (this.isRecord) {
      return this.onRecord();
    }
    this.isShowRecordVideoPopup = true;
  }

  closeCallWindow() {
    this.loadingService.stopLoading();
    this.device.destroy();
    window.close();
  }

  clearInterval() {
    clearInterval(this.intervalTimeCall);
    clearInterval(this.intervalTimeRecorded);
    clearInterval(this.intervalCallingTime);
  }

  handleHideDisclaimAnnouce() {
    this.isShowDisclaimAnnouce = false;
  }

  ngOnDestroy() {
    this.clearInterval();
    this.onEndCall();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    this.onChangeMouseEvent();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.onChangeMouseEvent();
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event) {
    this.onEndCall();
  }
}
