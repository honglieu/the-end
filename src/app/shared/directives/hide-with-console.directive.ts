import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';

@Directive({
  selector: '[hideWithConsole]'
})
export class HideWithConsoleDirective {
  private unsubscribe = new Subject<boolean>();

  constructor(
    private viewContainer: ViewContainerRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private templateRef: TemplateRef<any>,
    public userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.check();
        }
      });
  }

  private check() {
    this.viewContainer.clear();
    const isConsole = this.sharedService.isConsoleUsers();
    if (!isConsole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
  }
}
