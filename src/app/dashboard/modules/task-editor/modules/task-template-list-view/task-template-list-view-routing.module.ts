import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskTemplateListViewComponent } from './task-template-list-view.component';

const routes: Routes = [
  {
    path: '',
    component: TaskTemplateListViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskTemplateListViewRoutingModule {}
