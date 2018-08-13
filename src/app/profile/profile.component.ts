import { Component, OnInit,  } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Router } from "@angular/router";

import { ApiService, DataShareService, StorageService } from '../services/services';

import { User, MessageOutput, MessageType } from '../interfaces/interfaces';

import { Subscription } from 'rxjs';

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

  constructor(private _apiService: ApiService, private _dataShareService: DataShareService, private _router: Router, private _storage: StorageService, private _modalService: NgbModal) { }

  ngOnInit() {
    this._dataShareService.user.takeWhile(() => this.isAlive).subscribe(res => this.user = res);
    this.oldUsername = this.user.username;
  }

  public saveUser() {
    if (this.password.length > 0) this.user.password = this.password;

    let s: Subscription = this._apiService.putEntity<User>("Users", this.user, this.user.userId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to update profile", MessageType.Failure),
      () => {
        s.unsubscribe();
        this.triggerMessage("", "Profile updated!", MessageType.Success);
        this.user.password = null;
        this._storage.saveToLocal('savedUsername', this.user.username);

        this._dataShareService.changeUser(this.user);
      }
    );
  }

  public confirmDeleteCharacter(content: any) {
    this._modalService.open(content).result.then((result) => { //On close via Confirm
      this.deleteUser(); 
    }, (reason) => { //on close via click off
    });
  }
  
  private deleteUser() {
    let s: Subscription = this._apiService.deleteEntity<User>("Users", this.user.userId).subscribe(
      d => d = d,
      err => this.triggerMessage("", "Unable to delete profile", MessageType.Failure),
      () =>{
        s.unsubscribe();
        this.triggerMessage("", "Profile deleted", MessageType.Success);
        this._storage.setValue("loggedIn", false);
        this._dataShareService.changeUser(null);
        this._router.navigate(['login']);
      }
    );
  }

  public cancelChanges() {
    this.user.username = this.oldUsername;
    this.password = "";
    this.confirmPassword = "";
  }

  public passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  public madeChanges(): boolean {
    return (this.user.username !== this.oldUsername && this.user.username.length > 0) || (this.password.length > 0 && this.confirmPassword.length > 0 && this.passwordsMatch());
  }

  private triggerMessage(message: string, action: string, level: MessageType) {
    let out: MessageOutput = {
      message: message,
      action: action,
      level: level
    };

    this._dataShareService.changeMessage(out);
  }

  ngOnDestroy() {
    this.isAlive = false;
  }

}
