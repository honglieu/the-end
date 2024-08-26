import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivedMailboxListComponent } from './archived-mailbox-list.component';

describe('ArchivedMailboxListComponent', () => {
  let component: ArchivedMailboxListComponent;
  let fixture: ComponentFixture<ArchivedMailboxListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivedMailboxListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivedMailboxListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
