import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EEmailFolderPopup } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

@Injectable({
  providedIn: 'root'
})
export class EmailFolderService {
  private isVisibleCreateEmailFolder = new Subject<boolean>();
  public isVisibleCreateEmailFolder$ =
    this.isVisibleCreateEmailFolder.asObservable();

  private emailFolderId = new BehaviorSubject<string>('');
  public emailFolderId$ = this.emailFolderId.asObservable();

  private emailFolderActionBS = new BehaviorSubject<string>('');
  public emailFolderAction$ = this.emailFolderActionBS.asObservable();

  public get emailFolderAction() {
    return this.emailFolderActionBS.getValue();
  }
  public setIsVisibleCreateEmailFolder(value: boolean) {
    this.isVisibleCreateEmailFolder.next(value);
  }

  public setEmailFolderId(value: string) {
    this.emailFolderId.next(value);
  }

  public setEmailFolderAction(value: EEmailFolderPopup) {
    this.emailFolderActionBS.next(value);
  }
}
