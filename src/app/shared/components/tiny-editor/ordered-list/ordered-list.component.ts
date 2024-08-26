import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Editor as TinyMCEEditor } from 'tinymce';

@Component({
  selector: 'ordered-list',
  templateUrl: './ordered-list.component.html',
  styleUrl: './ordered-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderedListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editor: TinyMCEEditor = null;
  @Input() disabled: boolean = false;

  public isActive: boolean = false;
  private currentEditorInstance: TinyMCEEditor = null;
  private cmd = 'InsertOrderedList';

  constructor(protected cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.editor) {
      this.editor.on('NodeChange', this.onNodeChange.bind(this));
      this.currentEditorInstance = this.editor;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['editor'] &&
      changes['editor'].currentValue &&
      changes['editor'].currentValue !== this.currentEditorInstance
    ) {
      const editorInstance = changes['editor'].currentValue as TinyMCEEditor;
      editorInstance.on('NodeChange', this.onNodeChange.bind(this));
      if (this.currentEditorInstance) {
        this.currentEditorInstance.off(
          'NodeChange',
          this.onNodeChange.bind(this)
        );
      }

      this.currentEditorInstance = editorInstance;
    }
  }

  onNodeChange() {
    this.checkActiveButton();
  }

  checkActiveButton() {
    const cmdState = this.currentEditorInstance.queryCommandState(this.cmd);
    if (this.isActive !== cmdState) {
      this.isActive = cmdState;
      this.cdr.detectChanges();
    }
  }

  handleToggleAction() {
    const cmdState = this.currentEditorInstance.queryCommandState(this.cmd);
    if (cmdState) {
      this.currentEditorInstance.execCommand(this.cmd);
    } else {
      this.currentEditorInstance.execCommand(this.cmd, false, {
        'list-style-type': 'decimal',
        'list-item-attributes': { class: 'mylistitemclass' },
        'list-attributes': { id: 'mylist' }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.currentEditorInstance) {
      this.currentEditorInstance.off(
        'NodeChange',
        this.onNodeChange.bind(this)
      );
    }

    if (this.editor) {
      this.editor.off('NodeChange', this.onNodeChange.bind(this));
    }
  }
}
