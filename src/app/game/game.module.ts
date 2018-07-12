import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

//Components:
import { PlayGameComponent, PlayDmComponent, PlayPlayerComponent, GameComponent } from '../components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule
  ],
  declarations: [
    PlayGameComponent, 
    PlayDmComponent, 
    PlayPlayerComponent, 
    GameComponent
  ],
  exports: [
    PlayGameComponent, 
    PlayDmComponent, 
    PlayPlayerComponent, 
    GameComponent
  ]
})
export class GameModule { 
  static forRoot() {
    return {
      ngModule: GameModule,
      providers: [

      ]
    }
  }
}
