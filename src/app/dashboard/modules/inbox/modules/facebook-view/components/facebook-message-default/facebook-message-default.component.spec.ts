import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookMessageDefaultComponent } from './facebook-message-default.component';

describe('FacebookMessageDefaultComponent', () => {
  let component: FacebookMessageDefaultComponent;
  let fixture: ComponentFixture<FacebookMessageDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookMessageDefaultComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookMessageDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
