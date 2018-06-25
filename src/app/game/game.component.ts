import { Component, OnInit } from '@angular/core';

import { ApiService, DataShareService } from '../services/services';
import { Character, Game, User } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';


@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css', '../global-style.css']
})
export class GameComponent implements OnInit {
  private user: User;
  games: Game[] = [];

  creatingGame: boolean = false;
  gameName: string = "";
  isGM: boolean = false;

  selectedGame: Game;

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService) { }

  ngOnInit() {
    this._dataShareService.user.subscribe(res => this.user = res);
    let s: Subscription = this._apiService.getAllEntities<Game>("Games/user/" + this.user.userId).subscribe(
      d => this.games = d,
      err => console.log("Unable to get games"),
      () => s.unsubscribe()  
    );
  }

  public createGame() {
    this.creatingGame = true;
    this.selectedGame = null;
  }

  public saveNewGame(){
    let s: Subscription;

    let g = {
      name: this.gameName,
      userId: this.user.userId,
      gm: this.isGM
    };

    let game: Game;
    s = this._apiService.postEntity<Game>("Games", g).subscribe(
      d => game = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        this.games.push(game);
      }
    )
  }

  public loadGame(game: Game){
    this.creatingGame = false;
    let s: Subscription;

    s = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.selectedGame = d,
      err => console.log("Unable to load game", err),
      () => s.unsubscribe()
    );
  }
}
