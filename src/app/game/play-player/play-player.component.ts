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

  //Rolling:
  numDice: number = 1;
  dice: number[] = [4, 6, 8, 10, 12, 20];
  rollMax: number = 4;
  roll: number = 0;

  //Character info fields
  classDetail: ClassDetails;
  levelDetail: ClassLevels;

  spellSlots: number[] = [];

  armor: Equipment;
  weapon: Equipment;
  shield: Equipment;
  itemData: ItemMessageData;

  gotNewItem: ItemType;

  constructor(private _playManager: PlayManager, private _dataShareService: DataShareService, private _messageService: MessageService, private _itemManager: ItemManager, private _modal: NgbModal) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this._dataShareService.game.takeWhile(() => this.isAlive).subscribe(res => this.game = res);

    this._playManager.classDetail.takeWhile(() => this.isAlive).subscribe(res => this.classDetail = res);
    this._playManager.levelDetail.takeWhile(() => this.isAlive).subscribe(res => this.handleLevelDetail(res));

    this._messageService.itemDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setItemData(res));
  }

  /*
    This method is called whenever the user clicks the roll button, it will roll n number die and send the value rolled
    to all other users in the game iff hidden is false
    @param hidden: boolean - if the value rolled should be sent to all users or not
  */
  public rollDice(hidden: boolean) {
    let RMD: RollMessageData
    let max: number = this.rollMax * this.numDice; //The max number we can roll
    let min: number = 1 * this.numDice; //The min number we can roll

    this.roll = this.getRandomInt(min, max);

    if (!hidden) {
      RMD = this._playManager.createRMD(this.character.characterId, this.game.name, this.rollMax, this.roll, this.numDice);

      if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
    }
  }

  /*  
    This method is called when the user clicks the clear roll button. It sets their roll to 0D4 and notifies all other people in the lobby
  */
  public clearRoll() {
    let RMD: RollMessageData;
    this.roll = 0;
    RMD = this._playManager.createRMD(this.character.characterId, this.game.name, 4, this.roll, 1);

    if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
  }

  /*
    This method is called when the user gets a ping from signalR saying that they got a new item. It gets the item data from the API
    and updates their character
    @param item: ItemMessageData - The item url sent from signalR
  */
  public setItemData(item: ItemMessageData) {
    if (item === null) return;

    this.itemData = item;

    let rItem: Equipment;
    let s: Subscription = this._playManager.getItem(this.itemData.item).subscribe(
      d => rItem = d,
      err => console.log("Unable to get item", err),
      () => {
        s.unsubscribe();
        this.handleWeaponType(rItem);
      }
    );
  }

  /*
    This method is called when the user clicks the spell book button. It opens the modal displaying their class' spellbook
  */
  public openSpellBook(content) {
    this._modal.open(content, { size: 'lg' });
  }

  /*
    This method is called when the user clicks the cast spell button, it removes a count from their total number of spells
    the can cast at that level
    @param index: number - The spell level we are casting
  */
  public castSpell(index: number) {
    this.spellSlots[index]--;
  }

  /*
    This method is called when our play manager returns the level details of the current character
    @LD: ClassLevels - The current stats of the character at their given level
  */
  private handleLevelDetail(LD: ClassLevels) {
    if (LD === null) return;

    this.levelDetail = LD;

    if (this.levelDetail.spellcasting) { //Update their spellbook iff they are a spell caster
      this.spellSlots = this._playManager.setSpellSlots(this.levelDetail);
    }
  }

  /*
    This method is called whenever the user is given an item, it will check to see what type of item it is and
    update the character based on that.
    @param item: Equipment - The item given to the player
  */
  private handleWeaponType(item: Equipment) {
    let newItem: ItemType = null;
    this.gotNewItem = ItemType.None;

    switch (item.equipment_category) {
      case "Weapon":
        this.character.weapon = item.url;
        newItem = ItemType.Weapon;
        this.triggerMessage("", "Recieved new weapon!", MessageType.Notification);
        break;
      case "Armor":
        if (item.name === "Shield") {
          this.character.shield = item.url;
          newItem = ItemType.Shield;
          this.triggerMessage("", "Recieved new shield!", MessageType.Notification);
          break;
        }
        this.character.armor = item.url;
        newItem = ItemType.Armor;
        this.triggerMessage("", "Recieved new armor!", MessageType.Notification);

        break;
      case "Shield":
        this.character.shield = item.url;
        newItem = ItemType.Shield;
        this.triggerMessage("", "Recieved new shield!", MessageType.Notification);
        break;
      default:
        // newItem = ItemType.Bag;
        this.addItemToBag(item);
        return;
    }

    this._itemManager.updateCharacterEquipment(this.character, newItem);
  }

  private addItemToBag(eq: Equipment) {
    let item = {
      name: eq.name,
      url: eq.url,
      count: 1,
      characterId: this.character.characterId,
    };

    this._itemManager.addItem(item, item.url);
  }

  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }

  private getRandomInt(min: number, max: number) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
