import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EViewDetailMode } from './enums/task-detail.enum';
import { TaskDetailComponent } from './task-detail.component';

const routes: Routes = [
  {
    path: '',
    component: TaskDetailComponent,
    children: [
      {
        path: EViewDetailMode.APP_MESSAGE,
        loadChildren: () =>
          import(
            '../dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.module'
          ).then((m) => m.AppComposeMessageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskDetailRoutingModule {}
