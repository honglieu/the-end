import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { TrudiCollapseWidgetComponent } from 'src/app/trudi-ui/views/trudi-widget/trudi-collapse-widget.component';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export default {
  title: 'trudi-ui/TrudiCollapseWidgetComponent',
  component: TrudiCollapseWidgetComponent,
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [
        BrowserAnimationsModule,
        NzCollapseModule,
        AngularSvgIconModule.forRoot(),
        HttpClientModule
      ],
      declarations: [TrudiCollapseWidgetComponent, TrudiIconComponent]
    })
  ]
} as Meta;

const Template1: Story<TrudiCollapseWidgetComponent> = (
  args: TrudiCollapseWidgetComponent
) => ({
  props: args,
  template: `
  <trudi-collapse-widget
    [titleHeader]="headerTextTemplates"
    [createNewIcon]="createNewIcon"
    [activeExpand]="activeExpand"
  >
    <div class="d-flex flex-dir-column" *ngIf="!noContent else noData">
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
    </div>
  </trudi-collapse-widget>
  <ng-template #noData>
    <p class="no-content">No content to display</p>
  </ng-template>
  <ng-template #headerTextTemplates>
    <span>text no transform</span>
  </ng-template>
  `
});
const Template2: Story<TrudiCollapseWidgetComponent> = (
  args: TrudiCollapseWidgetComponent
) => ({
  props: args,
  template: `
  <trudi-collapse-widget
    [titleHeader]="headerImageTemplates"
    [createNewIcon]="createNewIcon"
    [activeExpand]="activeExpand"
  >
    <div class="d-flex flex-dir-column" *ngIf="!noContent else noData">
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
      <div>item box</div>
    </div>
  </trudi-collapse-widget>
  <ng-template #noData>
    <p class="no-content">No content to display</p>
  </ng-template>
  <ng-template #headerImageTemplates>
    <img class="image-header" src="assets/images/logo_dark.png">
  </ng-template>
  `
});

export const WidgetOptionsTextHeader = Template1.bind({});
export const WidgetOptionsImageHeader = Template2.bind({});
WidgetOptionsTextHeader.args = {
  createNewIcon: false,
  activeExpand: true,
  noContent: false
};
WidgetOptionsImageHeader.args = {
  createNewIcon: true,
  activeExpand: false,
  noContent: false
};
