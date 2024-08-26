import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyTreeStepComponent } from './property-tree-step.component';
import { PropertyTreeStepFormComponent } from './property-tree-step-form/property-tree-step-form.component';
import { TrudiUiModule } from '@trudi-ui';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  declarations: [PropertyTreeStepComponent, PropertyTreeStepFormComponent],
  exports: [PropertyTreeStepComponent],
  imports: [
    CommonModule,
    TrudiUiModule,
    FormsModule,
    ReactiveFormsModule,
    SharePopUpModule,
    NzToolTipModule
  ]
})
export class PropertyTreeStepModule {}
