import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookMessageFooterComponent } from './facebook-message-footer.component';

describe('FacebookMessageFooterComponent', () => {
  let component: FacebookMessageFooterComponent;
  let fixture: ComponentFixture<FacebookMessageFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookMessageFooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookMessageFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
