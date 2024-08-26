import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivedChannelListComponent } from './archived-channel-list.component';

describe('ArchivedChannelListComponent', () => {
  let component: ArchivedChannelListComponent;
  let fixture: ComponentFixture<ArchivedChannelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivedChannelListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivedChannelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
