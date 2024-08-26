import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouteName } from '@shared/enum';
import { VoiceMailListComponent } from './views/voice-mail-list/voice-mail-list.component';
import { PreventButtonGuard } from '@trudi-ui';
import { VoiceMailViewGuard } from './voice-mail-view.guard';

const routes: Routes = [
  {
    path: 'resolved',
    component: VoiceMailListComponent,
    canActivate: [VoiceMailViewGuard],
    data: {
      name: AppRouteName.VOICEMAIL_MESSAGES,
      reuse: true
    }
  },
  {
    path: ':status',
    component: VoiceMailListComponent,
    canActivate: [VoiceMailViewGuard, PreventButtonGuard],
    data: {
      name: AppRouteName.VOICEMAIL_MESSAGES,
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
export class VoiceMailViewRoutingModule {}
