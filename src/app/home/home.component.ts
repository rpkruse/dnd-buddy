import { Component, OnInit } from '@angular/core';

import { DataShareService } from '../services/services';

import { User } from '../interfaces/interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', '../global-style.css']
})
export class HomeComponent implements OnInit {

  constructor(private _dataShareService: DataShareService) { }

  ngOnInit() {
  }

}
