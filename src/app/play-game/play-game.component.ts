import { Component, OnInit } from '@angular/core';

import { DataShareService, MessageService, UserResolver } from '../services/services';
import { User, Game, Character, UserMessageData, RollMessageData, ItemMessageData, ClassDetails } from '../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css', '../global-style.css']
})
export class PlayGameComponent implements OnInit {
  private user: User;
  private isAlive: boolean = true;

  game: Game;

  constructor(private _dataShareService: DataShareService, public _messageService: MessageService) { }

  ngOnInit() {
    this._messageService.setConnection();
    
    this._dataShareService.user.subscribe(res => this.user = res);
    this._dataShareService.game.subscribe(res => this.game = res);
    this._dataShareService.connected.takeWhile(() => this.isAlive).subscribe(res => {if(res) this.joinGame();});
  }

  private joinGame(){
    
    let charId: number = this.game.userId === this.user.userId ? -1 : this.game.character[this.game.character.findIndex(u => u.userId === this.user.userId)].characterId;

    let umd: UserMessageData = {
      id: "",
      name: this.user.username,
      characterId: charId,
      groupName: this.game.name
    };

    this._messageService.joinGroup(umd);
  }

  

  ngOnDestroy(){
    this.isAlive = false;
    this._messageService.leaveGroup();
  }

}
