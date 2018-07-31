/**
 * [TODO]:
 *  1) Allow for users to equip gear from their bags
 *  2) Give players XP, allow for GM to give all players in their game XP
 */
import { Component, OnInit } from '@angular/core';

import { SnackbarComponent } from './components';

import { ApiService, DataShareService, StorageService } from './services/services';
import { User } from './interfaces/interfaces';

import { Class, ClassDetails } from './interfaces/interfaces';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './global-style.css']
})
export class AppComponent implements OnInit {
  user: User;

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, private _storage: StorageService) { }

  isNavbarCollapsed: boolean = true;

  ngOnInit() {
    if(this.isLoggedIn()){
      let s: Subscription;
      let tempUser: User;

      s = this._apiService.validateToken().subscribe(
        d => tempUser = d,
        err => console.log(err),
        () => {
          s.unsubscribe();
          this.user = tempUser;
          this._dataShareService.changeUser(this.user);
        }
      );
    }

    this._dataShareService.user.subscribe(res => this.user = res);
  }


  public getUser(): User{
    return this.user;
  }

  public isLoggedIn(): boolean {
    return this._storage.getValue('loggedIn') || this._storage.getValue('token');
  }

  public logout(){
    this._storage.setValue("loggedIn", false);
    this._storage.removeValue("token");
    this._dataShareService.clearAllValues();
  }
}
