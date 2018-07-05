/*
  Written by: Ryan Kruse
  This component controls all of the actions for the DM (and view). It allows them to make rolls and give items to the players in the game
*/
import { Component, OnInit } from '@angular/core';
import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

import {
  User, Game, Character, ItemMessageData, RollMessageData,
  Equipment, EquipmentCategory, EquipmentCategoryDetails,
  MessageOutput, MessageType, OnlineUser
} from '../interfaces/interfaces';

import { PlayManager, DataShareService, MessageService } from '../services/services';

@Component({
  selector: 'play-dm',
  templateUrl: './play-dm.component.html',
  styleUrls: ['./play-dm.component.css', '../global-style.css']
})
export class PlayDmComponent implements OnInit {
  private isAlive: boolean = true;

  user: User;
  game: Game;

  //Rolling:
  numDice: number = 1;
  dice: number[] = [4, 6, 8, 10, 12, 20];
  rollMax: number = 4;
  roll: number = 0;

  //Equipment Giving:
  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  equipmentItem: Equipment;

  constructor(private _playManager: PlayManager, private _dataShareService: DataShareService, private _messageService: MessageService) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this._dataShareService.game.takeWhile(() => this.isAlive).subscribe(res => this.game = res);

    this._playManager.equipmentCategories.takeWhile(() => this.isAlive).subscribe(res => this.equipmentTypes = res);
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
      RMD = this._playManager.createRMD(-1, this.game.name, this.rollMax, this.roll, this.numDice);

      if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
    }
  }

  /*  
    This method is called when the user clicks the clear roll button. It sets their roll to 0D4 and notifies all other people in the lobby
  */
  public clearRoll() {
    let RMD: RollMessageData;
    this.roll = 0;
    RMD = this._playManager.createRMD(-1, this.game.name, 4, this.roll, 1);

    if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
  }

  /*
    This method is called when the GM clicks on a item type (IE armor, weapon) it returns all items of that type from the DB
    @param url: string - The url of the item type to fetch from the db
  */
  public getListOfEquipment(url: string) {
    if (url === "Choose") {
      this.equipmentList = null;
      this.equipmentItem = null;
      return;
    };

    let s: Subscription = this._playManager.getItemList(url).subscribe(
      d => this.equipmentList = d,
      err => console.log("unable to get equipment list", err),
      () => s.unsubscribe()
    );
  }

  /*
    This method is called when the DM selects a specific item (IE sword, axe, chain mail) it will pull the details of this item
    from the api
    @param url: string - The api url of the item to pull
  */
  public getEquipmentItem(url: string) {
    if (url === "Choose") {
      this.equipmentItem = null;
    };

    let s: Subscription = this._playManager.getItem(url).subscribe(
      d => this.equipmentItem = d,
      err => console.log("Unable to get equipment item", err),
      () => s.unsubscribe()
    );
  }

  /*
    This method is called once the DM selects a player to give the item to, it will send the message via signalR
    @param id: string - The connection ID of the player to give the item to
  */
  public selectPlayer(id: string) {
    if (id === "Choose") return;

    let IMD: ItemMessageData = this._playManager.createIMD(id, this.game.name, this.equipmentItem.url);
    this._messageService.sendItem(IMD);
    this.triggerMessage("", "Item given!", MessageType.Success);
  }

  /*
    This method is called to filter ourself out of the connected memebers (so that we cannot select ourself)
    @return OnlineUser[] - An array of all connected players (that are not us)
  */
  public getOtherGroupMembers(): OnlineUser[] {
    return this._messageService.groupMembers.filter(x => x.umd.characterId > 0);
  }

  private getRandomInt(min: number, max: number) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
