import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrustAccountComponent } from './trust-account.component';

describe('TrustAccountComponent', () => {
  let component: TrustAccountComponent;
  let fixture: ComponentFixture<TrustAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustAccountComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TrustAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
