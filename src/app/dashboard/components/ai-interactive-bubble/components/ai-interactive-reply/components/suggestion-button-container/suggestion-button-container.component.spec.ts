import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestionButtonContainerComponent } from './suggestion-button-container.component';

describe('SuggestionButtonContainerComponent', () => {
  let component: SuggestionButtonContainerComponent;
  let fixture: ComponentFixture<SuggestionButtonContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionButtonContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionButtonContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
