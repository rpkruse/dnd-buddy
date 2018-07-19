import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { DndApiService, ItemManager } from '../../services/services';

import { Character, OnlineUser, Equipment, EquipmentCategory, EquipmentCategoryDetails, ItemType, ItemMessageData, UserMessageData } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-giveitem',
  templateUrl: './giveitem.component.html',
  styleUrls: ['./giveitem.component.css', '../../global-style.css', '../shared-style.css']
})
export class GiveitemComponent implements OnInit {

  @Input() character: Character;
  @Input() users: OnlineUser[] = [];

  @Output() imd: EventEmitter<ItemMessageData> = new EventEmitter<ItemMessageData>();
  private imdToSend: ItemMessageData;

  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  equipmentItem: Equipment;

  slottedItem: boolean = false;
  private slot: string;

  finished: boolean = false;

  constructor(private _dndApiService: DndApiService, private _itemManager: ItemManager) { }

  ngOnInit() {
    let j: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentTypes = d,
      err => console.log(err),
      () => j.unsubscribe()
    )
  }

  /*
    This method is called when the GM clicks on a item type (IE armor, weapon) it returns all items of that type from the DB
    @param url: string - The url of the item type to fetch from the db
  */
  public getListOfEquipment(url: string) {
    this.equipmentList = null;
    this.equipmentItem = null;
    this.finished = false;

    if (url === "Choose") {
      return;
    };

    let s: Subscription = this._dndApiService.getSingleEntity<EquipmentCategoryDetails>(url).subscribe(
      d => this.equipmentList = d,
      err => console.log("unable to get equipment list", err),
      () => {
        s.unsubscribe();
        this.slottedItem = this.equipmentList.name === "Rings"
      }
    );
  }

  /*
    This method is called when the DM selects a specific item (IE sword, axe, chain mail) it will pull the details of this item
    from the api
    @param url: string - The api url of the item to pull
  */
  public getEquipmentItem(url: string) {
    this.equipmentItem = null;
    this.finished = false;
    if (url === "Choose") {
      return;
    };

    let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(url).subscribe(
      d => this.equipmentItem = d,
      err => console.log("Unable to get equipment item", err),
      () => {
        s.unsubscribe();
        this.finished = !this.slottedItem && !this.users.length;
      }
    );
  }

  public setSlot(slot: string) {
    if (slot === "Choose") {
      return;
    }

    this.slot = slot;

    this.finished = !this.users.length;
  }

  /*
   This method is called once the DM selects a player to give the item to, it will send the message via signalR
   @param id: string - The connection ID of the player to give the item to
 */
  public selectPlayer(userId: string) {
    let UMD: UserMessageData;

    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].umd.id === userId) {
        UMD = this.users[i].umd;
      }
    }

    if (!UMD) return;

    let IMD: ItemMessageData = {
      groupName: UMD.groupName,
      connectionId: UMD.id,
      item: this.equipmentItem.url
    };

    this.imdToSend = IMD;
    this.finished = true;
  }

  public giveItem() {
    if (this.character) {
      this.setItem(this.equipmentItem, this.slot);
    } else {
      this.imd.next(this.imdToSend);
    }

    this.imdToSend = null;
    this.equipmentList = null;
    this.equipmentItem = null;
    this.slottedItem = false;
    this.finished = false;
  }

  setItem(item: Equipment, slot?: string) {
    let newItem: ItemType = ItemType.None;

    switch (item.equipment_category) {
      case "Weapon":
        this.character.weapon = item.url;
        newItem = ItemType.Weapon;
        break;
      case "Armor":
        if (item.name === "Shield") {
          this.character.shield = item.url;
          newItem = ItemType.Shield;
          break;
        }
        this.character.armor = item.url;
        newItem = ItemType.Armor;
        break;
      case "Shield":
        this.character.shield = item.url;
        newItem = ItemType.Shield;

        break;
      case "Rings":
        if (slot === "1") {
          this.character.ring_1 = item.url;
          newItem = ItemType.Ring_1
        } else if (slot === "2") {
          this.character.ring_2 = item.url;
          newItem = ItemType.Ring_2
        }
        break;
      default:
        this.createNewItem(item);
        this._itemManager.newItem.next(newItem);
        return;
    }

    this._itemManager.updateCharacterEquipment(this.character, newItem);

  }

  private createNewItem(eq: Equipment) {
    let nItem = {
      name: eq.name,
      url: eq.url,
      count: 1,
      characterId: this.character.characterId
    }

    this._itemManager.addItem(nItem, nItem.url);
  }

  ngOnDestroy() {
    this.character = null;
    this.users = null;
  }

}
