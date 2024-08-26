import {
  AfterViewInit,
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { Subscription, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { PermissionService } from '@services/permission.service';
import { UserService } from '@services/user.service';

@Directive({
  selector: '[trudiPermission]'
})
export class PermissionDirective implements OnInit, OnDestroy, AfterViewInit {
  @Input('trudiPermission') condition: string | undefined;
  subscription!: Subscription;
  cdrSubject = new ReplaySubject<void>();
  rendered = false;
  private unsubscribe = new Subject<boolean>();

  constructor(
    private permissionService: PermissionService,
    private viewContainer: ViewContainerRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private templateRef: TemplateRef<any>,
    public userService: UserService
  ) {}
  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        if (user) {
          this.check();
        }
      });
  }

  ngAfterViewInit() {
    this.rendered = true;
  }

  private check() {
    this.viewContainer.clear();
    let hasPermission = this.permissionService.hasFunction(this.condition);
    hasPermission && this.viewContainer.createEmbeddedView(this.templateRef);
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
  }
}
