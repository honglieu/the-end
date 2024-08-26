import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  switchMap
} from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { UserService } from '@services/user.service';
import { Subject } from 'rxjs';
import { AgencyService } from '@services/agency.service';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'select-supplier',
  templateUrl: './select-supplier.component.html',
  styleUrls: ['./select-supplier.component.scss']
})
export class SelectSupplierComponent implements OnInit {
  @Input() show = false;
  @Output() whenCheckListChanged = new EventEmitter();
  searchText$ = new FormControl('');
  isLoading = true;
  listSupplier = [];
  highlightText = '';
  agencyId = '';
  subscriber = new Subject<void>();
  constructor(
    private readonly agencyService: AgencyService,
    private readonly dashboardAgencyService: DashboardAgencyService,
    private readonly userService: UserService,
    private readonly taskService: TaskService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this.handleGetListSuppliers(changes['show']?.currentValue);
  }

  handleGetListSuppliers(change: boolean) {
    if (!change) return;
    if (this.show) {
      this.subscriber = new Subject<void>();
      this.agencyId = this.taskService.currentTask$?.getValue()?.agencyId;
      this.getListSuppliers(this.agencyId)
        .pipe(takeUntil(this.subscriber))
        .subscribe((res) => {
          if (res && res.list) {
            this.listSupplier = res.list;
            this.isLoading = false;
          }
        });
    } else {
      this.subscriber.next();
      this.subscriber.complete();
    }
  }

  ngOnInit(): void {
    this.searchText$.valueChanges
      .pipe(
        takeUntil(this.subscriber),
        distinctUntilChanged(),
        debounceTime(400),
        switchMap((value) => {
          this.highlightText = value;
          return this.getListSuppliers(this.agencyId, value);
        })
      )
      .subscribe((res) => {
        if (res && res.list) {
          this.listSupplier = res.list;
          this.isLoading = false;
        }
      }),
      catchError((err): any => {
        this.isLoading = false;
      });
  }

  getListSuppliers(agencyId: string, searchKey = '') {
    return this.userService.getListSupplier(agencyId, searchKey);
  }

  onCheckboxChange(event: boolean, index: number) {
    this.listSupplier[index].checked = event;
    const checkedSupplier = this.listSupplier.filter((value) => value.checked);
    this.whenCheckListChanged.next(checkedSupplier);
  }

  clearData() {
    this.searchText$.setValue('');
    this.highlightText = '';
    this.getListSuppliers(this.agencyId)
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => res && res.list && (this.listSupplier = res.list));
  }

  ngOnDestroy() {
    this.subscriber.next();
    this.subscriber.complete();
  }
}
