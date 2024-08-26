import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type File = any;

@Injectable()
export class FileState {
  // files in all conversation
  private readonly _sourceFiles$ = new BehaviorSubject<File[]>(null);
  // file in a conversation
  private readonly _conversationFiles$ = new BehaviorSubject<File[]>(null);
  private readonly _selectedFiles$ = new BehaviorSubject<File[]>(null);

  public readonly sourceFiles$ = this._sourceFiles$.asObservable();
  public readonly selectedFiles$ = this._selectedFiles$.asObservable();
  public readonly conversationFiles$ = this._conversationFiles$.asObservable();

  public setSourceFiles(files: File[]) {
    this._sourceFiles$.next(files);
  }

  public setConversationFiles(files: File[]) {
    this._conversationFiles$.next(files);
  }

  public getSelectedFiles() {
    return this._selectedFiles$.asObservable();
  }

  public setSelectedFiles(files: File[]) {
    this._selectedFiles$.next(
      files?.filter((file) => Boolean(file?.mediaLink))
    );
  }

  public removeSelectedFile(fileId: string) {
    const selectedFile = this._selectedFiles$.getValue();
    this._selectedFiles$.next(
      selectedFile.filter((file) => file.id !== fileId)
    );
  }

  public resetData() {
    this._sourceFiles$.next(null);
    this._selectedFiles$.next(null);
    this._conversationFiles$.next(null);
  }
}
