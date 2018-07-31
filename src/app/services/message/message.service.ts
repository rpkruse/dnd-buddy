/*
  Written by: Ryan Kruse
  This service is used to handle all of the information sent to and from the hub service
  It holds all of the songs, the most recent song, and our connection object
*/

import { Injectable } from '@angular/core';
import { OnlineUser, UserMessageData, ItemMessageData, RollMessageData, GridMessageData, ChatMessageData } from '../../interfaces/interfaces';
import { Subject, BehaviorSubject } from 'rxjs';
import { HubService } from '../message/hub.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private gridSize: number = 10; //nxn

  public groupMembers: OnlineUser[] = [];
  public chatMessages: Subject<ChatMessageData[]> = new BehaviorSubject<ChatMessageData[]>([]);
  public rollDataSubj: Subject<RollMessageData> = new BehaviorSubject<RollMessageData>(null);
  public itemDataSubj: Subject<ItemMessageData> = new BehaviorSubject<ItemMessageData>(null);

  public grid: GridMessageData[][] = [];

  constructor(private _hub: HubService) {
    this.grid = this.initGrid();

    this._hub.groupMembersSubj.subscribe(res => this.groupMembers = res);
    this._hub.chatMsgSubj.subscribe(res => this.chatMessages.next(res));

    this._hub.rollDataSubj.subscribe(res => this.rollDataSubj.next(res));
    this._hub.itemDataSubj.subscribe(res => this.itemDataSubj.next(res));

    this._hub.gridDataSubj.subscribe(res => this.updateGrid(res));
  }

  public setConnection() {
    this._hub.setConnection();
  }

  public joinGroup(userMessageData: UserMessageData) {
    this._hub.invokeJoinGroup(userMessageData);
  }

  public sendRoll(rmd: RollMessageData) {
    this._hub.invokeRoll(rmd);
  }

  public sendItem(itm: ItemMessageData) {
    if (!itm) {
      this.itemDataSubj.next(null);
      return;
    }
    this._hub.invokeItem(itm);
  }

  public sendGrid(gmd: GridMessageData) {
    this.grid[gmd.y][gmd.x] = gmd;

    this._hub.invokeGrid(gmd);
  }

  public sendMessage(cmd: ChatMessageData, privateMessage: boolean) {
    this._hub.invokeGroupMessage(cmd, privateMessage);
  }

  public leaveGroup() {
    this._hub.invokeLeaveGroup();
  }

  private updateGrid(gmd: GridMessageData) {
    if (!gmd) return;

    this.grid[gmd.y][gmd.x] = gmd;
  }

  public loadGridData(data: string) {
    for(let i = 0; i < this.grid.length; i++) {
      let row = this.grid[i];
      for (let j = 0; j < row.length; j++) {
          this.grid[i][j].type = data.charAt((i * 10) + (j));
      }
    }
  }

  public clearChatMessages() {
    this._hub.clearChatMessages();
  }

  private initGrid(): GridMessageData[][] {
    let g: GridMessageData[][] = [];
    let gmd: GridMessageData;
    for (let i = 0; i < this.gridSize; i++) {
      g[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        gmd = {
          x: j,
          y: i,
          type: "N", 
          name: " ",
          groupName: ""
        };

        g[i][j] = gmd;
      }
    }

    return g;
  }
}
