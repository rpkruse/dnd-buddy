import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';
import { Router } from '@angular/router';

import { ApiService, DndApiService, DataShareService, MessageService, StorageService, PlayManager } from '../services/services';
import { User, Game, Character, OnlineUser, UserMessageData, RollMessageData, ItemMessageData, ClassDetails, ClassLevels, Spell, SpellDetails, EquipmentCategory, EquipmentCategoryDetails, Equipment} from '../interfaces/interfaces';

import 'rxjs/add/operator/takeWhile';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css', '../global-style.css'],
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
export class PlayGameComponent implements OnInit {
  private user: User;
  private isAlive: boolean = true;
  public hasJoined: boolean = false;
  public mouseOver: number = -1;

  game: Game;
  character: Character = null;
  isGM: boolean = false;

  //Roll Fields
  numDice: number = 1; //number to roll
  dice: number[] = [4, 6, 8, 10, 12, 20]; //the dice values we can have
  rollMax: number = 4; //the max die value
  roll: number = 0; //what we got on our roll
  rollData: RollMessageData;

  //Character Info Fields
  classDetail: ClassDetails;
  levelDetails: ClassLevels;

  spellSlots: number[] = [];
  spellBook: Spell[] = [];
  spellDetail: SpellDetails;

  armor: Equipment;
  weapon: Equipment;
  shield: Equipment;


  equipmentTypes: EquipmentCategory;
  equipmentList: EquipmentCategoryDetails;
  equipmentItem: Equipment;

  itemData: ItemMessageData;

  
  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, public _messageService: MessageService, 
    private _storageService: StorageService, private _router: Router, private _playManager: PlayManager, private _modal: NgbModal) { }

  ngOnInit() {
    this.game = this._storageService.getValue('game');

    this._dataShareService.user.subscribe(res => this.user = res);
    // this._dataShareService.game.subscribe(res => this.game = res);
    this._dataShareService.connected.takeWhile(() => this.isAlive).subscribe(res => {if(res) this.getInfoToJoin();});
    this._messageService.rollDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setRollData(res));
    this._messageService.itemDataSubj.takeWhile(() => this.isAlive).subscribe(res => this.setItemData(res));

    this._playManager.classDetail.takeWhile(() => this.isAlive).subscribe(res => this.classDetail = res);
    this._playManager.levelDetail.takeWhile(() => this.isAlive).subscribe(res => this.handleLevelDetail(res));
    this._playManager.spellBook.takeWhile(() => this.isAlive).subscribe(res => this.spellBook = res);
    this._playManager.spellDetail.takeWhile(() => this.isAlive).subscribe(res => this.handleSpellDetail(res));

    this._playManager.equipmentCategories.takeWhile(() => this.isAlive).subscribe(res => this.equipmentTypes = res);

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
      let id: number = this.isGM ? -1 : this.character.characterId;
      let rmd: RollMessageData = this._playManager.createRMD(id, this.game.name, this.rollMax, this.roll, this.numDice);
      
      if(this._messageService.groupMembers.length > 1) this._messageService.sendRoll(rmd); //Check len here b/c we don't want to spam server with rolls that only one person can see (IE no one else is in the game but you)
    }
  }

  public clearRoll(){
    this.roll = 0;
    let id: number = this.isGM ? -1 : this.character.characterId;
    let rmd: RollMessageData = this._playManager.createRMD(id, this.game.name, 4, this.roll, 1);
    this._messageService.sendRoll(rmd);
  }


  public getAttrScore(attr: number){
    return Math.floor((attr - 10) /2);
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

        this.getCharacterItems();
      }
    );

  }

  private joinGame(name: string, charId: number){
    let umd: UserMessageData = this._playManager.createUMD(name, charId, this.game.name);
    this._messageService.joinGroup(umd);
    this.hasJoined = true;

    if(!this.isGM)
      this._playManager.initClassDetails(this.character);
    else
      this._playManager.initGMInfo();
  }

  private handleLevelDetail(LD: ClassLevels){
    if(LD === null) return;

    this.levelDetails = LD;

    if(this.levelDetails.spellcasting) {
      this.spellSlots = this._playManager.setSpellSlots(this.levelDetails);
      this._playManager.initSpellBook(this.classDetail, 9); //Do level 9 here so that the user can see all spell
    }
  }

  private getCharacterItems(){
    if(this.character.armor){
      let s: Subscription = this._playManager.getItem(this.character.armor).subscribe(
        d => this.armor = d,
        err => console.log("unable to get armor", err),
        () => s.unsubscribe()
      );
    }

    if(this.character.weapon){
      let s: Subscription = this._playManager.getItem(this.character.weapon).subscribe(
        d => this.weapon = d,
        err => console.log("unable to get weapon", err),
        () => s.unsubscribe()
      );
    }

    if(this.character.shield){
      let s: Subscription = this._playManager.getItem(this.character.shield).subscribe(
        d => this.shield = d,
        err => console.log("unable to get weapon", err),
        () => s.unsubscribe()
      );
    }
  }

  /*GM ACTIONS */
  public getListOfEquipment(url: string){
    if(url === "Choose") return;

    let s: Subscription = this._playManager.getItemList(url).subscribe(
      d => this.equipmentList = d,
      err => console.log("unable to get equipment list", err),
      () =>  s.unsubscribe()
    );
  }

  public getEquipmentItem(url: string){
    if(url === "Choose") return;

    let s: Subscription = this._playManager.getItem(url).subscribe(
      d => this.equipmentItem = d,
      err => console.log("unable to get equipment item", err),
      () => s.unsubscribe()
    );
  }

  public selectPlayer(id: string){
    if (id === "Choose") return;

    let imd: ItemMessageData = this._playManager.createIMD(id, this.game.name, this.equipmentItem.url);
    this._messageService.sendItem(imd);
  }

  /* Player ACTIONS */
  public openSpellBook(content){
    this._modal.open(content, {size: 'lg'});
  }
 
  public getSpellDetail(path: string){
    this._playManager.getSpellDetail(path);
  }

  public handleSpellDetail(spellDetail: SpellDetails){
    this.spellDetail = spellDetail; 
  }
  
  public castSpell(index: number){
    this.spellSlots[index]--;
  }

  /* MESSAGE HUB ACTIONS: */
  public setRollData(rmd: RollMessageData){
    if(rmd === null) return;

    let index: number = this._messageService.groupMembers.findIndex(x => x.rmd.charId === rmd.charId);
    if(index < 0) return;

    this._messageService.groupMembers[index].rmd = rmd;
  }

  public setItemData(itm: ItemMessageData){
    if(itm === null) return;

    this.itemData = itm;

    let item: Equipment;

    let s: Subscription = this._playManager.getItem(this.itemData.item).subscribe(
      d => item = d,
      err => console.log("Unable to get item", err),
      () => {
        s.unsubscribe();
        this.handleWeaponType(item);
      }
    )
  }

  private handleWeaponType(item: Equipment){
    switch(item.equipment_category){
      case "Weapon":
        this.character.weapon = item.url;
        break;
      case "Armor":
        if(item.name === "Shield") {
          this.character.shield = item.url;
          break;
        }

        this.character.armor = item.url;
        break;
      case "Shield":
        this.character.shield = item.url;
        break;
      default:
        return;
    }

    let s: Subscription = this._apiService.putEntity<Character>("Characters", this.character, this.character.characterId).subscribe(
      d => d = d,
      err => console.log("Unable to update character", err),
      () => { 
        s.unsubscribe();
        this.getCharacterItems();
      }
    )
  }

  /* MISC */
  private getRandomInt(min: number, max: number){
    return Math.floor(min + Math.random() * (max+1 - min));
  }

  ngOnDestroy(){
    this.isAlive = false;
    this.hasJoined = false;
    this._messageService.leaveGroup();
    this._storageService.removeValue('game');
    this._playManager.clearAllValues();
  }

}
