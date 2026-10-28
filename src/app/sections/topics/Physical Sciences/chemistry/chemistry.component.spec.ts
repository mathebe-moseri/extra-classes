import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChemistryComponent } from './chemistry.component';

describe('ChemistryComponent', () => {
  let component: ChemistryComponent;
  let fixture: ComponentFixture<ChemistryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChemistryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChemistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
