import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { IBillingInvoice } from '@/app/dashboard/modules/agency-settings/utils/billing.interface';

@Component({
  selector: 'invoice-history-pop-up',
  templateUrl: './invoice-history-pop-up.component.html',
  styleUrls: ['./invoice-history-pop-up.component.scss']
})
export class InvoiceHistoryPopUpComponent implements OnInit, AfterViewInit {
  @ViewChild('invoiceList') invoiceListRef: ElementRef;
  @Input() visible = false;
  @Input() invoiceHistoryData: IBillingInvoice[];
  @Output() closePopup = new EventEmitter<void>();
  private observer: MutationObserver;
  public invoiceChild;
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    if (this.invoiceListRef) {
      const height = (window.innerHeight * 80) / 100 - 110;
      this.invoiceListRef.nativeElement.style.height = `${height}px`;
    }

    const targetNode = this.invoiceListRef.nativeElement;
    const config = { attributes: false, childList: true, subtree: true };
    const callback = (
      mutationList: MutationRecord[],
      observer: MutationObserver
    ) => {
      this.handleScroll();
    };
    this.observer = new MutationObserver(callback);
    this.observer.observe(targetNode, config);
  }

  handleScroll() {
    if (this.invoiceListRef) {
      this.invoiceListRef.nativeElement.scrollTo({
        top: this.invoiceChild,
        behavior: 'smooth'
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (this.invoiceListRef) {
      const height = (window.innerHeight * 80) / 100 - 110;
      this.invoiceListRef.nativeElement.style.height = `${height}px`;
    }
  }

  handleInvoiceDropdown(invoiceChild, index: number) {
    this.invoiceChild = invoiceChild - 220;
    this.invoiceHistoryData = this.invoiceHistoryData?.map((value, idx) => {
      return {
        ...value,
        expanded: idx === index ? !value?.expanded : false
      };
    });
  }

  isFirstMonth(item, index) {
    return (
      index === this.invoiceHistoryData.length - 1 &&
      item?.summaryData?.every(
        (it) =>
          new Date(it.period.start * 1000).getTime() >=
          new Date(item.created).getTime()
      )
    );
  }
}
