import { Component, Input } from '@angular/core';
import { TabsComponent } from '@shared/components/tabs/tabs.component';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent {
  @Input() tabTitle;
  @Input() isActive: boolean;

  private tabsComponent: TabsComponent;

  constructor(tabs: TabsComponent) {
    this.tabsComponent = tabs;
    this.tabsComponent.addTab(this);
  }

  ngOnDestroy() {
    this.tabsComponent.removeTab(this);
  }
}
