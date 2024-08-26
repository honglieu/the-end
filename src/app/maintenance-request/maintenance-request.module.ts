import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { AutosizeModule } from 'ngx-autosize';
import { SupplierConductingWorkComponent } from './components/supplier-conducting-work/supplier-conducting-work.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiOutletModule } from '@core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule as SharedTaskModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
@NgModule({
  declarations: [SupplierConductingWorkComponent],
  imports: [
    CommonModule,
    SharedModule,
    AutosizeModule,
    SharePopUpModule,
    TrudiOutletModule,
    ReactiveFormsModule,
    SharedTaskModule,
    TrudiUiModule
  ],
  exports: [SupplierConductingWorkComponent]
})
export class MaintenanceRequestModule {}
