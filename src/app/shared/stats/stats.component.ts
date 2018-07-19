import { Component, OnInit, Input } from '@angular/core';

import { DndApiService } from '../../services/services';
import { Character, ClassDetails, ClassLevels } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css', '../../global-style.css', '../shared-style.css']
})
export class StatsComponent implements OnInit {
  @Input() character: Character;

  levelInfo: ClassLevels;

  stats: string[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  constructor(private _dndApiService: DndApiService) { }

  ngOnInit() {
    let cd: ClassDetails;
    let s: Subscription = this._dndApiService.getSingleEntity<ClassDetails>(this.character.class).subscribe(
      d => cd = d,
      err => console.log("unable to get class details", err),
      () => {
        s.unsubscribe();
        this.getLevelDetails(cd);
        for (let i = 0; i < this.stats.length; i++) {
          for (let j = 0; j < cd.saving_throws.length; j++) {
            if (this.stats[i] === cd.saving_throws[j].name) {
              let fixed: string = "*" + this.stats[i] + ":";
              this.stats[i] = fixed;
            }
          }
        }
      }
    );
  }

  private getLevelDetails(cd: ClassDetails) {
    let s: Subscription = this._dndApiService.getLevelInfo(cd.class_levels.class, this.character.level).subscribe(
      d => this.levelInfo = d,
      err => console.log("unable to get level info", err),
      () => s.unsubscribe()
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
}