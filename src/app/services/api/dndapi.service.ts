import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from '../session/session-storage.service';

import { User } from '../../interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DndApiService {

  constructor(private _http: HttpClient, private _storage: StorageService) { }

  public getAllEntities<T>(path: string): Observable<T> {
    return this._http.get(environment.dnd_api + path) as Observable<T>;
  }

  public getSingleEntity<T>(path: string): Observable<T> {
    return this._http.get(path) as Observable<T>;
  }
}
