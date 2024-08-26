import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewRowComponent } from './facebook-view-row.component';

describe('FacebookViewRowComponent', () => {
  let component: FacebookViewRowComponent;
  let fixture: ComponentFixture<FacebookViewRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewRowComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
