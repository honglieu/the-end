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
  defaultFontSize,
  listFontSizes,
  convertFontSizeToPt,
  convertFontSizeToLegacy,
  getMatchingStyles,
  FortmatStyleType,
  APPLY_CUSTOM_FONT_EVENT,
  CUSTOMIZE_FONT_STYLE_CLASS
} from '@shared/components/tiny-editor/utils/font-utils';
import {
  NzDropdownButtonDirective,
  NzDropDownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { NgForOf, NgIf } from '@angular/common';
import { NzMenuDirective, NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { FontSetting } from '@services/agency-email-font-setting.service';
import { CustomDirectivesModule } from '@/app/shared/directives';
import { TrudiUiModule } from '@trudi-ui';

@Component({
  selector: 'font-size',
  standalone: true,
  imports: [
    NzDropDownDirective,
    NzDropdownButtonDirective,
    NgForOf,
    NgIf,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    CustomDirectivesModule,
    TrudiUiModule
  ],
  templateUrl: './font-size.component.html',
  styleUrl: './font-size.component.scss'
})
export class FontSizeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editor: TinyMCEEditor = null;

  public fontSizes = listFontSizes;
  private readonly emptyFont = {
    title: '',
    format: ''
  };

  public currentFontSize = defaultFontSize;
  public settingFontSize = '';

  public displayDropdown = false;

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
          getComputedStyle(startNode).getPropertyValue('font-size');
        const endNodeFont =
          getComputedStyle(endNode).getPropertyValue('font-size');
        if (startNodeFont !== endNodeFont) return true;
      } else {
        const defaultFont =
          this.settingFontSize ||
          getComputedStyle(
            this.currentEditorInstance.getBody()
          ).getPropertyValue('font-size');
        return (
          getMatchingStyles(
            selectionContent,
            FortmatStyleType.FontSize,
            defaultFont
          ).length > 1
        );
      }
    }

    return false;
  }

  getMatchingValue() {
    if (this.checkIsMultipleFonts()) {
      //If highlighted text contain multiple font styles: font size in WYSIWYG should be empty
      return this.emptyFont;
    }

    const fontSize = this.currentEditorInstance?.queryCommandValue('FontSize');
    if (fontSize) {
      // checking for three digits after decimal point, should be precise enough
      for (let precision = 3; precision >= 0; precision--) {
        const pt = convertFontSizeToPt(fontSize, precision);
        const legacy = convertFontSizeToLegacy(pt);
        const matchItem = this.fontSizes.find(
          (item) =>
            item.format === fontSize ||
            item.format === pt ||
            item.format === legacy
        );
        if (matchItem) {
          return matchItem;
        }
      }
    }

    return this.emptyFont;
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
    if (matchItem.format !== this.currentFontSize.format) {
      this.currentFontSize = matchItem;
      this.cdr.markForCheck();
    }
  }

  onHandleChangeFontSize(font: FontSelectItem) {
    this.currentFontSize = font;
    if (this.currentEditorInstance) {
      this.currentEditorInstance.undoManager.transact(() => {
        this.currentEditorInstance.focus();
        this.currentEditorInstance.execCommand('FontSize', false, font.format);
      });
    }
    this.displayDropdown = !this.displayDropdown;
  }

  onApplyCustomFont(setting: FontSetting) {
    if (
      this.currentEditorInstance &&
      !this.currentEditorInstance.hasFocus() &&
      this.currentFontSize.format !== setting.fontSize
    ) {
      const firstChild =
        this.currentEditorInstance.getBody()?.firstElementChild;
      let activeVal = setting.fontSize;
      //If the first child has customize font, we need active font based on wrap element
      if (
        firstChild &&
        this.currentEditorInstance.dom.hasClass(
          firstChild,
          CUSTOMIZE_FONT_STYLE_CLASS
        )
      ) {
        activeVal = getComputedStyle(firstChild).getPropertyValue('font-size');
      }

      const activeItem = this.fontSizes.find(
        (item) => item.format === activeVal
      );
      if (activeItem) {
        this.currentFontSize = activeItem;
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
