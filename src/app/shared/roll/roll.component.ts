import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-roll',
  templateUrl: './roll.component.html',
  styleUrls: ['./roll.component.css', '../../global-style.css', '../shared-style.css']
})
export class RollComponent implements OnInit {

  numDice: number = 1;
  dice: number[] = [4, 6, 8, 10, 12, 20];
  rollMax: number = 4;
  roll: number = 0;


  hidden: boolean = false;

  show: boolean = true;

  @Output() rollOutput: EventEmitter<number[]> = new EventEmitter<number[]>();

  constructor() { }

  ngOnInit() {
  }

  public setRollValue(val: string) {
    let r: number = parseInt(val);

    this.rollMax = r;
    this.roll = 0;
  }

  /**
   * Called whenever the user clicks the roll button, it will roll n number die and send the value rolled
   * to all other users in the game iff hiden is false
   */
  public rollDice() {
    let max: number = this.rollMax * this.numDice; //The max number we can roll
    let min: number = 1 * this.numDice; //The min number we can roll

    this.roll = this.getRandomInt(min, max);

    if (!this.hidden) {
      this.rollOutput.emit([this.rollMax, this.roll, this.numDice]);
    }
  }

  /**
   * Called when the user clicks clear roll button. It sets their roll to 0D4 and notifies all other people in the lobby
   */
  public clearRoll() {
    this.rollMax = 4;
    this.roll = 0;
    this.numDice = 1;

    this.rollOutput.emit([this.rollMax, this.roll, this.numDice]);
  }

  /**
   * Gets a random number between two values
   * 
   * @param {number} min The min value 
   * @param {number} max The max value
   * 
   * @returns A number between min and max, both inclusive
   */
  private getRandomInt(min: number, max: number): number{
    return Math.floor(min + Math.random() * (max + 1 - min));
  }
}
