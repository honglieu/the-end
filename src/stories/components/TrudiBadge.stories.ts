// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, Story } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TrudiBadgeComponent } from 'src/app/trudi-ui/views/trudi-badge/trudi-badge.component';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Badge',
  component: TrudiBadgeComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    icon: {
      name: 'icon',
      type: 'string',
      defaultValue: '',
      description: 'use IconType value',
      control: 'select',
      options: Object.keys(IconType)
    },
    text: {
      name: 'text',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'text'
    },
    variant: {
      name: 'variant',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'select',
      options: [
        'primary',
        'warning',
        'error',
        'role',
        'success',
        'inProgress',
        'unassigned',
        'supplier'
      ]
    },
    size: {
      name: 'size',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'select',
      options: ['small', 'medium', 'large']
    }
  },
  decorators: [
    moduleMetadata({
      imports: [AngularSvgIconModule.forRoot(), HttpClientModule],
      providers: [],
      declarations: [TrudiIconComponent]
    })
  ]
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<TrudiBadgeComponent> = (args: TrudiBadgeComponent) => ({
  props: args,
  template: `
    <div [ngClass]="{'wrapper-badge': allowTruncated}">
      <trudi-badge 
        [text]="text" 
        [icon]="icon" 
        [variant]="variant" 
        [size]="size"
        [allowTruncated]="allowTruncated"
      ></trudi-badge>
    </div>
  `,
  styles: [
    `
      .wrapper-badge {
        width: 90px;
      }
    `
  ]
});

export const normal = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
normal.args = {
  text: 'Badges Name',
  icon: '',
  size: 'medium',
  variant: 'primary',
  allowTruncated: false
};

const TemplateSize: Story<TrudiBadgeComponent> = (
  args: TrudiBadgeComponent
) => ({
  props: args,
  template: `
    <div class="d-flex gap-8">
      <ng-container *ngFor="let item of data">
        <trudi-badge 
          [text]="text" 
          [icon]="icon" 
          [variant]="variant" 
          [size]="size ? size : item"
        ></trudi-badge>
      </ng-container>
    </div>
  `
});

export const sizes = TemplateSize.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
sizes.args = {
  text: 'Badges Name',
  icon: '',
  size: '',
  variant: 'primary',
  data: ['small', 'medium', 'large']
};

const TemplateVariant: Story<TrudiBadgeComponent> = (
  args: TrudiBadgeComponent
) => ({
  props: args,
  template: `
  <div class="d-flex gap-8">
    <ng-container *ngFor="let item of data">
      <trudi-badge 
        [text]="text" 
        [icon]="icon" 
        [variant]="variant ? variant : item" 
        [size]="size"
      ></trudi-badge>
    </ng-container>
  </div>
  `
});

export const variant = TemplateVariant.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
variant.args = {
  text: 'Badges Name',
  icon: '',
  size: 'medium',
  variant: '',
  data: [
    'primary',
    'warning',
    'error',
    'role',
    'success',
    'inProgress',
    'unassigned',
    'supplier'
  ]
};

const TemplateWithIcon: Story<TrudiBadgeComponent> = (
  args: TrudiBadgeComponent
) => ({
  props: args,
  template: `
    <div class="d-flex gap-8" >
      <ng-container *ngFor="let item of data">
          <trudi-badge 
            [text]="text" 
            [icon]="icon" 
            [variant]="variant" 
            [size]="size ? size : item"
          ></trudi-badge>
      </ng-container>
    </div>
  `
});

export const withIcon = TemplateWithIcon.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
withIcon.args = {
  text: 'Badges Name with demo storybook',
  icon: 'link',
  size: '',
  variant: 'primary',
  data: ['small', 'medium', 'large']
};
