import { NgModule } from '@angular/core';
import { TenantProspectComponent } from './tenant-prospect.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: TenantProspectComponent
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenantProspectRoutingModule {}
