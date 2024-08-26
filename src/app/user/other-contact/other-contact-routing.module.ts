import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OtherContactComponent } from './other-contact.component';

const routes: Routes = [
  {
    path: '',
    component: OtherContactComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OtherContactRoutingModule {}
