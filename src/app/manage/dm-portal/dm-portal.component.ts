import { Component, OnInit } from '@angular/core';

import { ApiService, DndApiService, DataShareService, ItemManager } from '../../services/services';

import {
  User, Character, Item, Game, RaceDetails, ClassDetails,
  Equipment, EquipmentCategory, EquipmentCategoryDetails, MessageOutput, MessageType, ItemType
} from '../../interfaces/interfaces';

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

  character: Character;
  race: Observable<RaceDetails>;
  class: Observable<ClassDetails>;

  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  item: Equipment;

  slottedItem: boolean = false;

  stats: string[] = ["STR: ", "DEX: ", "CON: ", "INT: ", "WIS: ", "CHA: "]

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _itemManager: ItemManager) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);

    this.games = this._apiService.getAllEntities<Game>("Games/gm/" + this.user.userId);
  }

  loadGame(game: Game) {
    this.character = null;

    let s: Subscription = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.game = d,
      err => console.log("unable to load game"),
      () => s.unsubscribe()
    );
  }

  selectCharacter(character: Character) {
    this.character = character;
    this.race = this._dndApiService.getSingleEntity<RaceDetails>(this.character.race);
    this.class = this._dndApiService.getSingleEntity<ClassDetails>(this.character.class);

    let s: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentTypes = d,
      err => console.log("unable to get equipment types"),
      () => s.unsubscribe()
    )
  }

  saveCharacter() {
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

  getStatValue(index: number): number {
    switch (index) {
      case 0:
        return this.character.abil_Score_Str;
      case 1:
        return this.character.abil_Score_Dex;
      case 2:
        return this.character.abil_Score_Con;
      case 3:
        return this.character.abil_Score_Int;
      case 4:
        return this.character.abil_Score_Wis;
      case 5:
        return this.character.abil_Score_Cha;
      default:
        return -1;
    }
  }

  setStatValue(val: number, index: number) {
    switch (index) {
      case 0:
        this.character.abil_Score_Str += val;
        break;
      case 1:
        this.character.abil_Score_Dex += val;
        break;
      case 2:
        this.character.abil_Score_Con += val;
        break;
      case 3:
        this.character.abil_Score_Int += val;
        break;
      case 4:
        this.character.abil_Score_Wis += val;
        break;
      case 5:
        this.character.abil_Score_Cha += val;
        break;
      default:
        break;
    }
  }

  getModValue(attrVal: number): string {
    let v: number = Math.floor((attrVal - 10) / 2);

    if (v < 0) return "(" + v + ")";

    return "(+" + v + ")";
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
