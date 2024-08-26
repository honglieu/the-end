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
  defaultTextColor,
  getCurrentColor,
  getMatchingStyles,
  listTextColor
} from '@shared/components/tiny-editor/utils/font-utils';

@Component({
  selector: 'text-color',
  templateUrl: './text-color.component.html',
  styleUrls: ['./text-color.component.scss']
})
export class TextColorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() editor: TinyMCEEditor = null;
  public visibleDropdown = false;
  public textColors = listTextColor;
  public currentTextColor = defaultTextColor;
  public isMultipleSelected = false;
  private timeOutHandle: NodeJS.Timeout = null;
  private currentEditorInstance: TinyMCEEditor = null;

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

  checkIsMultipleTextColors(): boolean {
    const selectionContent = this.currentEditorInstance.selection.getContent();
    if (selectionContent && selectionContent.trim() !== '') {
      const startNode = this.currentEditorInstance.selection.getStart();
      const endNode = this.currentEditorInstance.selection.getEnd();
      const selectedNode = this.currentEditorInstance.selection.getNode();
      if (startNode !== endNode && selectedNode.childNodes.length <= 2) {
        const startNodeFont =
          getComputedStyle(startNode).getPropertyValue('color');
        const endNodeFont = getComputedStyle(endNode).getPropertyValue('color');
        if (startNodeFont !== endNodeFont) return true;
      } else {
        return (
          getMatchingStyles(selectionContent, FortmatStyleType.ForeColor)
            .length > 1
        );
      }
    }

    return false;
  }
  getMatchingValue() {
    if (this.checkIsMultipleTextColors()) {
      this.isMultipleSelected = true;
      //If highlighted text contain multiple font styles: font size in WYSIWYG should be empty
      return defaultTextColor;
    }
    this.isMultipleSelected = false;
    const color = getCurrentColor(
      this.currentEditorInstance,
      ColorFormat.forecolor
    );
    if (!!color) {
      return {
        title: color,
        format: color
      };
    }
    return defaultTextColor;
  }

  checkDisplayFont() {
    const matchItem = this.getMatchingValue();
    if (matchItem.format !== this.currentTextColor.format) {
      this.currentTextColor = matchItem;
      this.cdr.markForCheck();
    }
  }

  onHandleChangeFontColor(color: FontSelectItem) {
    this.currentTextColor = color;
    if (this.currentEditorInstance) {
      this.currentEditorInstance.undoManager.transact(() => {
        this.currentEditorInstance.focus();
        const format = ColorFormat.forecolor as any;
        this.currentEditorInstance.execCommand(
          'mceApplyTextcolor',
          format,
          color.format
        );
      });
    }
    this.visibleDropdown = !this.visibleDropdown;
  }

  onNodeChange() {
    clearTimeout(this.timeOutHandle);
    this.checkDisplayFont();
  }

  onSelectionChange() {
    //Handle for the case selected text -> un-select, the tinymce maybe doesn't fire the NodeChange event
    const selectionContent = this.currentEditorInstance.selection.getContent();
    if (selectionContent.trim() === '') {
      clearTimeout(this.timeOutHandle);
      this.timeOutHandle = setTimeout(() => {
        this.checkDisplayFont();
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
