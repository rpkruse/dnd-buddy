/*
  TODO:
    Fix the song start on connection thing, it isn't working
      we are getting the values, but we are not actually starting the song at the given value
*/

/*
  Written by: Ryan Kruse
  This service is used to handle all of the information sent to and from the hub service
  It holds all of the songs, the most recent song, and our connection object
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OnlineUser, UserMessageData, ItemMessageData, RollMessageData } from '../../interfaces/interfaces';
import { Subject, BehaviorSubject } from 'rxjs';
import { HubService } from '../message/hub.service';
import { StorageService } from '../session/session-storage.service';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  public groupMembers: OnlineUser[] = [];
  public rollDataSubj: Subject<RollMessageData> = new BehaviorSubject<RollMessageData>(null);
  public itemDataSubj: Subject<ItemMessageData> = new BehaviorSubject<ItemMessageData>(null);

  constructor(private _http: HttpClient, private _hub: HubService, private _storage: StorageService, private _apiService: ApiService) {
    this._hub.notification.subscribe(res => this.notify(res));
    this._hub.groupMembersSubj.subscribe(res => this.groupMembers = res);

    this._hub.rollDataSubj.subscribe(res => this.rollDataSubj.next(res));
    this._hub.itemDataSubj.subscribe(res => this.itemDataSubj.next(res));
  }

  public setConnection(){
    this._hub.setConnection();
  }

  public joinGroup(userMessageData: UserMessageData){
      this._hub.invokeJoinGroup(userMessageData);
  }

  public sendRoll(rmd: RollMessageData){
    this._hub.invokeRoll(rmd);
  }

  public sendItem(itm: ItemMessageData){
    this._hub.invokeItem(itm);
  }

  public leaveGroup(){
      this._hub.invokeLeaveGroup();
  }

  public notify(msg: string){
      console.log(msg);
  }
}
