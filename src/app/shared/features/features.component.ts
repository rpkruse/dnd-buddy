import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DndApiService } from '../../services/services';

import { ClassDetails, SubClass, Feature, Character } from '../../interfaces/interfaces';
import { Subscription } from '../../../../node_modules/rxjs';
import { Results } from '../../interfaces/api/results';

export interface pull {
  count: number,
  results: Results[]
};

export interface localFeature {
  name: string,
  level: number,
  url: string
}

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css', '../../global-style.css']
})

export class FeaturesComponent implements OnInit {

  @Input() character: Character;
  @Input() className: string;

  subclassName: string;

  level: number;

  feature: Feature;
  features: localFeature[] = [];

  constructor(private _dndApiService: DndApiService, private _modalService: NgbModal) { }

  ngOnInit() { }

  ngOnChanges() {
    if (!this.character || !this.className) return;

    this.subclassName = this.character.subclass;
    this.level = this.character.level;


    // if (this.subclassName) {
    //   let s: Subscription = this._dndApiService.getSingleEntityEndpoint<SubClass>("subclasses/" + this.subclassName.toLowerCase()).subscribe(
    //     d => this.className = d.class.name,
    //     err => console.log(err),
    //     () => {
    //       s.unsubscribe();
    //       this.getAllFeatures();
    //     }
    //   );
    // }

    this.getAllFeatures();
  }

  public getAllFeatures() {
    let s: Subscription;

    for (let i = 1; i <= this.level; i++) {
      let r: pull;

      if (this.subclassName) {
        s = this._dndApiService.getSpecificEndpointLevelInfo<pull>("features", this.subclassName, i).subscribe(
          d => r = d,
          err => console.log(err),
          () => {
            for (let j = 0; j < r.count; j++) {
              let lf: localFeature = {
                name: r.results[j].name,
                level: i,
                url: r.results[j].url
              };

              this.features.push(lf);
            }

            if (i === this.level) { s.unsubscribe(); this.sortFeatures(); }
          }
        );
      }

      s = this._dndApiService.getSpecificEndpointLevelInfo<pull>("features", this.className, i).subscribe(
        d => r = d,
        err => console.log(err),
        () => {
          for (let j = 0; j < r.count; j++) {
            let lf: localFeature = {
              name: r.results[j].name,
              level: i,
              url: r.results[j].url
            };

            this.features.push(lf);
          }

          if (i === this.level) { s.unsubscribe(); this.sortFeatures(); }
        }
      )
    }
  }

  public getFeature(url: string, content: any) {
    let s: Subscription = this._dndApiService.getSingleEntity<Feature>(url).subscribe(
      d => this.feature = d,
      err => console.log(err),
      () => {
        s.unsubscribe();
        this._modalService.open(content, { size: 'lg' });
      }
    );
  }

  private sortFeatures() {
    this.features.sort((a, b) => a.level > b.level ? -1 : 1);
  }
}
