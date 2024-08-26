import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookFilterComponent } from './facebook-filter.component';

describe('FacebookFilterComponent', () => {
  let component: FacebookFilterComponent;
  let fixture: ComponentFixture<FacebookFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
