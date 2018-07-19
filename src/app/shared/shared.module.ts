import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { EquipmentComponent, SpellbookComponent, StatsComponent, SnackbarComponent } from '../components';

import { NgEnterDirective } from '../directives/directives';


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
    NgEnterDirective
  ],
  exports: [
    EquipmentComponent,
    SpellbookComponent,
    StatsComponent,
    SnackbarComponent,
    NgEnterDirective
  ]
})
export class SharedModule { }
