import { Injectable, Optional } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, retry } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { UNCATCH_API_URL, MAILBOX_ROLE_REQUIRED } from './constants';
import { ErrorService } from './error.service';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private _http: HttpClient,
    private loadingService: LoadingService,
    private errorService: ErrorService,
    @Optional() private toastService: ToastrService
  ) {}

  post<TBody, TResponse>(
    url: string,
    body: TBody
  ): Observable<HttpResponse<TResponse>> {
    return this._http.post(url, body, { observe: 'response' }).pipe(
      catchError((error) => {
        this.handleError(error);
        return this._errorHandler(error, url);
      })
    ) as Observable<HttpResponse<TResponse>>;
  }

  delete<DResponse extends any>(
    url: string
  ): Observable<HttpResponse<DResponse>> {
    return this._http.delete(url, { observe: 'response' }).pipe(
      catchError((error) => {
        this.handleError(error);
        return this._errorHandler(error, url);
      })
    ) as Observable<HttpResponse<DResponse>>;
  }

  getData<T>(url: string, params?: any): Observable<HttpResponse<T>> {
    let httpParams = new HttpParams();

    if (params) {
      for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
          httpParams = httpParams.set(key, value.join(','));
        } else {
          httpParams = httpParams.set(key, value);
        }
      }
    }

    const options: { params?: HttpParams; observe: 'response' } = {
      params: httpParams,
      observe: 'response'
    };

    return this._http.get<T>(url, options).pipe(
      retry({ count: 2, delay: 1500 }),
      catchError((error) => {
        this.handleError(error);
        return this._errorHandler(error, url);
      })
    );
  }

  deleteByPost<TRequest, TResponse>(
    url: string,
    body: TRequest
  ): Observable<HttpResponse<TResponse>> {
    return this._http.post<TResponse>(url, body, { observe: 'response' }).pipe(
      catchError((error) => {
        this.handleError(error);
        return this._errorHandler(error, url);
      })
    );
  }

  postIntervalAPI(_url, _action: string, _body: any, buttonId?: string) {
    this.addLoader(buttonId);
    return this._http
      .post(_url + _action, JSON.stringify(_body), this.addHeader())
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorIntervalHandler(error);
        })
      );
  }

  _errorIntervalHandler(error) {
    let errorMessage;
    if (!error || !error.status) {
      errorMessage = 'Server Not Responding';
    } else if (error.status === 401) {
      errorMessage = error.error.message || 'Bad Response';
    } else if (error.status === 500) {
      errorMessage = 'Server Error';
    } else {
      errorMessage = error.error.message || 'Bad Response';
    }
    return of(errorMessage);
  }

  _loginErrorHandler(error) {
    let errorMessage;
    if (!error || !error.status) {
      errorMessage = 'Server Not Responding';
    } else if (error.status === 401 || error.status === 400) {
      errorMessage = error.error.message || 'Invalid Username or Password';
    } else if (error.status === 500) {
      errorMessage = 'Server Error';
    } else {
      errorMessage = error.error.message || 'Bad Response';
    }

    this.toastService?.error(errorMessage);

    return of(errorMessage);
  }

  getAPI(_url, _action: string, _body?: any, buttonId?: string) {
    const params = {};
    if (_body) {
      for (const key in _body) {
        if (Array.isArray(_body[key])) {
          params[key] = JSON.stringify(_body[key]);
        } else {
          params[key] = _body[key];
        }
      }
    }
    this.addLoader(buttonId);
    return this._http
      .get(_url + _action, { params: _body, headers: this.getHeader() })
      .pipe(
        retry({ count: 2, delay: 1500 }),
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorHandler(error, _url + _action);
        })
      );
  }

  get(url: string, params?: any): Observable<Response> {
    let options = { params, headers: this.getHeader() };
    return this._http.get(url, options).pipe(
      retry({ count: 2, delay: 1500 }),
      tap((res: Response) => {
        return res;
      }),
      catchError((error) => {
        this.handleError(error);
        return this._errorHandler(error, url);
      })
    );
  }

  postAPI(_url, _action: string, _body: any, buttonId?: string) {
    this.addLoader(buttonId);
    return this._http
      .post(_url + _action, JSON.stringify(_body), this.addHeader())
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          return this._errorHandler(error, _url + _action);
        })
      );
  }

  postFormAPI(_url, _action: string, _body: any, buttonId?: string) {
    this.addLoader(buttonId);
    return this._http
      .post(_url + _action, _body, this.addHeaderForMultipart())
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorHandler(error, _url + _action);
        })
      );
  }

  putAPI(_url, _action: string, _body?: any, buttonId?: string, headers?: any) {
    this.addLoader(buttonId);
    return this._http
      .put(
        _url + _action,
        _body !== undefined ? JSON.stringify(_body) : null,
        this.addHeader(headers)
      )
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorHandler(error, _url + _action);
        })
      );
  }

  deleteAPI(_url, _action: string, _body?: any, buttonId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(_body)
    };
    this.addLoader(buttonId);
    return this._http.delete(_url + _action, httpOptions).pipe(
      map((response: any) => {
        this.removeLoader(buttonId);
        return response;
      }),
      catchError((error) => {
        this.removeLoader(buttonId);
        return this._errorHandler(error, _url + _action);
      })
    );
  }

  uploadImageAPI(
    _url,
    _action: string,
    _file: File,
    _propertyAgreementId?: string,
    _fileTypeId?: string,
    _name?: string,
    buttonId?: string
  ) {
    this.addLoader(buttonId);
    const formData = new FormData();
    formData.append('file', _file);
    if (_propertyAgreementId != null) {
      formData.append('propertyAgreementId', _propertyAgreementId.toString());
    }
    if (_fileTypeId != null) {
      formData.append('fileTypeId', _fileTypeId.toString());
    }
    if (_name != null) {
      formData.append('fileName', _name.toString());
    }
    return this._http
      .post(_url + _action, formData, this.addHeaderForMultipart())
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorHandler(error, _url);
        })
      );
  }

  removeImageAPI(
    _url,
    _action: string,
    _index: number,
    _id: number,
    buttonId?: string
  ) {
    this.addLoader(buttonId);
    const formData = new FormData();
    formData.append('index', _index.toString());
    formData.append('id', _id.toString());
    return this._http
      .post(_url + _action, formData, this.addHeaderForMultipart())
      .pipe(
        map((response: any) => {
          this.removeLoader(buttonId);
          return response;
        }),
        catchError((error) => {
          this.removeLoader(buttonId);
          this.handleError(error);
          return this._errorHandler(error, _url + _action);
        })
      );
  }

  handleError(err) {
    this.loadingService.stopLoading();
    const errorMessage = err.error?.message?.message || err.error?.message;
    const { code, role } = err.error?.response || {};
    if (
      code === MAILBOX_ROLE_REQUIRED &&
      role === EUserMailboxRole.COLLABORATOR
    ) {
      this.errorService.handleShowMailBoxPermissionWarning(true);
    }
    if (!errorMessage) {
      return;
    }
  }

  _errorHandler(error, url: string = '') {
    if (error && error.status && error.status === 500) {
      if (!UNCATCH_API_URL.find((item) => url.includes(item))) {
        this.errorService.handleHttpError(error);
      }
    }

    return throwError(error);
  }

  private addHeader(options?: any) {
    let headers = this.getHeader();
    if (options) {
      for (const key of Object.keys(options)) {
        headers = headers.append(key, options[key]);
      }
    }
    return { headers };
  }

  getHeader() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      app_version: '1.0',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });
  }

  addHeaderForMultipart(): any {
    if (localStorage.getItem('access_token')) {
      const headers = new HttpHeaders();
      return { headers: headers };
    }
  }

  addLoader(id: string) {
    if (id) {
      const buttonElement = document.querySelector('#' + id);
      if (buttonElement) {
        buttonElement.classList.add('disabled');
        buttonElement.prepend(`<i class='fa fa-spinner fa-spin'></i> `);
      }
    }
  }

  removeLoader(id: string) {
    if (id) {
      const buttonElement = document.querySelector('#' + id);
      if (buttonElement) {
        buttonElement.classList.remove('disabled');
        buttonElement.querySelector('i')?.remove();
      }
    }
  }
}
