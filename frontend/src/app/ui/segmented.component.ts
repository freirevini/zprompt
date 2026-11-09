import { NgFor } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

import { Option } from '../core/options';

@Component({
  selector: 'zp-segmented',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="seg" [class.seg--wrap]="wrap" role="radiogroup" [attr.aria-labelledby]="labelledBy" [attr.aria-describedby]="describedBy || null">
      <button
        *ngFor="let option of options; let i = index"
        type="button"
        role="radio"
        class="seg__option"
        [class.is-on]="option.value === value"
        [attr.aria-checked]="option.value === value"
        [attr.tabindex]="option.value === value ? 0 : -1"
        (click)="select(option.value)"
        (keydown)="onKey($event, i)"
      >{{ option.label }}</button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .seg {
      display: inline-flex;
      gap: 2px;
      padding: 3px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--canvas);
    }
    .seg--wrap { display: flex; flex-wrap: wrap; }
    .seg__option {
      appearance: none;
      border: 0;
      border-radius: 5px;
      padding: 6px 12px;
      background: transparent;
      color: var(--text-muted);
      font: inherit;
      font-size: 13px;
      line-height: 20px;
      cursor: pointer;
      transition: background-color 160ms ease, color 160ms ease;
    }
    .seg__option:hover { color: var(--text); }
    .seg__option.is-on {
      background: var(--raised);
      color: var(--text);
    }
  `],
})
export class SegmentedComponent {
  @Input() options: Option[] = [];
  @Input() value = '';
  @Input() labelledBy = '';
  @Input() describedBy = '';
  @Input() wrap = false;
  @Output() valueChange = new EventEmitter<string>();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  select(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  onKey(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const next = (index + step + this.options.length) % this.options.length;
    this.select(this.options[next].value);
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button');
    buttons[next]?.focus();
  }
}
