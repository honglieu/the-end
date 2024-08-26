import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskTemplateDetailsComponent } from './task-template-details.component';
import { SaveChangeGuard } from './modules/task-template-details-content/guard/save-change.guard';

const routes: Routes = [
  {
    path: '',
    component: TaskTemplateDetailsComponent,
    canDeactivate: [SaveChangeGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskTemplateDetailsRoutingModule {}
