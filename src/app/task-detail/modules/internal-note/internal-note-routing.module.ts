import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InternalNoteComponent } from './internal-note.component';

const routes: Routes = [
  {
    path: '',
    component: InternalNoteComponent
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InternalNoteRoutingModule {}
