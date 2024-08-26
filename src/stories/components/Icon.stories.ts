import { CommonModule, NgStyle } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

export default {
  title: 'trudi-ui/Icon',
  component: TrudiIconComponent,
  argTypes: {
    icon: {
      name: 'icon',
      type: { name: 'string', required: true },
      defaultValue: '',
      description: 'use IconType value',
      control: 'select',
      options: Object.keys(IconType)
    },
    style: {
      name: 'style',
      type: NgStyle,
      defaultValue: '',
      description: 'style',
      control: {
        type: 'object'
      }
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        CommonModule,
        FormsModule
      ],
      providers: []
    })
  ]
} as Meta;

const Template: Story<TrudiIconComponent> = (args: TrudiIconComponent) => ({
  props: args,
  template: `
    <div [ngStyle]="{ display: 'flex', 'align-items': 'center', 'flex-wrap': 'wrap', width: '1600px' }">
      <div
        *ngFor="let icon of icons"
        [ngStyle]="{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', height: '100px', width: '160px', gap: '8px' }">
        <trudi-icon [icon]="icon" [style]="style"></trudi-icon>
        <div>{{ icon }}</div>
      <div> 
    <div>
  `
});

export const Icon = Template.bind({});
Icon.args = {
  icons: Object.keys(IconType),
  style: { 'width.px': 40, 'height.px': 40, color: 'red' }
};
