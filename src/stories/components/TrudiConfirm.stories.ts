// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Component } from '@angular/core';
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
import { TrudiConfirmService } from 'src/app/trudi-ui/views/trudi-confirm/service/trudi-confirm.service';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiModalComponent } from 'src/app/trudi-ui/views/trudi-modal/trudi-modal.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { TrudiConfirmComponent } from 'src/app/trudi-ui/views/trudi-confirm/trudi-confirm.component';

@Component({
  selector: 'trudi-confirm-component',
  template: ` <div>
    <div>
      <button
        variant="outlined"
        size="medium"
        trudi-btn
        (click)="handleClick()">
        Confirm
      </button>
    </div>
    <br />
    <div>result: {{ result === null ? '' : result }}</div>
  </div>`
})
class ConfirmComponent {
  public result: boolean = null;

  constructor(private trudiConfirmService: TrudiConfirmService) {}

  handleClick() {
    this.trudiConfirmService.confirm(
      {
        title: 'This is title',
        subtitle: 'This is subtitle'
      },
      (res) => {
        this.result = res.result;
      }
    );
  }
}

export default {
  title: 'trudi-ui/Modal',
  component: ConfirmComponent,
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        NzModalModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        OverlayModule,
        PortalModule
      ],
      providers: [NzModalService, TrudiConfirmService],
      declarations: [
        TrudiIconComponent,
        TrudiModalComponent,
        TrudiCheckboxComponent,
        TrudiButtonComponent,
        ConfirmComponent,
        TrudiConfirmComponent
      ]
    })
  ]
} as Meta;

const TemplateConfirm: Story<TrudiModalComponent> = (
  args: TrudiModalComponent
) => ({
  template: `
    <trudi-confirm-component></trudi-confirm-component>
  `,
  props: args
});

export const confirm = TemplateConfirm.bind({});
confirm.args = {};
