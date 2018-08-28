import { Routes } from '@angular/router';

import { CharacterManagerComponent, CreateCharacterComponent, 
    CharacterRaceDetails, PlayGameComponent, GameComponent, HomeComponent, 
    ProfileComponent, LoginComponent, DmPortalComponent, 
    HelpFaqComponent, HelpGameComponent} from './components';

import { SessionGuard, UserResolver } from './services/services';

export const rootRouterConfig: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: HomeComponent },
    { path: 'profile', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: ProfileComponent },
    { path: 'game', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: GameComponent },
    { path: 'playGame', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: PlayGameComponent },
    { path: 'manageCharacter', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CharacterManagerComponent },
    { path: 'createCharacter', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CreateCharacterComponent },
    { path: 'characterRaceDetails', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: CharacterRaceDetails },
    { path: 'dmPortal', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: DmPortalComponent },
    { path: 'help-faq', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: HelpFaqComponent},
    { path: 'help-game', canActivate: [ SessionGuard ], resolve: { user: UserResolver }, component: HelpGameComponent},
    { path: 'login', component: LoginComponent }
];