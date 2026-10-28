import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SepediLiteratureComponent } from './sepedi-literature.component';

describe('SepediLiteratureComponent', () => {
  let component: SepediLiteratureComponent;
  let fixture: ComponentFixture<SepediLiteratureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SepediLiteratureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SepediLiteratureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
