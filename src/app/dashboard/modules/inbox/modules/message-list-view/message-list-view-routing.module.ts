import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MessageListViewComponent } from './message-list-view.component';
import { AppRouteName } from '@shared/enum';
import { PreventButtonGuard } from '@trudi-ui';
import { MessageViewListComponent } from '@/app/dashboard/modules/inbox/modules/message-list-view/components/message-view-list/message-view-list.component';

const routes: Routes = [
  {
    path: '',
    component: MessageListViewComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all'
      },
      {
        path: 'deleted',
        component: MessageViewListComponent,
        data: {
          name: AppRouteName.MESSAGES,
          reuse: true
        }
      },
      {
        path: 'resolved',
        component: MessageViewListComponent,
        data: {
          name: AppRouteName.MESSAGES,
          reuse: true
        }
      },
      {
        path: 'draft',
        component: MessageViewListComponent,
        data: {
          name: AppRouteName.MESSAGES,
          reuse: true
        }
      },
      {
        path: ':status',
        component: MessageViewListComponent,
        canActivate: [PreventButtonGuard],
        data: {
          name: AppRouteName.MESSAGES,
          reuse: true
        }
      }
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MessageListViewRoutingModule {}
