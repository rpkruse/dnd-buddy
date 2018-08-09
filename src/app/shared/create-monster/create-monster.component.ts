import { Component, OnInit, Input } from '@angular/core';

import { ApiService, DndApiService } from '../../services/services';

import { Game, Monster, ApiMonster } from '../../interfaces/interfaces';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-monster',
  templateUrl: './create-monster.component.html',
  styleUrls: ['./create-monster.component.css', '../../global-style.css']
})
export class CreateMonsterComponent implements OnInit {

  @Input() game: Game;
  @Input() creatingMonster: boolean;
  @Input() monster: Monster;

  monsterInfo: ApiMonster;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService) { }

  ngOnInit() {}

  ngOnChanges() {
    if (!this.creatingMonster && this.monster) {
      this.getMonsterApiInfo();
    } else {
      this.monster = null;
      this.monsterInfo = null;
    }
  }

  private getMonsterApiInfo() {
    let s: Subscription = this._dndApiService.getSingleEntity<ApiMonster>(this.monster.url).subscribe(
      d => this.monsterInfo = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        console.log(this.monsterInfo);
      }
    )
  }

}
