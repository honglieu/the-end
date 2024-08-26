import { TrudiUiModule } from '../../app/trudi-ui/trudi-ui.module';
import { SelectModule } from 'src/app/trudi-ui/select/select.module';
import { TrudiSelectReminderComponent } from '../../app/trudi-ui/select/trudi-select-reminder/trudi-select-reminder.component';
import type { Meta, Story } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { HttpClientModule } from '@angular/common/http';

export default {
  title: 'trudi-ui/Select/TrudiReminderSelect',
  component: TrudiSelectReminderComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        NgSelectModule,
        BrowserAnimationsModule,
        FormsModule,
        SelectModule,
        TrudiUiModule,
        CommonModule,
        NzSkeletonModule,
        HttpClientModule
      ],
      declarations: []
    })
  ],
  argTypes: {
    type: {
      name: 'time type',
      defaultValue: 'hours',
      type: 'string',
      description: 'type of time',
      control: 'select',
      options: ['date', 'timeLine', 'hours']
    },
    dateSelectModel: {
      name: 'date select',
      defaultValue: 1,
      type: 'number',
      description: 'date data',
      control: 'select',
      options: [0, 1, 3, 5, 7]
    },
    timeLineSelectModel: {
      name: 'time line select',
      defaultValue: 'before',
      type: 'string',
      description: 'select time line',
      control: 'select',
      options: ['before', 'after']
    },
    hoursSelectModel: {
      name: 'hours select',
      defaultValue: '8:00 AM',
      type: 'string'
    }
  }
} as Meta;
export const Default: Story = (args) => ({
  template: `
  <trudi-select-reminder
  [type]="type"
  [(ngModel)]="selectValue"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [startHour]="startHour"
  [startMinute]="startMinute"
  [endHour]="endHour"
  [endMinute]="endMinute"
  >
  </trudi-select-reminder>
  <div>select value : {{selectValue}}</div>
  `,
  props: args
});
Default.args = {
  startHour: 8,
  startMinute: 0,
  endHour: 23,
  endMinute: 0,
  bindLabel: 'label',
  bindValue: 'value'
};
export const TrudiReminderExample: Story = (args) => ({
  template: `
  <div style="display: flex; justify-content: center;">
  <trudi-select-reminder
  type="date"
  [(ngModel)]="dateSelectModel"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [startHour]="startHour"
  [startMinute]="startMinute"
  [endHour]="endHour"
  [endMinute]="endMinute"
  >
  </trudi-select-reminder>
  <trudi-select-reminder
  type="hours"
  [(ngModel)]="hoursSelectModel"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [startHour]="startHour"
  [startMinute]="startMinute"
  [endHour]="endHour"
  [endMinute]="endMinute"
  >
  </trudi-select-reminder>
  <trudi-select-reminder
  type="timeline"
  [(ngModel)]="timeLineSelectModel"
  [bindValue]="bindValue"
  [bindLabel]="bindLabel"
  [startHour]="startHour"
  [startMinute]="startMinute"
  [endHour]="endHour"
  [endMinute]="endMinute"
  >
  </trudi-select-reminder>
  </div>
  <div> hours value : {{hoursSelectModel}}<div><br>
  <div> date value : {{dateSelectModel}}<div><br>
  <div> timeline value : {{timeLineSelectModel}}<div><br>
  `,
  props: args
});
TrudiReminderExample.args = {
  startHour: 8,
  startMinute: 0,
  endHour: 23,
  endMinute: 0,
  bindLabel: 'label',
  bindValue: 'value'
};
