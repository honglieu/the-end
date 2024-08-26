import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiTextFieldComponent } from 'src/app/trudi-ui/form/trudi-text-field/trudi-text-field.component';

export default {
  title: 'trudi-ui/TrudiTextField',
  component: TrudiTextFieldComponent,
  argTypes: {
    model: {
      name: 'model',
      defaultValue: '123123',
      description: 'Value of input.',
      type: 'string'
    },
    size: {
      name: 'size',
      defaultValue: 'extra-large',
      type: 'string',
      description: 'Size of input',
      control: 'select',
      options: ['small', 'medium', 'large', 'extra-large']
    },
    disabled: {
      name: 'disabled',
      defaultValue: false,
      type: 'boolean',
      description: 'Disable input'
    },
    label: {
      name: 'label',
      defaultValue: 'Input Text',
      type: 'string',
      description:
        'Label of the input. If empty then it will not show up on DOM.'
    },
    placeholder: {
      name: 'placeholder',
      defaultValue: 'Input Text',
      type: 'string',
      description: 'Placeholder of the input.'
    },
    iconLeft: {
      name: 'iconLeft',
      defaultValue: 'calendar2',
      type: 'string',
      control: 'select',
      options: Object.keys(IconType),
      description:
        'Trudi-icon IconType enum. Icon only show when iconLeft has value.'
    },
    clearable: {
      name: 'clearable',
      defaultValue: true,
      type: 'boolean',
      description: 'Show clear value button at the end of input.'
    },
    prefixText: {
      name: 'prefixText',
      defaultValue: 'Text',
      type: 'string',
      description:
        'Prefix text of the component. If exist both iconLeft and prefixText, the text will take priority in displaying'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [HttpClientModule, FormsModule, AngularSvgIconModule.forRoot()],
      declarations: [TrudiIconComponent]
    })
  ]
} as Meta;

const TemplateWithPrefixIcon: Story<TrudiTextFieldComponent> = (
  args: TrudiTextFieldComponent
) => ({
  props: args,
  template: `
    <div>
      <trudi-text-field
        [iconLeft]="iconLeft"
        [label]="label"
        [size]="size"
        [placeholder]="placeholder"
        [(ngModel)]="model"
        required
        [disabled]="disabled"
        [clearable]="clearable"
      ></trudi-text-field>
    </div>
  `
});

const TemplateWithPrefixText: Story<TrudiTextFieldComponent> = (
  args: TrudiTextFieldComponent
) => ({
  props: args,
  template: `
    <div>
      <trudi-text-field
        [prefixText]="prefixText"
        [label]="label"
        [size]="size"
        [placeholder]="placeholder"
        [(ngModel)]="model"
        required
        [disabled]="disabled"
        [clearable]="clearable"
      ></trudi-text-field>
    </div>
  `
});

export const TrudiTextFieldWithPrefixIcon = TemplateWithPrefixIcon.bind({});
export const TrudiTextFieldWithPrefixText = TemplateWithPrefixText.bind({});

TrudiTextFieldWithPrefixIcon.args = {
  model: '1235',
  label: 'Label',
  placeholder: 'Input Text',
  iconLeft: 'calendar2',
  size: 'extra-large',
  disabled: false,
  clearable: true
};

TrudiTextFieldWithPrefixText.args = {
  model: '1235',
  label: 'Label',
  placeholder: 'Input Text',
  size: 'extra-large',
  disabled: false,
  clearable: true,
  prefixText: 'Text'
};
