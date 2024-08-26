import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { delay, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'generated-reply',
  templateUrl: './generated-reply.component.html',
  styleUrl: './generated-reply.component.scss'
})
export class GeneratedReplyComponent implements OnChanges, OnDestroy {
  @ViewChild('tinyEditor', { static: false }) tinyEditor: EditorComponent;
  @Input() controlName: string;
  @Input() formGroup: FormGroup;
  @Input() invalid: boolean = false;
  @Output() triggerUploadComputer = new EventEmitter();
  @Output() triggerUploadContactCard = new EventEmitter();
  @Output() triggerEventFocus = new EventEmitter();

  private timeout: NodeJS.Timeout = null;
  public isFocus: boolean = false;
  public showAttachMenu: boolean = false;
  public firstChange: boolean = true;

  public toolbarItems = {
    uploadFile: 'Upload from computer',
    addContactCard: 'Add contact card'
  };

  public TinyMCEConfig = {
    selector: 'textarea',
    base_url: '/tinymce',
    suffix: '.min',
    content_css: '/assets/styles/tiny-editor.css',
    menubar: false,
    statusbar: false,
    toolbar: false,
    plugins: 'lists autoresize wordcount link shortlink',
    convert_urls: false,
    inline_boundaries_selector: 'code',
    notifications: false,
    object_resizing: false,
    visual: false,
    autoresize_overflow_padding: 0,
    autoresize_bottom_margin: 5,
    min_height: 200,
    placeholder: 'Write your copy in here...',
    paste_preprocess: (_, args) => {
      args.content = args.content.replace(/<img.*?>/gi, '');
    },
    setup: (editor) => {
      editor.on('drop', (e) => {
        e.preventDefault();
      });
    }
  };

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { formGroup } = changes;
    if (formGroup.firstChange && formGroup.currentValue) {
      this.formGroup
        .get(this.controlName)
        .valueChanges.pipe(distinctUntilChanged())
        .subscribe(() => {
          clearTimeout(this.timeout);
          this.timeout = setTimeout(() => {
            if (this.firstChange) {
              const tinyContainer =
                this.el.nativeElement?.querySelector('.tox-tinymce');
              tinyContainer?.style?.setProperty(
                'max-height',
                'unset',
                'important'
              );
              this.firstChange = false;
            }
            this.cdr.markForCheck();
          }, 100);
        });
    }
  }

  onDropdownVisibleChange(visible: boolean) {
    this.isFocus = visible;
    const wrapper = this.el.nativeElement?.closest('.ant-drawer-body');
    wrapper?.style?.setProperty(
      'overflow',
      visible ? 'hidden' : 'auto',
      'important'
    );

    wrapper?.style?.setProperty(
      'padding-right',
      visible ? '5px' : '0px',
      'important'
    );
  }

  handleFocus() {
    this.isFocus = true;
    this.triggerEventFocus.emit();
  }

  handleBlur() {
    this.isFocus = false;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout);
  }
}
