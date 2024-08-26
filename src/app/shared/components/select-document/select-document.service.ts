import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  catchError,
  filter,
  map,
  switchMap
} from 'rxjs';
import { ReiFormService } from '@services/rei-form.service';
import { ReiForm } from '@shared/types/rei-form.interface';

@Injectable()
export class SelectDocumentService {
  private getReiFormsPayload = new BehaviorSubject<GetReiFormsPayload>(null);
  public listReiFormBS = new BehaviorSubject<ReiForm[]>([]);
  private loadingBS = new Subject<boolean>();
  public isLoading$ = this.loadingBS.asObservable();
  public listReiForm$ = this.listReiFormBS.asObservable();
  public currentPage = 1;
  public lastPage: boolean;
  constructor(private reiFormService: ReiFormService) {}
  getListReiFormTemplate$() {
    return this.getReiFormsPayload.pipe(
      filter(Boolean),
      switchMap((payload: GetReiFormsPayload) => {
        this.loadingBS.next(true);
        return this.reiFormService
          .getReiForm(payload.isTemplate, payload.page, payload.name)
          .pipe(
            map((value) => {
              this.loadingBS.next(false);
              const list = [...this.listReiFormBS.value, ...value];
              this.listReiFormBS.next(list);
              this.lastPage = !!!value?.length;
              this.currentPage = this.lastPage
                ? this.currentPage
                : payload.page;
              return list;
            }),
            catchError((err: HttpErrorResponse) => {
              this.loadingBS.next(false);
              throw err.error;
            })
          );
      })
    );
  }

  setPayload(payload: Partial<GetReiFormsPayload>) {
    const newPayload = {
      ...this.getReiFormsPayload.value,
      ...payload
    };
    if (
      newPayload.page === 1 ||
      newPayload.isTemplate !== this.getReiFormsPayload.value?.isTemplate
    ) {
      this.listReiFormBS.next([]);
    }
    this.getReiFormsPayload.next(newPayload);
  }

  getListReiform() {
    return this.listReiFormBS.value;
  }

  getNextPage() {
    this.setPayload({
      page: this.currentPage + 1
    });
  }

  getCurrentPayload() {
    return this.getReiFormsPayload.value;
  }
}

export interface GetReiFormsPayload {
  isTemplate: boolean;
  page: number;
  name: string;
}
