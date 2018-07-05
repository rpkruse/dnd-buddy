/*
  Written by: Ryan Kruse
  This component is used to join a game that you are currently in or create a new game (the creator is the DM of that game)
*/
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService, DndApiService, DataShareService, StorageService } from '../services/services';
import { Character, Game, User, ClassDetails, RaceDetails, MessageType, MessageOutput } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';


@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css', '../global-style.css']
})
export class GameComponent implements OnInit {
  MessageType = MessageType;

  private user: User;
  games: Game[] = [];

  creatingGame: boolean = false;
  gameName: string = "";
  gamenameTaken: boolean = false;
  hasClickedOff: boolean = false;

  selectedGame: Game;

  characterDetail: Character;
  classDetail: ClassDetails;
  raceDetail: RaceDetails;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _modalService: NgbModal, private _router: Router, private _storageService: StorageService) { }

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

  /*
    This method is called once the user enters a game name and clicks off of the input field.
    It checks the backend to make sure it isnt a game name that is already in use
  */
  public validateGamename(gameName: string){
    if(this.gameName.length <= 0) return;

    let s: Subscription;
    s = this._apiService.getSingleEntity<any>("Games/check/"+ gameName).subscribe(
      d => d = d,
      err => {
        if(err['error']['Error']){
          this.gamenameTaken = true;
        }else{
          this.hasClickedOff = true;
        }
      },
      () => {
        s.unsubscribe();
        this.hasClickedOff = true;
        this.gamenameTaken = false;
      }
    );
  }

  /*
    This method is called when the user clicks save game, it adds the game to the backend and makes them the DM on it
  */
  public saveNewGame() {
    let s: Subscription;

    let g = {
      name: this.gameName,
      userId: this.user.userId,
    };

    let game: Game;
    s = this._apiService.postEntity<Game>("Games", g).subscribe(
      d => game = d,
      err => this.triggerMessage("", "Unable to create new game", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Game Created!", MessageType.Success);
        this.games.push(game);
        this.loadGame(game);
        this.gameName = "";
      }
    )
  }

  public loadGame(game: Game) {
    this.creatingGame = false;
    let s: Subscription;

    s = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.selectedGame = d,
      err => console.log("Unable to load game", err),
      () => s.unsubscribe()
    );
  }

  public joinGame(){
    this._dataShareService.changeGame(this.selectedGame);
    this._storageService.setValue('game', this.selectedGame);
    this._router.navigate(['./playGame']);
  }

  public confirmDeleteGame(confirm){
    this._modalService.open(confirm).result.then((result) => {
      if(this.selectedGame.character.length > 0) this.removeCharactersFromGame(); else this.deleteGame();
    }, (reason) => {

    });
  }

  private deleteGame(){
    let s: Subscription;
    s = this._apiService.deleteEntity<Game>("Games", this.selectedGame.gameId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete game", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Game Deleted!", MessageType.Success);

        let index: number = this.games.findIndex(x => x.gameId === this.selectedGame.gameId);
        this.games.splice(index, 1);

        this.selectedGame = null;
      }
    );
  }

  /*
    This method is called when the DM deletes a game. Since the characters have a foreign key value to the game, we must 
    delete the characters first 
  */
  private removeCharactersFromGame(){
    let s: Subscription;
    let size: number = this.selectedGame.character.length;
    for(let i=0; i<size; i++){
      let c: Character = this.selectedGame.character[i];
      s = this._apiService.deleteEntity("Characters", c.characterId).subscribe(
        d => d = d,
        err => console.log(err),
        () => {
          if(i === size- 1){
            s.unsubscribe();
            this.deleteGame();
          }
        }
      )
    }
  }

  public loadCharacterDetails(index: number, content) {
    this.characterDetail = this.selectedGame.character[index];
    let s, j: Subscription;

    s = this._dndApiService.getSingleEntity<ClassDetails>(this.selectedGame.character[index].class).subscribe(
      d => this.classDetail = d,
      err => console.log(err),
      () => s.unsubscribe()
    );

    j = this._dndApiService.getSingleEntity<RaceDetails>(this.selectedGame.character[index].race).subscribe(
      d => this.raceDetail = d,
      err => console.log(err),
      () => j.unsubscribe()
    );

    this.openModal(content);
  }

  public openModal(content) {
    this._modalService.open(content).result.then((result) => { //On close via save
      this.clearCharacterDetails();
    }, (reason) => { //on close via click off
      this.clearCharacterDetails();
    });
  }

  public clearCharacterDetails() {
    this.classDetail = null;
    this.raceDetail = null;
  }

  private triggerMessage(message: string, action: string, level: MessageType){
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }
}
