import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewDetailMessageComponent } from './facebook-view-detail-message.component';

describe('FacebookViewDetailMessageComponent', () => {
  let component: FacebookViewDetailMessageComponent;
  let fixture: ComponentFixture<FacebookViewDetailMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewDetailMessageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewDetailMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
