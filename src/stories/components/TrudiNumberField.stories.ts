import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TrudiNumberFieldComponent } from 'src/app/trudi-ui/form/trudi-number-field/trudi-number-field.component';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

export default {
  title: 'trudi-ui/TrudiNumberField',
  component: TrudiNumberFieldComponent,
  argTypes: {
    model: {
      name: 'model',
      defaultValue: 123123,
      description: 'Value of input.',
      type: 'number'
    },
    size: {
      name: 'size',
      defaultValue: 'medium',
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
      defaultValue: 'dollarIcon',
      type: 'string',
      control: 'select',
      options: Object.keys(IconType),
      description:
        'Trudi-icon IconType enum. Icon only show when iconLeft has value.'
    },
    clearable: {
      name: 'clearable',
      defaultValue: false,
      type: 'boolean',
      description: 'Show clear value button at the end of input.'
    },
    prefixText: {
      name: 'prefixText',
      defaultValue: 'Text',
      type: 'string',
      description:
        'Prefix text of the component. If exist both iconLeft and prefixText, the text will take priority in displaying'
    },
    maxCharacter: {
      name: 'maxCharacter',
      defaultValue: 12,
      type: 'number',
      description: 'character of input'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [HttpClientModule, FormsModule, AngularSvgIconModule.forRoot()],
      declarations: [TrudiIconComponent]
    })
  ]
} as Meta;

const TemplateWithPrefixIcon: Story<TrudiNumberFieldComponent> = (
  args: TrudiNumberFieldComponent
) => ({
  props: args,
  template: `
    <div>
      <trudi-number-field
        [iconLeft]="iconLeft"
        [label]="label"
        [size]="size"
        [placeholder]="placeholder"
        [(ngModel)]="model"
        required
        [disabled]="disabled"
        [clearable]="clearable"
        [maxCharacter]="maxCharacter"
      ></trudi-number-field>
    </div>
  `
});

const TemplateWithPrefixText: Story<TrudiNumberFieldComponent> = (
  args: TrudiNumberFieldComponent
) => ({
  props: args,
  template: `
    <div>
      <trudi-number-field
        [prefixText]="prefixText"
        [label]="label"
        [size]="size"
        [placeholder]="placeholder"
        [(ngModel)]="model"
        required
        [disabled]="disabled"
        [clearable]="clearable"
        [maxCharacter]="maxCharacter"
      ></trudi-number-field>
    </div>
  `
});

export const TrudiNumberFieldWithPrefixIcon = TemplateWithPrefixIcon.bind({});
export const TrudiNumberFieldWithPrefixText = TemplateWithPrefixText.bind({});

TrudiNumberFieldWithPrefixIcon.args = {
  model: 123123,
  label: 'Label',
  placeholder: 'Input Text',
  iconLeft: 'dollarIcon',
  size: 'extra-large',
  disabled: false,
  clearable: true,
  maxCharacter: 12
};

TrudiNumberFieldWithPrefixText.args = {
  model: 123123,
  label: 'Label',
  placeholder: 'Input Text',
  size: 'extra-large',
  disabled: false,
  clearable: true,
  prefixText: 'Text',
  maxCharacter: 12
};
