import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, DataShareService, MessageService, StorageService} from '../services/services';
import { User, Game, Character, OnlineUser, UserMessageData, RollMessageData, ItemMessageData, ClassDetails } from '../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css', '../global-style.css']
})
export class PlayGameComponent implements OnInit {
  private user: User;
  private isAlive: boolean = true;
  public hasJoined: boolean = false;

  game: Game;
  character: Character = null;
  isGM: boolean = false;

  numDice: number = 1; //number to roll
  dice: number[] = [4, 6, 8, 10, 12, 20]; //the dice values we can have
  rollMax: number = 4; //the max die value
  roll: number = 0; //what we got on our roll
  rollData: RollMessageData;

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, public _messageService: MessageService, private _storageService: StorageService, private _router: Router) { }

  ngOnInit() {
    this.game = this._storageService.getValue('game');

    this._dataShareService.user.subscribe(res => this.user = res);
    // this._dataShareService.game.subscribe(res => this.game = res);
    this._dataShareService.connected.takeWhile(() => this.isAlive).subscribe(res => {if(res) this.getInfoToJoin();});
    this._messageService.rollDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setRollData(res));

    if(this.game !== null){      
      this._messageService.setConnection();
      this._dataShareService.changeGame(this.game);
    }else{
      this._router.navigate(['/game']);
    }
  }

  public rollDice(hidden: boolean){
    let max: number = this.rollMax * this.numDice;
    let min: number = 1 * this.numDice;

    this.roll = this.getRandomInt(min, max);

    if(!hidden){
      let rmd: RollMessageData = {
        charId: this.isGM ? -1 : this.character.characterId,
        groupName: this.game.name,
        maxRoll: this.rollMax,
        roll: this.roll,
        numDice: this.numDice
      };
      
      this._messageService.sendRoll(rmd);
    }
  }

  public setRollData(rmd: RollMessageData){
    if(rmd === null) return;

    let index: number = this._messageService.groupMembers.findIndex(x => x.rmd.charId === rmd.charId);
    if(index < 0) return;

    this._messageService.groupMembers[index].rmd = rmd;
  }

  public clearRoll(){
    this.roll = 0;

    let rmd: RollMessageData = {
      charId: this.isGM ? -1 : this.character.characterId,
      groupName: this.game.name,
      maxRoll: 4,
      roll: this.roll,
      numDice: 1
    };

    this._messageService.sendRoll(rmd);
  }

  public getOtherGroupMembers(): OnlineUser[]{
    let members: OnlineUser[] = [];

    if(this.isGM)
      members = this._messageService.groupMembers.filter(x => x.umd.characterId > 0); //Filter the GM out
    else
      members = this._messageService.groupMembers.filter(x => x.umd.characterId !== this.character.characterId); //filter ourself out

    return members;
  }

  private getInfoToJoin(){
    let s: Subscription;

    let charId: number = this.game.userId === this.user.userId ? -1 : this.game.character[this.game.character.findIndex(u => u.userId === this.user.userId)].characterId;
    if(charId < 0){
      this.isGM = true;
      this.joinGame(this.user.username + " (GM)", -1);
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

  private joinGame(name: string, charId: number){
    let umd: UserMessageData = {
      id: "",
      name: name,
      characterId: charId,
      groupName: this.game.name
    };

    this._messageService.joinGroup(umd);
    this.hasJoined = true;
  }

  private getRandomInt(min: number, max: number){
    // return Math.floor(Math.random() * (max - min)) + min;
    return Math.floor(min + Math.random() * (max+1 - min));
  }

  private leaveGame(){
    this._router.navigate(['/game']);
    /*this.isAlive = false;
    this.hasJoined = false;
    this._messageService.leaveGroup();
    this._storageService.removeValue('game');*/
  }

  ngOnDestroy(){
    // this._router.navigate(['/game']);
    this.isAlive = false;
    this.hasJoined = false;
    this._messageService.leaveGroup();
    this._storageService.removeValue('game');
  }

}
