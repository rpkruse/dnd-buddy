import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';

//Components:
import { HelpFaqComponent, HelpGameComponent} from '../components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    SharedModule,
  ],
  declarations: [
    HelpFaqComponent,
    HelpGameComponent
  ],
  exports: [
    HelpFaqComponent,
    HelpGameComponent
  ]
})
export class HelpModule { 
  static forRoot() {
    return {
      ngModule: HelpModule,
      providers: [

      ]
    }
  }
}

