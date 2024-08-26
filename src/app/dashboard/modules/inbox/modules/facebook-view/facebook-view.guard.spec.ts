import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { facebookViewGuard } from './facebook-view.guard';

describe('facebookViewGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => facebookViewGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
