import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { EquipmentComponent, SpellbookComponent, StatsComponent, SnackbarComponent } from '../components';

import { NgEnterDirective } from '../directives/directives';
import { GiveitemComponent } from './giveitem/giveitem.component';
import { GivexpComponent } from './givexp/givexp.component';
import { RollComponent } from './roll/roll.component';
import { CreateMonsterComponent } from './create-monster/create-monster.component';
import { EditCharacterComponent } from './edit-character/edit-character.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule
  ],
  declarations: [
    SnackbarComponent,
    EquipmentComponent,
    SpellbookComponent,
    StatsComponent,
    NgEnterDirective,
    GiveitemComponent,
    GivexpComponent,
    RollComponent,
    CreateMonsterComponent,
    EditCharacterComponent
  ],
  exports: [
    EquipmentComponent,
    SpellbookComponent,
    StatsComponent,
    GiveitemComponent,
    GivexpComponent,
    RollComponent,
    EditCharacterComponent,
    CreateMonsterComponent,
    SnackbarComponent,
    NgEnterDirective
  ]
})
export class SharedModule { }
