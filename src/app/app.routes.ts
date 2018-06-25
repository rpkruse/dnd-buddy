import { Routes } from '@angular/router';

import { AppComponent, CreateCharacterComponent, HomeComponent, LoginComponent } from './components';

import { SessionGuard, UserResolver } from './services/services';

export const rootRouterConfig: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: HomeComponent },
    { path: 'createCharacter', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CreateCharacterComponent },
    { path: 'login', component: LoginComponent }
];