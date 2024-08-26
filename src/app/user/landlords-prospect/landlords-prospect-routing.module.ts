import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandlordsProspectComponent } from './landlords-prospect.component';

const routes: Routes = [
  {
    path: '',
    component: LandlordsProspectComponent
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenantProspectRoutingModule {}
