import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help-game',
  templateUrl: './help-game.component.html',
  styleUrls: ['./help-game.component.css', '../../global-style.css']
})
export class HelpGameComponent implements OnInit {
  tldr: boolean = false;
  show: boolean[] = [false, false, false, false, false, false]

  constructor() { }

  ngOnInit() {
  }

}
