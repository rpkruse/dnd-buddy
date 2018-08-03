import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataShareService } from '../services/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', '../global-style.css']
})
export class HomeComponent implements OnInit {

  constructor(private _dataShareService: DataShareService, private _router: Router) { }

  ngOnInit() {
  }

  /**
   * 0 -> Game page
   * 
   * 1 -> Character info page
   * 
   * 2 -> User Characters
   * 
   * 3 -> New Character
   * 
   * @param {number} pageNum The page to move to  
   */
  public moveToPage(pageNum: number) {
    switch (pageNum) {
      case 0:
        this._router.navigate(['./game']);
        break;
      case 1:
        this._router.navigate(['./characterRaceDetails']);
        break;
      case 2:
        this._router.navigate(['./manageCharacter']);
        break;
      case 3:
        this._router.navigate(['./createCharacter']);
        break;
      default:
        break;
    }
  }
}
