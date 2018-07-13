import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

import { CharacterManagerComponent, CreateCharacterComponent, CharacterRaceDetails, DmPortalComponent } from '../components';
import { SortableListDirective, SortableDirective, DraggableDirective } from '../directives/directives';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    SharedModule
  ],
  declarations: [
    CreateCharacterComponent,
    CharacterRaceDetails,
    CharacterManagerComponent,
    DmPortalComponent,
    SortableListDirective,
    SortableDirective,
    DraggableDirective
  ],
  exports: [
    CreateCharacterComponent,
    CharacterRaceDetails,
    CharacterManagerComponent,
    DmPortalComponent,
    SortableListDirective,
    SortableDirective,
    DraggableDirective
  ]
})
export class ManageModule { }
