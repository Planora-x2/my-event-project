import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { EventListComponent } from './components/event-list/event-list';
import { EventDetailComponent } from './components/event-detail/event-detail';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard';
import { ClientAnalyticsComponent } from './components/client-analytics/client-analytics';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { EnquiryAnalyticsComponent } from './components/enquiry-analytics/enquiry-analytics';
import { UserProfileComponent } from './components/user-profile/user-profile';
import { SupportChatComponent } from './components/support-chat/support-chat';
import { SavedVendorsComponent } from './components/saved-vendors/saved-vendors';
import { PilgrimageComponent } from './components/pilgrimage/pilgrimage';

import { WeddingCardGeneratorComponent } from './components/wedding-card-generator/wedding-card-generator.component';
import { WeddingCardViewComponent } from './components/wedding-card-view/wedding-card-view.component';

export const routes: Routes = [
  { path: '', component: EventListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'event/:id', component: EventDetailComponent },
  { path: 'client-dashboard', component: ClientDashboardComponent },
  { path: 'client-analytics', component: ClientAnalyticsComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'enquiry-analytics', component: EnquiryAnalyticsComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'support', component: SupportChatComponent },
  { path: 'saved', component: SavedVendorsComponent },
  { path: 'pilgrimage', component: PilgrimageComponent },
  { path: 'wedding-card/generate', component: WeddingCardGeneratorComponent },
  { path: 'wedding-card/:id', component: WeddingCardViewComponent },
  { path: '**', redirectTo: '' }
];
