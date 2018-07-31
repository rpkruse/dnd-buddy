import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DndApiService, ItemManager } from '../../services/services';

import { Character, Equipment, Item, ItemType } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';

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

  private isAlive: boolean = true;

  items: Item[] = [];

  armor: Equipment = null;
  shield: Equipment = null;
  weapon: Equipment = null;
  ring_1: Equipment = null;
  ring_2: Equipment = null;

  selectedRing: Equipment;
  slotSwapIndex: number = 0;

  lastCharID: number = -1;

  mouseOver: number = -1;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
    this.loadAllItems();

    this._itemManager.itemSubj.takeWhile(() => this.isAlive).subscribe(res => this.items = res);
    this._itemManager.newItem.takeWhile(() => this.isAlive).subscribe(res => this.getItems(res));
  }

  ngOnChanges() {
    if (!this.character) return;

    if (this.character.characterId != this.lastCharID) {
      this.lastCharID = this.character.characterId;
      this.resetValues();
      this.loadAllItems();
    }

    // if (this.character) this.getItems();
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

  /**
   * 
   * @param {Item} item The item to equip
   * @param ringEquipModal Modal
   */
  public getItemToEquip(item: Item, ringEquipModal) {
    // console.log(item);
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

  public equipItem(item: Equipment, oldItem: Item, ringEquipModal) {
    let newItem: ItemType = null;

    oldItem.count = 1;
    switch (item.equipment_category) {
      case "Weapon":
        if (this.weapon) {
          oldItem.url = this.weapon.url;
          oldItem.name = this.weapon.name;
        } else {
          oldItem.count = 0;
        }

        this.character.weapon = item.url;
        newItem = ItemType.Weapon;
        break;
      case "Armor":
        if (item.name === "Shield") {
          if (this.shield) {
            oldItem.url = this.shield.url;
            oldItem.name = this.shield.name;
          } else {
            oldItem.count = 0;
          }

          this.character.shield = item.url;
          newItem = ItemType.Shield;
          break;
        }
        if (this.armor) {
          oldItem.url = this.armor.url;
          oldItem.name = this.armor.name;
        } else {
          oldItem.count = 0;
        }

        this.character.armor = item.url;
        newItem = ItemType.Armor;
        break;
      case "Shield":
        if (this.shield) {
          oldItem.url = this.shield.url;
          oldItem.name = this.shield.name;
        } else {
          oldItem.count = 0;
        }

        this.character.shield = item.url;
        newItem = ItemType.Shield;
        break;
      case "Rings":
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
        break;
      default:
        return;
    }

    this._itemManager.updateItem(oldItem, "Item swapped!");
    this._itemManager.updateCharacterEquipment(this.character, newItem);
  }

  public getRingDetails(ring: Equipment, ringModal) {
    this.selectedRing = ring;
    this._modal.open(ringModal, { size: 'lg' });
  }

  public selectRingSlot(ringNum: string) {
    if (ringNum === "Choose") {
      this.slotSwapIndex = 0;
      return;
    }

    this.slotSwapIndex = parseInt(ringNum);
  }

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
