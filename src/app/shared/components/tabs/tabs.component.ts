import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ControlPanelService,
  ControlPanelTab
} from '@/app/control-panel/control-panel.service';
import { FilesService, FileTabTypes } from '@services/files.service';
import { TabComponent } from './tab/tab.component';
import { PropertiesService } from '@services/properties.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit, OnDestroy {
  @Input() margin = '0px';
  @Input() isReadConversation: boolean = false;
  @Input() checkConversation: boolean = false;
  @Output() currentTabIndex = new EventEmitter<number>();
  private unsubscribe = new Subject<void>();
  private tabList = FileTabTypes;
  public controlPanelTab = ControlPanelTab;
  tabs: TabComponent[] = [];

  constructor(
    private panelService: ControlPanelService,
    private filesService: FilesService,
    private propertyService: PropertiesService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  addTab(tab: TabComponent) {
    this.tabs.push(tab);
  }

  removeTab(tab: TabComponent) {
    const index = this.tabs.findIndex((el) => el.tabTitle === tab.tabTitle);
    if (index > -1) {
      this.tabs.splice(index, 1);
    }
  }

  selectTab(tab: TabComponent, index: number) {
    this.currentTabIndex.emit(index);
    this.panelService.currentTab =
      this.controlPanelTab[tab.tabTitle.toLowerCase()];
    this.filesService.currentFileTab.next(this.tabList.appUser);
    this.panelService.setPreviousTab(this.tabs.indexOf(tab));
  }
}
