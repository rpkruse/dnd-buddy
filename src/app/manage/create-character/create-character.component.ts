/*
  TODO: Rewrite this
*/

import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

import { ApiService, DndApiService, DataShareService } from '../../services/services';

import { Class, ClassDetails, Race, RaceDetails, SubRace, Game, Character, User, MessageType, MessageOutput, XP, Trait } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

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

  selectedClass: ClassDetails = null;
  selectedRace: RaceDetails = null;
  selectedSubRace: SubRace = null;
  selectedGame: Game = null;

  level: number = 1;

  hp_rolls: number[] = [];
  hpRollCount: number[] = [];

  character: Character;
  trait: Trait;

  games: Game[] = [];

  private numOfDice: number = 6;
  private numOfDiceToKeep: number = 3;

  /**
   * Count for the rolls (rolls[n] >= 2 --> cannot roll again)
   */
  rolls: number[] = [0, 0, 0, 0, 0, 0];

  /**
   * The actual value rolled [6, 18]
   */
  keptRolls: number[] = [0, 0, 0, 0, 0, 0];
  stats: string[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  boxIndex: number = -1;

  public title: string = "Select Race"
  public buttonText: string = "Next";
  public currentPage: number = 1;
  public maxPage: number = 5;

  choiceAmount: number = -1;
  profChoices: string[] = [];

  languageListActive: boolean = false;
  traitsListActive: boolean = false;
  proficiencyChoiceListActive: boolean = false;
  proficiencyListActive: boolean = false;
  savingThrowsListActive: boolean = false;
  subclassesListActive: boolean = false;

  statsSet: boolean = false;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _router: Router, private _modalService: NgbModal) { }

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
      max_HP: 0,
      hp: 0,
      profs: "",
      level: 1,
      armor: null,
      weapon: null,
      shield: null,
      neck: null,
      ring_1: null,
      ring_2: null,
      xp: 0,
      userId: this.user.userId || null,
      gameId: null,
      user: this.user,
      game: null
    }
  }

  /**
   * Called when the user selects a race type to get its subraces
   * 
   * @param {string} raceUrl The URL of the race to get details on 
   */
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

  /**
   * Called when the user selects a subrace, it pulls its details
   * 
   * @param {string} subraceUrl The URL of the subrace to get details on 
   */
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

  /**
   * Called when the user selects a class, it pulls it details
   * 
   * @param {string} classUrl The URL of the class to get details from 
   */
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
      () => { 
        s.unsubscribe();
        this.choiceAmount = this.selectedClass.proficiency_choices[0].choose;
        this.character.profs = "";
        this.profChoices = [];
      }
    );
  }

  /**
   * Called when the user selects a game to join
   * 
   * @param {number} index The index of the game to join 
   */
  public selectGame(index: number) {
    if (this.games[index] === undefined) return;
    this.selectedGame = this.games[index];
  }

  /**
   * Called when the user clicks create on their character. It adds the race mods. to their ability score rolls
   * and adds them to the backend/game they selected
   */
  public confirmCharacter() {
    this.character.userId = this.user.userId;
    this.character.user = this.user;
    this.character.gameId = this.selectedGame.gameId;
    this.character.game = this.selectedGame;
    this.character.level = this.level;

    for(let i=0; i<this.level; i++) {
      this.character.hp += (this.hp_rolls[i] + this.getAttrScoreValue(this.character.abil_Score_Con));
    }

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
      max_HP: this.character.hp,
      hp: this.character.hp,
      profs: this.character.profs, //make this getProfs()
      level: this.level,
      xp: 0,
      userId: this.character.user.userId,
      gameId: this.character.gameId,
    }
    let xp: XP;
    let s: Subscription = this._dndApiService.getSingleEntity<XP>(environment.dnd_api + "xp/" + c.level).subscribe(
      d => xp = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        c.xp = xp.xp;
        this.saveCharacter(c);
      }
    );
  }

  private saveCharacter(c) {
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

  /**
   * Called when we are creating a character, it adds the race's mods. to the ability score
   * 
   * @param {number} index The stat index to add a value to 
   */
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

  public selectProf(val: string) {
    this.choiceAmount--;
    this.profChoices.push(val);

    // this.character.profs = this.profChoices.toString();

    //probably bad to do this every time
    this.character.profs = "";
    let profs: string[] = [];

    for(let i=0; i<this.profChoices.length; i++) {
      let s: string[] = this.profChoices[i].split("Skill: ");
      profs.push(s[1]);
    }

    this.character.profs = profs.toString();
  }

  public unselectProf(val: string) {
    let i = this.profChoices.indexOf(val);
    this.profChoices.splice(i, 1);
    this.choiceAmount++;
  }

  public isSelected(val: string): boolean {
    return this.profChoices.some(x => x === val);
  }

  public getStatString(index: number): string {

    if (this.selectedSubRace) {
      let v: number = this.selectedSubRace.ability_bonuses[index];
      if (v < 0) return this.selectedSubRace.ability_bonuses[index].toString();

      return "+" + this.selectedSubRace.ability_bonuses[index];
    }

    return "+0";
  }

  /**
   * Called when the user clicks on a trait to view. It pulls the trait from the 5e api and opens the modal to display
   * 
   * @param {string} url The url of the trait to pull
   * @param {any} content The modal 
   */
  public getTraitDetails(url: string, content) {
    let s: Subscription = this._dndApiService.getSingleEntity<Trait>(url).subscribe(
      d => this.trait = d,
      err => console.log("unable to load trait", err),
      () => {
        s.unsubscribe();
        this._modalService.open(content, { size: 'lg' });
      }
    );
  }

  /**
   * Appends words to each ability to make it look nicer on the DOM
   * 
   * @param {number[]} abilities The ability numbers to fix 
   */
  public fixAbilityBonuses(abilities: number[]): string[] { //str, dex, con, int, wis, char
    let s: string[] = [];

    for(let i=0; i < this.stats.length; i++) {
      if (abilities[i] > 0 || abilities[i] < 0) {
        s.push(this.stats[i] + ": " + abilities[i]);
      }
    }
    return s;
  }

  /**
   * Called when the user rolls on a stat
   * 
   * @param {number} index The index we rolled on 
   */
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

  public rollHP(index: number) {
    this.hpRollCount[index]++;

    let max: number = this.selectedClass.hit_die;
    let min: number = 1;

    let r: number = Math.floor(min + Math.random() * (max + 1 - min));

    this.hp_rolls[index] = r;
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

  public finishedRolling() : boolean {
    return !this.rolls.some(x => x < 2);
  }

  public canSubmitCharacter(): boolean {
    return this.character.name.length > 0 && this.character.class.length > 0 && this.character.race.length > 0
      && this.selectedGame !== null && this.level !== null && this.selectedRace !== null && this.selectedSubRace !== null && this.finishedRolling();
  }

   /**
   * Called when the user clicks next or back. It moves them to the new page
   * and resets values based on the movement
   * 
   * @param {number} dir The direction to move [-1, 1] 
   */
  public changePage(dir: number) {
    this.currentPage += dir;

    switch(this.currentPage) {
      case 1:
        this.title = "Select Race";
        this.selectedSubRace = null;
        break;
      case 2:
        this.title = "Select Class";
        this.selectedClass = null;
        break;
      case 3:
        this.title = "Roll Stats";
        break;
      case 4:
        this.title = "Select Game and Level";
        this.selectedGame = null;
        this.character.name = "";
        this.buttonText = "Next";
        
        if (!this.statsSet) {
          for (let i = 0; i < this.stats.length; i++) {
            this.setAttr(i);
          }
          this.statsSet = true;
        }
        break;
      case 5:
        this.hp_rolls = [];
        this.hpRollCount = [];

        for(let i=0; i<this.level; i++) {
          this.hp_rolls.push(0);
          this.hpRollCount.push(0);
        }

        this.hp_rolls[0] = this.selectedClass.hit_die;
        this.hpRollCount[0] = 2;
        this.buttonText = "Finalize Character";
        break;
      case 6:
        this.title = "Creating Character..."
        this.confirmCharacter();
        break;
      default:
        break;
    }
  }

  /**
   * 1 -> Race
   * 2 -> Class
   * 3 -> Stats
   * 4 -> Game, Name, Level
   * 5 -> Health
   */
  public canMoveOn(): boolean {
    switch (this.currentPage) {
      case 1:
        return this.selectedSubRace !== null;
      case 2:
        return this.selectedClass !== null && this.choiceAmount <= 0;
      case 3:
        return !this.rolls.some(x => x < 2);
      case 4:
        return this.selectedGame !== null && this.character.name.length > 0;
      case 5:
        return !this.hpRollCount.some(x => x < 2);
      default:
        return false;
    }
  }

  public canMoveBack(): boolean {
    return this.currentPage > 1;
  }

  public getAttrScoreString(attr: number): string {
    let v: string = "";

    let n: number = Math.floor((attr - 10) / 2);

    if (n >= 0)
      v += "(+" + n + ")";
    else
      v += "(" + n + ")";

    return v;
  }

  public getAttrScoreValue(attr: number): number {
    return Math.floor((attr - 10) / 2);
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
