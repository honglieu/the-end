import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentManagerNotesComponent } from './rent-manager-notes.component';
import { TrudiUiModule } from '@trudi-ui';
import { NotesRmWidgetComponent } from './components/notes-rm-widget/notes-rm-widget.component';
import { RentManagerNotesService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes.service';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { SharedModule as SharedWidgetRentManagerModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { SelectNotesPopupComponent } from './components/select-notes-popup/select-notes-popup.component';
import { SyncNotesPopupComponent } from './components/sync-notes-popup/sync-notes-popup.component';
import { SharedModule } from '@shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SharedModule as SharedModuleSidebarLeft } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { FormatLabelBySaveToTypePipe } from './pipes/format-label.pipe';
import { NoteCardComponent } from './components/note-card/note-card.component';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { PopupManagementService } from './services/popup-management.service';
import { FormatNoteInfoPipe } from './pipes/form-note-info.pipe';
import { AttachFilePopupComponent } from './components/attach-file-popup/attach-file-popup.component';
@NgModule({
  declarations: [
    RentManagerNotesComponent,
    NotesRmWidgetComponent,
    SelectNotesPopupComponent,
    SyncNotesPopupComponent,
    FormatLabelBySaveToTypePipe,
    NoteCardComponent,
    FormatNoteInfoPipe,
    AttachFilePopupComponent
  ],
  imports: [
    CommonModule,
    TrudiUiModule,
    SharedWidgetRentManagerModule,
    SharedModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomPipesModule,
    SharedModule,
    SharedModuleSidebarLeft,
    WidgetCommonModule
  ],
  providers: [
    RentManagerNotesService,
    RentManagerNotesFormService,
    PopupManagementService
  ],
  exports: [RentManagerNotesComponent, NotesRmWidgetComponent]
})
export class RentManagerNotesModule {}
