import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Editor as TinyMCEEditor } from 'tinymce';
import {
  ColorFormat,
  FortmatStyleType,
  FontSelectItem,
  defaultBackgroundColor,
  getCurrentColor,
  getMatchingStyles,
  listBackgroundColor
} from '@shared/components/tiny-editor/utils/font-utils';

@Component({
  selector: 'text-background-color',
  templateUrl: './text-background-color.component.html',
  styleUrls: ['./text-background-color.component.scss']
})
export class TextBackgroundColorComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() editor: TinyMCEEditor = null;
  public backgroundColors = listBackgroundColor;
  public visibleDropdown = false;

  private currentEditorInstance: TinyMCEEditor = null;
  private timeOutHandle: NodeJS.Timeout = null;
  public currentBackgroundColor = defaultBackgroundColor;
  public isMultipleSelected = false;
  constructor(protected cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.editor) {
      this.editor.on('NodeChange', this.onNodeChange.bind(this));
      this.editor.on('SelectionChange', this.onSelectionChange.bind(this));
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
      editorInstance.on('SelectionChange', this.onSelectionChange.bind(this));

      if (this.currentEditorInstance) {
        this.currentEditorInstance.off(
          'NodeChange',
          this.onNodeChange.bind(this)
        );
        this.currentEditorInstance.off(
          'SelectionChange',
          this.onSelectionChange.bind(this)
        );
      }

      this.currentEditorInstance = editorInstance;
    }
  }

  checkIsMultipleFonts(): boolean {
    const selectionContent = this.currentEditorInstance.selection.getContent();
    if (selectionContent && selectionContent.trim() !== '') {
      const startNode = this.currentEditorInstance.selection.getStart();
      const endNode = this.currentEditorInstance.selection.getEnd();
      const selectedNode = this.currentEditorInstance.selection.getNode();

      if (startNode !== endNode && selectedNode.childNodes.length <= 2) {
        const startNodeFont =
          getComputedStyle(startNode).getPropertyValue('background-color');
        const endNodeFont =
          getComputedStyle(endNode).getPropertyValue('background-color');
        if (startNodeFont !== endNodeFont) return true;
      } else {
        return (
          getMatchingStyles(selectionContent, FortmatStyleType.BackColor)
            .length > 1
        );
      }
    }

    return false;
  }

  getMatchingValue() {
    if (this.checkIsMultipleFonts()) {
      this.isMultipleSelected = true;
      //If highlighted text contain multiple font styles: font size in WYSIWYG should be empty
      return defaultBackgroundColor;
    }
    this.isMultipleSelected = false;
    const color = getCurrentColor(
      this.currentEditorInstance,
      ColorFormat.hilitecolor
    );

    if (!!color) {
      return {
        title: color,
        format: color
      };
    }
    return defaultBackgroundColor;
  }

  checkDisplayBackgroundColor() {
    const matchItem = this.getMatchingValue();
    if (matchItem.format !== this.currentBackgroundColor.format) {
      this.currentBackgroundColor = matchItem;
      this.cdr.markForCheck();
    }
  }
  onHandleChangeBackgroundColor(color?: FontSelectItem) {
    this.currentBackgroundColor = color;
    if (this.currentEditorInstance) {
      this.currentEditorInstance.undoManager.transact(() => {
        this.currentEditorInstance.focus();
        const format = ColorFormat.hilitecolor as any;
        this.currentEditorInstance.execCommand(
          'mceApplyTextcolor',
          format,
          color.format
        );
      });
    }
    this.visibleDropdown = !this.visibleDropdown;
  }
  removeBackgroundColor() {
    this.currentBackgroundColor = defaultBackgroundColor;
    if (this.currentEditorInstance) {
      this.currentEditorInstance.undoManager.transact(() => {
        this.currentEditorInstance.focus();
        const format = ColorFormat.hilitecolor as any;
        this.currentEditorInstance.execCommand('mceRemoveTextcolor', format);
      });
    }
  }
  onNodeChange() {
    clearTimeout(this.timeOutHandle);
    this.checkDisplayBackgroundColor();
  }

  onSelectionChange() {
    //Handle for the case selected text -> un-select, the tinymce maybe doesn't fire the NodeChange event
    const selectionContent = this.currentEditorInstance.selection.getContent();
    if (selectionContent.trim() === '') {
      clearTimeout(this.timeOutHandle);
      this.timeOutHandle = setTimeout(() => {
        this.checkDisplayBackgroundColor();
      }, 300);
    }
  }

  ngOnDestroy(): void {
    if (this.currentEditorInstance) {
      this.currentEditorInstance.off(
        'NodeChange',
        this.onNodeChange.bind(this)
      );
      this.currentEditorInstance.off(
        'SelectionChange',
        this.onSelectionChange.bind(this)
      );
    }

    if (this.editor) {
      this.editor.off('NodeChange', this.onNodeChange.bind(this));
      this.editor.off('SelectionChange', this.onSelectionChange.bind(this));
    }

    if (this.timeOutHandle) clearTimeout(this.timeOutHandle);
  }
}
