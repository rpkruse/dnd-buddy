import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { DndApiService } from '../../services/services';
import {
  User, Character, Item, Game, RaceDetails, ClassDetails,
  Equipment, EquipmentCategory, EquipmentCategoryDetails, MessageOutput, MessageType, XP
} from '../../interfaces/interfaces';

import { Subscription, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-character',
  templateUrl: './edit-character.component.html',
  styleUrls: ['./edit-character.component.css', '../../global-style.css']
})
export class EditCharacterComponent implements OnInit {

  @Input() character: Character;
  @Output() updatedCharacter: EventEmitter<Character> = new EventEmitter<Character>();

  race: Observable<RaceDetails>;
  class: Observable<ClassDetails>;

  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  item: Equipment;

  slottedItem: boolean = false;

  show: boolean = true;

  stats: string[] = ["STR: ", "DEX: ", "CON: ", "INT: ", "WIS: ", "CHA: "];

  constructor(private _dndApiService: DndApiService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (!this.character) return;

    this.loadCharacterInfo();
  }

  /**
   * Called to get the ability score of the character
   * 
   * @param {number} index The index of the stat to get 
   * 
   * @returns The value of the ability score at index "index"
   */
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

  /**
   * Called when the DM increases or decreases the stat of a character
   * 
   * @param {number} val The value to increase the stat by 
   * @param {number} index The index of the stat
   */
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

  setHPValue(val: number) {
    this.character.max_HP += val;

    if (this.character.max_HP <= 0) this.character.max_HP = 1;
  }

  setLevelValue(val: number) {
    this.character.level += val;

    if (this.character.level <= 0) this.character.level = 1;

    let xp: XP;
    let k: Subscription = this._dndApiService.getSingleEntity<XP>(environment.dnd_api + "xp/" + this.character.level).subscribe(
      d => xp = d,
      err => console.log(err),
      () => {
        k.unsubscribe();
        this.character.xp = xp.xp;
      }
    );
  }

  giveXP(xp: number) {
    this.character.xp += xp;

    this.checkForLevelUp();
  }

  private checkForLevelUp() {
    let s: Subscription;
    let nextLevel: number = this.character.level + 1;
    let xp: XP;
    s = this._dndApiService.getSingleEntity<XP>(environment.dnd_api + "XP/" + nextLevel).subscribe(
      d => xp = d,
      err => console.log("unable to get xp for next level"),
      () => {
        s.unsubscribe();

        if (xp.xp <= this.character.xp) this.character.level++;
      }
    )
  }
  /**
   * Returns the ability modifier value for a given stat: FL((val - 10)/2)
   * 
   * @param {number} attrVal The value of the attribute
   * 
   * @returns The ability mod. value 
   */
  getModValue(attrVal: number): string {
    let v: number = Math.floor((attrVal - 10) / 2);

    if (v < 0) return "(" + v + ")";

    return "(+" + v + ")";
  }

  updateCharacter(clear?: boolean) {
    if (clear) this.character = null;
    this.updatedCharacter.emit(this.character);
  }

  private loadCharacterInfo() {
    this.race = this._dndApiService.getSingleEntity<RaceDetails>(this.character.race);
    this.class = this._dndApiService.getSingleEntity<ClassDetails>(this.character.class);

    let s: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentTypes = d,
      err => console.log("unable to get equipment types"),
      () => s.unsubscribe()
    );
  }

}
