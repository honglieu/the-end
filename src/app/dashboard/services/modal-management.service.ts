import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalManagementService {
  private modalState: BehaviorSubject<EModalID[]> = new BehaviorSubject([]);
  public modalState$ = this.modalState.asObservable();
  public openModalId$ = this.modalState$.pipe(
    map((openModalIds) => {
      if (!openModalIds || !openModalIds.length) return null;
      return openModalIds[openModalIds.length - 1];
    })
  );
  public lastZIndex$: BehaviorSubject<number> = new BehaviorSubject(0);
  constructor() {}

  get openModalIds(): EModalID[] {
    return this.modalState.value;
  }

  pop() {
    if (this.isEmpty()) return;
    this.openModalIds.pop();
    this.modalState.next([...this.openModalIds]);
  }

  remove(modalId: EModalID) {
    this.modalState.next([
      ...this.openModalIds.filter((item) => item !== modalId)
    ]);
  }

  open(modalId: EModalID) {
    if (this.isExist(modalId)) return;
    this.modalState.next([...this.openModalIds, modalId]);
  }

  openModals(modalIds: EModalID[]) {
    this.modalState.next(modalIds);
  }

  isExist(modalId: EModalID) {
    if (this.isEmpty()) return false;
    return this.openModalIds.some((item) => item === modalId);
  }

  isEmpty(): boolean {
    return Boolean(!this.openModalIds || !this.openModalIds.length);
  }

  closeAll() {
    this.modalState.next([]);
  }

  getLastZIndex() {
    return this.lastZIndex$.asObservable();
  }

  setLastZIndex(zIndex: number) {
    this.lastZIndex$.next(zIndex);
  }
}

export enum EModalID {
  SelectRecipients,
  ViewTasks,
  SendMsg,
  BulkSendMsg
}
