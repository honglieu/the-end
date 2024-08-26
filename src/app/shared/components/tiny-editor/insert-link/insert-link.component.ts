import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IActiveLink } from '@shared/components/tiny-editor/plugins/custom-link/api/types';
import { TinyEditorOpenFrom } from '@shared/components/tiny-editor/tiny-editor.component';
import { InsertLinkService } from './services/insert-link.service';

@Component({
  selector: 'insert-link',
  templateUrl: './insert-link.component.html',
  styleUrls: ['./insert-link.component.scss']
})
export class InsertLinkComponent implements OnInit, OnDestroy, OnChanges {
  @Input() fromMore: boolean = false;
  @Input() from: TinyEditorOpenFrom = TinyEditorOpenFrom.AppChat;
  @Output() hidePopover = new EventEmitter();
  @Output() onSelect = new EventEmitter();
  @Output() onSave = new EventEmitter<IActiveLink>();

  private unsubscribe = new Subject<void>();
  public showPopover: boolean = false;
  public readonly icon = {
    more: 'textEditorMore',
    moreSelected: 'textEditorMoreSelected'
  };
  public readonly ETinyEditorOpenFrom = TinyEditorOpenFrom;

  constructor(private insertLinkService: InsertLinkService) {
    this.insertLinkService.buildForm();
  }

  ngOnInit(): void {
    this.subscribeEditLink();
    this.subscribeCurrenLink();
  }

  subscribeEditLink() {
    this.insertLinkService.isEditLinkBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isEditLink) => {
        if (isEditLink) this.showPopover = isEditLink;
      });
  }

  subscribeCurrenLink() {
    this.insertLinkService.currentLink$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        res && this.insertLinkService.patchFormValues(res);
      });
  }

  public get linkForm() {
    return this.insertLinkService.form;
  }

  visibleChange($event: boolean): void {
    this.showPopover = $event;
    if (!this.insertLinkService.isEditLink && this.showPopover) {
      this.onSelect.emit();
    }
    if (!this.showPopover && this.fromMore) {
      this.hidePopover.emit();
    }
    if (!this.showPopover) {
      this.resetForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fromMore']?.currentValue) {
      this.visibleChange(changes['fromMore']?.currentValue);
    }
  }

  closeModal() {
    this.resetForm();
    this.showPopover = false;
    this.insertLinkService.setIsEditLink(false);
    this.insertLinkService.setCurrenLink(null);
  }

  resetForm() {
    this.linkForm.reset();
    this.linkForm.markAsUntouched();
  }

  save() {
    this.linkForm.markAllAsTouched();
    if (this.linkForm.invalid) {
      return;
    }
    const { url, title } = this.linkForm.value;
    this.onSave.emit({ url, title });
    this.showPopover = false;
    if (!this.showPopover && this.fromMore) {
      this.hidePopover.emit();
    }
    this.resetForm();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
