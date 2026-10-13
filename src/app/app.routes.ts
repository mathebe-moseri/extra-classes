import { Routes } from '@angular/router';
import { AboutUSComponent } from './sections/about-us/about-us.component';
import { DashboardComponent } from './sections/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    children: [],
    pathMatch: 'full'
  },
  {
    path: 'about',
    component: AboutUSComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  }
];
