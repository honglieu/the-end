import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  ViewEncapsulation,
  EventEmitter
} from '@angular/core';

import { PopupComponent } from './popup.component';

@Component({
  selector: 'popup-select-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <popup-component
      (onClose)="close()"
      [title]="title"
      [header]="header"
      [footer]="footer"
      [specificWidth]="specificWidth">
      <div class="popup__body d-flex flex-dir-column">
        <ng-container *ngFor="let item of options; let i = index">
          <div
            class="popup__body__item d-flex justify-content-between align-items-center">
            <div class="popup__body__item__text" [attr.data-e2e]="item.dataE2e">
              {{ item.text }}
            </div>
            <div class="popup__body__item__checkbox" data-e2e="round-checkbox">
              <input
                type="checkbox"
                id="cb-{{ item.id }}-like-to-say"
                class="popup__body__item__input d-none"
                (change)="onCheckboxChange(item.id)" />
              <label
                for="cb-{{ item.id }}-like-to-say"
                class="popup__body__item__label cursor-pointer"
                data-e2e="button-uncheckbox">
                <img
                  [src]="
                    item.checked
                      ? '/assets/icon/ownership-check.svg'
                      : '/assets/icon/select-people-uncheck.svg'
                  " />
              </label>
            </div>
          </div>
          <div *ngIf="i > 0 && hasError" class="over-size-err d-flex gap-4">
            <img src="/assets/icon/icon_warning.svg" class="icon-warning" />
            <span>No tenancy found in this property</span>
          </div>
        </ng-container>
      </div>
    </popup-component>
  `,
  styleUrls: ['style/style.scss']
})
export class PopupSelectOptionComponent extends PopupComponent {
  @Input() options = [];
  @Output() onInvoiceType = new EventEmitter();
  @Input() hasError: boolean = false;

  public listChecked: boolean = false;
  onCheckboxChange(itemId: string) {
    if (!itemId || !itemId.length) {
      return;
    }
    this.options.forEach((item) =>
      item.id === itemId
        ? (item.checked = !item.checked)
        : (item.checked = false)
    );
    this.onInvoiceType.emit(this.options);
    this.checkListChecked();
  }

  checkListChecked() {
    this.listChecked = this.options.some((item) => item.checked);
  }
}
