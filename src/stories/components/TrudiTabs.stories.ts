import { CommonModule } from '@angular/common';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import type { NzTabSetComponent } from 'ng-zorro-antd/tabs';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TrudiTabsComponent } from 'src/app/trudi-ui/views/trudi-tabs/trudi-tabs.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
export default {
  title: 'trudi-ui/TrudiTabs',
  component: TrudiTabsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        HttpClientModule,
        NzTabsModule,
        CommonModule,
        RouterTestingModule
      ],
      declarations: [TrudiTabsComponent]
    })
  ],
  argTypes: {
    type: {
      name: 'tab type',
      defaultValue: 'line',
      type: 'string',
      description: 'type of tab',
      control: 'select',
      options: ['card', 'line']
    }
  }
} as Meta;
const templateTrudiTabs: Story<TrudiTabsComponent> = (
  args: TrudiTabsComponent
) => ({
  props: args,
  template: `<div style="width:fit-content"><trudi-tabs [type]="type" [tabs]="tabs"></trudi-tabs></div>`
});

const trudiTabNz: Story<NzTabSetComponent> = (args: NzTabSetComponent) => ({
  props: args,
  template: `
    <nz-tabset class="trudi-tabs">
      <nz-tab *ngFor="let tab of tabs" [nzTitle]="tab.title">{{tab.value}}</nz-tab>
    </nz-tabset>
  `
});

export const TrudiTabs = templateTrudiTabs.bind({});
export const TrudiTabNz = trudiTabNz.bind({});

TrudiTabs.args = {
  type: 'line',
  tabs: [
    {
      title: 'link1',
      link: '',
      queryParam: 'link1'
    },
    {
      title: 'link2',
      link: '',
      queryParam: 'link2'
    },
    {
      title: 'link3',
      link: '',
      queryParam: 'link3'
    },
    {
      title: 'link4',
      link: '',
      queryParam: 'link4'
    }
  ]
};

TrudiTabNz.args = {
  tabs: [
    {
      title: 'link1',
      value: 'value 1'
    },
    {
      title: 'link2',
      value: 'value 2'
    },
    {
      title: 'link3',
      value: 'value 3'
    },
    {
      title: 'link4',
      value: 'value 4'
    }
  ]
};
