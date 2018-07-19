/*
  Note: This code is very temp, and will be cleaned up ASAP
*/

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, DndApiService, DataShareService } from '../../services/services';

import { Class, ClassDetails, Race, RaceDetails, SubRace, Game, Character, User, MessageType, MessageOutput } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-character',
  templateUrl: './create-character.component.html',
  styleUrls: ['./create-character.component.css', './create-character.component.scss', '../../global-style.css']
})
export class CreateCharacterComponent implements OnInit {
  MessageType = MessageType;
  private user: User;

  classes: Class = null;
  races: Race = null;

  selectedClass: ClassDetails;
  selectedRace: RaceDetails;
  selectedSubRace: SubRace;
  selectedGame: Game;

  level: number = 1;

  character: Character;

  games: Game[] = [];

  private numOfDice: number = 6;
  private numOfDiceToKeep: number = 3;

  rolls: number[] = [0, 0, 0, 0, 0, 0]; //Count for the rolls (>=2 cannot roll again)
  keptRolls: number[] = [0, 0, 0, 0, 0, 0]; //The actual roll values
  stats: string[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  boxIndex: number = -1;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _router: Router) { }

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

    k = this._apiService.getAllEntities<Game>("Games/open/" + this.user.userId).subscribe(
      d => this.games = d,
      err => console.log("Unable to find games"),
      () => k.unsubscribe()
    );

    this.character = {
      characterId: null,
      name: "",
      class: "",
      race: "",
      abil_Score_Str: 0,
      abil_Score_Dex: 0,
      abil_Score_Con: 0,
      abil_Score_Int: 0,
      abil_Score_Wis: 0,
      abil_Score_Cha: 0,
      level: 1,
      armor: null,
      weapon: null,
      shield: null,
      neck: null,
      ring_1: null,
      ring_2: null,
      userId: this.user.userId || null,
      gameId: null,
      user: this.user,
      game: null
    }
  }

  public selectRace(raceUrl: string) {
    if (raceUrl === "Choose") {
      this.selectedRace = null;
      return null;
    }

    let s: Subscription;
    s = this._dndApiService.getSingleEntity<RaceDetails>(raceUrl).subscribe(
      d => this.selectedRace = d,
      err => console.log("Unable to get details for selected race"),
      () => s.unsubscribe()
    );
  }

  public selectSubRace(subraceUrl: string) {
    if (subraceUrl === "Choose") {
      this.selectedSubRace = null;
      return;
    }

    this.character.race = subraceUrl;

    let s: Subscription;
    s = this._dndApiService.getSingleEntity<SubRace>(subraceUrl).subscribe(
      d => this.selectedSubRace = d,
      err => console.log("Unable to get details for selected subrace"),
      () => s.unsubscribe()
    );
  }

  public selectClass(classUrl: string) {
    if (classUrl === "Choose") {
      this.selectedClass = null;
      this.character.class = '';
      return;
    }
    this.character.class = classUrl;
    let s: Subscription;
    s = this._dndApiService.getSingleEntity<ClassDetails>(classUrl).subscribe(
      d => this.selectedClass = d,
      err => console.log("Unable to get details for selected race"),
      () => s.unsubscribe()
    );
  }

  public selectGame(index: number) {
    if (this.games[index] === undefined) return;
    this.selectedGame = this.games[index];
  }

  public confirmCharacter() {
    for (let i = 0; i < this.stats.length; i++) {
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
      abil_Score_Str: this.character.abil_Score_Str,
      abil_Score_Dex: this.character.abil_Score_Dex,
      abil_Score_Con: this.character.abil_Score_Con,
      abil_Score_Int: this.character.abil_Score_Int,
      abil_Score_Wis: this.character.abil_Score_Wis,
      abil_Score_Cha: this.character.abil_Score_Cha,
      level: this.level,
      userId: this.character.user.userId,
      gameId: this.character.gameId,
    }

    let s: Subscription;
    let returnedChar: Character;
    s = this._apiService.postEntity<Character>("Characters", c).subscribe(
      d => returnedChar = d,
      err => this.triggerMessage("", "Unable to create character", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Character Created!", MessageType.Success);
        this._router.navigate(['./game']);
      }
    );
  }

  private setAttr(index: number) {
    let val: number = this.keptRolls[index];
    let bonus: number = this.selectedSubRace.ability_bonuses[index];

    switch (index) {
      case 0:
        this.character.abil_Score_Str = val + bonus;
        break;
      case 1:
        this.character.abil_Score_Dex = val + bonus;
        break;
      case 2:
        this.character.abil_Score_Con = val + bonus;
        break;
      case 3:
        this.character.abil_Score_Int = val + bonus;
        break;
      case 4:
        this.character.abil_Score_Wis = val + bonus;
        break;
      case 5:
        this.character.abil_Score_Cha = val + bonus;
        break;
    }
  }

  public getStatString(index: number): string {

    if (this.selectedSubRace) {
      let v: number = this.selectedSubRace.ability_bonuses[index];
      if (v < 0) return this.selectedSubRace.ability_bonuses[index].toString();

      return "+" + this.selectedSubRace.ability_bonuses[index];
    }

    return "+0";
  }

  public getRollString(index: number): string {
    let s: string = this.rolls[index] > 0 ? "Re-roll" : "Roll";

    return s;
  }

  public rollStat(index: number) {
    this.rolls[index]++;


    let max: number = 6 * this.numOfDice; //keep top three dice
    let min: number = 1 * this.numOfDice; //The lowest we can possibly get

    let localRolls: number[] = [];
    let r: number;
    let score: number = 0;

    //Roll each die
    for (let i = 0; i < this.numOfDice; i++) {
      r = Math.floor(Math.random() * 6) + 1;
      localRolls.push(r);
    }

    //Get the top n highest and add it to our score
    for (let i = 0; i < this.numOfDiceToKeep; i++) {
      let highest: number = Math.max(...localRolls);
      localRolls.splice(localRolls.indexOf(highest), 1);
      score += highest;
    }

    //Save the score
    this.keptRolls[index] = score;
  }

  public clickBox(index: number) {
    if (this.boxIndex === index) {
      this.boxIndex = -1;
      return;
    }

    if (this.boxIndex > -1) {
      let f: number = this.keptRolls[this.boxIndex];
      this.keptRolls[this.boxIndex] = this.keptRolls[index];
      this.keptRolls[index] = f;

      this.boxIndex = -1;
      return;
    }

    this.boxIndex = index;
  }

  public keepRoll(index: number) {
    this.rolls[index] = 2;
  }

  public canRollAgain(index: number): boolean {
    return this.rolls[index] < 2;
  }

  public finishedRolling() : boolean {
    for (let i = 0; i < this.stats.length; i++) {
      if (this.canRollAgain(i)) return false;
    }

    return true;
  }

  public canSubmitCharacter(): boolean {
    return this.character.name.length > 0 && this.character.class.length > 0 && this.character.race.length > 0
      && this.selectedGame !== null && this.level !== null && this.selectedRace !== null && this.selectedSubRace !== null && this.finishedRolling();
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
