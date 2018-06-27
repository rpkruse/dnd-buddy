/*
  Written by: Ryan Kruse
  This service controls our connection to the signalR hub on the api
*/
import { Injectable, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HubConnection } from '@aspnet/signalr';

import { DataShareService } from '../data/data-share.service';
// import * as signalR from '@aspnet/signalr';

import { UserMessageData, ItemMessageData, RollMessageData } from '../../interfaces/interfaces';

@Injectable({
    providedIn: 'root'
})
export class HubService {
    userMessage: EventEmitter<UserMessageData> = new EventEmitter(null); //the user's placement in the queue
    groupMembersSubj: EventEmitter<UserMessageData[]> = new EventEmitter(null);

    private groupMembers: UserMessageData[] = [];
    private me: UserMessageData;

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
            this.hubConnection.on('okToStopConnection', () => this.hubConnection.stop());
            this.hubConnection.on('updateLobby', (msgs) => this.updateLobby(msgs));
        }

        if (this.hubConnection.connection.connectionState !== 1) {
            this.hubConnection.start();
        }
    }

    public sendConnectionNoticeToGroup(umd: UserMessageData) {
        console.log(umd);
        this.hubConnection.invoke("SetGroup", this.groupMembers, umd.groupName, umd.id);

        this.notification.emit(umd.name + " has joined the group");
        this.groupMembers.push(umd);
        this.groupMembersSubj.next(this.groupMembers);

        console.log("mems on connect", this.groupMembers);
    }

    public sendDisconnectNoticeToGroup(umd: UserMessageData) {
        this.notification.emit(umd.name + " has left the group");
        let index = this.groupMembers.findIndex(x => x.name === umd.name);
        this.groupMembers.splice(index, 1);
        this.groupMembersSubj.next(this.groupMembers);

        console.log("mems on disconnect", this.groupMembers.length);

    }

    public updateLobby(umds: UserMessageData[]){
        this.groupMembers = umds;
        this.groupMembersSubj.next(umds);
    }

    public invokeJoinGroup(userMessageData: UserMessageData) {
        this.me = userMessageData;
        this.hubConnection.invoke('JoinGroup', userMessageData);
        this.groupMembers.push(this.me);
        this.groupMembersSubj.emit(this.groupMembers);
    }

    public invokeLeaveGroup() {
        this.hubConnection.invoke('LeaveGroup', this.me);
        this._dataShareService.connected.next(false);
        this.groupMembers = [];
        this.groupMembersSubj.next(this.groupMembers);
    }

}
