import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiStepComponent } from './trudi-step/trudi-step.component';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { TrudiUiModule } from '@trudi-ui';
import { FormsModule } from '@angular/forms';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import {
  ConfirmEssentialComponent,
  SelectDynamicTitlePipe
} from './confirm-essential/confirm-essential.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PreventButtonModule } from '@trudi-ui';
import { CtaButtonsComponent } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    TrudiStepComponent,
    ConfirmEssentialComponent,
    SelectDynamicTitlePipe
  ],
  imports: [
    FormsModule,
    CommonModule,
    TrudiUiModule,
    NzOutletModule,
    SharedAppModule,
    NzToolTipModule,
    PreventButtonModule,
    CtaButtonsComponent,
    RxPush
  ],
  exports: [ConfirmEssentialComponent, TrudiStepComponent]
})
export class SharedModule {}
