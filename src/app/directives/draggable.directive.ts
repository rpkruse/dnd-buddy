/*
  Taken from this guide:
    https://stackblitz.com/edit/draggable-part-5?file=app%2Fdraggable%2Fdraggable.directive.ts
*/
import { Directive, EventEmitter, HostBinding, HostListener, Output, ElementRef } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective {
  @HostBinding('class.draggable') draggable = true;

  pointerId?: number;

  // to trigger pointer-events polyfill
  @HostBinding('attr.touch-action') touchAction = 'none';

  @Output() dragStart = new EventEmitter<PointerEvent>();
  @Output() dragMove = new EventEmitter<PointerEvent>();
  @Output() dragEnd = new EventEmitter<PointerEvent>();

  @HostBinding('class.dragging') dragging = false;

  constructor(public element: ElementRef) { }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    // added after YouTube video: ignore right-click
    if (event.button !== 0) {
      return;
    }

    this.pointerId = event.pointerId;

    this.dragging = true;
    this.dragStart.emit(event);
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    this.dragMove.emit(event);
  }

  // added after YouTube video: pointercancel
  // @HostListener('document:pointercancel', ['$event'])
  @HostListener('document:pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    this.dragging = false;
    this.dragEnd.emit(event);
  }
}
