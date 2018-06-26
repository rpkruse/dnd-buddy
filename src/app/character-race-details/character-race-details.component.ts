import { Component, OnInit } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { DndApiService } from '../services/services';

import { Class, ClassDetails, Race, RaceDetails } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'character-race-details',
  templateUrl: './character-race-details.component.html',
  styleUrls: ['./character-race-details.component.css', '../global-style.css'],
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

  classes: Class = null;
  classDetail: ClassDetails;

  selectedClassIndex: number = -1;
  selectedRaceIndex: number = -1;

  mouseOverClass: number = -1;
  mouseOverRace: number = -1;

  constructor(private _dndApiService: DndApiService) { }

  ngOnInit() {
    let s: Subscription = this._dndApiService.getAllEntities<Class>("classes").subscribe(
      d => this.classes = d,
      err => console.log("unable to fetch classes", err),
      () => s.unsubscribe()
    );

    let j: Subscription = this._dndApiService.getAllEntities<Race>("races").subscribe(
      d => this.races = d,
      err => console.log("unable to fetch races"),
      () => { j.unsubscribe(); console.log(this.races); }
    );
  }

  public getClassDetails(url: string, index: number, content) {
    let s: Subscription = this._dndApiService.getSingleEntity<ClassDetails>(url).subscribe(
      d => this.classDetail = d,
      err => console.log("unable to fetch class", err),
      () => {
        s.unsubscribe();
        // this._modalService.open(content);
      }
    );
  }

  public getRaceDetails(url: string, index: number, content) {
    let s: Subscription = this._dndApiService.getSingleEntity<RaceDetails>(url).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to fetch race", err),
      () => {
        s.unsubscribe();
        console.log(this.raceDetail);
        // this._modalService.open(content);
      }
    );
  }

  public fixAbilityBonuses(abilities: string[]): string[]{ //str, dex, con, int, wis, char
    let s: string[] = [];

    s[0] = "str: " + abilities[0];
    s[1] = "dex: " + abilities[1];
    s[2] = "con: " + abilities[2];
    s[3] = "int: " + abilities[3];
    s[4] = "wis: " + abilities[4];
    s[5] = "char: " + abilities[5];
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
