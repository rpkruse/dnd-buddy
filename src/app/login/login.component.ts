import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService, StorageService, DataShareService } from '../services/services';

import { User } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../global-style.css']
})
export class LoginComponent implements OnInit {
  invalidLogin: boolean = false;
  private username: string = "";
  private password: string = "";
  private rememberMe: boolean = true;

  createUser: boolean = false;

  usernameTaken: boolean = false;
  private hasClickedOff: boolean = false;

  private createUsername: string = "";
  private createPassword: string = "";
  private createPasswordConfirm: string = "";

  constructor(private _apiService: ApiService, public _storage: StorageService, private _router: Router, private _dataShareService: DataShareService) { }

  ngOnInit() {
    let usrName = this._storage.getFromLocal('savedUsername');

    if(usrName) this.username = usrName;
  }

  /**
   * Called when the user clicks the login button. It wil attempt to get their
   * auth token from the api
   */
  private loginClicked() {
    if(!this.allFieldsFilled()) return;

    let s: Subscription;
    
    let loginCred = {
      Username: this.username,
      Password: this.password
    };

    let cred: string = JSON.stringify(loginCred);
    let user: any;

    s = this._apiService.getLoginToken(cred).subscribe(
      d => user = d,
      err => { this.invalidLogin = true; this.password = "" },
      () => {
        this._storage.setValue("token", user["token"]);
        this.validateLogin();
        s.unsubscribe();
      }
    );
  }

  /**
   * Called once the user has their auth token, it validates it. If the token is 
   * valid, then we move them to the home page
   */
  private validateLogin(){
    let user: User;
    let s: Subscription = this._apiService.validateToken().subscribe(
      d => user = d,
      err => console.log("Invalid token", err),
      () => {
        this._storage.setValue("loggedIn", true);

        if(this.rememberMe)
          this._storage.saveToLocal('savedUsername', this.username)
        else
          this._storage.removeFromLocal('savedUsername');

        s.unsubscribe();

        this._dataShareService.changeUser(user);
        this._router.navigate(['./home']);
      }
    );
  }

  /**
   * Called when the user clicks off the username box. It checks to see if 
   * the username the entered is taken or not. If it is taken, it notifies
   * the user
   */
  private validateUsername() {
    if(this.createUsername.length <= 0) return;

    let s: Subscription;
    s = this._apiService.validateUsername(this.createUsername).subscribe(
      d => d = d,
      err => {
        if(err['error']['Error']){
          this.usernameTaken = true;
        }else{
          this.hasClickedOff = true;
        }
      },
      () => {
        s.unsubscribe();
        this.hasClickedOff = true;
      }
    );
  }

  /**
   * Called when the user clicks the create user button.
   * It clears all values to avoid data errors
   */
  private createUserClicked() {
    this.createUser = true;
    this.createUsername = "";
    this.createPassword = "";
    this.createPasswordConfirm = "";
  }

  /**
   * Called when the user clicks the create account button. It adds them to the backend and 
   * logs them in
   */
  private createAccount() {
    let s: Subscription;

    let newUser = {
      Username: this.createUsername,
      Password: this.createPassword
    };

    let returnedUser: User;
    s = this._apiService.postEntity<User>("Users", newUser).subscribe(
      d => returnedUser = d,
      err => {
        if(err['error']['Error']) {
          this.usernameTaken = true;
          this.createUsername = "";
        }
      },
      () => {
        s.unsubscribe();
        this.username = this.createUsername;
        this.password = this.createPassword;
        this.loginClicked();
      }
    );
  }

  /**
   * Called to see if the user's passwords match
   * @returns If the passwords match or not (and are non-empty)
   */
  private passwordsMatch(): boolean{
    return this.createPasswordConfirm.toLocaleLowerCase() === this.createPassword.toLocaleLowerCase() && this.createPassword.length > 0 && this.createPasswordConfirm.length > 0;
  }

  /**
   * Called to see if all required fields are filled in
   * @returns if all required fields are filled in or not
   */
  private allFieldsFilled(): boolean {
    if(this.createUser)
      return this.passwordsMatch() && !this.usernameTaken && this.createUsername.length > 0;
    
      return this.username.length > 0 && this.password.length > 0;
  }


}
