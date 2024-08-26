import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskEditorComponent } from './task-editor.component';

const routes: Routes = [
  {
    path: '',
    component: TaskEditorComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadChildren: () =>
          import(
            './modules/task-template-list-view/task-template-list-view.module'
          ).then((m) => m.TaskTemplateListViewModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskEditorRoutingModule {}
