import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboxComponent } from '@/app/dashboard/modules/inbox/inbox.component';

const routes: Routes = [
  {
    path: '',
    component: InboxComponent,
    children: [
      {
        path: 'messages',
        loadChildren: () =>
          import('./modules/message-list-view/message-list-view.module').then(
            (m) => m.MessageListViewModule
          )
      },
      {
        path: 'app-messages',
        loadChildren: () =>
          import('./modules/app-message-list/app-message-list.module').then(
            (m) => m.AppMessageListViewModule
          )
      },
      {
        path: 'mail',
        loadChildren: () =>
          import('./modules/email-list-view/email-list-view.module').then(
            (m) => m.EmailListViewModule
          )
      },
      {
        path: 'voicemail-messages',
        loadChildren: () =>
          import('./modules/voice-mail-view/voice-mail-view.module').then(
            (m) => m.VoiceMailViewModule
          )
      },
      {
        path: 'facebook-messages',
        loadChildren: () =>
          import('./modules/facebook-view/facebook-view.module').then(
            (m) => m.FacebookViewModule
          )
      },
      {
        path: 'sms-messages',
        loadChildren: () =>
          import('./modules/sms-view/sms-view.module').then(
            (m) => m.SmsViewModule
          )
      },
      {
        path: 'whatsapp-messages',
        loadChildren: () =>
          import('./modules/whatsapp-view/whatsapp-view.module').then(
            (m) => m.WhatsappViewModule
          )
      },
      {
        path: '',
        redirectTo: 'messages',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'detail/:taskId',
    loadChildren: () =>
      import('@/app/task-detail/task-detail.module').then(
        (m) => m.TaskDetailModule
      )
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InboxRoutingModule {}
