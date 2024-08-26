import { Subject, BehaviorSubject, takeUntil } from 'rxjs';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { IPickBy, typePicker } from './date-time-picker';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
const DEFAULT_MONTH = 6;

@Component({
  selector: 'date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss']
})
export class DateTimePickerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  private unsubscribe = new Subject<void>();
  @ViewChild('yearInput') yearInput: ElementRef<HTMLElement>;
  @ViewChild('dropdownBtn') dropdownBtn: ElementRef<HTMLElement>;
  @Input() picker: typePicker;
  @Input() value: IPickBy | Date;
  @Input() format: string;
  @Input() label: string;
  @Input() error: {};
  @Input() hideError: boolean = false;
  @Input() styleText: string;
  @Output() onChange = new EventEmitter<IPickBy | string>();

  public typePicker = typePicker;
  public pickBySubject: BehaviorSubject<IPickBy> = new BehaviorSubject({
    type: this.typePicker.month,
    value: DEFAULT_MONTH
  });
  public dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public pickByYearSubject: BehaviorSubject<string> = new BehaviorSubject(null);
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {
    this.subscribePickBySubject();
    this.subscribePickByYearSubject();
  }

  ngAfterViewInit(): void {
    if (this.yearInput) {
      (this.yearInput.nativeElement as HTMLInputElement).defaultValue =
        this.pickByYearSubject.getValue();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']?.currentValue) {
      if (this.value instanceof Object) {
        this.pickBySubject.next(this.value as IPickBy);
      }
      if (this.value instanceof Date) {
        this.pickByYearSubject.next(dayjs(this.value).format('YYYY-MM-DD'));
      }
    }
  }

  subscribePickBySubject() {
    if (typePicker.pickBy !== this.picker) return;
    this.pickBySubject.pipe(takeUntil(this.unsubscribe)).subscribe((data) => {
      this.onChange.emit(data);
      this.removeDropdown();
    });
  }

  subscribePickByYearSubject() {
    if (typePicker.year !== this.picker) return;
    this.pickByYearSubject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.onChange.emit(dayjs(data).format('YYYY-MM-DD'));
      });
  }

  setTypePickBy(type: typePicker) {
    this.pickBySubject.next({
      type,
      value: this.pickBySubject.getValue().value
    });
  }

  setValuePickBy(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.pickBySubject.next({
      type: this.pickBySubject.getValue().type,
      value
    });
  }

  setValueYear(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.pickByYearSubject.next(dayjs(value).format('YYYY-MM-DD'));
  }

  toggleDropdown() {
    if (this.dropdownBtn) {
      this.dropdownBtn.nativeElement.classList.toggle('dropdown-show');
    }
  }

  removeDropdown() {
    if (this.dropdownBtn) {
      this.dropdownBtn.nativeElement.classList.remove('dropdown-show');
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
