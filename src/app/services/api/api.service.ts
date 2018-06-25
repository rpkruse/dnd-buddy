import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from '../session/session-storage.service';

import { User } from '../../interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private _http: HttpClient, private _storage: StorageService) { }

  public getLoginToken(cred: string): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders(
      { 'Content-Type': 'application/json' }
    );

    return this._http.post(environment.api + 'Auth/login', cred, { headers }) as Observable<any>;
  }

  public validateToken(): Observable<User> {
    let headers: HttpHeaders = new HttpHeaders(
      { "Authorization": "Bearer " + this._storage.getValue("token") }
    );

    return this._http.get(environment.api + "Auth/authUser", { headers }) as Observable<User>;
  }

  public validateUsername(username: string): Observable<any> {
    return this._http.get(environment.api + "Users/check/" + username) as Observable<any>;
  }


  public getAllEntities<T>(path: string): Observable<T> {
    return this._http.get(environment.dnd_api + path) as Observable<T>;
  }

  public getSingleEntity<T>(path: string): Observable<T> {
    return this._http.get(path) as Observable<T>;
  }

  public postEntity<T>(path: string, obj: any): Observable<T> {
    let headers: HttpHeaders = new HttpHeaders(
      { "Authorization": "Bearer " + this._storage.getValue("token") }
    );

    return this._http.post(environment.api + path, obj, { headers }) as Observable<T>;
  }
}
