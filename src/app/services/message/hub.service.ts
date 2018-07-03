/*
  Written by: Ryan Kruse
  This service controls our connection to the signalR hub on the api
*/
import { Injectable, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HubConnection } from '@aspnet/signalr';

import { DataShareService } from '../data/data-share.service';
// import * as signalR from '@aspnet/signalr';

import { UserMessageData, ItemMessageData, RollMessageData, OnlineUser } from '../../interfaces/interfaces';

@Injectable({
    providedIn: 'root'
})
export class HubService {
    onlineUserSubj: EventEmitter<OnlineUser[]> = new EventEmitter(null);

    userMessage: EventEmitter<UserMessageData> = new EventEmitter(null); //the user's placement in the queue
    groupMembersSubj: EventEmitter<OnlineUser[]> = new EventEmitter(null);
    rollDataSubj: EventEmitter<RollMessageData> = new EventEmitter<RollMessageData>(null);
    itemDataSubj: EventEmitter<ItemMessageData> = new EventEmitter<ItemMessageData>(null);


    private groupMembers: OnlineUser[] = [];
    private me: OnlineUser;

    notification: EventEmitter<string> = new EventEmitter();

    private HUB_URL: string = environment.message_api + 'messagehub';

    private hubConnection;

    constructor(private _dataShareService: DataShareService) { }

    /*
      This method is called when the user attempts to connect to the signalR hub.
    */
    public setConnection() {
        if (this.hubConnection == null) {
            //   this.hubConnection = new signalR.HubConnectionBuilder().withUrl(this.HUB_URL).build(); //change to this when updating to signalR 2.0
            this.hubConnection = new HubConnection(this.HUB_URL);
            this.hubConnection.on('connected', () => this._dataShareService.connected.next(true));
            this.hubConnection.on('sendConnectionNoticeToGroup', (msg) => this.sendConnectionNoticeToGroup(msg));
            this.hubConnection.on('sendDisconnectNoticeToGroup', (msg) => this.sendDisconnectNoticeToGroup(msg));
            this.hubConnection.on('sendRollNoticetoGroup', (msg) => this.sendRollNoticeToGroup(msg));
            this.hubConnection.on('okToStopConnection', () => this.okToStopConnection());
            this.hubConnection.on('updateLobby', (msgs) => this.updateLobby(msgs));
            this.hubConnection.on('getItem', (imd) => this.getItem(imd));
        }

        if (this.hubConnection.connection.connectionState !== 1) {
            this.hubConnection.start();
        }
    }

    /*
        This method is called when someone joins the group (it is sent to everyone but the person who joined)
    */
    public sendConnectionNoticeToGroup(umd: UserMessageData) {
        let index: number = this.groupMembers.findIndex(x => x.umd.characterId === umd.characterId);

        if (index >= 0) this.groupMembers.splice(index, 1);

        this.hubConnection.invoke("SetGroup", this.groupMembers, umd.groupName, umd.id);

        this.notification.emit(umd.name + " has joined the group");

        let u: OnlineUser = {
            umd: umd,
            rmd: this.setGenericRollData(umd),
            imd: this.setGenericItemData(umd)
        }

        this.groupMembers.push(u);
        this.groupMembersSubj.next(this.groupMembers);
    }

    public sendDisconnectNoticeToGroup(umd: UserMessageData) {
        this.notification.emit(umd.name + " has left the group");

        let index = this.groupMembers.findIndex(x => x.umd.characterId === umd.characterId);
        this.groupMembers.splice(index, 1);
        this.groupMembersSubj.next(this.groupMembers);
    }

    public sendRollNoticeToGroup(rmd: RollMessageData) {
        this.rollDataSubj.next(rmd);
    }

    /*
        This method is kinda bad b/c everyone in the lobby will spam the new person
        with everyone that has joined so far...
        for small groups this should not be a problem?
    */
    public updateLobby(users: OnlineUser[]) {
        if (this.groupMembers.length > 1) return;

        this.groupMembers = this.groupMembers.concat(users);
        this.groupMembersSubj.next(this.groupMembers);
    }

    public okToStopConnection() {
        this.hubConnection.stop();
        this._dataShareService.connected.next(false);
    }

    public getItem(imd: ItemMessageData) {
        this.itemDataSubj.emit(imd);
    }

    public invokeJoinGroup(userMessageData: UserMessageData) {
        let u: OnlineUser = {
            umd: userMessageData,
            rmd: this.setGenericRollData(userMessageData),
            imd: this.setGenericItemData(userMessageData)
        }

        this.me = u;

        this.hubConnection.invoke('JoinGroup', userMessageData);


        this.groupMembers.push(this.me);
        this.groupMembersSubj.emit(this.groupMembers);
    }

    public invokeRoll(rmd: RollMessageData) {
        this.hubConnection.invoke('SendRoll', rmd);
    }

    public invokeItem(itm: ItemMessageData) {
        this.hubConnection.invoke('SendItem', itm);
    }

    public invokeLeaveGroup() {
        this.hubConnection.invoke('LeaveGroup', this.me.umd);
        this.groupMembers = [];
        this.groupMembersSubj.next(this.groupMembers);
    }


    private setGenericRollData(umd: UserMessageData): RollMessageData {
        let rmd: RollMessageData;

        rmd = {
            charId: umd.characterId,
            maxRoll: 4,
            groupName: umd.groupName,
            roll: 1,
            numDice: 1
        };

        return rmd;
    }

    private setGenericItemData(umd: UserMessageData): ItemMessageData {
        let imd: ItemMessageData;

        imd = {
            groupName: umd.groupName,
            connectionId: umd.id,
            item: ""

        };

        return imd;
    }
}
