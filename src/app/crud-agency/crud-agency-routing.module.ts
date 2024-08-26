import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrudAgencyComponent } from './crud-agency.component';

const routes: Routes = [
  {
    path: '',
    component: CrudAgencyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CrudAgencyRoutingModule {}
