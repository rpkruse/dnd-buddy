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

  finished: boolean = false;

  giveAmount: number = 1;

  show: boolean = true;

  constructor(private _dndApiService: DndApiService, private _itemManager: ItemManager) { }

  ngOnInit() {
    let j: Subscription = this._dndApiService.getAllEntities<EquipmentCategory>("equipment-categories").subscribe(
      d => this.equipmentTypes = d,
      err => console.log(err),
      () => j.unsubscribe()
    )
  }

  /**
   * Called when the GM clicks on an item type (IE armor, weapon) it returns all items of that type from the DB
   * 
   * @param {string} url The url of the item type to fetch fro the DB 
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
      () => s.unsubscribe()
    );
  }

  /**
   * Called when the DM selects a specific item (IE sword, axe, chain mail) it will pull the details of this item from the API
   * 
   * @param {string} url The url of the item to pull 
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
        this.finished = !this.users.length;
      }
    );
  }

  /**
   * Called once the DM selects a player to give the item to, it will send the message via signalR (ONLY IN PLAY_GAME)
   * 
   * @param {string} userId The connection ID of the player to give the item to 
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

  changeAmountToGive(dir: number) {
    this.giveAmount += dir;

    if (this.giveAmount <= 1)
      this.giveAmount = 1;
  }

  /**
   * Called only from the DM portal, it gives the selected item to a player
   */
  public giveItem() {
    if (this.character) {
      this.setItem(this.equipmentItem);
    } else {
      this.imd.next(this.imdToSend);
    }

    this.imdToSend = null;
    this.equipmentList = null;
    this.equipmentItem = null;
    this.finished = false;
  }

  /**
   * Called from DM protal after we give an item, it lets us know if they can equipt the item or not
   * @param {Equipment} item The item to give 
   */
  setItem(item: Equipment) {
    // let cq = this.canEquip.some(x => x === item.equipment_category);
    
    this.createNewItem(item, this._itemManager.canEquipItem(item));
  }

  private createNewItem(eq: Equipment, canEquip: boolean) {
    let nItem = this._itemManager.createItem(eq, this.character, this.giveAmount);
    this._itemManager.addItem(nItem, nItem.url);

    this.giveAmount = 1;
  }

  ngOnDestroy() {
    this.character = null;
    this.users = null;
  }

}
