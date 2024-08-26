// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';
import { TrudiButtonComponent } from 'src/app/trudi-ui/views/trudi-button/trudi-button.component';
// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Button',
  component: TrudiButtonComponent,
  argTypes: {
    btnType: {
      defaultValue: 'primary',
      type: 'string',
      description: 'primary | danger | neutral',
      control: 'select',
      options: ['primary', 'danger', 'neutral']
    },
    variant: {
      defaultValue: 'filled',
      control: 'select',
      options: ['filled', 'outlined', 'tonal', 'text']
    },
    size: {
      defaultValue: 'large',
      control: 'select',
      options: ['small', 'medium', 'semi-large', 'large']
    },
    tooltipText: {
      defaultValue: 'Monday, April 24',
      type: 'string',
      description: 'Tooltip text.'
    },
    placement: {
      defaultValue: 'bottom',
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Placement of tooltip.'
    },
    disabled: {
      defaultValue: false,
      type: 'boolean'
    }
  },
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  decorators: [
    moduleMetadata({
      imports: [TrudiUiModule, HttpClientModule],
      providers: []
    })
  ]
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<TrudiButtonComponent> = (args: TrudiButtonComponent) => ({
  props: args,
  template: `
  <button
    trudi-btn
    [size]="size"
    [variant]="variant"
    [btnType]="btnType"
    [placement]="placement"
    [disabled]="disabled"
  >
  <ng-template iconPrefix>
    <trudi-icon [icon]="'calendar2'" [style]="{'width.px': size == 'small' ? 16: 20, 'height.px': size == 'small' ? 16: 20}"></trudi-icon>
  </ng-template>
  <ng-template iconSuffix>
    <trudi-icon [icon]="'calendar2'" [style]="{'width.px': size == 'small' ? 16: 20, 'height.px': size == 'small' ? 16: 20}"></trudi-icon>
  </ng-template>
    {{text}}
  </button>
  `
});

export const Button = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
Button.args = {
  variant: 'filled',
  btnType: 'primary',
  size: 'large',
  placement: 'bottom',
  text: 'Button',
  tooltipText: 'Monday, April 24'
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'outlined',
  btnType: 'primary',
  tooltipText: 'Monday, April 24',
  size: 'large',
  text: 'Button',
  placement: 'bottom'
};

export const ButtonSmallPrimaryFilledDisabled = Template.bind({});
ButtonSmallPrimaryFilledDisabled.args = {
  size: 'small',
  variant: 'filled',
  btnType: 'primary',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button',
  disabled: true
};

export const ButtonSmallPrimaryOutlined = Template.bind({});
ButtonSmallPrimaryOutlined.args = {
  size: 'small',
  variant: 'outlined',
  btnType: 'primary',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button'
};

export const ButtonSmallPrimaryTonal = Template.bind({});
ButtonSmallPrimaryTonal.args = {
  size: 'small',
  variant: 'tonal',
  btnType: 'primary',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button'
};

export const ButtonSmallPrimaryText = Template.bind({});
ButtonSmallPrimaryText.args = {
  size: 'small',
  variant: 'text',
  btnType: 'primary',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button'
};

export const ButtonSmallDangerFilled = Template.bind({});
ButtonSmallDangerFilled.args = {
  size: 'small',
  variant: 'filled',
  btnType: 'danger',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button',
  disabled: true
};

export const ButtonSmallDangerOutlined = Template.bind({});
ButtonSmallDangerOutlined.args = {
  size: 'small',
  variant: 'outlined',
  btnType: 'danger',
  tooltipText: 'Monday, April 24',
  placement: 'bottom',
  text: 'Button'
};
