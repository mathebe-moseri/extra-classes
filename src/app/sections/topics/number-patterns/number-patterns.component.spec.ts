import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberPatternsComponent } from './number-patterns.component';

describe('NumberPatternsComponent', () => {
  let component: NumberPatternsComponent;
  let fixture: ComponentFixture<NumberPatternsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberPatternsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberPatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
