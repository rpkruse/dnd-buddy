import { Component, OnInit } from '@angular/core';

import { ApiService, DataShareService } from '../services/services';

import { User } from '../interfaces/interfaces';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css', '../global-style.css']
})
export class ProfileComponent implements OnInit {
  user: User;
  private isAlive: boolean = true;

  oldUsername: string = "";
  password: string = "";
  confirmPassword: string = "";

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this.oldUsername = this.user.username;

    console.log(this.user);
  }

  public saveUser() {
    console.log(this.user);
  }

  public cancelChanges() {
    this.user.username = this.oldUsername;
    this.password = "";
    this.confirmPassword = "";
  }

  public passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
