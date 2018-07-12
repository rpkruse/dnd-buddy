import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { EquipmentComponent, SpellbookComponent, StatsComponent, SnackbarComponent } from '../components';

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
    StatsComponent
  ],
  exports: [
    EquipmentComponent,
    SpellbookComponent,
    StatsComponent,
    SnackbarComponent
  ]
})
export class SharedModule { }
