import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { EStatusPaid } from '@shared/enum/creditor-invoicing.enum';

@Component({
  selector: 'popup-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-modal-popup
      [show]="true"
      [specificWidth]="specificWidth"
      [appendBody]="true">
      <div class="popup">
        <div class="popup__container">
          <ng-container *ngIf="header; else headerDefault">
            <ng-container *trudiStringTemplateOutlet="header"></ng-container>
            <!-- {{header}}  -->
          </ng-container>
          <ng-template #headerDefault>
            <div class="popup__header">
              <div class="header-content">
                <div class="round-icon">
                  <trudi-icon
                    svgClass="size-48"
                    icon="trudiAvt"
                    data-e2e="trudi-logo"></trudi-icon>
                </div>
                <div class="text">
                  <span class="text-header" data-e2e="title">
                    {{ title }}
                  </span>
                  <ng-container *ngIf="subTitle">
                    <ng-container
                      *trudiStringTemplateOutlet="subTitle"></ng-container>
                  </ng-container>
                  <button
                    *ngIf="status"
                    class="btn-creditor unpaid-creditor-btn paid-creditor-btn"
                    [ngClass]="{
                      'unpaid-creditor-btn': status === ESTATUSPAID.UNPAID,
                      'paid-creditor-btn': status === ESTATUSPAID.PAID,
                      'part-paid-creditor-btn': status === ESTATUSPAID.PARTPAID,
                      'cancel-creditor-btn': status === ESTATUSPAID.CANCELLED
                    }">
                    {{ status === ESTATUSPAID.PARTPAID ? 'Part-paid' : status }}
                  </button>
                </div>
              </div>
              <button
                *ngIf="!disableClose"
                data-e2e="button-close"
                class="close-modal-btn"
                (click)="close()">
                <trudi-icon
                  [style]="{
                    'width.px': 14,
                    'height.px': 14,
                    color: '#646464'
                  }"
                  icon="closeBtn"
                  class="trudi-icon"></trudi-icon>
              </button>
            </div>
          </ng-template>
          <hr class="divider hr-top" />
          <ng-content></ng-content>
          <div class="popup__footer">
            <ng-container *ngIf="footer; else footerDefault">
              <ng-container *trudiStringTemplateOutlet="footer"></ng-container>
            </ng-container>
            <ng-template #footerDefault>
              <div>footer default</div>
            </ng-template>
          </div>
        </div>
      </div>
    </app-modal-popup>
  `,
  styleUrls: ['style/style.scss']
})
export class PopupComponent {
  public ESTATUSPAID = EStatusPaid;

  @Input() header?: TemplateRef<void>;
  @Input() title?: string;
  @Input() footer?: TemplateRef<void>;
  @Input() specificWidth?: number;
  @Input() status: '';
  @Input() subTitle: TemplateRef<void>;
  @Input() disableClose: boolean = false;
  @Output() onClose = new EventEmitter<boolean>();

  constructor() {}

  close() {
    this.onClose.emit(true);
  }
}
