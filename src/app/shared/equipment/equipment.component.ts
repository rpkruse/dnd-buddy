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
  @Input() dmPortal: boolean = false; //If true, then we can add items with a "+" button

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;

    this.onMobile = this.width <= 400;
  }

  onMobile: boolean = false;
  private width: number;

  private isAlive: boolean = true;

  armor: Equipment = null;
  shield: Equipment = null;
  weapon: Equipment = null;
  ring_1: Equipment = null;
  ring_2: Equipment = null;
  neck: Equipment = null;
  belt: Equipment = null;
  boot: Equipment = null;
  cloak: Equipment = null;
  gloves: Equipment = null;
  helm: Equipment = null;

  selectedItem: Equipment = null;

  selectedRing: Equipment;
  slotSwapIndex: number = 0;

  money: number[] = []; //GP, SP, CP

  lastCharID: number = -1;

  mouseOver: number = -1;

  show: boolean = true;

  moneyChanged: Subject<number[]> = new Subject<number[]>();
  saveMoney: Subject<number> = new Subject<number>();

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
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

  public removeGear(toRemove: Equipment, type: string) {
    let item: any = this._itemManager.createItem(toRemove, this.character, 1);

    switch (type) {
      case "armor":
        this.character.armor = "";
        this.armor = null;
        break;
      case "shield":
        this.character.shield = "";
        this.shield = null;
        break;
      case "weapon":
        this.character.weapon = "";
        this.weapon = null;
        break;
      case "ring_1":
        this.character.ring_1 = "";
        this.ring_1 = null;
        break;
      case "ring_2":
        this.character.ring_2 = "";
        this.ring_2 = null
        break;
      case "neck":
        this.character.neck = "";
        this.neck = null;
        break;
      case "belt":
        this.character.belt = "";
        this.belt = null;
        break;
      case "boot":
        this.character.boots = "";
        this.boot = null;
        break;
      case "cloak":
        this.character.cloak = "";
        this.cloak = null;
        break;
      case "gloves":
        this.character.gloves = "";
        this.gloves = null;
        break;
      case "helm":
        this.character.helm = "";
        this.helm = null;
        break;
      default:
        return;
    }

    this._itemManager.addItem(item, item.url);
    this._itemManager.setCharacter(this.character);
  }

  public sellItem(item: Item, index: number) {
    // let item: Item = this.items[index];

    let inputs: number[] = []; //Amount, Index (gp, sp, cp)
    switch (item.cost_Type) {
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
        this.equipItem(eq, item, ringEquipModal, item.count === 1);
      }
    );
  }

  /**
   * Called when the user attempts to swap their equipped item with one in their bag 
   * 
   * @param {Equipment} toEq The new equipment to wear (from bag)
   * @param {Item} toAddToBag The old equipment item to put into our bag (from bag)
   * @param {any} ringEquipModal The ring modal 
   */
  public equipItem(toEq: Equipment, toAddToBag: Item, ringEquipModal, single: boolean) {
    let newItemType: ItemType = null;

    let newItem: Item = null;

    if (toEq.equipment_category.includes("Weapon")) {
      if (this.weapon) {
        newItem = this._itemManager.createItem(this.weapon, this.character, 1);
      }

      this.character.weapon = toEq.url;
      newItemType = ItemType.Weapon;
    } else if (toEq.equipment_category.includes("Armor")) {
      if (toEq.name.includes("Shield")) {
        if (this.shield) {
          newItem = this._itemManager.createItem(this.shield, this.character, 1);
        }
        this.character.shield = toEq.url;
        newItemType = ItemType.Shield;
      } else {
        if (this.armor) {
          newItem = this._itemManager.createItem(this.armor, this.character, 1);
        }

        this.character.armor = toEq.url;
        newItemType = ItemType.Armor;
      }
    } else if (toEq.equipment_category.includes("Shield")) {
      if (this.shield) {
        newItem = this._itemManager.createItem(this.shield, this.character, 1);
      }

      this.character.shield = toEq.url;
      newItemType = ItemType.Shield;
    } else if (toEq.equipment_category === "Rings") {
      this.selectedRing = toEq;
      if (this.ring_1 === null) {
        this.character.ring_1 = toEq.url;
        newItemType = ItemType.Ring_1;
      } else if (this.ring_2 === null) {
        this.character.ring_2 = toEq.url;
        newItemType = ItemType.Ring_2;
      } else {
        this._modal.open(ringEquipModal).result.then((result) => { //On close via swap
          this.swapRings(toAddToBag);
        }, (reason) => { //on close via click off
        });
        return;
      }
    } else if (toEq.equipment_category.includes("Magical")) {
      this.equipMagicalItem(toEq, toAddToBag, single);
      return;
    } else {
      return;
    }

    toAddToBag.count--;
    if (newItem) this._itemManager.addItem(newItem, newItem.url);
    this._itemManager.updateItem(toAddToBag, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItemType);
  }

  private equipMagicalItem(item: Equipment, oldItem: Item, single: boolean) {
    let newItemType: ItemType = null;

    let newItem: Item = null;
    switch (item.armor_category) {
      case "Neck":
        if (this.neck) {
          newItem = this._itemManager.createItem(this.neck, this.character, 1);
        }

        this.character.neck = item.url;
        newItemType = ItemType.Neck;
        break;
      case "Belt":
        if (this.belt) {
          newItem = this._itemManager.createItem(this.belt, this.character, 1);
        }

        this.character.belt = item.url;
        newItemType = ItemType.Belt;

        break;
      case "Boot":
        if (this.boot) {
          newItem = this._itemManager.createItem(this.boot, this.character, 1);
        }

        this.character.boots = item.url;
        newItemType = ItemType.Boot;

        break;
      case "Cloak":
        if (this.cloak) {
          newItem = this._itemManager.createItem(this.cloak, this.character, 1);
        }

        this.character.cloak = item.url;
        newItemType = ItemType.Cloak;

        break;
      case "Gloves":
        if (this.gloves) {
          newItem = this._itemManager.createItem(this.gloves, this.character, 1);
        }

        this.character.gloves = item.url;
        newItemType = ItemType.Gloves;

        break;
      case "Helm":
        if (this.helm) {
          newItem = this._itemManager.createItem(this.helm, this.character, 1);
        }

        this.character.helm = item.url;
        newItemType = ItemType.Helm;

        break;
      default:
        return;
    }

    oldItem.count--;

    if (newItem) this._itemManager.addItem(newItem, newItem.url);
    this._itemManager.updateItem(oldItem, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItemType);
  }

  getAction(action: [Item, string, number], ringEquipModal) { //"sell", "use", "remove?", "equip"

    switch (action[1]) {
      case "sell":
        this.sellItem(action[0], action[2]);
        break;
      case "use":
        this.removeItemCount(action[2]);
        break;
      case "remove":
        break;
      case "equip":
        this.getItemToEquip(action[0], ringEquipModal);
        break;
      default:
        return;
    }
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

  public getItemDetails(item: Equipment, itemModal) {
    this.selectedItem = item;
    this._modal.open(itemModal, { size: "lg" });
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
    let newItemType: ItemType = null;

    let newItem: Item = null;

    if (this.slotSwapIndex === 1) {
      newItem = this._itemManager.createItem(this.ring_1, this.character, 1);

      this.character.ring_1 = this.selectedRing.url;
      newItemType = ItemType.Ring_1;
    } else {
      newItem = this._itemManager.createItem(this.ring_2, this.character, 1);

      this.character.ring_2 = this.selectedRing.url;
      newItemType = ItemType.Ring_2;
    }

    oldItem.count--;
    if (newItem) this._itemManager.addItem(newItem, newItem.url);
    this._itemManager.updateItem(oldItem, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItemType);
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
      case ItemType.Neck:
        this.getNeck();
        break;
      case ItemType.Belt:
        this.getBelt();
        break;
      case ItemType.Boot:
        this.getBoot();
        break;
      case ItemType.Cloak:
        this.getCloak();
        break;
      case ItemType.Gloves:
        this.getGloves();
        break;
      case ItemType.Helm:
        this.getHelm();
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

  private getNeck() {
    if (this.character.neck) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.neck).subscribe(
        d => this.neck = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
  }

  private getBelt() {
    if (this.character.belt) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.belt).subscribe(
        d => this.belt = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
  }

  private getBoot() {
    if (this.character.boots) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.boots).subscribe(
        d => this.boot = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
  }

  private getCloak() {
    if (this.character.cloak) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.cloak).subscribe(
        d => this.cloak = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
  }

  private getGloves() {
    if (this.character.gloves) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.gloves).subscribe(
        d => this.gloves = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
  }

  private getHelm() {
    if (this.character.helm) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.helm).subscribe(
        d => this.helm = d,
        err => console.log("unable to get neck", err),
        () => s.unsubscribe()
      );
    }
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
    this.getNeck();
    this.getBelt();
    this.getBoot();
    this.getCloak();
    this.getGloves();
    this.getHelm();
  }

  ngOnDestroy() {
    this.character = null;
    this.lastCharID = -1;
    this.resetValues();
    this.isAlive = false;
  }
}
