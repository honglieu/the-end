import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeOnboardComponent } from './welcome-onboard.component';

const routes: Routes = [
  {
    path: '',
    component: WelcomeOnboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WelcomeOnboardRoutingModule {}
