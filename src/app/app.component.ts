import { Component, OnInit } from '@angular/core';

import { ApiService } from './services/services';

import { Class, ClassDetails } from './interfaces/interfaces';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './global-style.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  classes: Class[] = []

  selectedClass: ClassDetails;

  constructor(private _apiService: ApiService) { }
  
  isNavbarCollapsed: boolean = true;

  ngOnInit() {

    // this._apiService.getAllEntities<Class>("classes").subscribe(
    //   d => this.classes = d,
    //   err => console.log(err),
    //   () => console.log(this.classes)
    // )
  }

  public getClassDetails(url: string){
    let s: Subscription = this._apiService.getSingleEntity<ClassDetails>(url).subscribe(
      d => this.selectedClass = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        console.log(this.selectedClass);
      }
    )
  }

  public getUser() {
    return true;
  }

  public isLoggedIn(): boolean {
    return true;
  }
}
