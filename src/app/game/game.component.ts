/*
  Written by: Ryan Kruse
  This component is used to join a game that you are currently in or create a new game (the creator is the DM of that game)
*/
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { trigger, state, animate, transition, style } from '@angular/animations';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService, DndApiService, DataShareService, StorageService } from '../services/services';
import { Character, Game, User, ClassDetails, RaceDetails, MessageType, MessageOutput } from '../interfaces/interfaces';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators/debounceTime';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css', '../global-style.css'],
  animations: [
    trigger(
      'showState', [
        state('show', style({
          opacity: 1,
          visibility: 'visible'
        })),
        state('hide', style({
          opacity: 0,
          visibility: 'hidden'
        })),
        transition('show => *', animate('400ms')),
        transition('hide => show', animate('400ms')),
      ])
  ]
})
export class GameComponent implements OnInit {
  MessageType = MessageType;

  private user: User;
  games: Game[] = [];
  dmGames: Game[] = [];

  creatingGame: boolean = false;
  gameName: string = "";
  gamenameTaken: boolean = false;
  hasClickedOff: boolean = false;

  selectedGame: Game;
  selectedCharacter: Character;

  characterDetail: Character;
  classDetail: ClassDetails;
  raceDetail: RaceDetails;

  viewingDMGames: boolean = false;

  gameNameChanged: Subject<string> = new Subject<string>();

  mouseOver: number = -1;
  deleteClickIndex: number = -1;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _modalService: NgbModal, private _router: Router, private _storageService: StorageService) { }

  ngOnInit() {
    this._dataShareService.user.subscribe(res => this.user = res);
    let s: Subscription = this._apiService.getAllEntities<Game>("Games/user/" + this.user.userId).subscribe(
      d => this.games = d,
      err => console.log("Unable to get games"),
      () => {
        s.unsubscribe();
        this.filterGames();
      }
    );

    let j: Subscription = this.gameNameChanged.pipe(debounceTime(500)).subscribe(res => this.validateGamename(res));
  }

  public createGame() {
    this.creatingGame = true;
    this.selectedGame = null;
  }

  /**
   * Called when the user enters a game name and clicks off the input field.
   * It checks the backend to make sure it isn't a game name that is already in use
   * 
   * @param {string} gameName The name of the game 
   */
  public validateGamename(gameName: string) {
    if (this.gameName.length <= 0) return;

    let s: Subscription;
    s = this._apiService.getSingleEntity<any>("Games/check/" + gameName).subscribe(
      d => d = d,
      err => {
        if (err['error']['Error']) {
          this.gamenameTaken = true;
        } else {
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

  /**
   * Called when the user clicks save game, it adds the game to the backend and makes them the DM on it
   */
  public saveNewGame() {
    let s: Subscription;
    let newState = '';
    for (let x = 0; x < 100; x++) {
      newState = newState + 'N';
    }

    let g = {
      name: this.gameName,
      userId: this.user.userId,
      gameState: newState,
      open: true
    };

    let game: Game;
    s = this._apiService.postEntity<Game>("Games", g).subscribe(
      d => game = d,
      err => this.triggerMessage("", "Unable to create new game", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Game Created!", MessageType.Success);
        this.dmGames.push(game);
        this.loadGame(game);
        this.gameName = "";
      }
    )
  }

  /**
   * Called when the user clicks on a game. It gets all of the details for that game and displays them
   * 
   * @param {Game} game The game to get details for 
   */
  public loadGame(game: Game) {
    this.creatingGame = false;
    let s: Subscription;

    s = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.selectedGame = d,
      err => console.log("Unable to load game", err),
      () => s.unsubscribe()
    );
  }

  public toggleGame() {
    this.selectedGame.open = !this.selectedGame.open;

    let s: Subscription = this._apiService.putEntity<Game>("Games", this.selectedGame, this.selectedGame.gameId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to lock game", MessageType.Failure),
      () => {
        s.unsubscribe();
        let msg: string = this.selectedGame.open ? "Game unlocked" : "Game locked";
        this.triggerMessage("", msg, MessageType.Success);
      }
    );
  }

  /**
   * Called when the user clicks join game. It either has them join as a player
   * or as a DM
   */
  public joinGame() {
    this._dataShareService.changeGame(this.selectedGame);
    this._storageService.setValue('game', this.selectedGame);
    this._router.navigate(['./playGame']);
  }

  /**
   * Called when the user clicks confirm (or cancel) on the confirm delete modal
   * 
   * @param {any} confirm The action the user took (confirm/cancel/click off) 
   */
  public confirmDeleteGame(confirm) {
    this._modalService.open(confirm).result.then((result) => { //confirm
      if (this.selectedGame.character.length > 0) this.removeAllCharactersFromGame(); else this.deleteGame();
    }, (reason) => { //cancel or click off, do nothing

    });
  }

  /**
   * Called when the user clicks the delete game button, it opens a modala asking 
   * the user to confirm their action
   */
  private deleteGame() {
    let s: Subscription;
    s = this._apiService.deleteEntity<Game>("Games", this.selectedGame.gameId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete game", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Game Deleted!", MessageType.Success);

        let index: number = this.games.findIndex(x => x.gameId === this.selectedGame.gameId);
        this.dmGames.splice(index, 1);

        this.selectedGame = null;
      }
    );
  }

  /**
   * Called when the DM deletes a game. Since the characters have a foreign key value to the game, we must delete the characters first
   */
  private removeAllCharactersFromGame() {
    let s: Subscription;
    let size: number = this.selectedGame.character.length;
    for (let i = 0; i < size; i++) {
      let c: Character = this.selectedGame.character[i];
      s = this._apiService.deleteEntity("Characters", c.characterId).subscribe(
        d => d = d,
        err => console.log(err),
        () => {
          if (i === size - 1) {
            s.unsubscribe();
            this.deleteGame();
          }
        }
      )
    }
  }

  /**
   * Called when the user clicks the delete button on a character
   * it opens a modal to confirm the delete
   * 
   * @param {any} content The modal 
   * @param {any} event Used to stop propagation
   * @param {Character} character The character to delete
   */
  public confirmRemoveCharacter(content, event, character: Character, index: number) {
    event.stopPropagation();
    this.selectedCharacter = character;
    this._modalService.open(content).result.then((result) => { //On close via save
      this.removeSingleCharacterFromGame(index); //When we save, we attempt to add all needed entities to the DB
    }, (reason) => { //on close via click off
    });
  }

  public removeSingleCharacterFromGame(index: number) {
    event.stopPropagation();
    this.deleteClickIndex = index;

    let c: Character = this.selectedGame.character[index];

    let s: Subscription = this._apiService.deleteEntity("Characters", c.characterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to remove character", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Character removed!", MessageType.Success);
        this.selectedGame.character.splice(index, 1);
        this.deleteClickIndex = -1;
      }
    );
  }

  public isGameOwner(): boolean {
    if (!this.selectedGame) return false;

    return this.selectedGame.userId === this.user.userId;
  }

  /**
   * Called when the user clicks on a character in the game. It brings up a modal showing that
   * character's stats/info
   * 
   * @param {number} index The index of the selected character 
   * @param {any} content The modal
   */
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

  public typeGameName(name: string) {
    // if (!name.length) return;

    this.gameName = name;
    this.gameNameChanged.next(this.gameName);
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

  private filterGames() {
    this.dmGames = this.games.filter(x => x.userId === this.user.userId);
    this.games = this.games.filter(x => x.userId !== this.user.userId);
  }

  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }
}
