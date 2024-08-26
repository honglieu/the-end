import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewDetailComponent } from './facebook-view-detail.component';

describe('FacebookViewDetailComponent', () => {
  let component: FacebookViewDetailComponent;
  let fixture: ComponentFixture<FacebookViewDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewDetailComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
