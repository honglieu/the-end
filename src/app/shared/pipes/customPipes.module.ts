import { NgModule } from '@angular/core';
import { DateCasePipe } from './date-pipe';
import { DateTimeRangePipe } from './date-time-range.pipe';
import { DisableTrudiButtonPipe } from './disable-trudi-button';
import { TrudiFileIconPipe } from './file-icon.pipe';
import { FileInboxCasePipe } from './file-inbox-pipe';
import { FileCasePipe } from './file-pipe';
import { FilterTablePipe } from './filter-table.pipe';
import { HighlightSearch } from './highlight-text';
import { LimitLetterPipe } from './limit-string-pipe';
import { PhoneNumberFormatPipe } from './phonenumber-format.pipe';
import { PluralizePipe } from './pluralize';
import { RegionUpperCasePipe } from './region-upper-case-pipe';
import { SafeHTMLPipe } from './safe-html-pipe copy';
import { TimeAgoPipe } from './time-ago-pipe';
import { TrudiTitleCasePipe } from './title-case.pipe';
import { TrudiButtonClassPipe } from './trudi-button-class';
import { UppercaseFirstLetterPipe } from './uppercase-first-letter';
import { FormatNamePipe } from './format-name.pipe';
import { FormatParticipants } from './format-participants.pipe';
import { FormatTimePipe } from './format-time.pipe';
import { ConvertRoleNamePipe } from './convert-role-name.pipe';
import { RoundDecimalPipe } from './round-decimal.pipe';
import { LandlordToOwnerPipe } from './landlord-to-owner.pipe';
import { FormatDateTimePipe } from './format-date-time.pipe';
import { CheckMailboxPermission } from './check-mailbox-permission.pipe';
import { ConvertFileSizePipe } from './convert-file-sze';
import { DayLeftPipe } from './day-left.pipe';
import { ShortenName } from './shorten-name.pipe';
import { ConvertRoleUserPropertyPipe } from './convert-role-user-property.pipe';
import { DateTimeStringPipe } from './date-time-string.pipe';
import { TrudiDateTimePipe } from './trudi-date-time-pipe';
import { GetFileIconTypePipe } from './file-icon-type.pipe';
import { UserClassPipe } from './user-class.pipe';
import { SafePipe } from './safe-html-pipe';
import { FormatNameConversationPipe } from './format-name-conversation.pipe';
import { TrunCateUrlPipe } from './trun-cate-url.pipe';
import { CheckFileInvalid } from './check-file-invalid.pipe';
import { InboxIconPipe } from './inbox-icon.pipe';
import { FormatDatePipe } from './format-date';
import { FormatTimeStringPipe } from './format-time-string.pipe';
import { FormatCharectorDatePipe } from './format-date-charector.pipe';
import { FormatCustomDatePipe } from './format-custom-date.pipe';
import { FormatExpiredDatePipe } from './format-expired-date';
import { ViewClassNameRemainDaysPipe } from './view-classname-remain-days';
import { RegionTagNamePipe } from './region-tag-name.pipe';
import { UserTypeInPTPipe } from './user-type-in-pt.pipe';
import { ContactTitleByConversationPropertyPipe } from './contact-title-by-property.pipe';
import { ConvertRoleUserWithConversationPropertyPipe } from './convert-role-user-with-conversation-property.pipe';
import { FormatClassNamePipe } from './format-class-name.pipe';
import { IsHTMLPipe } from './is-html.pipe';
import { SuggestDatePipe } from '@shared/components/chat/ticket-modal/pipes/suggest-date.pipe';
import { ConversationStatusPipe } from './conversation-status.pipe';
import { PropertyStatusVariantPipe } from './property-status-variant.pipe';
import { GetThumbOfFilePipe } from './get-thumb-of-file.pipe';
import { TaskDateCasePipe } from '@/app/dashboard/modules/task-page/modules/task-preview/pipe/task-date-case.pipe';
import { TaskFolderSelectedPipe } from '@/app/dashboard/modules/inbox/pipes/task-folder-selected.pipe';
import { OrderByPipe } from '@/app/dashboard/modules/inbox/pipes/order-by.pipe';
import { TitleStatusPipe } from './title-status.pipe';
import { MapPipe } from './map.pipe';
import { TrudiUiModule } from '@trudi-ui';
import { FormatDateTimeAbbrevPipe } from './format-date-time-abbrev.pipe';
import { IsShowNotificationNewInternalNotePipe } from './isShowNotificationNewInternalNote.pipe';
import { AllowedMediaPipe } from '@/app/shared/pipes/allowed-media.pipe';

@NgModule({
  imports: [TrudiUiModule],
  providers: [
    FileInboxCasePipe,
    FileCasePipe,
    PhoneNumberFormatPipe,
    SafeHTMLPipe,
    FormatTimePipe,
    FormatDatePipe,
    FormatDateTimePipe,
    GetThumbOfFilePipe,
    FormatParticipants
  ],
  declarations: [
    DateCasePipe,
    TimeAgoPipe,
    FileCasePipe,
    SafeHTMLPipe,
    FileInboxCasePipe,
    LimitLetterPipe,
    HighlightSearch,
    PluralizePipe,
    DisableTrudiButtonPipe,
    TrudiButtonClassPipe,
    FilterTablePipe,
    PhoneNumberFormatPipe,
    RegionUpperCasePipe,
    DateTimeRangePipe,
    TrudiTitleCasePipe,
    TrudiFileIconPipe,
    UppercaseFirstLetterPipe,
    FormatNamePipe,
    FormatParticipants,
    FormatTimePipe,
    FormatDatePipe,
    FormatTimeStringPipe,
    ConvertRoleNamePipe,
    RoundDecimalPipe,
    UserTypeInPTPipe,
    LandlordToOwnerPipe,
    FormatDateTimePipe,
    CheckMailboxPermission,
    ConvertFileSizePipe,
    DayLeftPipe,
    ShortenName,
    ConvertRoleUserPropertyPipe,
    GetFileIconTypePipe,
    GetThumbOfFilePipe,
    DateTimeStringPipe,
    TrudiDateTimePipe,
    UserClassPipe,
    SafePipe,
    FormatNameConversationPipe,
    TrunCateUrlPipe,
    CheckFileInvalid,
    InboxIconPipe,
    FormatCharectorDatePipe,
    FormatClassNamePipe,
    FormatCustomDatePipe,
    FormatExpiredDatePipe,
    ViewClassNameRemainDaysPipe,
    RegionTagNamePipe,
    TaskDateCasePipe,
    ContactTitleByConversationPropertyPipe,
    ConvertRoleUserWithConversationPropertyPipe,
    IsHTMLPipe,
    SuggestDatePipe,
    ConversationStatusPipe,
    PropertyStatusVariantPipe,
    TaskFolderSelectedPipe,
    OrderByPipe,
    TitleStatusPipe,
    MapPipe,
    FormatDateTimeAbbrevPipe,
    IsShowNotificationNewInternalNotePipe,
    AllowedMediaPipe
  ],
  exports: [
    DateCasePipe,
    TimeAgoPipe,
    FileCasePipe,
    SafeHTMLPipe,
    FileInboxCasePipe,
    LimitLetterPipe,
    HighlightSearch,
    PluralizePipe,
    DisableTrudiButtonPipe,
    TrudiButtonClassPipe,
    FilterTablePipe,
    PhoneNumberFormatPipe,
    RegionUpperCasePipe,
    DateTimeRangePipe,
    TrudiTitleCasePipe,
    TrudiFileIconPipe,
    UppercaseFirstLetterPipe,
    FormatNamePipe,
    FormatParticipants,
    FormatTimePipe,
    FormatDatePipe,
    FormatTimeStringPipe,
    ConvertRoleNamePipe,
    ConvertRoleUserPropertyPipe,
    RoundDecimalPipe,
    UserTypeInPTPipe,
    LandlordToOwnerPipe,
    FormatDateTimePipe,
    CheckMailboxPermission,
    ConvertFileSizePipe,
    DayLeftPipe,
    ShortenName,
    DateTimeStringPipe,
    TrudiDateTimePipe,
    GetFileIconTypePipe,
    GetThumbOfFilePipe,
    UserClassPipe,
    SafePipe,
    TrunCateUrlPipe,
    FormatNameConversationPipe,
    CheckFileInvalid,
    InboxIconPipe,
    FormatCharectorDatePipe,
    FormatClassNamePipe,
    FormatCustomDatePipe,
    FormatExpiredDatePipe,
    ViewClassNameRemainDaysPipe,
    RegionTagNamePipe,
    TaskDateCasePipe,
    ContactTitleByConversationPropertyPipe,
    ConvertRoleUserWithConversationPropertyPipe,
    IsHTMLPipe,
    SuggestDatePipe,
    ConversationStatusPipe,
    PropertyStatusVariantPipe,
    TaskFolderSelectedPipe,
    OrderByPipe,
    TitleStatusPipe,
    MapPipe,
    FormatDateTimeAbbrevPipe,
    IsShowNotificationNewInternalNotePipe,
    AllowedMediaPipe
  ]
})
export class CustomPipesModule {}
