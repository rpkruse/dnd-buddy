/**
 * Written by: Ryan Kruse
 * 
 * This component allows for the DM to modify player's in their game. They can change their ability scores and give them gear
 */
import { Component, OnInit } from '@angular/core';

import { ApiService, DataShareService } from '../../services/services';

import { User, Character, Monster, Game, MessageOutput, MessageType } from '../../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'dm-portal',
  templateUrl: './dm-portal.component.html',
  styleUrls: ['./dm-portal.component.css', '../../global-style.css']
})
export class DmPortalComponent implements OnInit {
  private isAlive: boolean = true;
  private user: User;

  mouseOver: number = -1;

  games: Observable<Game[]>;
  game: Game;
  
  monsters: Monster[] = [];
  monster: Monster;
  createMonster: boolean = false;

  character: Character;


  viewingCharacters: boolean = true;

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);

    this.games = this._apiService.getAllEntities<Game>("Games/gm/" + this.user.userId);
  }

  /**
   * Called when the DM clicks a game to load, it pulls it from the backend
   * 
   * @param {Game} game The game to get details on 
   */
  loadGame(game: Game) {
    this.character = null;
    this.monster = null;
    this.createMonster = false;

    let s: Subscription = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.game = d,
      err => console.log("unable to load game"),
      () => { s.unsubscribe(); this.loadMonsters(); }
    );
  }

  loadMonsters() {
    let s: Subscription = this._apiService.getAllEntities<Monster>("Monsters/game/" + this.game.gameId).subscribe(
      d => this.monsters = d,
      err => console.log(err),
      () => s.unsubscribe()
    );
  }
  /**
   * Called when the DM clicks a character in a game to load
   * 
   * @param {Character} character The character to load 
   */
  selectCharacter(character: Character) {
    this.monster = null;
    this.createMonster = false;

    this.character = character;
  }

  selectMonster(monster: Monster, createMonster: boolean) {
    this.character = null;

    this.createMonster = createMonster;
    this.monster = monster;
  }

  /**
   * Called when the DM clicks save on a character, it updates them in the DB
   */
  saveCharacter(character: Character) {
    if (!character) return;

    this.character = character;

    let s: Subscription;

    s = this._apiService.putEntity<Character>("Characters", this.character, this.character.characterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to update character", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Character Updated!", MessageType.Success);
      }
    );
  }

  openTab(tab: string) {
    this.viewingCharacters = tab === 'characters';
  }
  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
