import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { CreateNewTaskPopUpComponent } from './create-new-task-pop-up/create-new-task-pop-up.component';
import { SelectTaskAndPropertyComponent } from './create-new-task-pop-up/components/select-task-and-property/select-task-and-property.component';
import { ModalPopupComponent } from '@shared/components/modal-popup/modal-popup';
import { CreateTaskByCategoryComponent } from './create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { AutosizeModule } from 'ngx-autosize';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { PreviewImageVideoBoxComponent } from '@shared/components/preview-image-video-box/preview-image-video-box.component';
import { RequestLandlordTenantComponent } from './create-new-task-pop-up/components/request-landlord-tenant/request-landlord-tenant.component';
import { PopupLayoutComponent } from '@shared/components/popup-layout/popup-layout.component';
import { SelectTenantLandlordPopup } from '@/app/share-pop-up/select-tenant-and-landlord-popup/select-tenant-and-landlord-popup.component';
import { SelectSupplierPopupComponent } from './select-supplier-pop-up/select-supplier-pop-up.component';
import { CheckBoxPopUpComponent } from './check-box-pop-up/check-box-pop-up.component';
import { AppSubUserComponent } from '@shared/components/app-sub-user/app-sub-user.component';
import { AppUserBoxComponent } from '@shared/components/app-user-box/app-user-box.component';
import { FilterPipe } from '@shared/pipes/filter-type.pipe';
import { ConfirmPopupComponent } from '@shared/components/confirm-popup/confirm-popup.component';
import { TrudiUiModule } from '@trudi-ui';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { SmokeAlarmInvoiceFormService } from '@/app/smoke-alarm/modules/send-invoice-to-pt/services/invoice-form.service';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import { EmailImportPopUpComponent } from './email-import-pop-up/email-import-pop-up.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { EmailPreviewComponent } from './email-import-pop-up/email-preview/email-preview.component';
import { PlansSummaryPopUpComponent } from './plans-summary-pop-up/plans-summary-pop-up.component';
import { UserEmailTypePipe } from './email-import-pop-up/pipes/userEmailType.pipe';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { UpgradeMessageModule } from '@shared/components/upgrade-message/upgrade-message.module';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';
import { CreateMultipleTaskFailedComponent } from './create-new-task-pop-up/components/create-multiple-task-failed/create-multiple-task-failed.component';
import { CreateEditTaskFolderPopUpComponent } from '@/app/share-pop-up/task-folder-pop-up/create-edit-task-folder-pop-up.component';
import { SelectTaskTemplateModule } from '@shared/components/select-task-template/select-task-template.module';
import { SelectPropertyComponent } from './create-new-task-pop-up/components/create-task-by-property/components/select-property/select-property.component';
import { CreateTaskByPropertyComponent } from './create-new-task-pop-up/components/create-task-by-property/create-task-by-property.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { ResizableModalPopupComponent } from '@shared/components/resizable-modal/resizable-modal-popup';
import { OverlayModule } from '@angular/cdk/overlay';
import { SelectPolicyTypePopupComponent } from './select-policy-type-pop-up/select-policy-type-pop-up.component';
import { PolicyDetailPanelComponent } from './policy-detail/policy-detail-panel/policy-detail-panel.component';
import { AddSupplierComponent } from './policy-detail/add-supplier/add-supplier.component';
import { AddCustomPolicyComponent } from './policy-detail/add-custom-policy/add-custom-policy.component';
import { QuestionTagComponent } from './policy-detail/question-tag/question-tag.component';
import { TrudiAddContactCardModule } from '@shared/components/trudi-add-contact-card/trudi-add-contact-card.module';
import { AttachFileComponent } from './attach-file/attach-file.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ContactCardComponent } from './contact-card/contact-card.component';
import { GeneratedReplyComponent } from './policy-detail/generated-reply/generated-reply.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TextareaAutoresizeDirective } from '@/app/shared/directives/textarea-autoresize.directive';
import { NzTrimPipe } from 'ng-zorro-antd/pipes';
import { LottieModule } from 'ngx-lottie';

@NgModule({
  declarations: [
    SelectTaskAndPropertyComponent,
    CreateNewTaskPopUpComponent,
    EmailImportPopUpComponent,
    EmailPreviewComponent,
    ModalPopupComponent,
    PopupLayoutComponent,
    CreateTaskByCategoryComponent,
    PreviewImageVideoBoxComponent,
    RequestLandlordTenantComponent,
    SelectTenantLandlordPopup,
    SelectSupplierPopupComponent,
    CheckBoxPopUpComponent,
    AppSubUserComponent,
    AppUserBoxComponent,
    FilterPipe,
    UserEmailTypePipe,
    ConfirmPopupComponent,
    PlansSummaryPopUpComponent,
    CreateMultipleTaskFailedComponent,
    CreateEditTaskFolderPopUpComponent,
    SelectPropertyComponent,
    CreateTaskByPropertyComponent,
    ResizableModalPopupComponent,
    SelectPolicyTypePopupComponent,
    PolicyDetailPanelComponent,
    AddSupplierComponent,
    AddCustomPolicyComponent,
    QuestionTagComponent,
    AttachFileComponent,
    ContactCardComponent,
    GeneratedReplyComponent,
    TextareaAutoresizeDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NzDropDownModule,
    AutosizeModule,
    NgOptionHighlightModule,
    CustomPipesModule,
    NzPopoverModule,
    NzToolTipModule,
    UpgradeMessageModule,
    UserAvatarModule,
    SelectTaskTemplateModule,
    DragDropModule,
    NzResizableModule,
    OverlayModule,
    TrudiAddContactCardModule,
    NzSkeletonModule,
    EditorModule,
    ScrollingModule,
    NzTrimPipe,
    TrudiUiModule,
    LottieModule
  ],
  exports: [
    CreateNewTaskPopUpComponent,
    EmailImportPopUpComponent,
    CreateTaskByCategoryComponent,
    ModalPopupComponent,
    PopupLayoutComponent,
    PreviewImageVideoBoxComponent,
    RequestLandlordTenantComponent,
    SelectTenantLandlordPopup,
    SelectSupplierPopupComponent,
    CheckBoxPopUpComponent,
    AppSubUserComponent,
    AppUserBoxComponent,
    FilterPipe,
    ConfirmPopupComponent,
    PlansSummaryPopUpComponent,
    UpgradeMessageModule,
    UserAvatarModule,
    CreateEditTaskFolderPopUpComponent,
    ResizableModalPopupComponent,
    SelectPropertyComponent,
    SelectPolicyTypePopupComponent,
    PolicyDetailPanelComponent,
    AddSupplierComponent,
    AddCustomPolicyComponent,
    QuestionTagComponent,
    AttachFileComponent,
    ContactCardComponent,
    GeneratedReplyComponent,
    TextareaAutoresizeDirective
  ],
  providers: [
    ComplianceService,
    SmokeAlarmInvoiceFormService,
    TenantVacateService
  ]
})
export class SharePopUpModule {}
