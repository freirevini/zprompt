import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IDE_OPTIONS } from '../core/options';
import { SegmentedComponent } from './segmented.component';

describe('SegmentedComponent', () => {
  let fixture: ComponentFixture<SegmentedComponent>;
  let host: HTMLElement;
  let emitted: ReturnType<typeof vi.fn>;

  const buttons = () => Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
  const key = (index: number, keyName: string) => {
    const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true });
    buttons()[index].dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentedComponent);
    fixture.componentRef.setInput('options', IDE_OPTIONS);
    fixture.componentRef.setInput('value', 'cursor');
    fixture.componentRef.setInput('labelledBy', 'l');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
  });

  afterEach(() => host.remove());

  it('renderiza um botão por opção com role radio, aria-checked e tabindex só no selecionado', () => {
    const [cursor, antigravity] = buttons();
    expect(buttons()).toHaveLength(2);
    expect(cursor.getAttribute('role')).toBe('radio');
    expect(cursor.getAttribute('aria-checked')).toBe('true');
    expect(antigravity.getAttribute('aria-checked')).toBe('false');
    expect(cursor.getAttribute('tabindex')).toBe('0');
    expect(antigravity.getAttribute('tabindex')).toBe('-1');
    const group = host.querySelector('.seg');
    expect(group?.getAttribute('role')).toBe('radiogroup');
    expect(group?.getAttribute('aria-labelledby')).toBe('l');
    expect(group?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('clique emite valueChange e marca a opção', () => {
    buttons()[1].click();
    fixture.detectChanges();
    expect(emitted).toHaveBeenCalledWith('antigravity');
    expect(fixture.componentInstance.value).toBe('antigravity');
    expect(buttons()[1].classList.contains('is-on')).toBe(true);
  });

  it('setas percorrem em círculo e focam o botão', () => {
    key(1, 'ArrowRight');
    expect(emitted).toHaveBeenLastCalledWith('cursor');
    expect(document.activeElement).toBe(buttons()[0]);

    key(0, 'ArrowLeft');
    expect(emitted).toHaveBeenLastCalledWith('antigravity');
    expect(document.activeElement).toBe(buttons()[1]);

    key(1, 'ArrowDown');
    expect(emitted).toHaveBeenLastCalledWith('cursor');
    key(0, 'ArrowUp');
    expect(emitted).toHaveBeenLastCalledWith('antigravity');
  });

  it('tecla que não é seta não emite nem cancela o evento', () => {
    const event = key(0, 'Tab');
    expect(emitted).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
