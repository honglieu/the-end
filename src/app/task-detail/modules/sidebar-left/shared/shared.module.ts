import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiSuggestedStepComponent } from './trudi-suggested-step/trudi-suggested-step.component';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { TrudiUiModule } from '@trudi-ui';
import { FormsModule } from '@angular/forms';
import { TrudiSuggestedStepGroupComponent } from './trudi-suggested-step-group/trudi-suggested-step-group.component';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  declarations: [TrudiSuggestedStepComponent, TrudiSuggestedStepGroupComponent],
  imports: [
    FormsModule,
    CommonModule,
    TrudiUiModule,
    NzOutletModule,
    SharedAppModule,
    NzToolTipModule
  ],
  exports: [TrudiSuggestedStepComponent, TrudiSuggestedStepGroupComponent]
})
export class SharedModule {}
