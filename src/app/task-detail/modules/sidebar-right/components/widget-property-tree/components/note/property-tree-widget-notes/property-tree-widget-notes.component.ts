import { Component, Input } from '@angular/core';
import { ETypeNotesPropertyTreeWidget } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/notes/type-notes-property-tree-widget.enum';

@Component({
  selector: 'property-tree-widget-notes',
  templateUrl: './property-tree-widget-notes.component.html',
  styleUrls: ['./property-tree-widget-notes.component.scss']
})
export class PropertyTreeWidgetNotesComponent {
  @Input() type: ETypeNotesPropertyTreeWidget;
  @Input() expenditure: string;
  @Input() notes: string;
  public readonly eTypeNote = ETypeNotesPropertyTreeWidget;

  get header(): string {
    switch (this.type) {
      case ETypeNotesPropertyTreeWidget.MAINTENANCE:
        return 'Maintenance note';
      case ETypeNotesPropertyTreeWidget.INSPECTION:
        return 'Inspection note';
      default:
        return '';
    }
  }

  get hasNotes(): boolean {
    switch (this.type) {
      case ETypeNotesPropertyTreeWidget.MAINTENANCE:
        return this.expenditure || this.notes ? true : false;
      case ETypeNotesPropertyTreeWidget.INSPECTION:
        return this.notes ? true : false;
      default:
        return false;
    }
  }
}
