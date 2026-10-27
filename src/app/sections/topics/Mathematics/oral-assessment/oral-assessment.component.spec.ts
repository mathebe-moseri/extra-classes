import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OralAssessmentComponent } from './oral-assessment.component';

describe('OralAssessmentComponent', () => {
  let component: OralAssessmentComponent;
  let fixture: ComponentFixture<OralAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OralAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OralAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
