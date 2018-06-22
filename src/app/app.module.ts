import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { rootRouterConfig } from './app.routes';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressHttpModule } from '@ngx-progressbar/http';

//Components:
import { AppComponent, CreateCharacterComponent, HomeComponent } from './components';

//Services:
import { ApiService } from './services/services';

@NgModule({
  declarations: [
    AppComponent,
    CreateCharacterComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    NgProgressModule.forRoot(),
    NgProgressHttpModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  providers: [
    ApiService
    //DataShareService,
    //SessionGuard,
    //StorageService,
    //UserResolver,
    //HubService,
    //MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
