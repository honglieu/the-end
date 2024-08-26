import { Injectable } from '@angular/core';
import {
  CdkDragDrop,
  CdkDropList,
  copyArrayItem,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  delay,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DragDropFilesService {
  public childConnector!: string | CdkDropList | (string | CdkDropList);
  public parentConnector!: string | CdkDropList | (string | CdkDropList);
  private dropEnded = new BehaviorSubject<boolean>(true);
  public dropEnded$ = this.dropEnded.asObservable();
  private parentRendered = new BehaviorSubject<boolean>(false);
  private childRendered = new BehaviorSubject<boolean>(false);

  constructor() {}

  allRendered: Observable<boolean> = combineLatest([
    this.parentRendered,
    this.childRendered
  ]).pipe(
    filter(([parent, child]) => !!parent && !!child),
    map(([parent, child]) => parent && child)
  );

  setParentRendered(status: boolean) {
    this.parentRendered.next(status);
  }

  setChildRendered(status: boolean) {
    this.childRendered.next(status);
  }

  handleConnect({
    element,
    unsubscribe,
    connectedElement,
    type
  }: {
    element: CdkDropList | string;
    unsubscribe: Subject<void>;
    connectedElement: string | CdkDropList | (string | CdkDropList)[];
    type: 'parent' | 'child';
  }) {
    const config = {
      parent: {
        setRendered: this.setParentRendered.bind(this),
        setConnector: this.setParentConnector.bind(this),
        getConnector: () => this.childConnector
      },
      child: {
        setRendered: this.setChildRendered.bind(this),
        setConnector: this.setChildConnector.bind(this),
        getConnector: () => this.parentConnector
      }
    };
    const typeConfig = config[type];
    typeConfig.setRendered(true);
    this.allRendered
      .pipe(takeUntil(unsubscribe), type === 'child' ? delay(100) : tap())
      .subscribe({
        next: (allRendered) => {
          if (!allRendered) return;
          typeConfig.setConnector(element);
          connectedElement = [typeConfig.getConnector()];
        },
        complete: () => {
          typeConfig.setRendered(false);
        }
      });
  }

  detectDropEnded(dropEndState: boolean) {
    this.dropEnded.next(dropEndState);
  }

  setChildConnector(childRef: string | CdkDropList | (string | CdkDropList)) {
    this.childConnector = childRef;
  }

  setParentConnector(parentRef: string | CdkDropList | (string | CdkDropList)) {
    this.parentConnector = parentRef;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  drop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const idx = event.container.data.indexOf(
        event.previousContainer.data[event.previousIndex]
      );
      if (idx !== -1) {
        return;
      }
      copyArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
