/*
  Written by: Ryan Kruse
  This component controls all of the actions for the DM (and view). It allows them to make rolls and give items to the players in the game
*/
import { Component, OnInit, EventEmitter } from '@angular/core';
import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

import {
  User, Game, ItemMessageData, RollMessageData,
  Equipment, EquipmentCategory, EquipmentCategoryDetails,
  MessageOutput, MessageType, OnlineUser, XP, Character, Monster
} from '../../interfaces/interfaces';

import { PlayManager, DataShareService, MessageService, DndApiService, ApiService } from '../../services/services';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'play-dm',
  templateUrl: './play-dm.component.html',
  styleUrls: ['./play-dm.component.css', '../../global-style.css']
})
export class PlayDmComponent implements OnInit {
  private isAlive: boolean = true;

  user: User;
  game: Game;

  //Equipment Giving:
  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  equipmentItem: Equipment;

  deadMonster: Monster;

  constructor(private _playManager: PlayManager, private _dataShareService: DataShareService, private _messageService: MessageService, 
              private _dndApiService: DndApiService, private _apiService: ApiService) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this._dataShareService.game.takeWhile(() => this.isAlive).subscribe(res => this.game = res);
  }

  /**
   * Called whenever the user clicks the roll button, it will roll n number die and send the value rolled
   * to all other users in the game iff hiden is false
   * 
   * @param {boolean} hidden If the value rolled should be sent to all users or not  [this.rollMax, this.roll, this.numDice]
   */
  public rollDice(rollInfo: number[]) {
    let RMD: RollMessageData
    RMD = this._playManager.createRMD(-1, this.game.name, rollInfo[0], rollInfo[1], rollInfo[2]);
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

  public setDeadMonster(monster: Monster) {
    this.deadMonster = monster;
  }
  public giveXP(amount: number) {
    if (!amount || amount === 0) return;

    let currentlyOnline: OnlineUser[] = this.getOtherGroupMembers();

    
    let toGiveTo: Character[] = this.game.character.filter(gc => currentlyOnline.some(co => gc.characterId === co.umd.characterId));

    if (!toGiveTo) return;

    let givenAmount: number = Math.floor(amount/toGiveTo.length);

    for(let i=0; i<toGiveTo.length; i++) {
      toGiveTo[i].xp += givenAmount;
      this.checkForLevelUp(toGiveTo[i]);
    }
  }

  private checkForLevelUp(character: Character) {
    let s: Subscription;
    let nextLevel: number = character.level + 1;
    let xp: XP;
    s = this._dndApiService.getSingleEntity<XP>(environment.dnd_api + "XP/" + nextLevel).subscribe(
      d => xp = d,
      err => console.log("unable to get xp for next level"),
      () => {
        s.unsubscribe();

        if (xp.xp <= character.xp) character.level++;

        this.updateCharacter(character);
      }
    )
  }

  private updateCharacter(character: Character) {
    let s: Subscription = this._apiService.putEntity<Character>("Characters", character, character.characterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to give XP", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "XP given!", MessageType.Success);
      }
    )
  }

  /**
   * Called to filter ourself out of the connected members (so that we cannot select ourself)
   * 
   * @returns An array of all connected players excluding ourself
   */
  public getOtherGroupMembers(): OnlineUser[] {
    return this._messageService.groupMembers.filter(x => x.umd.characterId > 0);
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
