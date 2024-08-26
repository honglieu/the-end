import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewDetailHeaderComponent } from './facebook-view-detail-header.component';

describe('FacebookViewDetailHeaderComponent', () => {
  let component: FacebookViewDetailHeaderComponent;
  let fixture: ComponentFixture<FacebookViewDetailHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewDetailHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewDetailHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
