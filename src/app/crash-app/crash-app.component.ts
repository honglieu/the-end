import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ElectronService } from '@services/electron.service';
import { CRASH_APP } from '@/helpers/electron/constants';

@Component({
  selector: 'app-crash',
  templateUrl: './crash-app.component.html',
  styleUrls: ['./crash-app.component.scss']
})
export class CrashAppComponent implements OnInit {
  constructor(private electronService: ElectronService) {}

  ngOnInit() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send(CRASH_APP);
    }
  }
}
