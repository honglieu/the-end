import { TestBed } from '@angular/core/testing';

import { FacebookIdSetService } from './facebook-id-set.service';

describe('FacebookIdSetService', () => {
  let service: FacebookIdSetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacebookIdSetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
