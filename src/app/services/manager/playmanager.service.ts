/*
  Written By: Ryan Kruse
  This service is used to handle all information for the 5e api. It is called from all play components.
  It allows users and DMs to get their respective information that is needed to play
*/
import { Injectable } from '@angular/core';

import {
  ClassDetails, ClassLevels, Character, UserMessageData, RollMessageData,
  ItemMessageData, Spell, SpellDetails, Equipment, EquipmentCategory, EquipmentCategoryDetails, GridMessageData
} from '../../interfaces/interfaces';

import { ApiService } from '../api/api.service';
import { DndApiService } from '../api/dndapi.service';
import { DataShareService } from '../data/data-share.service';
import { Subject, BehaviorSubject, Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayManager {

  public classDetail: Subject<ClassDetails> = new BehaviorSubject<ClassDetails>(null); //All the info on a given class
  public levelDetail: Subject<ClassLevels> = new BehaviorSubject<ClassLevels>(null); //All the info at current class level

  public spellBook: Subject<Spell[]> = new BehaviorSubject<Spell[]>(null); //The class' spells
  public spellDetail: Subject<SpellDetails> = new BehaviorSubject<SpellDetails>(null); //The detail of a given spell

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService) { }

  /*
    This method is called when a player joins the game, it pulls all of their class details from the 5e api
    @param character: Character - The character of the user who joined the game
  */
  public initClassDetails(character: Character): void {
    let s: Subscription;

    let cd: ClassDetails;

    s = this._dndApiService.getSingleEntity<ClassDetails>(character.class).subscribe(
      d => cd = d,
      err => console.log("Unable to get class details", err),
      () => {
        s.unsubscribe();
        this.classDetail.next(cd);
        this.initClassLevelDetails(cd, character.level);
      }
    );
  }

  /*
    This method is called when a player joins the game, it pulls all of their level details from the api
    @param character: Character - The character of the user who joined the game
    @param level: number - The level of the character
  */
  public initClassLevelDetails(cd: ClassDetails, level: number) {
    let s: Subscription;

    let ld: ClassLevels;

    s = this._dndApiService.getLevelInfo(cd.name, level).subscribe(
      d => ld = d,
      err => console.log("Unable to get level details", err),
      () => {
        s.unsubscribe();
        this.levelDetail.next(ld);
      }
    );
  }
  
  /*
    This method is called when we need to get details of a given item
  */
  public getItem(url: string): Observable<Equipment> {
    return this._dndApiService.getSingleEntity<Equipment>(url);
  }

  /*
    This method is called when the user is a spell caster. It assigns the number of spells the can cast of level i at character level n
    It might be reworked in the future, but for now it works
    @param LD: ClassLevels - The ClassLevels of the current character
    @return number[] - An array holding the number of spells the character can cast at their current character level
  */
  public setSpellSlots(LD: ClassLevels): number[] { //spells/warlock/level/2
    let spellSlots: number[] = [];
    if (LD.spellcasting.spell_slots_level_1 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_1);
    if (LD.spellcasting.spell_slots_level_2 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_2);
    if (LD.spellcasting.spell_slots_level_3 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_3);
    if (LD.spellcasting.spell_slots_level_4 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_4);
    if (LD.spellcasting.spell_slots_level_5 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_5);
    if (LD.spellcasting.spell_slots_level_6 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_6);
    if (LD.spellcasting.spell_slots_level_7 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_7);
    if (LD.spellcasting.spell_slots_level_8 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_8);
    if (LD.spellcasting.spell_slots_level_9 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_9);

    return spellSlots;
  }

  /*
    Creates a new UMD object to send to the message Hub
  */
  public createUMD(name: string, charId: number, groupName: string): UserMessageData {
    let umd: UserMessageData = {
      id: "",
      name: name,
      characterId: charId,
      groupName: groupName
    };

    return umd;
  }

  /*
    Creates a new RMD object to send to the message Hub
  */
  public createRMD(charId: number, groupName: string, maxRoll: number, roll: number, numDice: number): RollMessageData {
    let rmd: RollMessageData = {
      charId: charId,
      groupName: groupName,
      maxRoll: maxRoll,
      roll: roll,
      numDice: numDice
    };

    return rmd;
  }

  /*
    Creates a new IMD object to send to the message Hub
  */
  public createIMD(id: string, groupName: string, item: string): ItemMessageData {
    let itm: ItemMessageData = {
      connectionId: id,
      groupName: groupName,
      item: item
    };

    return itm;
  }

  /*
    Creates a new GMD object to send to the message Hub
  */
  public createGMD(x: number, y: number, type: string, name: string, groupName: string): GridMessageData {
    let gmd: GridMessageData = {
      x: x,
      y: y,
      type: type,
      name: name,
      groupName: groupName
    };

    return gmd;
  }


  public clearAllValues(): void {
    this.classDetail.next(null);
    this.levelDetail.next(null);
  }
}
