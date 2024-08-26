// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { TrudiRadioButtonComponent } from 'src/app/trudi-ui/form/trudi-radio-button/trudi-radio-button.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/RadioButton',
  component: TrudiRadioButtonComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [NzRadioModule, CommonModule, FormsModule, HttpClientModule],
      declarations: [TrudiRadioButtonComponent]
    })
  ]
} as Meta;

const Template: Story<TrudiRadioButtonComponent> = (
  args: TrudiRadioButtonComponent
) => ({
  props: args,
  template: `
  <trudi-radio-button
    [options]="options"
    [(ngModel)]="model">
  </trudi-radio-button>
   model: {{ model }}
  `
});

export const TrudiRadioButton = Template.bind({});

TrudiRadioButton.args = {
  options: [
    {
      value: 0,
      label: 'Routine service'
    },
    {
      value: 1,
      label: 'New lease service'
    },
    {
      value: 2,
      label: 'New tenancy service'
    },
    {
      value: 3,
      label: 'Expiry / Replacement'
    }
  ],
  model: 0
};
