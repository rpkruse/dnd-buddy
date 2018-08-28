/**
 * Written by: Ryan Kruse
 * 
 * This component allows for the DM to modify player's in their game. They can change their ability scores and give them gear
 */
import { Component, OnInit } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DataShareService } from '../../services/services';

import { User, Character, Monster, Game, MessageOutput, MessageType } from '../../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'dm-portal',
  templateUrl: './dm-portal.component.html',
  styleUrls: ['./dm-portal.component.css', '../../global-style.css'],
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

  /**
   * Called when the DM clicks a monster or create monster button
   * 
   * @param {Monster} monster The monster to load 
   * @param {boolean} createMonster If the DM is creating a monster or not 
   */
  selectMonster(monster: Monster, createMonster: boolean) {
    this.character = null;

    this.createMonster = createMonster;
    this.monster = monster;
  }

  /**
   * Called when the create monster page returns a list of monsters (len >= 1)
   * 
   * @param {any[]} monsters A list of monster (like) objects to add to the DB 
   */
  getNewMonster(monsters: any[]) {
    let notif: string = monsters.length > 1 ? "Monsters Added" : "Monster Added";

    for (let i = 0; i < monsters.length; i++) {
      let newMonster: Monster;

      let s: Subscription = this._apiService.postEntity<Monster>("Monsters", monsters[i]).subscribe(
        d => newMonster = d,
        err => this.triggerMessage("", "Unable to create new mosnter", MessageType.Failure),
        () => {
          this.monsters.push(newMonster);

          if (i === monsters.length - 1) {
            s.unsubscribe();
            this.triggerMessage("", notif, MessageType.Success);
            this.createMonster = false;
          }
        }
      );
    }
  }

  /**
   * Called when the monster view page outputs a monster it updates it in the backend
   * 
   * @param {Monster} monster The monster to update 
   */
  updateMonster(monster: Monster) {
    let s: Subscription = this._apiService.putEntity<Monster>("Monsters", monster, monster.monsterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to update monster", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage(monster.name, "Updated", MessageType.Success);
      }
    );
  }

  /**
   * Called when the DM removes a monster
   * 
   * @param {number} index The index of the monster to remove 
   * @param {any} event The event to stop propagation
   */
  removeMonster(index: number, event: any) {
    event.stopPropagation();
    let s: Subscription;

    let monster: Monster = this.monsters[index];

    s = this._apiService.deleteEntity<Monster>("Monsters", monster.monsterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete monster", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.monsters.splice(index, 1);
        this.triggerMessage("", "Monster Removed", MessageType.Success);
      }
    );
  }

  /**
   * Called when the DM clicks save on a character, it updates them in the DB
   */
  saveCharacter(character: Character) {
    if (!character) {
      this.character = null;
      return;
    }


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
