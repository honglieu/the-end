import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationSummaryFileComponent } from './conversation-summary-file.component';

describe('ConversationSummaryFileComponent', () => {
  let component: ConversationSummaryFileComponent;
  let fixture: ComponentFixture<ConversationSummaryFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationSummaryFileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationSummaryFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
