// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule
} from '@angular/platform-browser/animations';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, Story } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TrudiCheckboxComponent } from 'src/app/trudi-ui/form/trudi-checkbox/trudi-checkbox.component';
import { TrudiButtonComponent } from 'src/app/trudi-ui/views/trudi-button/trudi-button.component';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiModalComponent } from 'src/app/trudi-ui/views/trudi-modal/trudi-modal.component';

export default {
  title: 'trudi-ui/Modal',
  component: TrudiModalComponent,
  argTypes: {
    title: {
      title: 'title',
      type: { name: 'string', required: false },
      defaultValue: 'title',
      description: ' default title is title',
      control: 'text'
    },
    subTitle: {
      title: 'subTitle',
      type: { name: 'string', required: false },
      defaultValue: 'sub-title',
      description: '',
      control: 'text'
    },
    type: {
      name: 'type',
      type: { name: 'string', required: false },
      defaultValue: 'default',
      description: '',
      control: 'select',
      options: ['default', 'confirm']
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        NzModalModule,
        BrowserAnimationsModule,
        NoopAnimationsModule
      ],
      providers: [NzModalService],
      declarations: [
        TrudiIconComponent,
        TrudiModalComponent,
        TrudiCheckboxComponent,
        TrudiButtonComponent
      ]
    })
  ]
} as Meta;

const Template: Story<TrudiModalComponent> = (args: TrudiModalComponent) => ({
  template: `
    <div>
      <button variant="outlined" size="medium" trudi-btn (click)="visible = !visible">Normal</button> 
    </div>

    <trudi-modal 
      [(visible)]="visible" 
      [closable]="closable"
      [type]="type"
      [allowCheckbox]="allowCheckbox"
      [okText]="okText"
      [cancelText]="cancelText"
      [title]="title"
      [subTitle]="subTitle"
      [checkboxLabel]="checkboxLabel"
      [iconName]="iconName"
      [hiddenCancelBtn]="hiddenCancelBtn"
    >
      content
    </trudi-modal>
  `,
  component: TrudiModalComponent,
  props: args
});

export const normal = Template.bind({});
normal.args = {
  visible: false,
  closable: true,
  type: 'default',
  title: 'Title',
  subTitle: 'Subtitle',
  iconName: 'iconTrudi',
  okText: 'Confirm',
  cancelText: 'Cancel',
  allowCheckbox: false,
  checkboxLabel: 'checkbox label',
  hiddenCancelBtn: false
};

const TemplateCustom: Story<TrudiModalComponent> = (
  args: TrudiModalComponent
) => ({
  template: `
    <div>
      <button variant="outlined" size="medium" trudi-btn (click)="visible = !visible">Custom modal</button> 
    </div>

    <trudi-modal 
      [(visible)]="visible" 
      [closable]="closable"
      [type]="type"
      [allowCheckbox]="allowCheckbox"
      [checkboxLabel]="checkboxLabel"
    >
      <ng-template #headerModal>This is header</ng-template>
      content
      <ng-template #footerModal>This is footer</ng-template>
    </trudi-modal>
  `,
  component: TrudiModalComponent,
  props: args
});

export const custom = TemplateCustom.bind({});
custom.args = {
  visible: false,
  closable: true,
  type: 'default',
  allowCheckbox: false,
  checkboxLabel: 'checkbox label'
};
