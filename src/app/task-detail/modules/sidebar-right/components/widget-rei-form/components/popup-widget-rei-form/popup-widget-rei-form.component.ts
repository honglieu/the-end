import { ReiFormService } from '@services/rei-form.service';
import { EButtonType, EButtonWidget, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ReiFormLink } from '@shared/types/rei-form.interface';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'popup-widget-rei-form',
  templateUrl: './popup-widget-rei-form.component.html',
  styleUrl: './popup-widget-rei-form.component.scss'
})
export class PopupWidgetReiFormComponent implements OnInit, OnDestroy {
  public isShowREIFormPopup = false;
  public showReviewAttachPopup: boolean;
  private unsubscribe = new Subject<void>();
  public modalId = StepKey.communicationStep.reiform;
  public reiFormLink: ReiFormLink;

  constructor(
    private reiFormService: ReiFormService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit() {
    this.reiFormService.popupReiForm
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isShowREIFormPopup = res?.isShowREIFormPopup;
        this.showReviewAttachPopup = res?.showReviewAttachPopup;
      });

    this.reiFormService.reiFormLink
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.reiFormLink = res;
      });
  }

  onReviewAttachmentPopupClosed() {
    this.reiFormService.popupReiForm.next({
      isShowREIFormPopup: false,
      showReviewAttachPopup: false
    });
    this.preventButtonService.deleteProcess(
      EButtonWidget.REI_FORM,
      EButtonType.WIDGET
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
