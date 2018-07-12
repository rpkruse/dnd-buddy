import { Component, OnInit, Input} from '@angular/core';

import { ApiService } from '../../services/services';
import { Character } from '../../interfaces/interfaces';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css', '../../global-style.css', '../shared-style.css']
})
export class StatsComponent implements OnInit {
  @Input() character: Character;

  constructor(private _apiService: ApiService) { }

  ngOnInit() {
  }

  public getAttrScore(attr: number): string{
    let v: string = "";

    let n: number = Math.floor((attr - 10) / 2);

    if(n >= 0)
      v += "(+" + n + ")";
    else
      v += "(-" + n + ")";

    return v;
  }
}
