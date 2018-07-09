import { Routes } from '@angular/router';

import { CharacterManagerComponent, CreateCharacterComponent, CharacterRaceDetails, PlayGameComponent, GameComponent, HomeComponent, LoginComponent, DmPortalComponent } from './components';

import { SessionGuard, UserResolver } from './services/services';

export const rootRouterConfig: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: HomeComponent },
    { path: 'game', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: GameComponent },
    { path: 'playGame', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: PlayGameComponent },
    { path: 'manageCharacter', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CharacterManagerComponent },
    { path: 'createCharacter', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CreateCharacterComponent },
    { path: 'characterRaceDetails', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CharacterRaceDetails },
    { path: 'dmPortal', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: DmPortalComponent },
    { path: 'login', component: LoginComponent }
];