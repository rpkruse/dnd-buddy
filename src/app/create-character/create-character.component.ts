import { Component, OnInit } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService } from '../services/services';

import { Class, ClassDetails, Race, RaceDetails } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-character',
  templateUrl: './create-character.component.html',
  styleUrls: ['./create-character.component.css', '../global-style.css'],
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
export class CreateCharacterComponent implements OnInit {

  races: Race = null;
  raceDetail: RaceDetails;

  classes: Class = null;
  classDetail: ClassDetails;

  selectedClassIndex: number = -1;
  selectedRaceIndex: number = -1;

  mouseOverClass: number = -1;
  mouseOverRace: number = -1;

  constructor(private _apiService: ApiService, private _modalService: NgbModal) { }

  ngOnInit() {
    let s: Subscription = this._apiService.getAllEntities<Class>("classes").subscribe(
      d => this.classes = d,
      err => console.log("unable to fetch classes", err),
      () => s.unsubscribe()
    );

    let j: Subscription = this._apiService.getAllEntities<Race>("races").subscribe(
      d => this.races = d,
      err => console.log("unable to fetch races"),
      () => { j.unsubscribe(); console.log(this.races); }
    );
  }

  public getClassesInRange(start: number, end: number): Class {
    let c: Class = {
      count: this.classes.count,
      results: this.classes.results.slice(start, end)
    };

    return c;
  }

  public getRacesInRange(start: number, end: number): Race {
    let r: Race = {
      count: this.races.count,
      results: this.races.results.slice(start, end)
    };

    return r;
  }

  public getClassDetails(url: string, index: number, content) {
    let s: Subscription = this._apiService.getSingleEntity<ClassDetails>(url).subscribe(
      d => this.classDetail = d,
      err => console.log("unable to fetch class", err),
      () => {
        s.unsubscribe();
        // this._modalService.open(content);
      }
    );
  }

  public getRaceDetails(url: string, index: number, content) {
    let s: Subscription = this._apiService.getSingleEntity<RaceDetails>(url).subscribe(
      d => this.raceDetail = d,
      err => console.log("unable to fetch race", err),
      () => {
        s.unsubscribe();
        console.log(this.raceDetail);
        // this._modalService.open(content);
      }
    );
  }

  public selectClass(index: number) {
    if (this.selectedClassIndex === index) {
      this.selectedClassIndex = -1;
      return;
    }

    this.selectedClassIndex = index;
  }

  public selectRace(index: number) {
    if (this.selectedRaceIndex === index) {
      this.selectedRaceIndex = -1;
      return;
    }

    this.selectedRaceIndex = index;
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

  private openModal(content) {
    this._modalService.open(content).result.then((result) => { //on close via ok

    }, (reason) => { //On close via click off

    });
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
