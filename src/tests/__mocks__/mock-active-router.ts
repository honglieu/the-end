import { Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export class MockActivatedRoute {
  private innerTestParams?: any;
  private subject?: BehaviorSubject<any> = new BehaviorSubject(this.testParams);

  public params = this.subject.asObservable();
  public queryParams = this.subject.asObservable();

  constructor(params?: Params) {
    this.testParams = params || {};
  }

  get testParams() {
    return this.innerTestParams;
  }

  set testParams(params: {}) {
    this.innerTestParams = params;
    this.subject.next(params);
  }

  get snapshot() {
    return { params: this.testParams, queryParams: this.testParams };
  }
}
