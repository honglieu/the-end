import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { ElectronService } from '@services/electron.service';
import {
  REFRESH_APP_LATER,
  REFRESH_APP,
  SHOW_REFRESH_POPUP
} from 'src/helpers/electron/constants';
import { IShowPopupNotifyNewVersion } from '@shared/types/trudi.interface';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'notify-new-version-popup',
  templateUrl: './notify-new-version-popup.component.html',
  styleUrls: ['./notify-new-version-popup.component.scss']
})
export class NotifyNewVersionPopupComponent implements OnInit, AfterViewInit {
  @ViewChild('popupNotifyNewVersionElement', { static: false })
  popupNotifyNewVersionElement: ElementRef;
  @Output() onNotifyLater = new EventEmitter<boolean>();
  @Output() onReload = new EventEmitter();
  @Output() onShow = new EventEmitter<boolean>();
  @Input() showPopup: boolean = false;
  public dataShowPopupNotifyNewVersion: IShowPopupNotifyNewVersion;

  public electronApp: boolean = false;
  constructor(
    private electronService: ElectronService,
    private sharedService: SharedService
  ) {
    this.electronApp = this.electronService.isElectronApp;
    if (this.electronApp) {
      this.electronService.ipcRenderer.on(SHOW_REFRESH_POPUP, () => {
        this.onShow.emit(true);
        this.getOptionShowPopupNotifyNewVersion();
      });
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.getOptionShowPopupNotifyNewVersion();
  }

  handleNotifyLaterBtn() {
    this.electronService.ipcRenderer.send(REFRESH_APP_LATER);
    this.onShow.emit(false);
  }

  handleReloandBtn() {
    this.electronService.ipcRenderer.send(REFRESH_APP);
    this.onShow.emit(false);
  }

  getOptionShowPopupNotifyNewVersion() {
    if (!!this.onShow) {
      const popupHeight =
        this.popupNotifyNewVersionElement.nativeElement.clientHeight;
      this.dataShowPopupNotifyNewVersion = {
        isShowPopup: !!this.onShow,
        heighPopup: popupHeight
      };
      this.sharedService.setShowPopupNotifyNewVersion(
        this.dataShowPopupNotifyNewVersion
      );
    } else {
      this.sharedService.setShowPopupNotifyNewVersion(null);
    }
  }
}
