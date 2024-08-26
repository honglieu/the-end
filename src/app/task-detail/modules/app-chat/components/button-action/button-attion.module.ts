import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonActionComponent } from './button-action.component';
import { CustomDirectivesModule } from '@shared/directives/custom-directive.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [ButtonActionComponent],
  imports: [
    CommonModule,
    TrudiUiModule,
    CustomDirectivesModule,
    NzToolTipModule
  ],
  exports: [ButtonActionComponent]
})
export class ButtonAttionModule {}
