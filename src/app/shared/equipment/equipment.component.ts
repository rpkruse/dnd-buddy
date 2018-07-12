import { Component, OnInit, Input} from '@angular/core';

import { ApiService, DndApiService } from '../../services/services';

import { Character, Equipment } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  styleUrls: ['./equipment.component.css', '../../global-style.css', '../shared-style.css']
})
export class EquipmentComponent implements OnInit {
  @Input() character: Character;
  @Input() newItem: boolean = false;

  armor: Equipment = null;
  shield: Equipment = null;
  weapon: Equipment = null;
  ring_1: Equipment = null;
  ring_2: Equipment = null;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService) { }

  ngOnInit() {
    this.getItems();
  }

  ngOnChanges() {
    if (!this.character) return;
    if (this.newItem) this.getItems();
  }

  private getItems() {
    this.resetValues();

    if (this.character.armor) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.armor).subscribe(
        d => this.armor = d,
        err => console.log("unable to get armor", err),
        () => s.unsubscribe()
      );
    }

    if (this.character.weapon) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.weapon).subscribe(
        d => this.weapon = d,
        err => console.log("unable to get weapon", err),
        () => s.unsubscribe()
      );
    }

    if (this.character.shield) {
      let s: Subscription = this._dndApiService.getSingleEntity<Equipment>(this.character.shield).subscribe(
        d => this.shield = d,
        err => console.log("unable to get shield", err),
        () => s.unsubscribe()
      );
    }
  }

  resetValues() {
    this.armor = null;
    this.shield = null;
    this.weapon = null;
    this.ring_1 = null;
    this.ring_2 = null;
  }

  ngOnDestroy() {
    this.character = null;
    this.resetValues();
  }
}
