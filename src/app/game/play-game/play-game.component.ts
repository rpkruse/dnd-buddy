import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, DataShareService, MessageService, StorageService, PlayManager } from '../../services/services';
import { User, Game, Character, OnlineUser, UserMessageData, RollMessageData, GridMessageData } from '../../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css', '../../global-style.css']
})

export class PlayGameComponent implements OnInit {
  private user: User;
  private isAlive: boolean = true;
  public hasJoined: boolean = false;
  public mouseOver: number = -1;

  game: Game;
  character: Character = null;
  isGM: boolean = false;

  token: string = "N";
  gridHidden: boolean = true;

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, public _messageService: MessageService,
    private _storageService: StorageService, private _router: Router, private _playManager: PlayManager) { }

  ngOnInit() {
    this.game = this._storageService.getValue('game');

    this._dataShareService.user.subscribe(res => this.user = res);
    this._dataShareService.connected.takeWhile(() => this.isAlive).subscribe(res => { if (res) this.getInfoToJoin(); });
    this._messageService.rollDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setRollData(res));

    if (this.game) {
      this._messageService.setConnection();
      this._dataShareService.changeGame(this.game);
    } else {
      this._router.navigate(['/game']);
    }

    let s = this._apiService.getSingleEntity<string>('Games/state/' + this.game.gameId).subscribe(
      d => this.game.gameState = d,
      err => console.log('Unable to load game.', err),
      () => {
        s.unsubscribe();
        this._messageService.loadGridData(this.game.gameState);
      }
    );
  }

  /**
   * Called to start the connection to signalR
   */
  private getInfoToJoin() {
    let s: Subscription;

    let charId: number = this.game.userId === this.user.userId ? -1 : this.game.character[this.game.character.findIndex(u => u.userId === this.user.userId)].characterId;
    if (charId < 0) {
      this.isGM = true;
      this.joinGame(this.user.username + " (DM)", -1);
      return;
    }

    s = this._apiService.getSingleEntity<Character>("Characters/" + charId).subscribe(
      d => this.character = d,
      err => console.log("Unable to load character", err),
      () => {
        s.unsubscribe();
        let n: string = this.user.username + " (" + this.character.name + ")";
        this.joinGame(n, this.character.characterId);
      }
    );

  }

  /**
   * Called once we are connected to signalR. If we are the DM it gets all of the needed DM info.
   * If we are the player it gets our class details from the api
   * 
   * @param {string} name The name of the character or DM 
   * @param {number} charId The character id of the current player (-1 if DM)
   */
  private joinGame(name: string, charId: number) {
    let umd: UserMessageData = this._playManager.createUMD(name, charId, this.game.name);
    this._messageService.joinGroup(umd);
    this.hasJoined = true;

    if (!this.isGM)
      this._playManager.initClassDetails(this.character);
    // else
    // this._playManager.initGMInfo();
  }

  /**
   * Called when we get a message from signalR saying that someone has rolled a new value
   * it updates their value to display on the DOM
   * 
   * @param {RollMessageData} rmd The roll message data of the player's roll 
   */
  public setRollData(rmd: RollMessageData) {
    if (rmd === null) return;

    let index: number = this._messageService.groupMembers.findIndex(x => x.rmd.charId === rmd.charId);
    if (index < 0) return;

    this._messageService.groupMembers[index].rmd = rmd;
  }

  /**
   * Called when the dM clicks on a tile in our grid. It places the token on the tile
   * and notifies everyone in the group
   * 
   * @param {number} x The x pos on the grid 
   * @param {number} y The y pos on the grid
   */
  public placeToken(x: number, y: number) {
    let gmd: GridMessageData;

    if (this.getGridValue(x, y).type === this.token) {
      gmd = this._playManager.createGMD(x, y, 'N', '', this.game.name);
    } else {
      gmd = this._playManager.createGMD(x, y, this.token, '', this.game.name);
    }

    let pos = (y * 10) + (x);
    this.game.gameState = this.replaceAt(this.game.gameState, pos, this.token);

    let r: Subscription = this._apiService.putEntity<Game>('Games', this.game, this.game.gameId).subscribe(
      d => d = d,
      err => console.log('Unable to save game.', err),
      () => {
        r.unsubscribe();
      }
    );

    this._messageService.sendGrid(gmd);
  }

  /**
   * Called when the DM clicks reset. It removes all values in the grid that are non-empty
   */
  public resetGrid() {
    let GMD: GridMessageData;
    this.game.gameState = '';
    for (let y = 0; y < this._messageService.grid.length; y++) {
      for (let x = 0; x < this._messageService.grid[y].length; x++) {
        this.game.gameState = this.game.gameState + 'N';

        GMD = this._playManager.createGMD(x, y, 'N', '', this.game.name);
        this._messageService.sendGrid(GMD);
      }
    }

    let r: Subscription = this._apiService.putEntity<Game>('Games', this.game, this.game.gameId).subscribe(
      d => d = d,
      err => console.log('Unable to save game.', err),
      () => {
        r.unsubscribe();
      }
    );
  }

  /**
   * Called to dynamically display the cells background
   * 
   * @param {number} x The x pos on the grid 
   * @param {number} y The y pos on the grid 
   */
  public getGridClass(x: number, y: number) {
    let gmd: GridMessageData = this._messageService.grid[y][x];

    let color: string;
    switch (gmd.type) {
      case "P": //Player
        color = 'bg-primary';
        break;
      case "E": //Enemy
        color = 'bg-danger';
        break;
      case "W": //Wall
        color = "bg-secondary"
        break;
      default: //Anything else
        color = 'bg-white';
        break;
    }

    return color;
  }

  public getGridValue(x: number, y: number): GridMessageData {
    return this._messageService.grid[y][x];
  }

  /**
   * Returns an image for a given grid value
   * 
   * @param {string} gridValue The value of an image to load on the grid
   * 
   * @returns The path to the image 
   */
  public getGridImage(gridValue: string): string {
    switch (gridValue) {
      case 'P': {
        return 'assets/class_imgs/cleric.png';
      }
      case 'E': {
        return 'assets/race_imgs/minotaur.png';
      }
      case 'N': {
        return 'assets/textures/emptyTile.jpg';
      }
      case 'W': {
        return 'assets/textures/wall.png';
      }
    }
  }

  /**
   * Called to get all the other players in the group (minus the current user)
   * 
   * @param {boolean} onlyPlayers If we want to only return players (used for grid)
   * 
   * @returns An array of all connected players minus us 
   */
  public getOtherGroupMembers(onlyPlayers?: boolean): OnlineUser[] {
    if (this.isGM || onlyPlayers)
      return this._messageService.groupMembers.filter(x => x.umd.characterId > 0); //Filter the GM out
    else
      return this._messageService.groupMembers.filter(x => x.umd.characterId !== this.character.characterId); //filter ourself out
  }

  private replaceAt(string, index, replace) {
    return string.substring(0, index) + replace + string.substring(index + 1);
  }

  /*
    When we leave the page we want to unsub, disconnect from signalR group, and clear all of our values
  */
  ngOnDestroy() {
    this.isAlive = false;
    this.hasJoined = false;
    this._messageService.leaveGroup();
    this._storageService.removeValue('game');
    this._playManager.clearAllValues();
  }

}
