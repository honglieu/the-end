import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef,
  Inject
} from '@angular/core';
import { CallingService } from '@services/calling.service';
import { MessageCallSocketSendData } from '@shared/types/socket.interface';

@Component({
  selector: 'app-call-inprogress-notify-v2',
  templateUrl: './call-inprogress-notify.component.html',
  styleUrls: ['./call-inprogress-notify.component.scss']
})
export class CallInprogressNotifyComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() message: any;
  @Input() isShow: boolean;
  @Input() lastCall: MessageCallSocketSendData;

  public isShowNoti: boolean = false;
  public isRemoveMessage: boolean = true;
  public callTime: string;
  private showNotiTimeout: NodeJS.Timeout;
  private hideNotiTimeout: NodeJS.Timeout;
  private inprogessCallTimeout: NodeJS.Timeout;

  constructor(
    private callingService: CallingService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  handleGetTimeLastCall = () => {
    if (this.lastCall && !this.inprogessCallTimeout) {
      const startTime = new Date(this.lastCall.createdAt).getTime();
      this.inprogessCallTimeout = setInterval(() => {
        const endTime = new Date().getTime();
        const secondDiff = (endTime - startTime) % 60000;
        const minutesDiff = (endTime - startTime - secondDiff) % 3600000;
        const hoursDiff = endTime - startTime - minutesDiff - secondDiff;
        let res = '';
        if (hoursDiff) {
          res += `${Math.trunc(hoursDiff / 3600000)}:`;
        }
        res += `${this.callingService.pad(
          Math.trunc(minutesDiff / 60000),
          2
        )}:${this.callingService.pad(Math.trunc(secondDiff / 1000), 2)}`;
        this.callTime = res;
        this.cdr.markForCheck();
      }, 1000);
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    this.handleShowNotify(changes);
  }

  handleShowNotify(changes: SimpleChanges) {
    const { isShow, message, lastCall } = changes;

    if (lastCall && lastCall.currentValue) {
      this.handleGetTimeLastCall();
    }

    if (isShow && isShow.currentValue) {
      this.isRemoveMessage = !this.isShow;
      this.showNotiTimeout = setTimeout(() => {
        this.isShowNoti = this.isShow;
      }, 1000);
    } else {
      this.isShowNoti = this.isShow;
      this.hideNotiTimeout = setTimeout(() => {
        this.isRemoveMessage = !this.isShow;
      }, 1000);
      clearInterval(this.inprogessCallTimeout);
      this.inprogessCallTimeout = null;
    }

    if (!message?.currentValue && !lastCall?.currentValue) {
      this.isShowNoti = false;
      this.hideNotiTimeout = setTimeout(() => {
        this.isRemoveMessage = true;
      }, 1000);
      clearInterval(this.inprogessCallTimeout);
      this.inprogessCallTimeout = null;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.showNotiTimeout);
    clearTimeout(this.hideNotiTimeout);
    clearInterval(this.inprogessCallTimeout);
  }
}
