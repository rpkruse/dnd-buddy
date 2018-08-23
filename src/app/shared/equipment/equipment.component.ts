import { Component, OnInit, Input, HostListener } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DndApiService, ItemManager } from '../../services/services';

import { Character, Equipment, Item, ItemType, MessageType } from '../../interfaces/interfaces';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { Subscription, Subject } from 'rxjs';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  styleUrls: ['./equipment.component.css', '../../global-style.css', '../shared-style.css'],
  animations: [
    trigger(
      'showState', [
        state('show', style({
          opacity: 1,
          visibility: 'visible'
        })),
        state('hide', style({
          opacity: 0,
          visibility: 'hidden'
        })),
        transition('show => *', animate('400ms')),
        transition('hide => show', animate('400ms')),
      ])
  ]
})
export class EquipmentComponent implements OnInit {
  @Input() character: Character;
  // @Input() newItem: ItemType;

  @Input() dmPortal: boolean = false; //If true, then we can add items with a "+" button

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;

    this.onMobile = this.width <= 400;
  }

  onMobile: boolean = false;
  private width: number;
  
  private isAlive: boolean = true;

  items: Item[] = [];

  armor: Equipment = null;
  shield: Equipment = null;
  weapon: Equipment = null;
  ring_1: Equipment = null;
  ring_2: Equipment = null;

  selectedRing: Equipment;
  slotSwapIndex: number = 0;

  money: number[] = []; //GP, SP, CP

  lastCharID: number = -1;

  bagVisible: boolean = false;

  mouseOver: number = -1;

  show: boolean = true;

  moneyChanged: Subject<number[]> = new Subject<number[]>();
  saveMoney: Subject<number> = new Subject<number>();

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
    this.loadAllItems();

    this._itemManager.itemSubj.takeWhile(() => this.isAlive).subscribe(res => this.items = res);
    this._itemManager.newItem.takeWhile(() => this.isAlive).subscribe(res => this.getItems(res));

    let j: Subscription = this.moneyChanged.pipe(debounceTime(250)).subscribe(res => this.updateMoney(res));
    let k: Subscription = this.saveMoney.pipe(debounceTime(2000)).subscribe(res => this.saveMoneyToDB(res));
  }

  ngOnChanges() {
    if (!this.character) return;

    if (this.character.characterId != this.lastCharID) {
      this.lastCharID = this.character.characterId;
      this.resetValues();
      this.loadAllItems();
      this.setMoneyArray();
    }
  }

  private setMoneyArray() {
    let money: number[] = [0, 0, 0]; //GP, SP, CP (500, 55, 50)
    let left: number = 0;

    //Get Gold:
    money[0] = Math.floor(this.character.gp);
    left = (this.character.gp - Math.floor(this.character.gp)) * 100;

    //Get Silver:
    money[1] = Math.floor(left);
    left = Math.floor((left - money[1]) * 100);

    //Get Copper:
    money[2] = left;

    this.money = money;
  }

  public setMoneyValue(val: string, index: number) {
    let amount: number;
    if (!val) {
      amount = 0;
    } else {
      amount = parseInt(val);
      if (amount === NaN || !amount) amount = 0;
    }

    if (this.money[index] === amount) return;

    let inputs: number[] = [amount, index];
    this.moneyChanged.next(inputs);
  }

  private updateMoney(inputs: number[]) {
    let total, gp, sp, cp, amount, index: number;
    amount = inputs[0];
    index = inputs[1];

    if (index > 0) { //Silver or Copper
      if (amount >= 100) {
        this.money[index - 1] += Math.floor(amount / 100);

        if (index > 1 && this.money[1] >= 100) {
          this.money[0] += Math.floor(this.money[1] / 100);
          this.money[1] %= 100;
        }

        amount = amount % 100;
      }
    }

    this.money[index] = amount;

    gp = this.money[0];
    sp = this.money[1] / 100;
    cp = this.money[2] / 10000;
    total = gp + sp + cp;

    this.character.gp = total;

    this.saveMoney.next(this.character.gp);
  }

  private saveMoneyToDB(val: number) {
    let s: Subscription = this._apiService.putEntity<Character>("Characters", this.character, this.character.characterId).subscribe(
      d => d = d,
      err => this._itemManager.triggerMessage("", "Unable to update money", MessageType.Failure),
      () => { s.unsubscribe(); this._itemManager.triggerMessage("", "Money updated", MessageType.Success); }
    );
  }

  /**
   * Called when the DM gives the player an item either in the game or from the DM portal page. 
   * If it is from the portal we wait to add it to the backend until the DM clicks save
   * 
   * @param {Item} item The item to add 
   * @param {number} index The index of the item in the item list 
   */
  public addItemCount(item: Item, index: number) {
    this._itemManager.addItem(item, item.url, index);
  }

  /**
   * Called when the DM removes an item or a player uses an item
   * 
   * @param {number} index The index of the item in the item list 
   */
  public removeItemCount(index: number) {
    this._itemManager.removeItem(index);
  }

  public sellItem(index: number) {
    let item: Item = this.items[index];

    let inputs: number[] = []; //Amount, Index (gp, sp, cp)
    switch(item.cost_Type) {
      case "gp":
        inputs[0] = item.cost + this.money[0];
        inputs[1] = 0;
        break;
      case "sp":
        inputs[0] = item.cost + this.money[1];
        inputs[1] = 1;
        break;
      case "cp":
        inputs[0] = item.cost + this.money[2];
        inputs[1] = 2;
        break;
      default:
        return;
    }

    this.updateMoney(inputs);
    this.removeItemCount(index);
  }

  /**
   * 
   * @param {Item} item The item to equip
   * @param ringEquipModal Modal
   */
  public getItemToEquip(item: Item, ringEquipModal) {
    let eq: Equipment;
    let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(item.url).subscribe(
      d => eq = d,
      err => console.log("unable to get item"),
      () => {
        s.unsubscribe();
        this.equipItem(eq, item, ringEquipModal);
      }
    );
  }

  /**
   * Called when the user attempts to swap their equipped item with one in their bag 
   * 
   * @param {Equipment} item The new equipment to wear 
   * @param {Item} oldItem The old equipment item to put into our bag 
   * @param {any} ringEquipModal The ring modal 
   */
  public equipItem(item: Equipment, oldItem: Item, ringEquipModal) {
    let newItem: ItemType = null;

    oldItem.count = 1;
    if (item.equipment_category.includes("Weapon")) {
      if (this.weapon) {
        oldItem.url = this.weapon.url;
        oldItem.name = this.weapon.name;
      } else {
        oldItem.count = 0;
      }

      this.character.weapon = item.url;
      newItem = ItemType.Weapon;
    } else if (item.equipment_category.includes("Armor")) {
      if (item.name.includes("Shield")) {
        if (this.shield) {
          oldItem.url = this.shield.url;
          oldItem.name = this.shield.name;
        } else {
          oldItem.count = 0;
        }

        this.character.shield = item.url;
        newItem = ItemType.Shield;
      } else {
        if (this.armor) {
          oldItem.url = this.armor.url;
          oldItem.name = this.armor.name;
        } else {
          oldItem.count = 0;
        }

        this.character.armor = item.url;
        newItem = ItemType.Armor;
      }
    } else if (item.equipment_category.includes("Shield")) {
      if (this.shield) {
        oldItem.url = this.shield.url;
        oldItem.name = this.shield.name;
      } else {
        oldItem.count = 0;
      }

      this.character.shield = item.url;
      newItem = ItemType.Shield;
    } else if (item.equipment_category === "Rings") {
      this.selectedRing = item;
      if (this.ring_1 === null) {
        this.character.ring_1 = item.url;
        newItem = ItemType.Ring_1;
        oldItem.count = 0;
      } else if (this.ring_2 === null) {
        this.character.ring_2 = item.url;
        newItem = ItemType.Ring_2;
        oldItem.count = 0;
      } else {
        this._modal.open(ringEquipModal).result.then((result) => { //On close via swap
          this.swapRings(oldItem);
        }, (reason) => { //on close via click off
        });
        return;
      }
    }else {
      return;
    }

    this._itemManager.updateItem(oldItem, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItem);
  }

  /**
   * Called when the user clicks on a ring to view. It opens a modal with the ring's details
   * 
   * @param {Equipment} ring The ring to view 
   * @param {any} ringModal The ring modal 
   */
  public getRingDetails(ring: Equipment, ringModal) {
    this.selectedRing = ring;
    this._modal.open(ringModal, { size: 'lg' });
  }

  /**
   * Called when the user attempts to equip a ring while wearing two
   * 
   * @param {string} ringNum The ring slot to swap to 
   */
  public selectRingSlot(ringNum: string) {
    if (ringNum === "Choose") {
      this.slotSwapIndex = 0;
      return;
    }

    this.slotSwapIndex = parseInt(ringNum);
  }

  /**
   * Called to swap a given ring slot with a new ring
   * 
   * @param {Item} oldItem The old ring to swap out 
   */
  public swapRings(oldItem: Item) {
    let newItem: ItemType = null;

    if (this.slotSwapIndex == 1) {
      oldItem.url = this.ring_1.url;
      oldItem.name = this.ring_1.name;

      this.character.ring_1 = this.selectedRing.url;
      newItem = ItemType.Ring_1;
    } else {
      oldItem.url = this.ring_2.url;
      oldItem.name = this.ring_2.name;

      this.character.ring_2 = this.selectedRing.url;
      newItem = ItemType.Ring_2;
    }

    this._itemManager.updateItem(oldItem, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItem);
  }

  /**
   * Called whenever the user is given a new item, it pulls it from the backend and updates the DOM
   * 
   * @param {ItemType} newItem The new item type given 
   */
  private getItems(newItem: ItemType) {
    switch (newItem) {
      case ItemType.Armor:
        this.getArmor();
        break;
      case ItemType.Weapon:
        this.getWeapon();
        break;
      case ItemType.Shield:
        this.getShield();
        break;
      case ItemType.Ring_1:
        this.getRingOne();
        break;
      case ItemType.Ring_2:
        this.getRingTwo();
        break;
      case ItemType.Bag:
        this.getBag();
        break;
      default:
        break;
    }
  }

  private getArmor() {
    if (this.character.armor) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.armor).subscribe(
        d => this.armor = d,
        err => console.log("unable to get armor", err),
        () => s.unsubscribe()
      );
    }
  }

  private getWeapon() {
    if (this.character.weapon) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.weapon).subscribe(
        d => this.weapon = d,
        err => console.log("unable to get weapon", err),
        () => s.unsubscribe()
      );
    }
  }

  private getShield() {
    if (this.character.shield) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.shield).subscribe(
        d => this.shield = d,
        err => console.log("unable to get shield", err),
        () => s.unsubscribe()
      );
    }
  }

  private getRingOne() {
    if (this.character.ring_1) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.ring_1).subscribe(
        d => this.ring_1 = d,
        err => console.log("unable to get ring_1", err),
        () => s.unsubscribe()
      );
    }
  }

  private getRingTwo() {
    if (this.character.ring_2) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.ring_2).subscribe(
        d => this.ring_2 = d,
        err => console.log("unable to get ring_2", err),
        () => s.unsubscribe()
      );
    }
  }

  private getBag() {
    let s: Subscription = this._apiService.getAllEntities<Item>("Items/character/" + this.character.characterId).subscribe(
      d => this._itemManager.setItems(d),
      err => console.log("unable to get character items", err),
      () => s.unsubscribe()
    );
  }

  private resetValues() {
    this.armor = null;
    this.shield = null;
    this.weapon = null;
    this.ring_1 = null;
    this.ring_2 = null;
  }

  private loadAllItems() {
    this.getArmor();
    this.getWeapon();
    this.getRingOne();
    this.getRingTwo();
    this.getBag();
  }

  ngOnDestroy() {
    this.character = null;
    this.lastCharID = -1;
    this.resetValues();
    this.isAlive = false;
  }
}
