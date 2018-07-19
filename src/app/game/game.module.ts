import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

//Components:
import { PlayGameComponent, PlayDmComponent, PlayPlayerComponent, GameComponent } from '../components';
import { PlayChatComponent } from './play-chat/play-chat.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    SharedModule,
  ],
  declarations: [
    PlayGameComponent, 
    PlayDmComponent, 
    PlayPlayerComponent, 
    GameComponent, 
    PlayChatComponent,
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
