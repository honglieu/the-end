import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrudiSwitchComponent } from 'src/app/trudi-ui/form/trudi-switch/trudi-switch.component';
import type { Story } from '@storybook/angular/types-6-0';

export default {
  title: 'trudi-ui/TrudiSwitch',
  component: TrudiSwitchComponent,
  argTypes: {
    reverse: {
      name: 'reverse',
      type: 'boolean',
      defaultValue: false,
      description: 'Reverse the switch direction',
      control: 'boolean'
    },
    label: {
      name: 'label',
      type: 'string',
      defaultValue: '',
      description:
        'Label of the Switch. If empty then it will not show up on DOM.',
      control: 'text'
    },
    isChecked: {
      name: 'isChecked',
      type: 'boolean',
      defaultValue: true,
      description: 'Switch checked state',
      control: 'boolean'
    },
    index: {
      name: 'index',
      type: 'number',
      defaultValue: -1,
      description: 'Switch index',
      control: 'number'
    },
    labelTemplate: {
      name: 'labelTemplate',
      type: 'TemplateRef<any>',
      defaultValue: null,
      description: 'Custom label template',
      control: null
    },
    reminderToggle: {
      name: 'reminderToggle',
      type: 'boolean',
      defaultValue: false,
      description: 'Reminder toggle',
      control: 'boolean'
    },
    disabled: {
      name: 'disabled',
      type: 'boolean',
      defaultValue: false,
      description: 'Switch disabled state',
      control: 'boolean'
    }
  },
  decorators: [
    moduleMetadata({
      declarations: [TrudiSwitchComponent],
      imports: [CommonModule, FormsModule]
    })
  ]
};

const TemplateTrudiSwitch: Story<TrudiSwitchComponent> = (
  args: TrudiSwitchComponent
) => ({
  props: args,
  template: `
  <trudi-switch
    [(ngModel)]="isChecked"
    [disabled]="disabled"
    [reverse]="reverse"
    [label]="label"
    [index]="index"
    [labelTemplate]="labelTemplate"
    [reminderToggle]="reminderToggle"
  ></trudi-switch>
    model: {{ isChecked }}
  `
});

export const TrudiSwitchTemplate = TemplateTrudiSwitch.bind({});
TrudiSwitchTemplate.args = {
  reverse: false,
  label: '',
  isChecked: true,
  index: -1,
  labelTemplate: null,
  reminderToggle: false,
  disabled: false
};
