import { Component, OnInit, Input, HostListener } from '@angular/core';

import { ApiService, DndApiService } from '../../services/services';

import { SubClass, ClassDetails, Spell, SpellDetails, Character } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';
import { Results } from '../../interfaces/api/results';

export interface SimpleSpell {
  name: string,
  level: number,
  url: string
};

@Component({
  selector: 'app-spellbook',
  templateUrl: './spellbook.component.html',
  styleUrls: ['./spellbook.component.css', '../../global-style.css']
})

export class SpellbookComponent implements OnInit {
  @Input() cd: ClassDetails;
  @Input() character: Character;
  @Input() simpleView: boolean;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;

    this.onMobile = this.width <= 400;
  }

  spellBook: Spell[] = [];
  simpleSpellBook: SimpleSpell[] = [];

  spellDetail: SpellDetails;

  mouseOver: number = -1;

  show: boolean = true;

  width: number;
  private onMobile: boolean = false;

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

    if (this.character.subclass) {
      this.getSubClassSpells();
    } else {
      for (let i = 0; i <= 9; i++) { //Spells only go up to 9th level
        s = this._dndApiService.getAllEntities<Spell>("spells/" + this.cd.name.toLowerCase() + "/level/" + i).subscribe(
          d => spell = d,
          err => console.log("Unable to get spells at", i, err),
          () => {
            this.spellBook.push(spell);
            if (i === 9) {
              s.unsubscribe();
              this.setSimpleSpellBook();
              this.sortTabSpells();
            }
          }
        );
      }
    }
  }

  public getSubClassSpells() {
    let sc: SubClass;
    let s: Subscription = this._dndApiService.getSingleEntityEndpoint<SubClass>("subclasses/" + this.character.subclass.toLowerCase()).subscribe(
      d => sc = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        this.setSubClassSpells(sc);
      }
    )
  }

  public setSubClassSpells(sc: SubClass) {
    for(let i=0; i<sc.spells.length; i++) {
      let spell: SimpleSpell = {
        level: sc.spells[i].level_acquired,
        name: sc.spells[i].spell.name,
        url: sc.spells[i].spell.url
      };

      this.simpleSpellBook.push(spell);
    }

    this.sortSimpleSpellBook();
  }

  private setSimpleSpellBook() {
    for (let i = 0; i < this.spellBook.length; i++) {
      let spells: Results[] = this.spellBook[i].results;

      for (let j = 0; j < spells.length; j++) {
        let spell: SimpleSpell = {
          level: i+1,
          name: spells[j].name,
          url: spells[j].url
        };

        this.simpleSpellBook.push(spell);
      }
    }

    // this.sortSimpleSpellBook();
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
      () => {
        s.unsubscribe();
        if (this.onMobile) this.show = false;
      }
    );
  }

  public dismissSpell() {
    this.spellDetail = null;
    if (this.onMobile) this.show = true;
  }

  private sortSimpleSpellBook() {
    this.simpleSpellBook.sort((a, b) => a.level > b.level ? -1 : 1);
  }

  private sortTabSpells() {
    for (let i=0; i<this.spellBook.length; i++)
      this.spellBook[i].results.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  ngOnDestroy() {
    this.spellBook = [];
    this.spellDetail = null;
  }
}
