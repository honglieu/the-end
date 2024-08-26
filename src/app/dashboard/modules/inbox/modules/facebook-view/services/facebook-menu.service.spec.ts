import { TestBed } from '@angular/core/testing';

import { FacebookMenuService } from './facebook-menu.service';

describe('FacebookMenuService', () => {
  let service: FacebookMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacebookMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
