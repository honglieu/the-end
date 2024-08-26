import { TestBed } from '@angular/core/testing';

import { ConverationSummaryService } from './converation-summary.service';

describe('ConverationSummaryService', () => {
  let service: ConverationSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConverationSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
