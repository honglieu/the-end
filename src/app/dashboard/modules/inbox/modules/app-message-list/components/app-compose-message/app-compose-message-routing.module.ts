import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComposeMessageComponent } from './app-compose-message.component';

const routes: Routes = [
  {
    path: '',
    component: AppComposeMessageComponent
  }
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppComposeMessageRoutingModule {}
