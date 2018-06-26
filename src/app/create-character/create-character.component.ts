import { Component, OnInit } from '@angular/core';

import { ApiService, DndApiService, DataShareService } from '../services/services';

import { Class, ClassDetails, Race, RaceDetails, Game, Character, User } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-character',
  templateUrl: './create-character.component.html',
  styleUrls: ['./create-character.component.css', '../global-style.css']
})
export class CreateCharacterComponent implements OnInit {
  private user: User;

  classes: Class = null;
  races: Race = null;

  selectedClass: ClassDetails;
  selectedRace: RaceDetails;
  selectedGame: Game;

  level: number = 1;

  character: Character;

  games: Game[] = [];

  private numOfDice: number = 6;
  private numOfDiceToKeep: number = 3;

  rolls: number[] = [0, 0, 0, 0, 0, 0];

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService) { }

  ngOnInit() {
    let s, j, k: Subscription;

    this._dataShareService.user.subscribe(res => this.user = res);

    s = this._dndApiService.getAllEntities<Class>("classes").subscribe(
      d => this.classes = d,
      err => console.log("unable to get classes"),
      () => s.unsubscribe()
    );

    j = this._dndApiService.getAllEntities<Race>("races").subscribe(
      d => this.races = d,
      err => console.log("Unable to get races"),
      () => j.unsubscribe()
    );

    k = this._apiService.getAllEntities<Game>("Games").subscribe(
      d => this.games = d,
      err => console.log("Unable to find games"),
      () => k.unsubscribe()
    );

    this.character = {
      characterId: null,
      name: "",
      class: "",
      race: "",
      abil_score_str: 0,
      abil_score_dex: 0,
      abil_score_con: 0,
      abil_score_int: 0,
      abil_score_wis: 0,
      abil_score_cha: 0,
      level: 1,
      userId: this.user.userId || null,
      gameId: null,
      user: this.user,
      game: null
    }
  }

  public selectRace(raceUrl: string) {
    if(raceUrl === "Choose") return;

    this.character.race = raceUrl;

    let s: Subscription;
    s = this._dndApiService.getSingleEntity<RaceDetails>(raceUrl).subscribe(
      d => this.selectedRace = d,
      err => console.log("Unable to get details for selected race"),
      () => s.unsubscribe()
    );
  }

  public selectClass(classUrl: string) { //FL[(num-10)/2]
    if(classUrl === "Choose") return;
    this.character.class = classUrl;
    let s: Subscription;
    s = this._dndApiService.getSingleEntity<ClassDetails>(classUrl).subscribe(
      d => this.selectedClass = d,
      err => console.log("Unable to get details for selected race"),
      () => s.unsubscribe()
    );
  }

  public selectGame(index: number){
    if(this.games[index] === undefined) return;
    this.selectedGame = this.games[index];
  }

  public confirmCharacter(){
    for(let i=0; i<6; i++){
      this.setAttr(i);
    }

    this.character.userId = this.user.userId;
    this.character.user = this.user;
    this.character.gameId = this.selectedGame.gameId;
    this.character.game = this.selectedGame;
    this.character.level = this.level;

    let c = {
      name: this.character.name,
      class: this.character.class,
      race: this.character.race,
      abil_score_str: this.character.abil_score_str,
      abil_score_dex: this.character.abil_score_dex,
      abil_score_con: this.character.abil_score_con,
      abil_score_int: this.character.abil_score_int,
      abil_score_wis: this.character.abil_score_wis,
      abil_score_cha: this.character.abil_score_cha,
      level: this.level,
      userId: this.character.user.userId,
      gameId: this.character.gameId,
    }

    let s: Subscription;
    let returnedChar: Character;
    s = this._apiService.postEntity<Character>("Characters", c).subscribe(
      d => returnedChar = d,
      err => console.log(err),
      () => {s.unsubscribe(); console.log(returnedChar);}
    );
  }

  private setAttr(index: number){
    let val: number = parseInt(this.selectedRace.ability_bonuses[index]);
    switch (index) {
      case 0:
        this.character.abil_score_str += val;
        break;
      case 1:
        this.character.abil_score_dex += val;
        break;
      case 2:
        this.character.abil_score_con += val;
        break;
      case 3:
        this.character.abil_score_int += val;
        break;
      case 4:
        this.character.abil_score_wis += val;
        break;
      case 5:
        this.character.abil_score_cha += val;
        break;
    }
  }

  public getStatString(index: number): string {
    let raceBonusAttr: string = " +";
    if(this.selectedRace){
      raceBonusAttr += this.selectedRace.ability_bonuses[index];
    }else{
      raceBonusAttr = " select race to see bonus";
    }
    
    switch (index) {
      case 0:
        return "STR: " + this.character.abil_score_str + raceBonusAttr;
      case 1:
        return "DEX: " + this.character.abil_score_dex + raceBonusAttr;
      case 2:
        return "CON: " + this.character.abil_score_con + raceBonusAttr;
      case 3:
        return "INT: " + this.character.abil_score_int + raceBonusAttr;
      case 4:
        return "WIS: " + this.character.abil_score_wis + raceBonusAttr;
      case 5:
        return "CHA: " + this.character.abil_score_cha + raceBonusAttr;
    }
  }

  public getRollString(index: number): string{
    let s: string = this.rolls[index] > 0 ? "Re-roll" : "Roll";

    return s;
  }

  public setStatString(index: number, val: number) {
    switch (index) {
      case 0:
        this.character.abil_score_str = val;
        break;
      case 1:
        this.character.abil_score_dex = val;
        break;
      case 2:
        this.character.abil_score_con = val;
        break;
      case 3:
        this.character.abil_score_int = val;
        break;
      case 4:
        this.character.abil_score_wis = val;
        break;
      case 5:
        this.character.abil_score_cha = val;
        break;
    }
  }
  
  public rollStat(index: number) {
    this.rolls[index]++;


    let max: number = 6 * this.numOfDice; //keep top three dice
    let min: number = 1 * this.numOfDice; //The lowest we can possibly get

    let localRolls: number[] = [];
    let r: number;
    let score: number = 0;

    //Roll each die
    for(let i = 0; i<this.numOfDice; i++){
      r = Math.floor(Math.random() * 6) + 1;
      localRolls.push(r);
    }

    //Get the top n highest and add it to our score
    for(let i=0; i<this.numOfDiceToKeep; i++){
      let highest: number = Math.max(...localRolls);
      localRolls.splice(localRolls.indexOf(highest), 1);
      score += highest;
    }

    //Save the score
    this.setStatString(index, score);
  }

  public keepRoll(index: number){
    this.rolls[index] = 2;
  }

  public canRollAgain(index: number): boolean {
    return this.rolls[index] < 2;
  }

  public canSubmitCharacter(): boolean{
    for(let i=0; i<6; i++){
      if(this.canRollAgain(i)) return false;
    }

    return this.character.name.length > 0 && this.character.class.length > 0 && this.character.race.length > 0 
          && this.selectedGame !== null && this.level !== null;
  }
}
