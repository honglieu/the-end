import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import {
  ICurrentViewNoteResponse,
  IListNoteResponse
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { mapUsersToName } from '@core';

@Injectable({
  providedIn: 'root'
})
export class InternalNoteService {
  private _selectedFileIdBS = new BehaviorSubject<string>('');
  private _listNotes$: BehaviorSubject<IListNoteResponse> =
    new BehaviorSubject<IListNoteResponse>(null);
  private _currentViewNote$: BehaviorSubject<ICurrentViewNoteResponse> =
    new BehaviorSubject<ICurrentViewNoteResponse>(null);
  private imageDetail = new BehaviorSubject<any>(null);
  private refreshNotes$ = new BehaviorSubject<boolean>(false);
  private _isLoading$ = new BehaviorSubject<boolean>(true);
  public isLoading = this._isLoading$.asObservable();
  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  setLoading(isLoading: boolean) {
    this._isLoading$.next(isLoading);
  }

  setRefreshNote(value: boolean) {
    this.refreshNotes$.next(value);
  }

  get getRefreshNote() {
    return this.refreshNotes$.asObservable();
  }

  setCurrentViewNote(value) {
    this._currentViewNote$.next(value);
  }

  get getCurrentViewNote() {
    return this._currentViewNote$.asObservable();
  }

  setSelectedFile(value) {
    this._selectedFileIdBS.next(value);
  }

  get getSelectedFile() {
    return this._selectedFileIdBS.asObservable();
  }

  get selectedFileValue() {
    return this._selectedFileIdBS.getValue();
  }

  setListNote(value: IListNoteResponse) {
    this._listNotes$.next(value);
  }

  get listNote(): Observable<IListNoteResponse> {
    return this._listNotes$.asObservable();
  }

  get listNoteValue() {
    return this._listNotes$.getValue();
  }

  groupNoteByDate(notes) {
    const userInfo = this.userService.userInfo$.getValue();
    const listNotesGroup = notes
      .reduce((acc, item) => {
        const createdAtDate = this.agencyDateFormatService
          .agencyDayJs(item?.createdAt)
          .format(SHORT_ISO_DATE);
        const group = acc.find((group) => group.date === createdAtDate);
        if (!group) {
          acc.push({ date: createdAtDate, notes: [item] });
        } else {
          group.notes.push(item);
        }
        return acc;
      }, [])
      .map((group) => {
        group.notes = group.notes
          .map((note) => ({
            ...note,
            text: mapUsersToName(note.text, note.mentionUsers),
            isPmNote: note.createdBy?.id === userInfo.id
          }))
          .sort((a, b) => a.friendlyId - b.friendlyId);
        return group;
      });
    return listNotesGroup;
  }

  setImageDetail(value) {
    this.imageDetail.next(value);
  }

  getImageDetail() {
    return this.imageDetail.asObservable();
  }

  addEventForImage(elementRef: ElementRef) {
    const imagesInMessage =
      elementRef.nativeElement.querySelectorAll('.image-detail');
    for (let item = 0; item <= imagesInMessage.length - 1; item++) {
      imagesInMessage?.[item]?.addEventListener(
        'click',
        this.setImageDetail.bind(this)
      );
    }
  }

  removeEventForImage(elementRef: ElementRef) {
    const imagesInMessage =
      elementRef.nativeElement.querySelectorAll('.image-detail');
    for (let item = 0; item <= imagesInMessage.length - 1; item++) {
      imagesInMessage?.[item]?.removeEventListener(
        'click',
        this.setImageDetail.bind(this)
      );
    }
  }
}
