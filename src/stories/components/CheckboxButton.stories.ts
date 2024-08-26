// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TrudiCheckboxButtonComponent } from 'src/app/trudi-ui/form/trudi-checkbox-button/trudi-checkbox-button.component';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Checkbox/CheckboxButton',
  component: TrudiCheckboxButtonComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    icon: {
      name: 'icon',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'use IconType value',
      control: 'select',
      options: Object.keys(IconType)
    },
    label: {
      name: 'label',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'text'
    },
    disabled: {
      name: 'disabled',
      type: 'boolean',
      defaultValue: '',
      description: 'disabled'
    },
    isChecked: {
      name: 'isChecked',
      type: 'boolean',
      defaultValue: '',
      description: 'isChecked'
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
const Template: Story<TrudiCheckboxButtonComponent> = (
  args: TrudiCheckboxButtonComponent
) => ({
  props: args
});

export const CheckboxButton = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
CheckboxButton.args = {
  label: 'checkbox button',
  icon: '',
  disabled: false,
  isChecked: false
};
