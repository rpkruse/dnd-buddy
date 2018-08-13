import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService, DndApiService, DataShareService } from '../../services/services';

import { Game, Monster, ApiMonster, MessageType, MessageOutput } from '../../interfaces/interfaces';

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
  selector: 'app-view-monster',
  templateUrl: './view-monster.component.html',
  styleUrls: ['./view-monster.component.css', '../../global-style.css']
})
export class ViewMonsterComponent implements OnInit {

  @Input() game: Game;

  monsters: Monster[] = [];
  monster: Monster;
  monsterInfo: ApiMonster;

  changeHealthBy: any = 1;
  selectedIndex: number = -1;

  //Modal Fields:
  selectedAbility: Ability;
  selectedAction: Action;

  //UI toggle Fields
  show: boolean = true;
  showMonsterList: boolean = true;
  simpleView: boolean = true;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _modalService: NgbModal) { }

  ngOnInit() {
    this.loadMonsters();
  }

  addHP(val: number, addToTotal: boolean) {
    if (!this.changeHealthBy) this.changeHealthBy = 1;
    
    try {
      this.changeHealthBy = parseInt(this.changeHealthBy);
    }catch {
      this.changeHealthBy = 1;
    }

    if (!Number.isInteger(this.changeHealthBy) || Number.isNaN(this.changeHealthBy)) this.changeHealthBy = 1;


    val *= this.changeHealthBy;

    if (addToTotal) {
      this.monster.max_HP += val;
      if (this.monster.max_HP < this.monster.hp) this.monster.hp = this.monster.max_HP;
    }else{
      this.monster.hp += val;
      if (this.monster.hp > this.monster.max_HP) this.monster.max_HP = this.monster.hp;
    }
  }

  selectMonster(monster: Monster, index: number) {
    this.monster = monster;
    this.selectedIndex = index;
    this.getMonsterApiInfo(this.monster.url);
  }

  removeSelectedMoster() {
    let index: number = this.monsters.findIndex(x => x.monsterId === this.monster.monsterId);

    if (index < 0) return;

    let s: Subscription = this._apiService.deleteEntity<Monster>("Monsters", this.monster.monsterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete monster", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.monsters.splice(index, 1);
        this.triggerMessage(this.monster.name, "was killed", MessageType.Success);
        this.monster = null;
        this.selectedIndex = -1;
      }
    )
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

  getStatString(val: number): string {
    let s: string = "(";

    let n: number = Math.floor((val-10)/2);

    if (n >= 0) 
      s += "+" + n + ")";
    else
      s += n + ")";

    return s;
  }

  hasSaves(): boolean {
    if (this.monsterInfo.strength_save || this.monsterInfo.dexterity_save ||
      this.monsterInfo.constitution_save || this.monsterInfo.intelligence_save ||
      this.monsterInfo.wisdom_save || this.monsterInfo.charisma_save) return true;

    return false;
  }
  
  private loadMonsters() {
    let s: Subscription = this._apiService.getAllEntities<Monster>("Monsters").subscribe(
      d => this.monsters = d,
      err => console.log(err),
      () => s.unsubscribe()
    );
  }

  private getMonsterApiInfo(url: string) {
    let s: Subscription = this._dndApiService.getSingleEntity<ApiMonster>(url).subscribe(
      d => this.monsterInfo = d,
      err => console.log(err),
      () => s.unsubscribe()
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
}
