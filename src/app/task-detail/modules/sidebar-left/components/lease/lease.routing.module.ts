import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LeaseComponent } from './lease.component';

const routes: Routes = [
  {
    path: '',
    component: LeaseComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeaseRoutingModule {}
