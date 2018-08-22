import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DndApiService } from '../../services/services';
import { Character, ClassDetails, ClassLevels, SubRace, Trait } from '../../interfaces/interfaces';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators/debounceTime';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css', '../../global-style.css', '../shared-style.css']
})
export class StatsComponent implements OnInit {
  @Input() character: Character;
  @Input() playing: boolean = false;

  @Output() newHealth: EventEmitter<number> = new EventEmitter<number>();

  levelInfo: ClassLevels;
  lastCharID: number = -1;

  cd: ClassDetails;
  raceDetails: SubRace;
  trait: Trait;

  healthChanged: Subject<number> = new Subject<number>();

  stats: string[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
  
  profsVisible: boolean = false;
  featsVisible: boolean = false;
  traitsVisible: boolean = false;
  langVisible: boolean = false;

  show: boolean = true;

  constructor(private _dndApiService: DndApiService, private _modalService: NgbModal) { }

  ngOnInit() {
    let s: Subscription = this._dndApiService.getSingleEntity<ClassDetails>(this.character.class).subscribe(
      d => this.cd = d,
      err => console.log("unable to get class details", err),
      () => {
        s.unsubscribe();
        this.getLevelDetails(this.cd);
        for (let i = 0; i < this.stats.length; i++) {
          for (let j = 0; j < this.cd.saving_throws.length; j++) {
            if (this.stats[i] === this.cd.saving_throws[j].name) {
              let fixed: string = "*" + this.stats[i] + ":";
              this.stats[i] = fixed;
            }
          }
        }
      }
    );

    let j: Subscription = this.healthChanged.pipe(debounceTime(500)).subscribe(res => this.saveNewHP(res));
  }

  ngOnChanges() {
    if (!this.character) return;

    if (this.character.characterId != this.lastCharID) {
      this.lastCharID = this.character.characterId;
      this.getLevelDetails(this.cd);
    }
  }

  public setHPValue(val: number) {
    let lastHp: number = this.character.hp;

    this.character.hp += val;

    if (this.character.hp > this.character.max_HP) this.character.hp = this.character.max_HP;
    
    if (lastHp != this.character.hp) this.healthChanged.next(this.character.hp);
  }

  private saveNewHP(hp: number) {
    this.newHealth.emit(hp);
  }

  private getLevelDetails(cd: ClassDetails) {
    if (!cd) return;
    
    let s: Subscription = this._dndApiService.getLevelInfo(cd.class_levels.class, this.character.level).subscribe(
      d => this.levelInfo = d,
      err => console.log("unable to get level info", err),
      () => s.unsubscribe()
    );

    let k: Subscription = this._dndApiService.getSingleEntity<SubRace>(this.character.race).subscribe(
      d => this.raceDetails = d,
      err => console.log("unable to get race detail", err),
      () => k.unsubscribe()
    );
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

  public getAttrScore(attr: number): string {
    let v: string = "";

    let n: number = Math.floor((attr - 10) / 2);

    if (n >= 0)
      v += "(+" + n + ")";
    else
      v += "(" + n + ")";

    return v;
  }

  public getProf(): string[] {
    return this.character.profs.split(",");
  }
}
