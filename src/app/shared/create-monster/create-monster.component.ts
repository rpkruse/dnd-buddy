import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DndApiService } from '../../services/services';

import { Game, Monster, ApiMonster } from '../../interfaces/interfaces';
import { Results } from '../../interfaces/api/results';

import { Subscription } from 'rxjs';

export interface Ability {
  atk_bonus: number,
  desc: string,
  name: string
}

export interface Action {
  attack_bonus?: number
  damage_bonus?: number,
  damage_dice?: string, //nDn
  desc: string,
  name: string //Weapon name
}

@Component({
  selector: 'app-create-monster',
  templateUrl: './create-monster.component.html',
  styleUrls: ['./create-monster.component.css', '../../global-style.css']
})
export class CreateMonsterComponent implements OnInit {

  @Input() game: Game;
  @Input() creatingMonster: boolean;
  @Input() monster: Monster;

  @Output() outputMonster: EventEmitter<any[]> = new EventEmitter<any[]>();
  @Output() updateMonster: EventEmitter<Monster> = new EventEmitter<Monster>();

  monsterInfo: ApiMonster;

  //Creating monster field:
  listOfMonsters: Results[] = [];
  searchString: string = "";
  matchingMonsters: Results[] = [];

  //Modal Fields:
  selectedAbility: Ability;
  selectedAction: Action;

  show: boolean = true;

  amountToAdd: number = 1;

  constructor(private _dndApiService: DndApiService, private _modalService: NgbModal) { }

  ngOnInit() { }

  ngOnChanges() {
    if (!this.creatingMonster && this.monster) {
      this.getMonsterApiInfo(this.monster.url);
    } else if (this.creatingMonster) {
      if (this.listOfMonsters.length <= 0) this.getListOfMonsters();
    } else {
      this.monster = null;
      this.monsterInfo = null;
    }
  }

  selectAction(index: number, content: any) {
    this.selectedAbility = null;

    let a: Action = {
      attack_bonus: this.monsterInfo.actions[index].attack_bonus,
      damage_bonus: this.monsterInfo.actions[index].damage_bonus,
      damage_dice: this.monsterInfo.actions[index].damage_dice,
      desc: this.monsterInfo.actions[index].desc,
      name: this.monsterInfo.actions[index].name
    };

    this.selectedAction = a;

    this._modalService.open(content);
  }

  selectAbility(index: number, content: any) {
    this.selectedAction = null;

    let a: Ability = {
      name: this.monsterInfo.special_abilities[index].name,
      atk_bonus: this.monsterInfo.special_abilities[index].attack_bonus,
      desc: this.monsterInfo.special_abilities[index].desc
    };

    this.selectedAbility = a;

    this._modalService.open(content);
  }

  search(val: string) {
    if (val.length <= 0) {
      this.matchingMonsters = this.listOfMonsters;
      return;
    }

    this.matchingMonsters = this.listOfMonsters.filter(e => e.name.toLowerCase().includes(val.toLowerCase()));
  }

  addAmount(val: number) {
    this.amountToAdd += val;

    if (this.amountToAdd <= 0) this.amountToAdd = 1;
  }

  addHP(val: number, addToTotal: boolean) {
    if (addToTotal) {
      this.monster.max_HP += val;
      if (this.monster.max_HP <= 0) this.monster.max_HP = 1;
      if (this.monster.max_HP < this.monster.hp) this.monster.hp = this.monster.max_HP;
    }else{
      this.monster.hp += val;
      if (this.monster.hp <= 0) this.monster.hp = 1;

      if (this.monster.hp > this.monster.max_HP) this.monster.max_HP = this.monster.hp;
    }
  }

  addMonster() {
    let monsters: any[] = [];

    for (let j = 0; j < this.amountToAdd; j++) {

      let hd: string[] = this.monsterInfo.hit_dice.split('d');

      let n: number = parseInt(hd[0]);
      let max: number = parseInt(hd[1]);

      let totalHP: number = this.monsterInfo.hit_points;
      for (let i = 0; i < n; i++) {
        totalHP += this.getRandomInt(1, max);
      }

      let monster = {
        gameId: this.game.gameId,
        name: this.monsterInfo.name,
        max_HP: totalHP,
        hp: totalHP,
        url: this.monsterInfo.url
      };

      monsters.push(monster);
    }

    this.outputMonster.emit(monsters);
  }

  sendUpdate() {
    this.updateMonster.emit(this.monster);
  }

  hasSaves(): boolean {
    if (this.monsterInfo.strength_save || this.monsterInfo.dexterity_save ||
      this.monsterInfo.constitution_save || this.monsterInfo.intelligence_save ||
      this.monsterInfo.wisdom_save || this.monsterInfo.charisma_save) return true;

    return false;
  }

  private getMonsterApiInfo(url: string) {
    let s: Subscription = this._dndApiService.getSingleEntity<ApiMonster>(url).subscribe(
      d => this.monsterInfo = d,
      err => console.log(err),
      () => s.unsubscribe()
    );
  }

  private getListOfMonsters() {
    let s: Subscription = this._dndApiService.getAllEntities<any>("monsters").subscribe(
      d => this.listOfMonsters = d.results,
      err => console.log(err),
      () => { s.unsubscribe(); this.matchingMonsters = this.listOfMonsters; }
    );
  }

  /**
  * Gets a random number between two values
  * 
  * @param {number} min The min value 
  * @param {number} max The max value
  * 
  * @returns A number between min and max, both inclusive
  */
  private getRandomInt(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

}
