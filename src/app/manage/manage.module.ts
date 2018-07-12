import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { CharacterManagerComponent, CreateCharacterComponent, CharacterRaceDetails, DmPortalComponent } from '../components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule
  ],
  declarations: [
    CreateCharacterComponent,
    CharacterRaceDetails,
    CharacterManagerComponent,
    DmPortalComponent
  ],
  exports: [
    CreateCharacterComponent,
    CharacterRaceDetails,
    CharacterManagerComponent,
    DmPortalComponent
  ]
})
export class ManageModule { }
