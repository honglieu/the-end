import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFacebookPageComponent } from './select-facebook-page.component';

describe('SelectFacebookPageComponent', () => {
  let component: SelectFacebookPageComponent;
  let fixture: ComponentFixture<SelectFacebookPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectFacebookPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectFacebookPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
