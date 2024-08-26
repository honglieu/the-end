import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivedMailboxItemComponent } from './archived-mailbox-item.component';

describe('ArchivedMailboxItemComponent', () => {
  let component: ArchivedMailboxItemComponent;
  let fixture: ComponentFixture<ArchivedMailboxItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivedMailboxItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivedMailboxItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
