import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookViewListComponent } from './facebook-view-list.component';

describe('FacebookViewListComponent', () => {
  let component: FacebookViewListComponent;
  let fixture: ComponentFixture<FacebookViewListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookViewListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FacebookViewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
