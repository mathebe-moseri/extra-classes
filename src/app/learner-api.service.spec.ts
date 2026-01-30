import { TestBed } from '@angular/core/testing';

import { LearnerAPiService } from './learner-api.service';

describe('LearnerAPiService', () => {
  let service: LearnerAPiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LearnerAPiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

