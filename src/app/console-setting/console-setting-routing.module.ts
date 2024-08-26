import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgenciesViewPageComponent } from './agencies/agencies-view-page/agencies-view-page.component';
import { AgentComponent } from './agent/agent.component';
import { ConsoleSettingComponent } from './console-setting.component';
import { PromotionsComponent } from './promotions/promotions-view.component';
import { SettingTaskNameComponent } from './setting-task-name/setting-task-name.component';

const routes: Routes = [
  {
    path: '',
    component: ConsoleSettingComponent,
    children: [
      {
        path: '',
        redirectTo: 'agent-management',
        pathMatch: 'full'
      },

      {
        path: 'agent-management',
        component: AgentComponent
      },

      {
        path: 'promotions',
        component: PromotionsComponent
      },
      {
        path: 'task-names',
        component: SettingTaskNameComponent
      },
      {
        path: 'agencies-management',
        component: AgenciesViewPageComponent
      },
      {
        path: 'task-editor/list/task-template/:taskTemplateId',
        loadChildren: () =>
          import(
            '@/app/dashboard/modules/task-editor/modules/task-template-details/task-template-details.module'
          ).then((m) => m.TaskTemplateDetailsModule)
      },
      {
        path: 'task-editor',
        loadChildren: () =>
          import('../dashboard/modules/task-editor/task-editor.module').then(
            (m) => m.TaskEditorModule
          )
      }
    ]
  },
  {
    path: ':agencyId',
    children: [
      {
        path: 'task-template/:taskTemplateId',
        loadChildren: () =>
          import(
            '../dashboard/modules/task-editor/modules/task-template-details/task-template-details.module'
          ).then((m) => m.TaskTemplateDetailsModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsoleSettingRoutingModule {}
