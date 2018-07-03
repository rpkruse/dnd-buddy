/*
  Written By: Ryan Kruse
  This service is used to handle all information for the 5e api. It is called from all play components.
  It allows users and DMs to get their respective information that is needed to play
*/
import { Injectable } from '@angular/core';

import {
  ClassDetails, ClassLevels, Character, UserMessageData, RollMessageData,
  ItemMessageData, Spell, SpellDetails, Equipment, EquipmentCategory, EquipmentCategoryDetails
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

  public equipmentCategories: Subject<EquipmentCategory> = new BehaviorSubject<EquipmentCategory>(null); //The types of items you can give (Armor, Weapon, Mount, etc)

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService) { }

  /*
    This method is called when the GM joins the game, it pulls all of the item types they can give
    from the 5e api
  */
  public initGMInfo() {
    let j: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentCategories.next(d),
      err => console.log(err),
      () => j.unsubscribe()
    )
  }

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
    This method is called by the GM it returns the list of items you can get from a category of items (IE armor, weapons)
    @return Observable<EquipmentCategoryDetails>
  */
  public getItemList(url: string): Observable<EquipmentCategoryDetails> {
    return this._dndApiService.getSingleEntity<EquipmentCategoryDetails>(url);
  }

  /*
    This method is called when we need to get details of a given item
  */
  public getItem(url: string): Observable<Equipment> {
    return this._dndApiService.getSingleEntity<Equipment>(url);
  }

  /*
    This method is called iff the character who joined can cast spells. It pulls the class spells from the api
    and emits the spells returned (up to their current level)
    @param cd: ClassDetails - The ClassDetails of the joined character
    @param level: number - The level of the character
    *Note: right now we simply return all spells (level 0-9) this will change later
  */
  public initSpellBook(cd: ClassDetails, level: number) {
    let spells: Spell[] = [];

    let s: Subscription;

    let spell: Spell;

    for (let i = 0; i <= level; i++) {
      s = this._dndApiService.getAllEntities<Spell>("spells/" + cd.name + "/level/" + i).subscribe(
        d => spell = d,
        err => console.log("Unable to get page {0} of spell boo", i, err),
        () => {
          spells.push(spell);

          if (i === level) {
            s.unsubscribe();
            this.spellBook.next(spells);
          }
        }
      )
    }
  }

  /*
    This method is called when the user needs to get the details of a given spell. Once it is pulled, it emits the value
    @param path: string - The URL of the spell to get from the 5e api
  */
  public getSpellDetail(path: string) {
    let s: Subscription;

    let spell: SpellDetails;

    s = this._dndApiService.getSingleEntity<SpellDetails>(path).subscribe(
      d => spell = d,
      err => console.log("unable to get spell details"),
      () => {
        s.unsubscribe();
        this.spellDetail.next(spell);
      }
    );
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

  public clearAllValues(): void {
    this.classDetail.next(null);
    this.levelDetail.next(null);
  }
}
