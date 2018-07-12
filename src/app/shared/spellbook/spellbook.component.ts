import { Component, OnInit, Input } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations';

import { ApiService, DndApiService } from '../../services/services';

import { ClassDetails, Spell, SpellDetails } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';

@Component({
  selector: 'app-spellbook',
  templateUrl: './spellbook.component.html',
  styleUrls: ['./spellbook.component.css', '../../global-style.css', '../shared-style.css'],
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

export class SpellbookComponent implements OnInit {
  @Input() cd: ClassDetails

  spellBook: Spell[] = [];
  spellDetail: SpellDetails;

  mouseOver: number = -1;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (!this.cd) return;
    this.getSpells();
  }

  private getSpells() {
    if (this.spellBook.length) return;

    let s: Subscription;
    let spell: Spell;

    for (let i = 0; i <= 9; i++) { //Spells only go up to 9th level
      s = this._dndApiService.getAllEntities<Spell>("spells/" + this.cd.name + "/level/" + i).subscribe(
        d => spell = d,
        err => console.log("Unable to get spells at", i, err),
        () => {
          this.spellBook.push(spell);

          if (i === 9) s.unsubscribe();
        }
      );
    }
  }

  /*
    This method is called when the user needs to get the details of a given spell. Once it is pulled, it emits the value
    @param path: string - The URL of the spell to get from the 5e api
  */
  public getSpellDetail(path: string) {
    let s: Subscription;

    s = this._dndApiService.getSingleEntity<SpellDetails>(path).subscribe(
      d => this.spellDetail = d,
      err => console.log("unable to get spell details"),
      () => s.unsubscribe()
    );
  }

  ngOnDestroy() {
    this.spellBook = [];
    this.spellDetail = null;
  }

}
