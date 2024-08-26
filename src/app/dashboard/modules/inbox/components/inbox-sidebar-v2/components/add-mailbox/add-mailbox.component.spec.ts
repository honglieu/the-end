import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMailboxComponent } from './add-mailbox.component';

describe('AddMailboxComponent', () => {
  let component: AddMailboxComponent;
  let fixture: ComponentFixture<AddMailboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMailboxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AddMailboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
