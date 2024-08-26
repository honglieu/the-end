import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrudAgencyRoutingModule } from './crud-agency-routing.module';
import { CreateEditAgencyComponent } from './create-edit-agency/create-edit-agency.component';
import { AgencyListComponent } from './agency-list/agency-list.component';
import { AgencyDetailComponent } from './agency-detail/agency-detail.component';
import { CrudAgencyComponent } from './crud-agency.component';
import { SharedModule } from '@shared/shared.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';

@NgModule({
  declarations: [
    CreateEditAgencyComponent,
    AgencyListComponent,
    AgencyDetailComponent,
    CrudAgencyComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CrudAgencyRoutingModule,
    SharePopUpModule
  ]
})
export class CrudAgencyModule {}
