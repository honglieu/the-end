import { EUserPropertyType } from '@shared/enum/user.enum';
import { BroadcastHelperService } from './../services/broadcast-helper.service';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { auth, conversations } from 'src/environments/environment';
import {
  connect,
  Room,
  createLocalTracks,
  Track,
  LocalDataTrack
} from 'twilio-video';
import dayjs from 'dayjs';
import { ApiService } from '@services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { UserService } from '@services/user.service';
import { CallingService } from '@services/calling.service';
import { FileUploadService } from '@services/fileUpload.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { CallType } from '@shared/types/share.model';
import { VIDEO_CALL_DATA, CALL_TYPE } from '@services/constants';
import { CallTypeEnum } from '@shared/enum/share.enum';
import { SharedService } from '@services/shared.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { combineNames } from '@shared/feature/function.feature';
import { UserService as DBUserService } from '@/app/dashboard/services/user.service';
import * as Sentry from '@sentry/angular-ivy';

const dataTrack = new LocalDataTrack();

export enum CallAction {
  // Portal end call with at least one participant joined
  PORTAL_END_CALL = 'PORTAL_END_CALL',
  // Portal end call with no participants
  PORTAL_CANCEL_CALL = 'PORTAL_CANCEL_CALL'
}

@Component({
  selector: 'app-calling',
  templateUrl: './calling.component.html',
  styleUrls: ['./calling.component.scss']
})
export class CallingComponent implements OnInit, OnDestroy {
  @ViewChild('localTrack') localTrackElement: ElementRef;
  @ViewChild('remoteTrack') remoteTrackElement: ElementRef;
  @ViewChild('btnChangeMic') btnChangeMicElement: ElementRef<HTMLElement>;
  @ViewChild('callTime') callTime: ElementRef<HTMLDivElement>;
  @ViewChild('pText') pText: ElementRef<HTMLDivElement>;

  private unsubscribe = new Subject<void>();
  public isConnecting = true;
  public isWaiting = false;
  public isCalling = false;
  public isVideoCall = false;
  public isMouseMoving = true;
  private timeOutMouseMove: NodeJS.Timer;
  private timeOutMicChange: NodeJS.Timer;
  private timeOutRemoteMicChange: NodeJS.Timer;
  private intervalTimeRecorded: NodeJS.Timer;
  private intervalTimeCall: NodeJS.Timeout;
  private screenshotTimeout: NodeJS.Timeout;
  public isMicOff = false;
  public isMicRemoteOff = false;
  public isMicRemoteOn = true;
  public isMicChange = false;
  public isRemoteMicChange = false;
  public isTakePhoto = false;
  public isRecord = false;
  public isShowScreenshotPopup: boolean = false;
  public track: any;
  public url: string;
  public agentToken: string;
  public roomName: string;
  public messageCallId: string;
  public messageCall: any;
  public receiver;
  public conversationId: string;
  public userId: string;
  public userPropertyId: string;
  public remoteAvt: string;
  public localAvt: string;
  public localType: string;
  public localFirstName: string;
  public localLastName: string;
  public localInfo;
  public propertyId: string;
  public timeRecorded: string;
  public isShowRecordVideoPopup = false;
  public popupModalPosition = ModalPopupPosition;
  public remain15sRecord = false;
  public dataTrackPublished = {} as any;
  public availableTrack = [];
  public getCallTime: any;
  public screenShotImage: string;
  public isShowDisclaimAnnouce: boolean = true;
  public lastSpeakerSID: string;
  public callType: CallType;
  public callTypeEnum = CallTypeEnum;
  public receiverTypeOrPrimary: string = '';
  public receiverType: 'landlord' | 'supplier' | 'tenant' | '';
  public isDefaultType: boolean = false;
  public readonly EUserPropertyType = EUserPropertyType;
  public isShowRM: boolean = false;
  public isPTEnvironment: boolean = false;
  public screenShotImageDimension: {
    width: number;
    height: number;
  };
  public participantJoined: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private websocketService: RxWebsocketService,
    public userService: UserService,
    public DBUserService: DBUserService,
    public callingService: CallingService,
    private fileUpload: FileUploadService,
    private broadcastHelperService: BroadcastHelperService,
    public sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private activatedRoute: ActivatedRoute
  ) {
    combineLatest([
      this.DBUserService.checkUser(),
      this.DBUserService.getSelectedUser()
    ]).subscribe(([user, res]) => {
      if (user && res?.id) {
        this.websocketService.connect(res);
      }
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((param) => {
        this.isPTEnvironment = param['isPTEnvironment'];
      });
    this.callType = this.getCallType();
    const url = this.router.url;
    const parts = url.split('/');
    this.conversationId = parts[parts.length - 3];
    this.propertyId = parts[parts.length - 1].split('?')[0];
    this.initCallData();

    this.dataTrackPublished.promise = new Promise((resolve, reject) => {
      this.dataTrackPublished.resolve = resolve;
      this.dataTrackPublished.reject = reject;
    });

    this.websocketService.onSocketSend
      .pipe(debounceTime(300), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const data = res;
        if (
          data &&
          data.messageType === 'CALL' &&
          (data.message.includes('missed your call') ||
            data.message.includes('has been ended'))
        ) {
          window.loader.ajaxindicatorstop();

          Sentry.captureMessage('Close video call screen', {
            extra: {
              receiver: this.receiver,
              reason: 'receive data from socket',
              data: data
            },
            level: 'debug'
          });

          window.close();
        }
      });
  }

  getCallType(): CallType {
    return localStorage.getItem(CALL_TYPE) as CallType;
  }

  initCallData() {
    const callData = JSON.parse(localStorage.getItem(VIDEO_CALL_DATA));
    if (callData) {
      this.messageCall = callData.messageCall;
      this.intervalTimeCall = setInterval(() => {
        this.getCallTime = this.callingService.getCallTime(this.messageCall);
      }, 1000);
      const options = JSON.parse(callData.options);
      this.receiver = {
        ...callData.receiver,
        fullName: combineNames(
          callData.receiver.firstName,
          callData.receiver.lastName
        )
      };
      this.receiverType = this.callingService.getReceiverType(
        this.receiver?.type
      );
      if (!this.receiver.googleAvatar) {
        this.receiver.textAvatar =
          this.receiver?.firstName?.charAt(0) ||
          '' + ' ' + this.receiver?.lastName?.charAt(0);
      }
      this.agentToken = options.agentToken;
      this.roomName = options.roomName;
      this.messageCallId = callData.messageCall.id;
      this.localAvt = callData.googleAvatar;
      this.localType = callData.type;
      this.localFirstName = callData.firstName;
      this.localLastName = callData.lastName;
      this.userId = callData.user.uid;
      this.userPropertyId = callData.userPropertyId;

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
        this.sharedService.displayName(
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
      this.joinCall();
    }
  }

  async joinCall(type?: CallType) {
    this.participantJoined = false;
    const lt = await createLocalTracks({
      audio: true,
      video: type === 'videoCall'
    });
    lt.forEach((track: any) => {
      this.localTrackElement.nativeElement.appendChild(track.attach());
    });
    await connect(this.agentToken, {
      name: this.roomName,
      tracks: [...lt, dataTrack]
    })
      .then(async (room: Room) => {
        this.onNextToWaiting();
        const changeAudio = document.getElementById('btnChangeMic');
        if (changeAudio) {
          changeAudio.onclick = () => {
            room.localParticipant.audioTracks.forEach((track) => {
              if (track.isTrackEnabled) track.track.disable();
              else track.track.enable();
            });
          };
        }

        room.localParticipant.on('trackPublished', (publication) => {
          if (publication.track === dataTrack) {
            this.dataTrackPublished.resolve();
          }
        });

        room.on('disconnected', (room: Room) => {
          room.localParticipant.audioTracks.forEach((publication) => {
            publication.track.disable();
            publication.track.stop();
            publication.unpublish();
          });
          room.localParticipant.videoTracks.forEach((publication) => {
            publication.track.disable();
            publication.track.stop();
            publication.unpublish();
          });
          room.localParticipant.tracks.forEach((publication: any) => {
            if (publication.kind !== 'data') {
              const attachedElements = publication.track.detach();
              attachedElements.forEach((element: any) => element.remove());
            }
          });

          Sentry.captureMessage('Close video call screen and end call', {
            extra: {
              room: room,
              receiver: this.receiver,
              reason: 'room disconnected'
            },
            level: 'debug'
          });

          this.onEndCall();
        });
        this.remoteTrackElement.nativeElement.childNodes.forEach((s) => {
          if (
            s.nodeName.toLowerCase() === 'video' ||
            s.nodeName.toLowerCase() === 'audio'
          )
            s.remove();
        });
        room.participants.forEach((participant: any) => {
          if (participant.identity === this.receiver.id) {
            participant.tracks.forEach((publication: any) => {
              if (publication.isSubscribed) {
                const track = publication.track;
                this.addAvailableTrack(track);
                if (
                  this.getCallType() === 'videoCall' &&
                  track.kind === 'video'
                ) {
                  this.onNextToCall();
                }
                this.remoteTrackElement.nativeElement.appendChild(
                  track.attach()
                );
                this.checkKindOfTrack(track);
              }
            });

            participant.on('trackSubscribed', (track: any) => {
              this.remoteTrackElement.nativeElement.childNodes.forEach((s) => {
                if (s.nodeName.toLowerCase() === track.kind) s.remove();
              });
              this.remoteTrackElement.nativeElement.appendChild(track.attach());

              if (
                this.getCallType() === 'videoCall' &&
                track.kind === 'video'
              ) {
                this.onNextToCall();
              }

              this.addAvailableTrack(track);
              this.checkKindOfTrack(track);
            });
          }
        });

        room.on('participantConnected', (participant: any) => {
          this.participantJoined = true;
          if (participant.identity === this.receiver.id) {
            this.remoteTrackElement.nativeElement.childNodes.forEach((s) => {
              if (
                s.nodeName.toLowerCase() === 'video' ||
                s.nodeName.toLowerCase() === 'audio'
              )
                s.remove();
            });
            this.onNextToCall();
            participant.tracks.forEach((publication: any) => {
              if (publication.isSubscribed) {
                const track = publication.track;
                this.remoteTrackElement.nativeElement.appendChild(
                  track.attach()
                );
                this.addAvailableTrack(track);
                this.checkKindOfTrack(track);
              }
            });
            participant.on('trackSubscribed', (track: any) => {
              this.addAvailableTrack(track);

              if (
                this.getCallType() === 'videoCall' &&
                track.kind === 'video'
              ) {
                this.onNextToCall();
              }

              if (track.kind === 'audio') {
                this.isMicRemoteOn = true;
                this.onChangeMicRemote();
              }
              this.remoteTrackElement.nativeElement.childNodes.forEach((s) => {
                if (s.nodeName.toLowerCase() === track.kind) s.remove();
              });
              this.remoteTrackElement.nativeElement.appendChild(track.attach());
              this.checkKindOfTrack(track);
            });

            participant.on('trackUnsubscribed', (track: Track) => {
              this.removeAvailableTrack(track);

              if (track.kind === 'audio') {
                this.isMicRemoteOn = false;
                this.onChangeMicRemote();
              }
              if (track.kind === 'video') {
                this.isVideoCall = false;
              }
            });
          }
        });
        room.on('participantDisconnected', (participant: any) => {
          this.remoteTrackElement.nativeElement.childNodes.forEach((s) => {
            if (
              s.nodeName.toLowerCase() === 'video' ||
              s.nodeName.toLowerCase() === 'audio'
            )
              s.remove();
          });

          Sentry.captureMessage('Close video call screen', {
            extra: {
              participant: participant,
              receiver: this.receiver,
              reason: 'participantDisconnected'
            },
            level: 'debug'
          });
          this.onEndCall();
        });
      })
      .catch((e) => {
        console.warn('Unable to connect to Room: ' + e.message);
        this.onEndCall();

        Sentry.captureMessage('End video call', {
          extra: {
            receiver: this.receiver,
            reason: 'Unable to connect to Room',
            error: e
          },
          level: 'debug'
        });
      });
  }

  async addAvailableTrack(track) {
    const tracks = new Set([...this.availableTrack]);
    tracks.add(track.id || track.sid);
    this.availableTrack = Array.from(tracks);
  }

  async removeAvailableTrack(track) {
    this.availableTrack = this.availableTrack.filter(
      (e) => !(e === track.id || e === track.sid)
    );
  }

  checkKindOfTrack(track: any) {
    switch (track.kind) {
      case 'audio':
        this.isMicRemoteOff = !track.isEnabled;
        this.handleTrackAudioDisabled(track);
        break;
      case 'video':
        this.isVideoCall = track.isEnabled;
        this.handleTrackVideoDisabled(track);
        break;
      default:
        break;
    }
  }

  handleTrackAudioDisabled(track: any) {
    track.on('disabled', () => {
      this.removeAvailableTrack(track);
      this.isMicRemoteOff = true;
    });
    track.on('enabled', () => {
      this.addAvailableTrack(track);
      this.isMicRemoteOff = false;
    });
  }

  handleTrackVideoDisabled(track: any) {
    track.on('disabled', () => {
      this.isVideoCall = false;
      this.isCalling = true;
    });
    track.on('enabled', () => {
      this.isVideoCall = true;
      this.isCalling = false;
    });
  }

  onNextToWaiting() {
    this.isConnecting = false;
    this.isWaiting = true;
  }

  onNextToCall() {
    this.isWaiting = false;
    this.isCalling = true;
  }

  onChangeMicRemote() {
    this.isMicRemoteOn = !this.isMicRemoteOn;
    this.isRemoteMicChange = true;
    clearTimeout(this.timeOutRemoteMicChange);
    this.timeOutRemoteMicChange = setTimeout(() => {
      this.isRemoteMicChange = false;
    }, 2000);
  }

  onChangeMic(event: any) {
    this.isMicOff = !this.isMicOff;
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
    const body = {
      roomName: this.roomName,
      action: this.participantJoined
        ? CallAction.PORTAL_END_CALL
        : CallAction.PORTAL_CANCEL_CALL
    };
    if (this.isRecord) {
      this.onRecord();
    }
    this.apiService
      .postAPI(auth, 'call-action', body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (response) => {
          console.debug('End call', response);
          window.loader.ajaxindicatorstop();
        },
        complete: () => {
          window.close();
          window.loader.ajaxindicatorstop();
        }
      });
  }

  sendMessage(message) {
    this.dataTrackPublished.promise.then(() => dataTrack.send(message));
  }

  getDateTimeFormat() {
    return (
      this.agencyDateFormatService.dateFormat$?.value
        ?.DATE_AND_TIME_FORMAT_DAYJS ||
      (localStorage.getItem('dateFormat') &&
        JSON.parse(localStorage.getItem('dateFormat'))
          ?.DATE_AND_TIME_FORMAT_DAYJS) ||
      'hh:mm a DD/MM/YYYY'
    );
  }

  getTimezone() {
    return (
      this.agencyDateFormatService.getCurrentTimezone() ||
      (localStorage.getItem('agencyTimezone') &&
        JSON.parse(localStorage.getItem('agencyTimezone'))) || {
        value: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    );
  }

  handleCapture() {
    if (!this.isVideoCall) return;

    this.sendMessage('capture');

    this.isShowScreenshotPopup = true;
    this.isTakePhoto = true;
    setTimeout(() => {
      this.isTakePhoto = false;
    }, 2000);
    setTimeout(async () => {
      this.isShowScreenshotPopup = false;
      const videoEl =
        this.remoteTrackElement.nativeElement.querySelector('video');
      // Ratio of the video's intrisic dimensions
      var videoRatio = videoEl.videoWidth / videoEl.videoHeight;
      // The width and height of the video element
      var width = videoEl.offsetWidth,
        height = videoEl.offsetHeight;
      // The ratio of the element's width to its height
      var elementRatio = width / height;
      // If the video element is short and wide
      if (elementRatio > videoRatio) width = height * videoRatio;
      // It must be tall and thin, or exactly equal to the original ratio
      else height = width / videoRatio;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas
        .getContext('2d')
        .drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      let image_data_url = canvas.toDataURL('image/jpeg');

      const timezone = this.getTimezone();
      const blob = await fetch(image_data_url).then((res) => res.blob());
      const imgFile = new Blob([blob], {
        type: 'image/jpeg'
      }) as any;
      imgFile.name = `Screenshot-${dayjs()
        .tz(timezone.value)
        .format(this.getDateTimeFormat())
        .toUpperCase()}.jpeg`;
      const data = await this.fileUpload.uploadFile(imgFile);

      this.screenShotImage = data.Location;
      this.screenShotImageDimension = {
        width: width,
        height: height
      };
      this.screenshotTimeout = setTimeout(() => {
        this.screenShotImage = '';
      }, 6500);

      const body = {
        conversationId: this.conversationId,
        link: data.Location,
        size: imgFile.size,
        propertyId: this.propertyId,
        tenantId: this.receiver.type === 'TENANT' ? this.receiver.id : '',
        userId: this.userId,
        messageCallId: this.messageCallId,
        clientDate: dayjs().toISOString()
      };
      this.apiService
        .postAPI(conversations, 'take-image-call', body)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(() => {
          window.loader.ajaxindicatorstop();
        });
    }, 100);
  }

  public handleRecord() {
    if (this.isRecord) {
      this.onRecord();
    } else if (this.isVideoCall) {
      this.isShowRecordVideoPopup = true;
    }
  }

  onRecord() {
    this.dataTrackPublished.promise.then(() =>
      dataTrack.send(!this.isRecord ? 'record_start' : 'record_end')
    );

    const body = {
      conversationId: this.conversationId,
      roomName: this.roomName,
      isRecord: !this.isRecord,
      propertyId: this.propertyId,
      tenantId: this.receiver.type === 'TENANT' ? this.receiver.id : '',
      userId: this.userId,
      userPropertyId: this.userPropertyId,
      clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    window.loader.ajaxindicatorstop();
    window.loader.ajaxindicatorstart(
      body.isRecord ? 'Start recording' : 'Stop recording'
    );

    this.apiService
      .postAPI(conversations, 'record-call', body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        window.loader.ajaxindicatorstop();
        if (!this.isRecord) {
          const timeRecord = 60 * 2.5 - 1; // 2.5 minutes
          this.startTimer(timeRecord);
        }
        this.isRecord = !this.isRecord;
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
    if (this.isRecord) {
      this.remain15sRecord = false;
      clearInterval(this.intervalTimeRecorded);
      return this.onRecord();
    }
    this.isShowRecordVideoPopup = true;
  }

  handleHideDisclaimAnnouce() {
    this.isShowDisclaimAnnouce = false;
  }

  clearInterval() {
    clearInterval(this.intervalTimeCall);
    clearInterval(this.intervalTimeRecorded);
    clearTimeout(this.screenshotTimeout);
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
  handleBeforeUnload(event: any) {
    const body = {
      roomName: this.roomName
    };
    const data = {
      message: 'close',
      body
    };
    this.broadcastHelperService.publish(data);
  }
}
