import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { EquipmentComponent, SpellbookComponent, StatsComponent, SnackbarComponent } from '../components';

import { NgEnterDirective } from '../directives/directives';
import { GiveitemComponent } from './giveitem/giveitem.component';


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
    GiveitemComponent
  ],
  exports: [
    EquipmentComponent,
    SpellbookComponent,
    StatsComponent,
    GiveitemComponent,
    SnackbarComponent,
    NgEnterDirective
  ]
})
export class SharedModule { }
