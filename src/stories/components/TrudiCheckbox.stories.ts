import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  ELabelPosition,
  TrudiCheckboxComponent
} from 'src/app/trudi-ui/form/trudi-checkbox/trudi-checkbox.component';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

export default {
  title: 'trudi-ui/TrudiCheckBox',
  component: TrudiCheckboxComponent,
  argTypes: {
    label: {
      name: 'label',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'text'
    },
    labelPosition: {
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'label position',
      control: 'select',
      options: Object.keys(ELabelPosition)
    },
    disabled: {
      name: 'disabled',
      type: 'boolean',
      defaultValue: false,
      description: 'disabled'
    },
    isSelectedAll: {
      name: 'isSelectedAll',
      type: 'boolean',
      defaultValue: false,
      description: 'isSelectedAll'
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

const Template: Story<TrudiCheckboxComponent> = (
  args: TrudiCheckboxComponent
) => ({
  props: args,
  template: `
  <div class='checkBox-wrapper'>
    <trudi-checkbox
      [(ngModel)]="isSelected"
      [disabled]="disabled"
      [labelPosition]="labelPosition"
      [label]="label"
      [isSelectedAll]="isSelectedAll"
    ></trudi-checkbox>
  </div>
  `,
  styles: [
    `
      .checkBox-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `
  ]
});

export const TrudiCheckbox = Template.bind({});

TrudiCheckbox.args = {
  label: '',
  labelPosition: ELabelPosition.RIGHT,
  disabled: false,
  isSelectedAll: false
};
