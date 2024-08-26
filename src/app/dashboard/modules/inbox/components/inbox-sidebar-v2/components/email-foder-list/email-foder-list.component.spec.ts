import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailFoderListComponent } from './email-foder-list.component';

describe('EmailFoderListComponent', () => {
  let component: EmailFoderListComponent;
  let fixture: ComponentFixture<EmailFoderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailFoderListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailFoderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
