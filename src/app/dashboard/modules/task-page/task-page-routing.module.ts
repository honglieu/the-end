import { FolderTaskListComponent } from '@/app/dashboard/modules/task-page/views/folder-task-list/folder-task-list.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouteName } from '@shared/enum';

const routes: Routes = [
  {
    path: '',
    data: {
      name: AppRouteName.TASKS,
      reuse: true
    },
    component: FolderTaskListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskPageRoutingModule {}
