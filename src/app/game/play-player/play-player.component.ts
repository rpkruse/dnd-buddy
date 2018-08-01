/*
  Written by: Ryan Kruse
  The component controls all of the actions (and view) from players in the current game. It allows them to make rolls, cast spells, view their spell book/inventory
  and allows them to get equipment from the DM
*/
import { Component, OnInit, Input } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs';

import { User, Game, Character, ItemMessageData, RollMessageData, Equipment, ClassDetails, ClassLevels, MessageOutput, MessageType, Item, ItemType } from '../../interfaces/interfaces';

import { PlayManager, DataShareService, MessageService, ItemManager } from '../../services/services';

@Component({
  selector: 'play-player',
  templateUrl: './play-player.component.html',
  styleUrls: ['./play-player.component.css', '../../global-style.css'],
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
export class PlayPlayerComponent implements OnInit {
  private isAlive: boolean = true;

  user: User;
  game: Game;
  @Input() character: Character;

  canEquip: string[] = ["Weapon", "Armor", "Shield", "Rings"];

  //Character info fields
  classDetail: ClassDetails;
  levelDetail: ClassLevels;

  spellSlots: number[] = [];

  constructor(private _playManager: PlayManager, private _dataShareService: DataShareService, private _messageService: MessageService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this._dataShareService.game.takeWhile(() => this.isAlive).subscribe(res => this.game = res);

    this._playManager.classDetail.takeWhile(() => this.isAlive).subscribe(res => this.classDetail = res);
    this._playManager.levelDetail.takeWhile(() => this.isAlive).subscribe(res => this.handleLevelDetail(res));

    this._messageService.itemDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setItemData(res));
  }

  /**
   * Called whenever the user clicks the roll button, it will roll n number die and send the value rolled
   * to all other users in the game iff hiden is false
   * 
   * @param {boolean} hidden If the value rolled should be sent to all users or not  [this.rollMax, this.roll, this.numDice]
   */
  public rollDice(rollInfo: number[]) {
    let RMD: RollMessageData
    RMD = this._playManager.createRMD(this.character.characterId, this.game.name, rollInfo[0], rollInfo[1], rollInfo[2]);
    if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
  }

  /**
   * Called when the user gets a ping from signalR saying that they got a new item. It gets the item data from the API
   * and updates their character
   * 
   * @param {ItemMessageData} item The item data sent from signalR 
   */
  public setItemData(item: ItemMessageData) {
    if (item === null) return;

    let rItem: Equipment;
    let s: Subscription = this._playManager.getItem(item.item).subscribe(
      d => rItem = d,
      err => console.log("Unable to get item", err),
      () => {
        s.unsubscribe();
        this.handleWeaponType(rItem);
      }
    );
  }

  /**
   * Called when the user clicks the spell book button. It opens the modal displaying their class's spellbook
   * 
   * @param {any} content The modal
   */
  public openSpellBook(content) {
    this._modal.open(content, { size: 'lg' });
  }

  /**
   * Called when the user clicks the cast spell button, it removes a count from their total number of spells
   * they can canst at that level
   * 
   * @param {number} index The spell level we are casting 
   */
  public castSpell(index: number) {
    this.spellSlots[index]--;
  }

  /**
   * Called when our play manager returns the level details of the current character
   * 
   * @param {ClassLevels} LD The current stats of the character at their given level 
   */
  private handleLevelDetail(LD: ClassLevels) {
    if (LD === null) return;

    this.levelDetail = LD;

    if (this.levelDetail.spellcasting) { //Update their spellbook iff they are a spell caster
      this.spellSlots = this._playManager.setSpellSlots(this.levelDetail);
    }
  }

  /**
   * Called whenever the user is given an item, it will check to see what type of item it is and update the
   * character based on that
   * 
   * @param {Equipment} item The item given to the player 
   */
  private handleWeaponType(item: Equipment) {
    let canEq = this.canEquip.some(i => i === item.equipment_category);

    this.addItemToBag(item, canEq);
    this._messageService.sendItem(null); //reset so we don't double up
  }

  /**
   * Called when the user gets an item that cannot be equipped it adds it to their bag
   * 
   * @param {Equipment} eq The item to add to the character's bag 
   */
  private addItemToBag(eq: Equipment, canEquip: boolean) {
    let item = {
      name: eq.name,
      url: eq.url,
      count: 1,
      canEquip: canEquip,
      characterId: this.character.characterId,
    };

    this._itemManager.addItem(item, item.url);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
