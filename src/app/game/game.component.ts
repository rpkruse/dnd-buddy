import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ApiService, DndApiService, DataShareService } from '../services/services';
import { Character, Game, User, ClassDetails, RaceDetails } from '../interfaces/interfaces';
import { Subscription } from 'rxjs';


@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css', '../global-style.css']
})
export class GameComponent implements OnInit {
  private user: User;
  games: Game[] = [];

  creatingGame: boolean = false;
  gameName: string = "";
  isGM: boolean = false;

  selectedGame: Game;

  characterDetail: Character;
  classDetail: ClassDetails;
  raceDetail: RaceDetails;

  constructor(private _apiService: ApiService, private _dndApiService: DndApiService, private _dataShareService: DataShareService, private _modalService: NgbModal) { }

  ngOnInit() {
    this._dataShareService.user.subscribe(res => this.user = res);
    let s: Subscription = this._apiService.getAllEntities<Game>("Games/user/" + this.user.userId).subscribe(
      d => this.games = d,
      err => console.log("Unable to get games"),
      () => s.unsubscribe()
    );
  }

  public createGame() {
    this.creatingGame = true;
    this.selectedGame = null;
  }

  public saveNewGame() {
    let s: Subscription;

    let g = {
      name: this.gameName,
      userId: this.user.userId,
      gm: this.isGM
    };

    let game: Game;
    s = this._apiService.postEntity<Game>("Games", g).subscribe(
      d => game = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        this.games.push(game);
      }
    )
  }

  public loadGame(game: Game) {
    this.creatingGame = false;
    let s: Subscription;

    s = this._apiService.getSingleEntity<Game>("Games/details/" + game.gameId).subscribe(
      d => this.selectedGame = d,
      err => console.log("Unable to load game", err),
      () => s.unsubscribe()
    );
  }

  public loadCharacterDetails(index: number, content) {
    this.characterDetail = this.selectedGame.character[index];
    let s, j: Subscription;

    s = this._dndApiService.getSingleEntity<ClassDetails>(this.selectedGame.character[index].class).subscribe(
      d => this.classDetail = d,
      err => console.log(err),
      () => s.unsubscribe()
    );

    j = this._dndApiService.getSingleEntity<RaceDetails>(this.selectedGame.character[index].race).subscribe(
      d => this.raceDetail = d,
      err => console.log(err),
      () => j.unsubscribe()
    );

    this.openModal(content);
  }

  public openModal(content) {
    this._modalService.open(content).result.then((result) => { //On close via save
      //this.addNeededEntitiesToDB(); //When we save, we attempt to add all needed entities to the DB
      //this.currentStep = 1;
      this.clearCharacterDetails();
    }, (reason) => { //on close via click off
      //this.currentStep = 1;
      this.clearCharacterDetails();
    });
  }

  public clearCharacterDetails() {
    this.classDetail = null;
    this.raceDetail = null;
  }
}
