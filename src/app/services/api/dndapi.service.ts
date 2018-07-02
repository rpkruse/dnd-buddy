import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from '../session/session-storage.service';

import { ClassLevels, RaceDetails, Race } from '../../interfaces/interfaces';

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

  public getLevelInfo(c: string, level: number): Observable<ClassLevels>{
    c = c.toLocaleLowerCase();
    return this._http.get(environment.dnd_api + "classes/" + c +"/level/" + level) as Observable<ClassLevels>
  }
  
  public getRaceInfo(index: number): Observable<RaceDetails> {
    return this._http.get(environment.dnd_api + "races/" + index) as Observable<RaceDetails>;
  }

  public test<T>(path: string): Observable<T[]>{
    return this._http.get(environment.dnd_api + path) as Observable<T[]>;
  }
}
