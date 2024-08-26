import { Subject, takeUntil } from 'rxjs';
import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
  OnDestroy
} from '@angular/core';
import { TaskActionDropdownComponent } from '@/app/dashboard/modules/inbox/modules/task-list-view/components/task-row/components/task-action-dropdown/task-action-dropdown.component';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

@Injectable()
export class TaskActionDropdownService implements OnDestroy {
  private destroyed$ = new Subject<void>();
  private componentRef: ComponentRef<TaskActionDropdownComponent>;
  private isRmEnvironment: boolean;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private appRef: ApplicationRef,
    private companyService: CompanyService,
    private agencyService: AgencyService
  ) {
    companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroyed$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  create(event: MouseEvent, taskItem: ITaskRow) {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    const factory = this.componentFactoryResolver.resolveComponentFactory(
      TaskActionDropdownComponent
    );
    this.componentRef = factory.create(this.injector);
    Object.assign(this.componentRef.instance, {
      event,
      taskItem,
      isRmEnvironment: this.isRmEnvironment
    });
    this.appRef.attachView(this.componentRef.hostView);

    return this.componentRef.instance;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
