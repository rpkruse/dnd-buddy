/*
  Written By: Ryan Kruse
  
  What this serive should do:
    1) Add/Remove items from the BE
    2) Handle the item list to send to all subs
    3) Trigger messages on screen when items are changed
*/
import { Injectable } from '@angular/core';

import { Item, MessageOutput, MessageType, ItemType, Character } from '../../interfaces/interfaces';

import { ApiService } from '../api/api.service';
import { DataShareService } from '../data/data-share.service';

import { Subject, BehaviorSubject, Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemManager {

  private items: Item[] = [];
  itemSubj: Subject<Item[]> = new BehaviorSubject<Item[]>([]);

  newItem: Subject<ItemType> = new BehaviorSubject<ItemType>(ItemType.None);

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService) { }

  public addItem(item: any, url: string, dupItemIndex: number = -1) {

    //Check to see if we already have the item (if so increase its count)
    if (dupItemIndex <= 0) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].url === url) {
          dupItemIndex = i;
          break;
        }
      }
    }

    let s: Subscription;

    //If we have a duplicate item, increase its count
    if (dupItemIndex >= 0) {
      this.items[dupItemIndex].count++;
      let di: Item = this.items[dupItemIndex];
      this.updateItem(di, "Item added!");
    } else { //Otherwise just add it
      let rItem: Item;

      s = this._apiService.postEntity<Item>("Items", item).subscribe(
        d => rItem = d,
        err => this.triggerMessage("", "Unable to add item", MessageType.Failure),
        () => {
          s.unsubscribe();
          this.items.push(rItem);
          this.itemSubj.next(this.items);
          this.triggerMessage("", "Item added!", MessageType.Success);
        }
      );
    }
  }

  public removeItem(index: number) {
    this.items[index].count--;

    let item: Item = this.items[index];

    let s: Subscription;

    //Remove the item if we use the last one
    if (item.count <= 0) {
      s = this._apiService.deleteEntity("Items", item.itemId).subscribe(
        d => d = d,
        err => this.triggerMessage("", "Unable to remove item", MessageType.Failure),
        () => {
          s.unsubscribe();
          this.triggerMessage("", "Item Removed!", MessageType.Success);
          this.items.splice(index, 1);
          this.itemSubj.next(this.items);
        }
      );
    } else { //Otherwise just update the item
      this.updateItem(item, "Item removed!");
    }
  }

  public updateItem(item: Item, action: string) {
    if (item.count <= 0) {
      let i: number = this.items.findIndex(x => x.itemId === item.itemId);
      this.removeItem(i);
      return;
    }
    let s: Subscription = this._apiService.putEntity("Items", item, item.itemId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to update bag", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", action, MessageType.Success);
        this.itemSubj.next(this.items);
      }
    )
  }

  public updateCharacterEquipment(character: Character, type: ItemType) {
    if (!type) {
      this.newItem.next(ItemType.None);
      return;
    }
    
    let s: Subscription = this._apiService.putEntity<Character>("Characters", character, character.characterId).subscribe(
      d => d = d,
      err => console.log("Unable to update character", err),
      () => {
        s.unsubscribe();
        this.newItem.next(type);
      }
    )
  }

  public setItems(items: Item[]) {
    this.items = items;
    this.itemSubj.next(this.items);
  }

  public triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }
}
