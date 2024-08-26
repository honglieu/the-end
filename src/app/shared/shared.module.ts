import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageAgentJoinComponent } from './components/chat/message-agent-join/message-agent-join.component';
import { TrudiDefaultActionsComponent } from './components/chat/trudi-default-actions/trudi-default-actions';
import { TrudiNavLinksComponent } from './components/chat/trudi-nav-links/trudi-nav-links';
import { TrudiUrlComponent } from './components/chat/trudi-url/trudi-url';
import { MessageHeaderComponent } from './components/chat/message-header/message-header.component';
import { MessageActionLinkComponent } from './components/chat/message-action-link/message-action-link.component';
import { MessageFileComponent } from './components/chat/message-file/message-file.component';
import { MessageCallComponent } from './components/chat/message-call/message-call.component';
import { MessageAgentExpectationComponent } from './components/chat/message-agent-expectation/message-agent-expectation.component';
import { MessageReopenedComponent } from './components/chat/message-reopened/message-reopened.component';
import { MessageResolvedComponent } from './components/chat/message-resolved/message-resolved.component';
import { PopupComponent } from './components/popup/popup.component';
import { GoogleplaceDirective } from './directives/google.place.directive';
import { DigitOnlyDirective } from './directives/digitOnly.directive';
import { TabsComponent } from './components/tabs/tabs.component';
import { TabComponent } from './components/tabs/tab/tab.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { MessageRecordComponent } from './components/message-record/message-record.component';
import { TypingAnimationComponent } from './components/chat/typing-animation/typing-animation';
import { MessageFooterComponent } from './components/chat/message-footer/message-footer.component';
import { PopupAskRecordCallComponent } from './components/popup-ask-record-call/popup-ask-record-call.component';
import { TextBadgeComponent } from '@shared/components/text-badge/text-badge.component';
import { TdCheckboxComponent } from './components/td-checkbox/td-checkbox.component';
import { RippleDirective } from './directives/ripple.directive';
import { TriggerMenuDirective } from './directives/trigger-menu.directive';
import { CircleLoadingIndicatorComponent } from './components/circle-loading-indicator/circle-loading-indicator.component';
import { NumberPhoneFormatInputDirective } from './directives/numberphone-format-input.directive';
import { OutlineRoundedButtonComponent } from './components/rounded-button/outline-rounded-button.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import ImagesCarouselComponent from './components/images-carousel/images-carousel.component';
import { SwiperModule } from 'swiper/angular';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { RouterModule } from '@angular/router';
import { SendVerifiedEmailSuccessComponent } from './components/send-verified-email-success/send-verified-email-success.component';
import { SendMessageSuccessComponent } from './components/send-message-success/send-message-success.component';
import { SendMessageComponent } from './components/send-message/send-message.component';
import { SelectPeoplePopupComponent } from './components/select-people-popup/select-people-popup.component';
import { QuitConfirmComponent } from './components/quit-confirm/quit-confirm.component';
import { SendAppInviteComponent } from './components/send-app-invite/send-app-invite.component';
import { SendActionLinkComponent } from './components/send-action-link/send-action-link.component';
import { CreateEditActionLinkSuccessComponent } from './components/create-edit-action-link-success/create-edit-action-link-success.component';
import { NewActionLinkPopupComponent } from './components/create-edit-action-link-popup/create-edit-action-link-popup.component';
import { AddFilesPopUpComponent } from './components/add-files-pop-up/add-files-pop-up.component';
import { ApiService } from '@services/api.service';
import { ConfirmSendVerifiedEmailComponent } from './components/confirm-send-verified-email/confirm-send-verified-email.component';
import { ShowPersonComponent } from './components/show-person/show-person.component';
import { PhoneNumberFormatPipe } from './pipes/phonenumber-format.pipe';
import { ModalDialogComponent } from './components/chat/message-dialog/message-dialog.component';
import { AvatarButtonComponent } from './components/avatar-button/avatar-button.component';
import { CircleButtonComponent } from './components/circle-button/circle-button.component';
import { TaskTicketComponent } from './components/task-ticket/task-ticket.component';
import { SwitchCheckboxComponent } from './components/switch-checkbox/switch-checkbox.component';
import { AutosizeModule } from 'ngx-autosize';
import { PopupLikeToSayComponent } from './components/popup-like-to-say/popup-like-to-say.component';
import { InfoTicketComponent } from './components/info-ticket/info-ticket.component';
import { DropdownMenuComponent } from './components/dropdown-menu/dropdown.component';
import { DropdownTriggerForDirective } from './components/dropdown-menu/dropdown-trigger-for.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AssignToAgentsComponent } from './components/assign-to-agents/assign-to-agents/assign-to-agents.component';
import { SuccessModalPopupComponent } from './components/success-modal-popup/success-modal-popup.component';
import { PopupDeleteComponent } from './components/popup-delete/popup-delete.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ButtonUploadFileComponent } from './components/button-upload-file/button-upload-file.component';
import { DocumentRequestAddTenancyAgreementPopupComponent } from './components/document-request/add-tenancy-agreemance-popup/add-tenancy-agreement-popup.component';
import { DocumentRequestSendMessageComponent } from './components/document-request/send-message/send-message.component';
import { DocumentRequestQuitConfirmComponent } from './components/document-request/quit-confirm/quit-confirm.component';
import { DocumentRequestAddFilesPopUpComponent } from './components/document-request/add-files-pop-up/add-files-pop-up.component';
import { UploadAttachmentComponent } from './components/upload-attachments/upload-attachments.component';
import { CardUploadFileComponent } from './components/card-upload-file/card-upload-file.component';
import { DateTimePickerComponent } from './components/date-time-picker/date-time-picker.component';
import { PopupTenantIntentionComponent } from './components/popup-tenant-intention/popup-tenant-intention.component';
import { LoaderComponent } from './components/loader/loader.component';
import { RangeTimePickerComponent } from './components/range-time-picker/range-time-picker.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { FavouriteStarComponent } from './components/favourite-star/favourite-star.component';
import { ReminderItemComponent } from './components/list-notification/components/reminder-item/reminder-item.component';
import { WarningPopupComponent } from './components/warning-popup/warning-popup.component';
import { AttachEntryNoteComponent } from './components/attach-entry-note/attach-entry-note.component';
import { SelectDocumentComponent } from './components/select-document/select-document.component';
import { ReviewAttachmentPopupComponent } from './components/review-attachment-popup/review-attachment-popup.component';
import { PopupModalComponent } from './components/popup-modal/popup-modal.component';
import { AddEmailPopUpComponent } from './components/add-email-pop-up/add-email-pop-up.component';
import { YearCalendarComponent } from './components/year-calendar/year-calendar.component';
import { MonthCalendarComponent } from './components/month-calendar/month-calendar.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { LoaderGlobalComponent } from '@/app/loader/loader.component';
import { ChipComponent } from './components/chip/chip.component';
import { DetectFocusDirective } from './directives/detect-foucus.directive';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { InforPeopleComponent } from './components/info-people-popup/info-people-popup.component';
import { CardInfoPeopleComponent } from './components/card-info-people/card-info-people.component';
import { LeaseShareComponent } from './components/lease/lease-share.component';
import { MessageConversationMovedComponent } from './components/chat/message-conversation-moved/message-conversation-moved.component';
import { AddNotePropertyComponent } from './components/add-note-property/add-note-property.component';
import { NotifyNewVersionPopupComponent } from './notify-new-version-popup/notify-new-version-popup.component';
import { ListItemSelectPeopleComponent } from './components/select-people-popup/list-item-select-people/list-item-select-people.component';
import { PopupModule } from './components/popup2';
import { ScheduleMessageComponent } from './components/schedule-message/schedule-message.component';
import { TimeDetailRoutineComponent } from './components/schedule-message/time-detail-routine/time-detail-routine.component';
import { TrudiDatePickerModule } from './components/date-picker2';
import { ListItemSelectTenantComponent } from './components/list-item-select-tenant/list-item-select-tenant.component';
import { MaxLengthNumberDirective } from './directives/maxlength-number-directive.directive';
import { SelectContactPopupComponent } from './components/select-contact-popup/select-contact-popup.component';
import { HeaderTrudiPageComponent } from '@/app/task/header-trudi-page/header-trudi-page.component';
import { ConfirmSendInviteOrMessageComponent } from './components/confirm-send-invite-or-message/confirm-send-invite-or-message.component';
import { ButtonWithDropdownActionsComponent } from './components/button-with-dropdown-actions/button-with-dropdown-actions.component';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TinyEditorModule } from './components/tiny-editor/tiny-editor.module';
import { RemainingCharacterModule } from './components/remaining-character/remaining-character.module';
import { ScheduleMessagePopupComponent } from './components/schedule-message-popup/schedule-message-popup.component';
import { AmountFormatDirective } from './directives/amount-format.directive';
import { WarningNotePopupComponent } from './components/warning-note-popup/warning-note-popup.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ReminderTimeComponent } from './components/reminder-time/reminder-time.component';
import { TrudiStepButtonComponent } from './components/button/trudi-step-button/trudi-step-button';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { UploadFileButtonComponent } from './upload-file-button/upload-file-button.component';
import { FormatUTCDatePipe } from './pipes/format-utc-date';
import { CustomPipesModule } from './pipes/customPipes.module';
import { AudioControlComponent } from './components/audio-control/audio-control.component';
import { PermissionDirective } from './directives/permission.directive';
import { ValidateTreeDirective } from './directives/validate-tree.directive';
import { DropdownPillComponent } from './components/dropdown-pill/dropdown-pill.component';
import { FilterByPortfolioComponent } from './components/filter-by-portfolio/filter-by-portfolio.component';
import { FilterPortfolioBoxComponent } from './components/filter-by-portfolio/filter-portfolio-box/filter-portfolio-box.component';
import { FilterByAssigneeComponent } from './components/filter-by-assignee/filter-by-assignee.component';
import { FilterAssigneeBoxComponent } from './components/filter-by-assignee/filter-assignee-box/filter-assignee-box.component';
import { LazyLoadDirective } from './directives/LazyLoad.directive';
import { FilterFocusViewComponent } from './components/filter-focus-view/filter-focus-view.component';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { ClickOutsideModule } from './directives/click-outside/click-outside.module';
import ImageDetailComponent from './components/image-detail/image-detail.component';
import { UpgradeMessageModule } from './components/upgrade-message/upgrade-message.module';
import { TrudiAddContactCardModule } from './components/trudi-add-contact-card/trudi-add-contact-card.module';
import { SidebarItemSharedComponent } from './components/sidebar-item-shared/sidebar-item-shared.component';
import { TaskEditorToolbarModule } from '@/app/dashboard/modules/task-editor/components/task-editor-toolbar/task-editor-toolbar/task-editor-toolbar.module';
import { ChargesDetailPopUpComponent } from './components/charges-detail-pop-up/charges-detail-pop-up.component';
import { LanguageTranslationLabelComponent } from './components/language-translation-label/language-translation-label.component';
import { LanguageOriginalContentComponent } from './components/language-original-content/language-original-content.component';
import { SelectEventsProviderComponent } from './components/select-events-provider/select-events-provider.component';
import { EventsListComponent } from './components/select-events-provider/events-list/events-list.component';
import { NzElementPatchModule } from 'ng-zorro-antd/core/element-patch';
import { ConfirmPropertiesPopupComponent } from './components/confirm-properties-popup/confirm-properties-popup.component';
import { FilterByStatusComponent } from './components/filter-by-status/filter-by-status.component';
import { FilterStatusBoxComponent } from './components/filter-by-status/filter-status-box/filter-status-box.component';
import { FilterByEventComponent } from './components/filter-by-event/filter-by-event.component';
import { FilterByTaskTypeComponent } from './components/filter-by-task-type/filter-by-task-type.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TrudiToolbarModule } from './components/trudi-toolbar/trudi-toolbar.module';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { UploadFromCrmModule } from './components/upload-from-crm/upload-from-crm.module';
import { EmailAutomaticInvoicesComponent } from './email-automatic-invoices/email-automatic-invoices.component';
import { InboxFilterComponent } from '@/app/dashboard/modules/inbox/components/inbox-filter/inbox-filter.component';
import { FilterDropdownComponent } from '@/app/dashboard/modules/inbox/components/filter-dropdown/filter-dropdown.component';
import { DragCursorDirective } from './directives/drag-cursor.directive';
import { SubscribeToCalendarComponent } from './components/subscribe-to-calendar/subscribe-to-calendar.component';
import { CustomDirectivesModule } from './directives/custom-directive.module';
import { FormatEntityTypePipe } from './pipes/format-entity-type.pipe';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PdfViewerDocumentComponent } from './components/pdf-viewer-document/pdf-viewer-document.component';
import { SelectReassignContactPopupComponent } from './components/select-reassign-contact-popup/select-reassign-contact-popup.component';
import { TrudiItemDirective } from '@shared/directives/trudi-item.directive';
import { ImageErrorHandlerDirective } from './directives/image-error-handler.directive';
import { MsgAttachmentLoadModule } from './components/msg-attachment-load/msg-attachment-load.module';
import { HideWithConsoleDirective } from '@shared/directives/hide-with-console.directive';
import { MessageChangePropertyComponent } from './components/chat/message-change-property/message-change-property.component';
import { LinkedToComponent } from './components/linked-to/linked-to.component';
import { MessageDeletedComponent } from './components/chat/message-deleted/message-deleted.component';
import { ViewTasksModalComponent } from './components/view-tasks-modal/view-tasks-modal.component';
import { AddContactPopupComponent } from './components/add-contact-popup/add-contact-popup.component';
import { AddContactBoxComponent } from './components/add-contact-popup/add-contact-box/add-contact-box.component';
import { CreateNewContactPopupComponent } from './components/add-contact-popup/create-new-contact-popup/create-new-contact-popup.component';
import { AssignAttachBoxModule } from './components/assign-attach-box/assign-attach-box.module';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { MessageSyncedConversationComponent } from './components/chat/message-synced-conversation/message-synced-conversation.component';
import { ConfirmPropertiesTaskPtPopupComponent } from './components/confirm-properties-task-pt-popup/confirm-properties-task-pt-popup.component';
import { NotifyUpdatedVersionDbComponent } from './notify-updated-version-db/notify-updated-version-db/notify-updated-version-db.component';
import { ExportConversationHistoryComponent } from './components/export-conversation-history/export-conversation-history.component';
import { ResolveConversationPopupComponent } from './components/resolve-conversation-popup/resolve-conversation-popup.component';
import { SaveMailboxActivityPopupComponent } from './components/save-mailbox-activity-popup/save-mailbox-activity-popup.component';
import { WarningPropertyComponent } from '@/app/task-detail/modules/header-left/components/warning-property/warning-property.component';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { MessageEndSessionComponent } from './components/chat/message-end-session/message-end-session.component';
import { UpdateVersionPopupComponent } from './update-version-popup/update-version-popup.component';
import { CreateEditGmailFolderPopUpComponent } from './components/create-edit-gmail-folder-pop-up/create-edit-gmail-folder-pop-up.component';
import { MessageGroupsComponent } from './components/message-groups/message-groups.component';
import { RxFor } from '@rx-angular/template/for';
import { FilterShowTaskMessageComponent } from './components/filter-show-task-message/filter-show-task-message.component';
import { InTaskTagComponent } from './components/in-task-tag/in-task-tag.component';
import { ZoomableMediaComponent } from '@shared/components/zoomable-media/zoomable-media.component';
import { LinkedTaskComponent } from './components/linked-task/linked-task.component';
import { InboxToolbarComponent } from '@/app/dashboard/modules/inbox/components/inbox-toolbar/inbox-toolbar.component';
import { ScalePercentInputComponent } from './components/zoomable-media/scale-percent-input/scale-percent-input.component';
import { ScheduleMessageV2Component } from './components/schedule-message-v2/schedule-message-v2.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TriggerTextSelectionAddPolicyDirective } from './directives/trigger-text-selection-add-policy.directive';
import { SelectFacebookPageComponent } from './components/select-facebook-page/select-facebook-page.component';
import { ReplyMessageBtnComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/reply-message-btn/reply-message-btn.component';
import { MessageReplyComponent } from './components/chat/message-reply';
import { NzTrimPipe } from 'ng-zorro-antd/pipes';
import { RequestCardComponent } from './components/request-card/request-card.component';
import { TrudiUiModule } from '@trudi-ui';
import { PreventButtonModule } from '@trudi-ui';
import { MessageParticipantsComponent } from '@/app/dashboard/modules/inbox/components/message-participants/message-participants.component';
import { ImagesCarouselModalComponent } from './components/images-carousel-modal/images-carousel-modal.component';
import { TwemojiPipe } from './pipes/twemoji.pipe';

@NgModule({
  imports: [
    TaskEditorToolbarModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SwiperModule,
    NgSelectModule,
    NgOptionHighlightModule,
    RouterModule,
    AutosizeModule,
    DragDropModule,
    PdfJsViewerModule,
    PopupModule,
    SharePopUpModule,
    TrudiDatePickerModule,
    NzPopoverModule,
    NzToolTipModule,
    TinyEditorModule,
    RemainingCharacterModule,
    NzSkeletonModule,
    NzMenuModule,
    NzDropDownModule,
    InfiniteScrollModule,
    CustomPipesModule,
    ClickOutsideModule,
    UpgradeMessageModule,
    TrudiAddContactCardModule,
    NzElementPatchModule,
    TrudiToolbarModule,
    UploadFromCrmModule,
    NgxDocViewerModule,
    ScrollingModule,
    CustomDirectivesModule,
    PdfViewerModule,
    MsgAttachmentLoadModule,
    AssignAttachBoxModule,
    RxLet,
    RxIf,
    RxFor,
    ButtonAttionModule,
    ZoomableMediaComponent,
    ScalePercentInputComponent,
    EditorModule,
    ReplyMessageBtnComponent,
    MessageReplyComponent,
    NzTrimPipe,
    TrudiUiModule,
    PreventButtonModule,
    TwemojiPipe
  ],
  providers: [ApiService, PhoneNumberFormatPipe, CustomPipesModule],
  declarations: [
    ValidateTreeDirective,
    GoogleplaceDirective,
    DigitOnlyDirective,
    MessageAgentJoinComponent,
    MessageAgentJoinComponent,
    MessageHeaderComponent,
    MessageActionLinkComponent,
    MessageFileComponent,
    MessageCallComponent,
    MessageAgentExpectationComponent,
    MessageReopenedComponent,
    MessageResolvedComponent,
    TrudiDefaultActionsComponent,
    TrudiNavLinksComponent,
    TrudiUrlComponent,
    LoaderComponent,
    PopupComponent,
    TabsComponent,
    TabComponent,
    ProgressBarComponent,
    MessageRecordComponent,
    TypingAnimationComponent,
    MessageFooterComponent,
    PopupAskRecordCallComponent,
    TextBadgeComponent,
    TdCheckboxComponent,
    RippleDirective,
    TriggerMenuDirective,
    CircleLoadingIndicatorComponent,
    NumberPhoneFormatInputDirective,
    OutlineRoundedButtonComponent,
    ImagesCarouselComponent,
    ImagesCarouselModalComponent,
    VideoPlayerComponent,
    SendVerifiedEmailSuccessComponent,
    SendMessageSuccessComponent,
    SendMessageComponent,
    SelectPeoplePopupComponent,
    QuitConfirmComponent,
    SendAppInviteComponent,
    SendActionLinkComponent,
    CreateEditActionLinkSuccessComponent,
    NewActionLinkPopupComponent,
    AddFilesPopUpComponent,
    ConfirmSendVerifiedEmailComponent,
    ShowPersonComponent,
    ModalDialogComponent,
    AvatarButtonComponent,
    CircleButtonComponent,
    TaskTicketComponent,
    SwitchCheckboxComponent,
    PopupLikeToSayComponent,
    InfoTicketComponent,
    DropdownMenuComponent,
    DropdownTriggerForDirective,
    AssignToAgentsComponent,
    SuccessModalPopupComponent,
    PopupDeleteComponent,
    PaginationComponent,
    DocumentRequestAddTenancyAgreementPopupComponent,
    DocumentRequestSendMessageComponent,
    DocumentRequestQuitConfirmComponent,
    DocumentRequestAddFilesPopUpComponent,
    ButtonUploadFileComponent,
    UploadAttachmentComponent,
    CardUploadFileComponent,
    DateTimePickerComponent,
    PopupTenantIntentionComponent,
    TimePickerComponent,
    RangeTimePickerComponent,
    FavouriteStarComponent,
    ReminderItemComponent,
    WarningPopupComponent,
    AttachEntryNoteComponent,
    SelectDocumentComponent,
    ReviewAttachmentPopupComponent,
    PopupModalComponent,
    AddEmailPopUpComponent,
    YearCalendarComponent,
    MonthCalendarComponent,
    LoaderGlobalComponent,
    ChipComponent,
    DetectFocusDirective,
    AmountFormatDirective,
    InforPeopleComponent,
    CardInfoPeopleComponent,
    InforPeopleComponent,
    CardInfoPeopleComponent,
    LeaseShareComponent,
    MessageConversationMovedComponent,
    AddNotePropertyComponent,
    NotifyNewVersionPopupComponent,
    NotifyUpdatedVersionDbComponent,
    ListItemSelectPeopleComponent,
    ScheduleMessageComponent,
    TimeDetailRoutineComponent,
    ListItemSelectTenantComponent,
    MaxLengthNumberDirective,
    SelectContactPopupComponent,
    HeaderTrudiPageComponent,
    ConfirmSendInviteOrMessageComponent,
    ButtonWithDropdownActionsComponent,
    ScheduleMessagePopupComponent,
    ScheduleMessageV2Component,
    WarningNotePopupComponent,
    ReminderTimeComponent,
    TrudiStepButtonComponent,
    UploadFileButtonComponent,
    AudioControlComponent,
    FormatUTCDatePipe,
    PermissionDirective,
    DropdownPillComponent,
    FilterByPortfolioComponent,
    FilterPortfolioBoxComponent,
    FilterByAssigneeComponent,
    FilterAssigneeBoxComponent,
    FilterByStatusComponent,
    LazyLoadDirective,
    FilterFocusViewComponent,
    AppHeaderComponent,
    ImageDetailComponent,
    SidebarItemSharedComponent,
    ChargesDetailPopUpComponent,
    LanguageTranslationLabelComponent,
    LanguageOriginalContentComponent,
    FilterByEventComponent,
    SelectEventsProviderComponent,
    EventsListComponent,
    EmailAutomaticInvoicesComponent,
    ConfirmPropertiesPopupComponent,
    FilterStatusBoxComponent,
    FilterByTaskTypeComponent,
    EventsListComponent,
    DragCursorDirective,
    InboxFilterComponent,
    FilterDropdownComponent,
    SubscribeToCalendarComponent,
    FormatEntityTypePipe,
    PdfViewerDocumentComponent,
    SelectReassignContactPopupComponent,
    TrudiItemDirective,
    ImageErrorHandlerDirective,
    HideWithConsoleDirective,
    HideWithConsoleDirective,
    MessageChangePropertyComponent,
    LinkedToComponent,
    MessageDeletedComponent,
    ViewTasksModalComponent,
    AddContactPopupComponent,
    AddContactBoxComponent,
    CreateNewContactPopupComponent,
    MessageSyncedConversationComponent,
    ConfirmPropertiesTaskPtPopupComponent,
    ExportConversationHistoryComponent,
    ResolveConversationPopupComponent,
    SaveMailboxActivityPopupComponent,
    WarningPropertyComponent,
    MessageEndSessionComponent,
    UpdateVersionPopupComponent,
    CreateEditGmailFolderPopUpComponent,
    MessageGroupsComponent,
    FilterShowTaskMessageComponent,
    InTaskTagComponent,
    LinkedTaskComponent,
    InboxToolbarComponent,
    TriggerTextSelectionAddPolicyDirective,
    SelectFacebookPageComponent,
    RequestCardComponent,
    MessageParticipantsComponent
  ],
  exports: [
    SwiperModule,
    AddContactPopupComponent,
    AddContactBoxComponent,
    TaskEditorToolbarModule,
    LazyLoadDirective,
    DropdownPillComponent,
    ValidateTreeDirective,
    AmountFormatDirective,
    DetectFocusDirective,
    PopupModule,
    ChipComponent,
    YearCalendarComponent,
    FavouriteStarComponent,
    PopupModalComponent,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgOptionHighlightModule,
    GoogleplaceDirective,
    DigitOnlyDirective,
    MessageAgentJoinComponent,
    MessageAgentJoinComponent,
    MessageHeaderComponent,
    MessageActionLinkComponent,
    MessageFileComponent,
    MessageCallComponent,
    MessageAgentExpectationComponent,
    MessageReopenedComponent,
    MessageResolvedComponent,
    TrudiDefaultActionsComponent,
    TrudiNavLinksComponent,
    TrudiUrlComponent,
    LoaderComponent,
    PopupComponent,
    TabsComponent,
    TabComponent,
    ProgressBarComponent,
    MessageRecordComponent,
    TypingAnimationComponent,
    MessageFooterComponent,
    PopupAskRecordCallComponent,
    TextBadgeComponent,
    TdCheckboxComponent,
    RippleDirective,
    TriggerMenuDirective,
    CircleLoadingIndicatorComponent,
    NumberPhoneFormatInputDirective,
    OutlineRoundedButtonComponent,
    ImagesCarouselComponent,
    ImagesCarouselModalComponent,
    SendVerifiedEmailSuccessComponent,
    SendMessageSuccessComponent,
    SendMessageComponent,
    RemainingCharacterModule,
    SelectPeoplePopupComponent,
    QuitConfirmComponent,
    SendAppInviteComponent,
    SendActionLinkComponent,
    CreateEditActionLinkSuccessComponent,
    NewActionLinkPopupComponent,
    AddFilesPopUpComponent,
    ConfirmSendVerifiedEmailComponent,
    ShowPersonComponent,
    ModalDialogComponent,
    AvatarButtonComponent,
    CircleButtonComponent,
    TaskTicketComponent,
    PopupLikeToSayComponent,
    SwitchCheckboxComponent,
    InfoTicketComponent,
    DropdownMenuComponent,
    DropdownTriggerForDirective,
    AssignToAgentsComponent,
    SuccessModalPopupComponent,
    PopupDeleteComponent,
    PaginationComponent,
    DocumentRequestAddTenancyAgreementPopupComponent,
    DocumentRequestSendMessageComponent,
    DocumentRequestQuitConfirmComponent,
    DocumentRequestAddFilesPopUpComponent,
    ButtonUploadFileComponent,
    UploadAttachmentComponent,
    CardUploadFileComponent,
    DateTimePickerComponent,
    PopupTenantIntentionComponent,
    TimePickerComponent,
    RangeTimePickerComponent,
    WarningPopupComponent,
    AttachEntryNoteComponent,
    SelectDocumentComponent,
    ReviewAttachmentPopupComponent,
    AddEmailPopUpComponent,
    LoaderGlobalComponent,
    InforPeopleComponent,
    InforPeopleComponent,
    LeaseShareComponent,
    MessageConversationMovedComponent,
    AddNotePropertyComponent,
    NotifyNewVersionPopupComponent,
    NotifyUpdatedVersionDbComponent,
    ScheduleMessageComponent,
    TimeDetailRoutineComponent,
    ListItemSelectTenantComponent,
    MaxLengthNumberDirective,
    SelectContactPopupComponent,
    HeaderTrudiPageComponent,
    ConfirmSendInviteOrMessageComponent,
    ButtonWithDropdownActionsComponent,
    TinyEditorModule,
    SharePopUpModule,
    NzPopoverModule,
    ScheduleMessagePopupComponent,
    ScheduleMessageV2Component,
    NzToolTipModule,
    WarningNotePopupComponent,
    ReminderTimeComponent,
    TrudiStepButtonComponent,
    UploadFileButtonComponent,
    FormatUTCDatePipe,
    CustomPipesModule,
    AudioControlComponent,
    PermissionDirective,
    FilterByPortfolioComponent,
    FilterPortfolioBoxComponent,
    FilterByAssigneeComponent,
    FilterByStatusComponent,
    FilterFocusViewComponent,
    ImageDetailComponent,
    TrudiAddContactCardModule,
    TrudiToolbarModule,
    SidebarItemSharedComponent,
    ChargesDetailPopUpComponent,
    LanguageTranslationLabelComponent,
    LanguageOriginalContentComponent,
    SelectEventsProviderComponent,
    EmailAutomaticInvoicesComponent,
    ConfirmPropertiesPopupComponent,
    FilterByEventComponent,
    FilterByTaskTypeComponent,
    SelectEventsProviderComponent,
    InboxFilterComponent,
    FilterDropdownComponent,
    DragCursorDirective,
    UploadFromCrmModule,
    SubscribeToCalendarComponent,
    FormatEntityTypePipe,
    SelectReassignContactPopupComponent,
    TrudiItemDirective,
    HideWithConsoleDirective,
    MessageChangePropertyComponent,
    MessageSyncedConversationComponent,
    ImageErrorHandlerDirective,
    LinkedToComponent,
    MessageDeletedComponent,
    ViewTasksModalComponent,
    CustomDirectivesModule,
    ConfirmPropertiesTaskPtPopupComponent,
    ExportConversationHistoryComponent,
    ResolveConversationPopupComponent,
    SaveMailboxActivityPopupComponent,
    WarningPropertyComponent,
    MessageEndSessionComponent,
    UpdateVersionPopupComponent,
    CreateEditGmailFolderPopUpComponent,
    MessageGroupsComponent,
    FilterShowTaskMessageComponent,
    InTaskTagComponent,
    LinkedTaskComponent,
    InboxToolbarComponent,
    TriggerTextSelectionAddPolicyDirective,
    SelectFacebookPageComponent,
    ReplyMessageBtnComponent,
    MessageReplyComponent,
    RequestCardComponent,
    MessageParticipantsComponent
  ]
})
export class SharedModule {}
