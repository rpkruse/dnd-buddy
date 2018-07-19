/*
  Written by: Ryan Kruse
  This component allows for the user to view their current characters, delete a character, or create a new character
*/

import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DndApiService, DataShareService } from '../../services/services';

import { ClassDetails, RaceDetails, Equipment, Character, User, MessageType, MessageOutput } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-character-manager',
  templateUrl: './character-manager.component.html',
  styleUrls: ['./character-manager.component.css', '../../global-style.css'],
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
export class CharacterManagerComponent implements OnInit {
  private user: User;

  characters: Character[] = [];
  selectedCharacter: Character;

  classDetail: ClassDetails;
  raceDetail: RaceDetails;

  armor: Equipment;
  weapon: Equipment;
  shield: Equipment;

  mouseOver: number = -1;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _modalService: NgbModal) { }

  ngOnInit() {
    this._dataShareService.user.subscribe(res => this.user = res);

    let s: Subscription;

    s = this._apiService.getAllEntities<Character>("Characters/user/" + this.user.userId).subscribe(
      d => this.characters = d,
      err => console.log("Unable to get list of characters"),
      () => s.unsubscribe()
    );
  }

  /*
    This method is called when the user clicks a character to get the details on.
    It pulls their class, race, and equipment from the 5e api
    @param character: Character - The character to get the details on
  */
  public getCharacterDetails(character: Character) {
    this.selectedCharacter = character;
  
  
    let s, j: Subscription;

    s = this._dndApiService.getSingleEntity<ClassDetails>(this.selectedCharacter.class).subscribe(
      d => this.classDetail = d,
      err => console.log("unable to get class info"),
      () => s.unsubscribe()
    );

    j = this._dndApiService.getSingleEntity<RaceDetails>(this.selectedCharacter.race).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to get race info"),
      () => j.unsubscribe()
    );

  }
  
  /*
    This method is called when the user clicks the delete button on a character
    it opens the a modal to confirm the delete
    @param content - The modal
    @param event - used to stop propagation
    @param character?: Character - The character to delete
  */
  public confirmDeleteCharacter(content, event, character?: Character) {
    event.stopPropagation();
    if (character) this.selectedCharacter = character;
    this._modalService.open(content).result.then((result) => { //On close via save
      this.deleteCharacter(); //When we save, we attempt to add all needed entities to the DB
    }, (reason) => { //on close via click off
    });
  }

  /*
    This method is called when the user clicks confirm on deleting their character. It removes them from
    the database
  */
  private deleteCharacter() {
    let s: Subscription;

    s = this._apiService.deleteEntity<Character>("Characters", this.selectedCharacter.characterId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete character", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Character Deleted!", MessageType.Success);
        let index: number = this.characters.findIndex(x => x.characterId === this.selectedCharacter.characterId);

        this.characters.splice(index, 1);

        this.selectedCharacter = null;
      }
    )
  }

  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }

}
