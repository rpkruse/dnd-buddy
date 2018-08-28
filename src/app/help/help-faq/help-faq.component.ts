import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help-faq',
  templateUrl: './help-faq.component.html',
  styleUrls: ['./help-faq.component.css', '../../global-style.css']
})
export class HelpFaqComponent implements OnInit {

  show: boolean[] =[false, false, false];

  constructor() { }

  ngOnInit() {
  }

}
