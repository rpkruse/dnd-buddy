import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService, DndApiService } from '../../services/services';

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

  monsterInfo: ApiMonster;

  //Creating monster field:
  listOfMonsters: Results[] = [];
  searchString: string = "";
  matchingMonsters: Results[] = [];

  //Modal Fields:
  selectedAbility: Ability;
  selectedAction: Action;

  show: boolean = true;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService,  private _modalService: NgbModal) { }

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

    let a: Action =  {
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

}
