import { NgModule } from '@angular/core';
import { TinyEditorComponent } from './tiny-editor.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RemainingCharacterModule } from '@shared/components/remaining-character/remaining-character.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { EmailSignatureForMessageComponent } from '@shared/components/email-signature-for-message/email-signature-for-message.component';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AiGenerateMsgCopyComponent } from './ai-generate-msg-copy/ai-generate-msg-copy.component';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { AiSettingControlComponent } from './ai-generate-msg-copy/components/ai-setting-control/ai-setting-control.component';
import { ClickOutsideModule } from '@shared/directives/click-outside/click-outside.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SendOptionControlComponent } from './send-option-control/send-option-control.component';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { DynamicIoModule } from 'ng-dynamic-component';
import { InsertLinkComponent } from './insert-link/insert-link.component';
import { CustomDirectivesModule } from '@shared/directives/custom-directive.module';
import { AutomateSimilarReplyComponent } from './automate-similar-reply/automate-similar-reply.component';
import { FontFamilyComponent } from './font-family/font-family.component';
import { TextColorComponent } from './text-color/text-color.component';
import { ToolbarWrapperComponent } from './toolbar-wrapper/toolbar-wrapper.component';
import { TextBackgroundColorComponent } from './text-background-color/text-background-color.component';
import { UnorderedListComponent } from '@/app/shared/components/tiny-editor/unordered-list/unordered-list.component';
import { OrderedListComponent } from '@/app/shared/components/tiny-editor/ordered-list/ordered-list.component';
import { TrudiUiModule } from '@trudi-ui';
import { LottieModule } from 'ngx-lottie';
@NgModule({
  declarations: [
    TinyEditorComponent,
    EmailSignatureForMessageComponent,
    AiSettingControlComponent,
    AiGenerateMsgCopyComponent,
    SendOptionControlComponent,
    InsertLinkComponent,
    AutomateSimilarReplyComponent,
    FontFamilyComponent,
    TextColorComponent,
    ToolbarWrapperComponent,
    TextBackgroundColorComponent,
    UnorderedListComponent,
    OrderedListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EditorModule,
    AngularSvgIconModule.forRoot(),
    RemainingCharacterModule,
    SharePopUpModule,
    ScrollingModule,
    CustomPipesModule,
    NzToolTipModule,
    NzPopoverModule,
    ClickOutsideModule,
    NzDropDownModule,
    NzNoAnimationModule,
    DynamicIoModule,
    CustomDirectivesModule,
    TrudiUiModule,
    LottieModule
  ],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ],
  exports: [TinyEditorComponent, EmailSignatureForMessageComponent]
})
export class TinyEditorModule {}
