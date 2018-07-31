/*
  Written by: Ryan Kruse
  This component controls all of the actions for the DM (and view). It allows them to make rolls and give items to the players in the game
*/
import { Component, OnInit } from '@angular/core';
import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

import {
  User, Game, ItemMessageData, RollMessageData,
  Equipment, EquipmentCategory, EquipmentCategoryDetails,
  MessageOutput, MessageType, OnlineUser
} from '../../interfaces/interfaces';

import { PlayManager, DataShareService, MessageService } from '../../services/services';

@Component({
  selector: 'play-dm',
  templateUrl: './play-dm.component.html',
  styleUrls: ['./play-dm.component.css', '../../global-style.css']
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
  }

  /**
   * Called whenever the user clicks the roll button, it will roll n number die and send the value rolled
   * to all other users in the game iff hiden is false
   * 
   * @param {boolean} hidden If the value rolled should be sent to all users or not 
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

  /**
   * Called when the user clicks clear roll button. It sets their roll to 0D4 and notifies all other people in the lobby
   */
  public clearRoll() {
    let RMD: RollMessageData;
    this.roll = 0;
    RMD = this._playManager.createRMD(-1, this.game.name, 4, this.roll, 1);

    if (this._messageService.groupMembers.length > 1) this._messageService.sendRoll(RMD); //Only send the roll if we have at least one other person in the lobby (that isn't us)
  }

  /**
   * Called once the DM selects a player to give a item to, it will send the message via signalR
   * 
   * @param {ItemMessageData} IMD The item message data object to send  
   */
  public selectPlayer(IMD: ItemMessageData) {
    if (!IMD) return;

    this._messageService.sendItem(IMD);
    this.triggerMessage("", "Item given!", MessageType.Success);
  }

  /**
   * Called to filter ourself out of the connected members (so that we cannot select ourself)
   * 
   * @returns An array of all connected players excluding ourself
   */
  public getOtherGroupMembers(): OnlineUser[] {
    return this._messageService.groupMembers.filter(x => x.umd.characterId > 0);
  }

  /**
   * Gets a random number between two values
   * 
   * @param {number} min The min value 
   * @param {number} max The max value
   * 
   * @returns A number between min and max, both inclusive
   */
  private getRandomInt(min: number, max: number): number{
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
