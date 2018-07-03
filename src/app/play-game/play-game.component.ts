import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, DataShareService, MessageService, StorageService, PlayManager } from '../services/services';
import { User, Game, Character, OnlineUser, UserMessageData, RollMessageData } from '../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

import { PlayDmComponent } from '../play-dm/play-dm.component';
import { PlayPlayerComponent } from '../play-player/play-player.component';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css', '../global-style.css']
})

export class PlayGameComponent implements OnInit {
  private user: User;
  private isAlive: boolean = true;
  public hasJoined: boolean = false;
  public mouseOver: number = -1;

  game: Game;
  character: Character = null;
  isGM: boolean = false;
  
  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, public _messageService: MessageService, 
    private _storageService: StorageService, private _router: Router, private _playManager: PlayManager) { }

  ngOnInit() {
    this.game = this._storageService.getValue('game');

    this._dataShareService.user.subscribe(res => this.user = res);
    this._dataShareService.connected.takeWhile(() => this.isAlive).subscribe(res => {if(res) this.getInfoToJoin();});
    this._messageService.rollDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setRollData(res));

    if(this.game){      
      this._messageService.setConnection();
      this._dataShareService.changeGame(this.game);
    }else{
      this._router.navigate(['/game']);
    }
  }

  /*
    This method is called once we are connected to the group in signalR. It pulls or character from the DB iff we are not the DM
  */
  private getInfoToJoin(){
    let s: Subscription;

    let charId: number = this.game.userId === this.user.userId ? -1 : this.game.character[this.game.character.findIndex(u => u.userId === this.user.userId)].characterId;
    if(charId < 0){
      this.isGM = true;
      this.joinGame(this.user.username + " (DM)", -1);
      return;
    }

    s = this._apiService.getSingleEntity<Character>("Characters/" + charId).subscribe(
      d => this.character = d,
      err => console.log("Unable to load character", err),
      () => {
        s.unsubscribe();
        let n: string = this.user.username + " (" + this.character.name + ")";
        this.joinGame(n, this.character.characterId);
      }
    );

  }

  /*
    This method is called once we are connected to sigalR.
    If we are the GM it gets all information we need from the api
    If we are th player it gets our class details from the api
    @param name: string - The name of the character or DM
    @param charId: number - The character ID of the current player (-1 if DM)
  */
  private joinGame(name: string, charId: number){
    let umd: UserMessageData = this._playManager.createUMD(name, charId, this.game.name);
    this._messageService.joinGroup(umd);
    this.hasJoined = true;

    if(!this.isGM)
      this._playManager.initClassDetails(this.character);
    else
      this._playManager.initGMInfo();
  }

  /* 
    This method is called when we get a message from SignalR saying that someone has rolled a new value
    it updates their value to display on the DOM
    @param rmd: RollMessageData - The roll message data of a player's roll
  */
  public setRollData(rmd: RollMessageData){
    if(rmd === null) return;

    let index: number = this._messageService.groupMembers.findIndex(x => x.rmd.charId === rmd.charId);
    if(index < 0) return;

    this._messageService.groupMembers[index].rmd = rmd;
  }

  /*
    This method is called to get all the other players in the group (minus the current user)
    @return OnlineUser[] - An array of all connected players minus us
  */
  public getOtherGroupMembers(): OnlineUser[]{
    if(this.isGM)
      return this._messageService.groupMembers.filter(x => x.umd.characterId > 0); //Filter the GM out
    else
      return this._messageService.groupMembers.filter(x => x.umd.characterId !== this.character.characterId); //filter ourself out
  }

  /*
    When we leave the page we want to unsub, disconnect from signalR group, and clear all of our values
  */
  ngOnDestroy(){
    this.isAlive = false;
    this.hasJoined = false;
    this._messageService.leaveGroup();
    this._storageService.removeValue('game');
    this._playManager.clearAllValues();
  }

}
