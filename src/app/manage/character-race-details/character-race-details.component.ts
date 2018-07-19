/*
  Written by: Ryan Kruse
  This component is used to display all of the playable races and classes to the user. It allows them to view details on each
*/
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { trigger, state, animate, transition, style } from '@angular/animations';

import { DndApiService } from '../../services/services';

import { Class, ClassDetails, Race, RaceDetails, SubRace, Trait } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { toInteger } from '@ng-bootstrap/ng-bootstrap/util/util';

@Component({
  selector: 'character-race-details',
  templateUrl: './character-race-details.component.html',
  styleUrls: ['./character-race-details.component.css', '../../global-style.css'],
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
export class CharacterRaceDetails implements OnInit {

  races: Race = null;
  raceDetail: RaceDetails;
  raceDetailIndex: number = -1;
  subrace: SubRace;

  classes: Class = null;
  classDetail: ClassDetails;

  trait: Trait;

  selectedClassIndex: number = -1;
  selectedRaceIndex: number = -1;

  mouseOverClass: number = -1;
  mouseOverRace: number = -1;
  mouseOverTrait: number = -1;
  subMenuActive: boolean = false;
  raceTabActive: boolean = true;
  languageListActive: boolean = false;
  traitsListActive: boolean = false;
  proficiencyChoiceListActive: boolean = false;
  proficiencyListActive: boolean = false;
  savingThrowsListActive: boolean = false;
  subclassesListActive: boolean = false;

  constructor(private _dndApiService: DndApiService, private _modalService: NgbModal) { }

  ngOnInit() {
    let s: Subscription = this._dndApiService.getAllEntities<Class>("classes").subscribe(
      d => this.classes = d,
      err => console.log("unable to fetch classes", err),
      () => s.unsubscribe()
    );

    let j: Subscription = this._dndApiService.getAllEntities<Race>("races").subscribe(
      d => this.races = d,
      err => console.log("unable to fetch races"),
      () => j.unsubscribe()
    );
  }

   /*
    Sets property on what tab is active.
    @param tab: string - The tab to be activated.
  */
  public openTab(tab: string) {
    this.subMenuActive = false;

    if (tab === 'races' ) {
      this.raceTabActive = true;
    } else if (tab === 'classes') {
      this.raceTabActive = false;
    }
  }

  public toggleLanguageList() {
    this.languageListActive = !this.languageListActive;
  }

  public toggleTraitsList() {
    this.traitsListActive = !this.traitsListActive;
  }

  public toggleProficiencyChoiceList() {
    this.proficiencyChoiceListActive = !this.proficiencyChoiceListActive;
  }

  public toggleProficiencyList() {
    this.proficiencyListActive = !this.proficiencyListActive;
  }

  public toggleSavingThrowsList() {
    this.savingThrowsListActive = !this.savingThrowsListActive;
  }

  public toggleSubClassesList() {
    this.subclassesListActive = !this.subclassesListActive;
  }

  /*
    This method is called when the use clicks a playable race type. It pulls all of the subraces from
    our 5e database
    @param url: string - The url of the selected race type
  */
  public getSubrace(url: string){
    this.classDetail = null;
    let s: Subscription;

    s = this._dndApiService.getSingleEntity<SubRace>(url).subscribe(
      d => this.subrace = d,
      err => console.log("unable to get subrace", err),
      () => s.unsubscribe()
    );

  }

  public resetTabs() {
    this.raceDetail = null;
    this.raceDetailIndex = -1;
    return;
  }

  /*
    This method is called whenever the user changes the subrace panel they are viewing
  */
  public changeSubRace(num: number) {
    this.getRaceDetails(num);
  }

  /*
    This method is called whenever the user wants to get details of a specific class. It pulls it from the DB
    @param url: string - The url of the class to get details on
  */
  public getClassDetails(url: string) {
    this.subrace = null;
    let s: Subscription = this._dndApiService.getSingleEntity<ClassDetails>(url).subscribe(
      d => this.classDetail = d,
      err => console.log("unable to fetch class", err),
      () => s.unsubscribe()
    );
  }

  /*
    This method is called when the user opens a panel on a specific race type
    It gets all of the sub races of that type from the DB
    @param index: number - The index of the race to get details on
  */
  public getRaceDetails(index: number) {
    let s: Subscription = this._dndApiService.getRaceInfo(index).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to fetch race", err),
      () => {
        s.unsubscribe();
        this.raceDetailIndex =  this.raceDetailIndex === (index-1) ?  -1 : (index-1);
      }
    );
  }

  /*
    This method is called when the user clicks on a trait to view. It pulls the trait from the 5e api
    and opens a modal to display the description
    @param url: string - The url of the trait to pull
  */
  public getTraitDetails(url: string, content) {
    let s: Subscription = this._dndApiService.getSingleEntity<Trait>(url).subscribe(
      d => this.trait = d,
      err => console.log("unable to load trait", err),
      () => {
        s.unsubscribe();
        this._modalService.open(content, { size: 'lg' });
      }
    );
  }

  /*
    This method appends words to each ability to make it look nicer on the DOM
  */
  public fixAbilityBonuses(abilities: number[]): string[]{ //str, dex, con, int, wis, char
    let s: string[] = [];

    s[0] = "str: " + abilities[0];
    s[1] = " dex: " + abilities[1];
    s[2] = " con: " + abilities[2];
    s[3] = " int: " + abilities[3];
    s[4] = " wis: " + abilities[4];
    s[5] = " char: " + abilities[5];
    return s;
  }

  public getClassImage(className: string): string {
    let path = "assets/class_imgs/";
    className = className.toLocaleLowerCase();

    return path + className + ".png";
  }

  public getRaceImage(className: string): string {
    let path = "assets/race_imgs/";
    className = className.toLocaleLowerCase();

    return path + className + ".png";
  }
}
