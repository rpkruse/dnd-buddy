import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DndApiService, ItemManager } from '../../services/services';

import { Character, Equipment, Item, ItemType, MessageType } from '../../interfaces/interfaces';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { Subscription, Subject } from 'rxjs';

@Component({
  selector: 'app-bag',
  templateUrl: './bag.component.html',
  styleUrls: ['./bag.component.css', '../../global-style.css', '../shared-style.css'],
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
export class BagComponent implements OnInit {
  @Input() character: Character;
  items: Item[];

  @Output() action: EventEmitter<[Item, string, number]> = new EventEmitter<[Item, string, number]>(); //Item, action=["sell", "use", "remove", "equip"] (right now its only one at a time?)

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;

    this.onMobile = this.width <= 400;
  }

  normal: Item[] = [];
  equip: Item[] = [];
  magical: Item[] = [];

  selectedEquipment: Equipment;

  mouseOver: number = -1;
  onMobile: boolean = false;
  width: number;

  constructor(private _dndApiService: DndApiService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
    this._itemManager.itemSubj.subscribe(res => this.setItems(res));
  }

  getItem(url: string, item: Item, content: any) {
    let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(url).subscribe(
      d => this.selectedEquipment = d,
      err => console.log("unable to get item", err),
      () => {
        s.unsubscribe();
        this._modal.open(content, { "size": "lg" });
      }
    )
  }
  
  performAction(item: Item, action: string, event) {
    event.stopPropagation();

    let index: number = this.items.findIndex(x => x.itemId === item.itemId);

    let out: [Item, string, number] = [item, action, index];
    this.action.emit(out);
  }

  private setItems(items: Item[]) {
    this.normal = [];
    this.equip = [];
    this.magical = [];

    if (items.length <= 0) return;

    let changed: boolean[] = [false, false, false]; //n, e, m

    this.items = items;

    let item: Item;
    for (let i = 0; i < items.length; i++) {
      item = items[i];
      if (item.canEquip) {
        this.equip.push(item);
        changed[1] = true;
      }else{
        if (item.magic_Type !== "none") {
          this.magical.push(item);
          changed[2] = true;
        }else {
          this.normal.push(item);
          changed[0] = true;
        }
      }
    }

    if (changed[0]) this.normal.sort((a, b) => a.name > b.name ? 1 : -1);
    if (changed[1]) this.equip.sort((a, b) => a.name > b.name ? 1 : -1);
    if (changed[2]) this.magical.sort((a, b) => a.name > b.name ? 1 : -1);
  }

}
