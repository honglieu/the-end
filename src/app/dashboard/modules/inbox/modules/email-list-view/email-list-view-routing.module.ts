import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailListViewComponent } from './email-list-view.component';

const routes: Routes = [
  {
    path: '',
    component: EmailListViewComponent
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmailListViewRoutingModule {}
