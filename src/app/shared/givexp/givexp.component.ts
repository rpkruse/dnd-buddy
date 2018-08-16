import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { DndApiService, StorageService } from '../../services/services';

import { Monster, MonsterXP } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

interface XpItem {
  amount: number, //amount of XP to give
  times: number, //How many times
  saved: boolean
};

@Component({
  selector: 'app-givexp',
  templateUrl: './givexp.component.html',
  styleUrls: ['./givexp.component.css', '../../global-style.css', '../shared-style.css']
})


export class GivexpComponent implements OnInit {

  xpItems: XpItem[] = [];

  show: boolean = true;

  @Input() monster: Monster;
  @Output() xpOutput: EventEmitter<number> = new EventEmitter<number>();

  constructor(private _dndApiService: DndApiService, private _storageService: StorageService) { }

  ngOnInit() {
    if (this._storageService.hasValue("xpItems")) {
      this.xpItems = this._storageService.getValue("xpItems");
    }
  }

  ngOnChanges() {
    if (this.monster) {
      this.getMonsterXpWorth();
    }
  }

  /**
   * Called when the DM clicks the add new XP button. It adds a new xpItem to our list
   */
  public createNewItem(amount?: number) {
    if (amount) {
      let matching: XpItem[] = this.xpItems.filter(x => x.amount === amount);

      if (matching.length) {
        let i: number = this.xpItems.findIndex(x => x.amount === amount);

        this.xpItems[i].times++;
        this._storageService.setValue("xpItems", this.xpItems);
        return;
      }
    }

    let x: XpItem = {
      amount: amount,
      times: 1,
      saved: false
    };

    this.xpItems.push(x);
    this._storageService.setValue("xpItems", this.xpItems);
  }

  /**
   * Called when the DM clicks "-" || "+" to add the multi. amount for an xp item
   * 
   * @param {number} dir The amount to move [-1, 1]
   * @param {number} index The index of the item to change 
   */
  public changeTimes(dir: number, index: number) {
    this.xpItems[index].times += dir;

    if (this.xpItems[index].times <= 0) {
      this.xpItems.splice(index, 1);
    }

    this._storageService.setValue("xpItems", this.xpItems);
  }

  public setXpAmount(index: number, valS: string) {
    let val: number = parseInt(valS);

    if (isNaN(val)) val = 1;

    this.xpItems[index].amount = val;

    this.xpItems[index].saved = false;
  }

  public saveXp(index: number) {
    this.xpItems[index].saved = true;
    this._storageService.setValue("xpItems", this.xpItems);
  }

  /**
   * Called when the DM clicks the give xp button. It adds it all together
   * and outputs the total value to parent component
   */
  public giveXp() {
    let total: number = 0;

    let item: XpItem;
    for (let i = 0; i < this.xpItems.length; i++) {
      item = this.xpItems[i];

      if (!item.amount) continue;

      total += (item.amount * item.times);
    }

    this.xpOutput.emit(total);

    this.xpItems = [];
    this._storageService.removeValue("xpItems");
  }

  private getMonsterXpWorth() {
    let index: number = Math.ceil(this.monster.cr);

    let monsterxp: MonsterXP;

    let s: Subscription = this._dndApiService.getSingleEntityEndpoint<MonsterXP>("monster-xp/" + index).subscribe(
      d => monsterxp = d,
      err => console.log("Unable to get monster xp", err),
      () => {
        s.unsubscribe();
        let worth: number = monsterxp.xp * this.monster.cr;
        this.createNewItem(worth);
      }
    )
  }
}
