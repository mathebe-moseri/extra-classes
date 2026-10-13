import { bootstrapApplication } from '@angular/platform-browser';
import { MainComponent } from './app/main/main.component';
import { appConfig } from './app/app.config';

bootstrapApplication(MainComponent, appConfig)
  .catch((err) => console.error(err));
