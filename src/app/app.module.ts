import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { rootRouterConfig } from './app.routes';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressHttpModule } from '@ngx-progressbar/http';

//Modules:
import { ManageModule } from './manage/manage.module';
import { GameModule } from './game/game.module';
import { SharedModule } from './shared/shared.module';

//Components:
import { AppComponent, HomeComponent, LoginComponent } from './components';

//Services:
import { ApiService, DndApiService, DataShareService, SessionGuard, StorageService, UserResolver, HubService, MessageService, PlayManager} from './services/services';

//Directives:
import { NgEnterDirective } from './directives/directives';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    NgEnterDirective,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    NgProgressModule.forRoot(),
    NgProgressHttpModule,
    ManageModule,
    GameModule,
    SharedModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  providers: [
    ApiService,
    DndApiService,
    DataShareService,
    SessionGuard,
    StorageService,
    UserResolver,
    HubService,
    MessageService,
    PlayManager
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
