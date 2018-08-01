import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { DndApiService, ItemManager } from '../../services/services';

import { Character, OnlineUser, Equipment, EquipmentCategory, EquipmentCategoryDetails, ItemType, ItemMessageData, UserMessageData } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

interface XpItem {
  amount: number, //amount of XP to give
  times: number //How many times
};

@Component({
  selector: 'app-givexp',
  templateUrl: './givexp.component.html',
  styleUrls: ['./givexp.component.css', '../../global-style.css', '../shared-style.css']
})


export class GivexpComponent implements OnInit {

  xpItems: XpItem[] = [];

  @Output() xpOutput: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

  public createNewItem() {
    let x: XpItem = {
      amount: null,
      times: 1
    };

    this.xpItems.push(x);
  }

  public changeTimes(dir: number, index: number){
    this.xpItems[index].times += dir;

    if (this.xpItems[index].times <= 0) {
      this.xpItems.splice(index, 1);
    }
  }

  public giveXp() {
    let total: number = 0;

    let item: XpItem;
    for(let i=0; i<this.xpItems.length; i++) {
      item = this.xpItems[i];

      if (!item.amount) continue;

      total += (item.amount * item.times);
    }
    
    this.xpOutput.emit(total);

    this.xpItems = [];
  }

}
