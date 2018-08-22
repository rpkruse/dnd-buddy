/*
  Written by: Ryan Kruse
  This component is used to display all of the playable races and classes to the user. It allows them to view details on each
*/
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { trigger, state, animate, transition, style } from '@angular/animations';

import { DndApiService } from '../../services/services';

import { Class, ClassDetails, Race, RaceDetails, SubRace, Trait, SubClass } from '../../interfaces/interfaces';
import { Subscription } from 'rxjs';

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
  subrace: SubRace;
  subClass: SubClass;


  classes: Class = null;
  classDetail: ClassDetails;

  trait: Trait;

  subMenuActive: boolean = false;
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
      () => { s.unsubscribe(); this.sortClasses(); }
    );

    let j: Subscription = this._dndApiService.getAllEntities<Race>("races").subscribe(
      d => this.races = d,
      err => console.log("unable to fetch races"),
      () => { j.unsubscribe(); this.sortRaces(); }
    );
  }

  /**
   * Called when the user clicks a playable race type. IT pulls all of the subraces from our DB
   * 
   * @param {string} url The url of the selected race type 
   */
  public getSubrace(url: string) {
    let s: Subscription;

    s = this._dndApiService.getSingleEntity<SubRace>(url).subscribe(
      d => this.subrace = d,
      err => console.log("unable to get subrace", err),
    () => { s.unsubscribe(); this.classDetail = null; }
    );
  }

  public getSubclassDetails(url: string, subclass) {
    let s: Subscription = this._dndApiService.getSingleEntity<SubClass>(url).subscribe(
      d => this.subClass = d,
      err => console.log("unable to load subclass", err),
      () => {
        s.unsubscribe();
        this._modalService.open(subclass, { size: 'lg' });
      }
    );
  }

  /**
   * Called when the user wants to get details of a specific class. It pulls it from the DB
   * 
   * @param {string} url The url of the class to get detailson
   */
  public getClassDetails(url: string) {
    let s: Subscription = this._dndApiService.getSingleEntity<ClassDetails>(url).subscribe(
      d => this.classDetail = d,
      err => console.log("unable to fetch class", err),
      () => { s.unsubscribe(); this.subrace = null; }
    );
  }

  /**
   * Called when the user opens a panel on a specific race type. It gets
   * all of the sub races of that type from the DB
   * 
   * @param {number} index The index of the race to get details on 
   */
  public getRaceDetails(url: string) {
    /*let s: Subscription = this._dndApiService.getRaceInfo(index).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to fetch race", err),
      () => {
        s.unsubscribe();
      }
    );*/
    let s: Subscription = this._dndApiService.getSingleEntity<RaceDetails>(url).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to fetch race", err),
      () => { s.unsubscribe(); this.sortSubraces(); }
    )
  }

  /**
   * Called when the user clicks on a trait to view. It pulls the trait from the 5e api and opens the modal to display
   * 
   * @param {string} url The url of the trait to pull
   * @param {any} content The modal 
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

  private sortClasses() {
    this.classes.results.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  private sortRaces() {
    this.races.results.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  private sortSubraces() {
    this.raceDetail.subraces.sort((a, b) => a.name > b.name ? 1 : -1);
    this.subMenuActive = !this.subMenuActive; //after we sort, we allow the user to see
  }

  /**
   * Appends words to each ability to make it look nicer on the DOM
   * 
   * @param {number[]} abilities The ability numbers to fix 
   */
  public fixAbilityBonuses(abilities: number[]): string[] { //str, dex, con, int, wis, char
    let s: string[] = [];

    s[0] = "STR: " + abilities[0];
    s[1] = " DEX: " + abilities[1];
    s[2] = " CON: " + abilities[2];
    s[3] = " INT: " + abilities[3];
    s[4] = " WIS: " + abilities[4];
    s[5] = " CHAR: " + abilities[5];
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