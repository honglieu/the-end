import { AppComposeMessageComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { MessengerInlineEditorComponent } from '@/app/dashboard/modules/inbox/modules/facebook-view/components/messenger-inline-editor/messenger-inline-editor.component';
import { SmsComposeMessageComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-compose-message/sms-compose-message.component';
import { WhatsAppInlineEditorComponent } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/components/whatsapp-inline-editor/whatsapp-inline-editor.component';
import { TinyEditorComponent } from '@/app/shared/components/tiny-editor/tiny-editor.component';
import { TrudiBulkSendMsgComponent } from '@/app/trudi-send-msg/trudi-bulk-send-msg.component';
import { TrudiSendMsgV3Component } from '@/app/trudi-send-msg/trudi-send-msg-v3.component';

export function getConfigs(tinyEditorComponent: TinyEditorComponent) {
  const configs =
    tinyEditorComponent.injector.get(TrudiSendMsgV3Component, null)?.configs ||
    tinyEditorComponent.injector.get(TrudiBulkSendMsgComponent, null)
      ?.configs ||
    tinyEditorComponent.injector.get(AppComposeMessageComponent, null)
      ?.configs ||
    tinyEditorComponent.injector.get(SmsComposeMessageComponent, null)
      ?.configs ||
    tinyEditorComponent.injector.get(MessengerInlineEditorComponent, null)
      ?.configs ||
    tinyEditorComponent.injector.get(WhatsAppInlineEditorComponent, null)
      ?.configs;
  return configs;
}
