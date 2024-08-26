import type { Meta, Story } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TrudiSingleSelectComponent } from 'src/app/trudi-ui/select/trudi-single-select/trudi-single-select.component';
import { SelectModule } from 'src/app/trudi-ui/select/select.module';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { action } from '@storybook/addon-actions';

const items = [
  {
    id: 1,
    label: 'Task 1',
    status: 1
  },
  {
    id: 2,
    label: 'Task 2',
    status: 2
  },
  {
    id: 3,
    label: 'Task 3',
    status: 1
  },
  {
    id: 4,
    label: 'Task 4',
    status: 2
  },
  {
    id: 5,
    label: 'Task 5',
    status: 3
  },
  {
    id: 6,
    label: 'Task 6',
    status: 3
  },
  {
    id: 7,
    label: 'Task 7',
    status: 2
  },
  {
    id: 8,
    label: 'Task 8',
    status: 2
  }
];

export default {
  title: 'trudi-ui/Select/TrudiSingleSelect',
  component: TrudiSingleSelectComponent,
  argTypes: {
    scrollToEnd: {
      action: 'scrollToEnd',
      description: 'Emit when dropdown panel scrolled to end.'
    },
    search: {
      action: 'search',
      description: 'Emit when user typing in input.'
    },
    footerClick: {
      action: 'footerClick',
      description: 'Emit when user clicked on footer button.'
    }
  },
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        HttpClientModule,
        NgSelectModule,
        BrowserAnimationsModule,
        FormsModule,
        SelectModule,
        TrudiUiModule,
        CommonModule,
        NzSkeletonModule
      ]
    })
  ],
  args: {}
} as Meta;
export const Default: Story = (args) => ({
  template: `
  <div style="width: 300px">
    <trudi-single-select
    [items]="items"
    [(ngModel)]="model"
    (scrollToEnd)="scrollToEnd($event)"
    [bindValue]="bindValue"
    [bindLabel]="bindLabel"
    [groupBy]="groupBy"
    [required]="true"
    [loading]="loading"
    [virtualScroll]="true"
    [label]="label"
    name="selectedTaskName"
    #selectTaskNameModel="ngModel"
    (search)="search($event)">
    </trudi-single-select>
  </div>
  `,
  props: args
});

Default.args = {
  items: items,
  loading: false,
  model: 1,
  label: 'Task',
  bindLabel: 'label',
  bindValue: 'id',
  scrollToEnd: (event) => {
    action('scrollToEnd')(event);
  },
  search: (event) => {
    action('search')(event);
  }
};

export const Group = Default.bind({});
Group.args = {
  items: items,
  loading: false,
  model: 1,
  label: 'Task',
  bindLabel: 'label',
  bindValue: 'id',
  groupBy: 'status'
};

export const Loading = Default.bind({});

Loading.args = {
  items: [],
  loading: true,
  model: 0,
  label: 'Task',
  bindLabel: 'label',
  bindValue: 'id'
};

const TrudiSingleSelectWithFooter: Story = (args) => ({
  template: `
  <div style="width: 300px">
  <trudi-single-select
  [items]="items"
  [(ngModel)]="model"
  (scrollToEnd)="scrollToEnd($event)"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [groupBy]="groupBy"
  [required]="true"
  [loading]="loading"
  [virtualScroll]="true"
  [label]="label"
  name="selectedTaskName"
  #selectTaskNameModel="ngModel"
  (search)="search($event)"
  (footerClick)="footerClick($event)">
  <ng-template trudi-footer-tmp>
    <div class="p-2">
      <button style=" font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      color: var(--bg-brand-solid-normal, #00aa9f);
      background: transparent;
      border: none;">
        Button
      </button>
    </div>
  </ng-template>
  </trudi-single-select>
</div>
`,
  props: args
});
export const CustomFooter = TrudiSingleSelectWithFooter.bind({});

CustomFooter.args = {
  items: items,
  loading: false,
  model: 1,
  label: 'Task',
  bindLabel: 'label',
  bindValue: 'id',
  scrollToEnd: (event) => {
    action('scrollToEnd')(event);
  },
  search: (event) => {
    action('search')(event);
  },
  footerClick: (event) => {
    action('footerClick')(event);
  }
};

const TrudiSingleSelectWithOption: Story = (args) => ({
  template: `
  <div style="width: 300px">
  <trudi-single-select
  [items]="items"
  [(ngModel)]="model"
  (scrollToEnd)="scrollToEnd($event)"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [groupBy]="groupBy"
  [required]="true"
  [loading]="loading"
  [virtualScroll]="true"
  [label]="label"
  name="selectedTaskName"
  #selectTaskNameModel="ngModel"
  (search)="search($event)"
  (footerClick)="footerClick($event)">
  <ng-template trudi-option-tmp let-item="item" let-searchTerm="searchTerm">
    <div>{{item.label}}</div>
  </ng-template>
  </trudi-single-select>
</div>
`,
  props: args
});

export const CustomOption = TrudiSingleSelectWithOption.bind({});

CustomOption.args = {
  items: items,
  loading: false,
  model: 1,
  label: 'Task',
  bindLabel: 'label',
  bindValue: 'id',
  scrollToEnd: (event) => {
    action('scrollToEnd')(event);
  },
  search: (event) => {
    action('search')(event);
  },
  footerClick: (event) => {
    action('footerClick')(event);
  }
};
