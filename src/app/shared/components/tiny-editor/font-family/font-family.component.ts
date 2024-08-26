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
  FontSelectItem,
  listFontFamilies,
  getFirstFont,
  isSystemFontStack,
  getMatchingStyles,
  FortmatStyleType,
  APPLY_CUSTOM_FONT_EVENT,
  defaultFontFamily,
  CUSTOMIZE_FONT_STYLE_CLASS
} from '@shared/components/tiny-editor/utils/font-utils';
import { FontSetting } from '@services/agency-email-font-setting.service';

@Component({
  selector: 'font-family',
  templateUrl: './font-family.component.html',
  styleUrls: ['./font-family.component.scss']
})
export class FontFamilyComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editor: TinyMCEEditor = null;

  public fontFamilies = listFontFamilies;
  private systemFont = 'System Font';
  private readonly emptyFont = {
    title: '',
    format: ''
  };

  //Default font family is Inter
  public currentFontFamily = defaultFontFamily;
  public settingFontFamily = '';
  public visibleDropdown = false;

  private currentEditorInstance: TinyMCEEditor = null;
  private timeOutHandle: NodeJS.Timeout = null;

  constructor(protected cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.editor) {
      this.editor.on('NodeChange', this.onNodeChange.bind(this));
      this.editor.on('SelectionChange', this.onSelectionChange.bind(this));
      this.editor.on(
        APPLY_CUSTOM_FONT_EVENT,
        this.onApplyCustomFont.bind(this)
      );
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
      editorInstance.on(
        APPLY_CUSTOM_FONT_EVENT,
        this.onApplyCustomFont.bind(this)
      );

      if (this.currentEditorInstance) {
        this.currentEditorInstance.off(
          'NodeChange',
          this.onNodeChange.bind(this)
        );
        this.currentEditorInstance.off(
          'SelectionChange',
          this.onSelectionChange.bind(this)
        );
        this.currentEditorInstance.off(
          APPLY_CUSTOM_FONT_EVENT,
          this.onApplyCustomFont.bind(this)
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
          getComputedStyle(startNode).getPropertyValue('font-family');
        const endNodeFont =
          getComputedStyle(endNode).getPropertyValue('font-family');
        if (startNodeFont !== endNodeFont) return true;
      } else {
        const defaultFont =
          this.settingFontFamily ||
          getComputedStyle(
            this.currentEditorInstance.getBody()
          ).getPropertyValue('font-family');
        return (
          getMatchingStyles(
            selectionContent,
            FortmatStyleType.FontName,
            defaultFont
          ).length > 1
        );
      }
    }

    return false;
  }

  getMatchingValue() {
    if (this.checkIsMultipleFonts()) {
      //If highlighted text contain multiple font styles: font style in WYSIWYG should be empty
      return this.emptyFont;
    }

    const fontFamily =
      this.currentEditorInstance?.queryCommandValue('FontName');
    const font = fontFamily ? fontFamily.toLowerCase() : '';
    const defaultFontStack =
      this.currentEditorInstance.options.get('default_font_stack');
    const matchItem = this.fontFamilies.find((item) => {
      const format = item.format;
      return (
        format.toLowerCase() === font ||
        getFirstFont(format).toLowerCase() === getFirstFont(font).toLowerCase()
      );
    });

    if (!matchItem) {
      if (isSystemFontStack(font, defaultFontStack)) {
        return {
          title: this.systemFont,
          format: font
        };
      } else {
        return this.emptyFont;
      }
    }

    return matchItem;
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

  checkDisplayFont() {
    const matchItem = this.getMatchingValue();
    if (matchItem.format !== this.currentFontFamily.format) {
      this.currentFontFamily = matchItem;
      this.cdr.markForCheck();
    }
  }

  onHandleChangeFontFamily(font: FontSelectItem) {
    this.currentFontFamily = font;
    if (this.currentEditorInstance) {
      this.currentEditorInstance.undoManager.transact(() => {
        this.currentEditorInstance.focus();
        this.currentEditorInstance.execCommand('FontName', false, font.format);
      });
    }
    this.visibleDropdown = !this.visibleDropdown;
  }

  onApplyCustomFont(setting: FontSetting) {
    if (
      this.currentEditorInstance &&
      !this.currentEditorInstance.hasFocus() &&
      this.currentFontFamily.format !== setting.fontStyle
    ) {
      const firstChild =
        this.currentEditorInstance.getBody()?.firstElementChild;
      let activeVal = setting.fontStyle;
      //If the first child has customize font, we need active font based on wrap element
      if (
        firstChild &&
        this.currentEditorInstance.dom.hasClass(
          firstChild,
          CUSTOMIZE_FONT_STYLE_CLASS
        )
      ) {
        activeVal =
          getComputedStyle(firstChild).getPropertyValue('font-family');
      }

      const activeItem = this.fontFamilies.find(
        (item) => item.format === activeVal
      );
      if (activeItem) {
        this.currentFontFamily = activeItem;
        this.cdr.markForCheck();
      }
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
      this.currentEditorInstance.off(
        APPLY_CUSTOM_FONT_EVENT,
        this.onApplyCustomFont.bind(this)
      );
    }

    if (this.editor) {
      this.editor.off('NodeChange', this.onNodeChange.bind(this));
      this.editor.off('SelectionChange', this.onSelectionChange.bind(this));
      this.editor.off(
        APPLY_CUSTOM_FONT_EVENT,
        this.onApplyCustomFont.bind(this)
      );
    }

    if (this.timeOutHandle) clearTimeout(this.timeOutHandle);
  }
}
