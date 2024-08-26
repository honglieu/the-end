import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouteName } from '@shared/enum';
import { WhatsappViewListComponent } from './views/whatsapp-view-list/whatsapp-view-list.component';

const routes: Routes = [
  {
    path: ':status',
    component: WhatsappViewListComponent,
    data: {
      name: AppRouteName.WHATSAPP,
      reuse: true
    }
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'all'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WhatsAppViewRoutingModule {}
