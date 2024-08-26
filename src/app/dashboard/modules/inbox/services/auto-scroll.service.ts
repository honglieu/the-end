import { Injectable, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { auditTime, filter, switchMap, takeUntil } from 'rxjs/operators';

export type SiblingType =
  | SiblingEnum.nextElementSibling
  | SiblingEnum.previousElementSibling;
export enum SiblingEnum {
  nextElementSibling = 'nextElementSibling',
  previousElementSibling = 'previousElementSibling'
}
@Injectable({
  providedIn: 'root'
})
export class AutoScrollService {
  private onDestroy = new Subject<void>();
  private autoScrollEnabled = true;
  private keyPairs: [string, string][] = [
    ['taskId', 'conversationId'],
    ['threadId', 'emailMessageId']
    // Add more pairs as needed
  ];
  private scrollTimeOut: NodeJS.Timeout;
  private callbackTimeOut: NodeJS.Timeout;

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  disableAutoScroll() {
    this.autoScrollEnabled = false;
  }

  findSiblingElement(
    nativeElement: HTMLElement,
    optional?: {
      taskId?: string;
      conversationId?: string;
      type?: SiblingType;
      querySelector?: string;
    }
  ) {
    // Construct the query selector string for task ID and conversation ID
    const querySelector = `[data-conversation-id="${CSS.escape(
      optional.conversationId
    )}"][data-task-id="${CSS.escape(optional.taskId)}"] ${
      optional.querySelector || ''
    }`;
    const selectedElement = nativeElement.querySelector(
      querySelector
    ) as HTMLElement;

    let targetElement = selectedElement?.[optional.type] as HTMLElement;

    if (!targetElement) {
      const groupMessages = nativeElement.querySelectorAll(
        '.group-list-message'
      );
      const index = Array.from(groupMessages).findIndex((element) =>
        element.contains(selectedElement)
      );

      if (index !== -1) {
        // Determine the sibling group message and select the first or last child based on the navigation type
        const siblingGroup = groupMessages[index]?.[
          optional.type
        ] as HTMLElement | null;
        if (siblingGroup) {
          targetElement = siblingGroup.querySelector(
            `#auto-scroll-item:${
              optional.type === 'nextElementSibling'
                ? 'first-child'
                : 'last-child'
            }`
          );
        }
      }
    }

    return {
      taskId: targetElement?.dataset['taskId'] || '',
      conversationId: targetElement?.dataset['conversationId'] || '',
      targetElement
    };
  }

  scrollToElementSmoothly(
    element: HTMLElement,
    optional: {
      navigatePreMessage: boolean;
      delay?: number;
      delayCallback?: number;
      callback?: () => void;
    }
  ) {
    clearTimeout(this.scrollTimeOut);
    clearTimeout(this.callbackTimeOut);

    if (!element) return;
    this.scrollTimeOut = setTimeout(() => {
      element.scrollIntoView({
        block: optional?.navigatePreMessage ? 'end' : 'start',
        inline: 'nearest',
        behavior: 'smooth'
      });

      this.callbackTimeOut = setTimeout(
        () => optional.callback(),
        optional.delayCallback || 200
      );
    }, optional.delay || 0);
  }

  initializeAutoScroll<T>(
    renderCallback: Observable<T>,
    elementRef: ElementRef<HTMLElement>
  ): Observable<void> {
    return renderCallback.pipe(
      auditTime(300),
      takeUntil(this.onDestroy),
      filter(() => this.hasValidDataQuerySelect()),
      switchMap(() => {
        const querySelector = this.createQueryString();
        const element = elementRef.nativeElement?.querySelector(querySelector);
        return of(element);
      }),
      filter((elementRef) => !!elementRef),
      switchMap((elementRef) => {
        elementRef.scrollIntoView({
          block: 'start',
          inline: 'nearest',
          behavior: 'smooth'
        });
        this.autoScrollEnabled = false;
        return of(void 0); // Return an observable of void
      })
    );
  }

  private createQueryString(): string {
    const queryParams = this.activatedRoute?.snapshot?.queryParams;
    const selectors: string[] = [];

    // Iterate over each set of keys in keyPairs
    this.keyPairs.forEach((keys) => {
      // Array to store selectors for current set of keys
      const currentSelectors: string[] = [];

      // Generate selectors for each key in the current set
      keys.forEach((key) => {
        const value = queryParams[key];
        if (value) {
          currentSelectors.push(
            `[data-${this.convertToKebabCase(key)}="${value}"]`
          );
        }
      });

      if (currentSelectors.length > 0) {
        selectors.push(currentSelectors.join(''));
      }
    });

    return selectors.join('');
  }

  private convertToKebabCase(input: string): string {
    return input
      .replace(/[A-Z]/g, (match) => '-' + match.toLowerCase())
      .replace(/^./, (match) => match.toLowerCase());
  }

  private hasValidDataQuerySelect(): boolean {
    const queryParams = this.activatedRoute?.snapshot?.queryParams;
    return (
      this.autoScrollEnabled &&
      this.keyPairs.some((keys) => keys.every((key) => queryParams[key]))
    );
  }

  destroy() {
    this.autoScrollEnabled = true;
    clearTimeout(this.scrollTimeOut);
    clearTimeout(this.callbackTimeOut);
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
