import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgentUserComponent } from './agent-user.component';

const routes: Routes = [
  {
    path: '',
    component: AgentUserComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgentUserRoutingModule {}
