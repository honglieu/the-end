import { SmsMessageApiService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms.message.api.services';
import { Component, inject, OnInit } from '@angular/core';

@Component({
  selector: 'media-link',
  templateUrl: './media-link.component.html'
})
export class MediaLinkComponent {
  private smsMessageApiService = inject(SmsMessageApiService);

  constructor() {
    const parsedUrl = new URL(window.location.href);
    const fullUrl = parsedUrl.href;
    this.smsMessageApiService.getMediaLinkTracking(fullUrl).subscribe({
      next: ({ link }) => {
        window.location.href = link;
      },
      error: (err) => {
        window.close();
      }
    });
  }
}
