import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { RentManagerStepComponent } from './rent-manager-step.component';
import { RentManagerStepFormComponent } from './rent-manager-step-form/rent-manager-step-form.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [RentManagerStepComponent, RentManagerStepFormComponent],
  exports: [RentManagerStepComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharePopUpModule,
    NzToolTipModule,
    TrudiUiModule
  ]
})
export class RentManagerStepModule {}
