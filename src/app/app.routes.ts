import { Routes } from '@angular/router';

import { AppComponent, CreateCharacterComponent, HomeComponent } from './components';

// import { SessionGuard, UserResolver } from './services/services';

export const rootRouterConfig: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'createCharacter', component: CreateCharacterComponent }
    // { path: 'home', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: SearchResultsComponent},
    // { path: 'profile', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: ProfileComponent },
    // { path: 'login', component: LoginComponent }
];