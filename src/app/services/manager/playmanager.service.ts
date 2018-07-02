import { Injectable } from '@angular/core';

import { Class, ClassDetails, ClassLevels, Character, UserMessageData, RollMessageData, 
          ItemMessageData, Spell, SpellDetails, Equipment, EquipmentCategory, EquipmentCategoryDetails } from '../../interfaces/interfaces';

import { ApiService } from '../api/api.service';
import { DndApiService } from '../api/dndapi.service';
import { DataShareService } from '../data/data-share.service';
import { Subject, BehaviorSubject, Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayManager {

  public classDetail: Subject<ClassDetails> = new BehaviorSubject<ClassDetails>(null);
  public levelDetail: Subject<ClassLevels> = new BehaviorSubject<ClassLevels>(null);

  public spellBook: Subject<Spell[]> = new BehaviorSubject<Spell[]>(null);
  public spellDetail: Subject<SpellDetails> = new BehaviorSubject<SpellDetails>(null);

  public equipmentCategories: Subject<EquipmentCategory> = new BehaviorSubject<EquipmentCategory>(null);

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService) { }

  public initGMInfo(){
    let j: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentCategories.next(d),
      err => console.log(err),
      () => j.unsubscribe()
    )
  }
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

  public getItemList(url: string): Observable<EquipmentCategoryDetails> {
    return this._dndApiService.getSingleEntity<EquipmentCategoryDetails>(url);
  }

  public getItem(url: string): Observable<Equipment> {
    return this._dndApiService.getSingleEntity<Equipment>(url);
  }

  public initSpellBook(cd: ClassDetails, level: number){
    let spells: Spell[] = [];

    let s: Subscription;

    let spell: Spell;

    for(let i=0; i<=level; i++){
      s = this._dndApiService.getAllEntities<Spell>("spells/" + cd.name + "/level/" + i).subscribe(
        d => spell = d,
        err => console.log("Unable to get page {0} of spell boo", i, err),
        () => {
          spells.push(spell);

          if(i === level){
            s.unsubscribe();
            this.spellBook.next(spells);
          }
        }
      )  
    }
  }

  public getSpellDetail(path: string){
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

  //Maybe redo this?
  public setSpellSlots(LD: ClassLevels): number[]{ //spells/warlock/level/2
    let spellSlots: number[] = [];
    if(LD.spellcasting.spell_slots_level_1 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_1);
    if(LD.spellcasting.spell_slots_level_2 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_2);
    if(LD.spellcasting.spell_slots_level_3 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_3);
    if(LD.spellcasting.spell_slots_level_4 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_4);
    if(LD.spellcasting.spell_slots_level_5 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_5);
    if(LD.spellcasting.spell_slots_level_6 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_6);
    if(LD.spellcasting.spell_slots_level_7 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_7);
    if(LD.spellcasting.spell_slots_level_8 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_8);
    if(LD.spellcasting.spell_slots_level_9 > 0) spellSlots.push(LD.spellcasting.spell_slots_level_9);

    return spellSlots;
  }

  public createUMD(name: string, charId: number, groupName: string): UserMessageData {
    let umd: UserMessageData = {
      id: "",
      name: name,
      characterId: charId,
      groupName: groupName
    };

    return umd;
  }

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

  public createIMD(id: string, groupName: string, item: string): ItemMessageData{
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
