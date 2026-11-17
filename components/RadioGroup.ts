/* Declarative radio options are templates; their content is cloned into the shadow tree. */

const CSS = `
:host { display: inline-block; font: inherit; color: inherit; }
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }
fieldset { border: 0; padding: 0; margin: 0; min-inline-size: 0; }
legend {
  padding: 0;
  margin: 0 auto 0.35em;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0 0.35em;

  border: 1px solid currentColor;
  border-radius: 999px;
}

label {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  position: relative;
  padding: 0.35em;
  cursor: pointer;
  line-height: 1.2;
  border-radius: 999px;
}
/* Visually hidden, but still focusable and exposed to assistive technology. */
input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}
.content { display: inline-flex; align-items: center; gap: 0.35em; }
.content img, .content svg {
  width: var(--radio-icon-size, 1.5rem);
  height: var(--radio-icon-size, 1.5rem);
  object-fit: contain;
}
.content svg { fill: currentColor; }
label:has(input:checked) { background: var(--radio-selected-background, #ddbfc67a); }
label:has(input:focus-visible) { outline: 2px solid currentColor; outline-offset: 2px; }
label:has(input:disabled) { opacity: 0.5; cursor: default; }
.popover {
  position: absolute;
  bottom: calc(100% + 0.5em);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 0.4em 0.75em;
  border-radius: 4px;
  background: var(--popover-bg, var(--primary-color, #7c0028));
  color: var(--popover-text, white);
  font-size: 0.875em;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}
.popover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--popover-bg, var(--primary-color, #7c0028));
}
label:hover .popover,
label:has(input:focus-visible) .popover {
  opacity: 1;
  visibility: visible;
}
`;

type OptionView = {
  label: HTMLLabelElement;
  input: HTMLInputElement;
  content: HTMLSpanElement;
  popover: HTMLSpanElement;
  defaultChecked: boolean;
};

class RadioGroup extends HTMLElement {
  #fieldset = document.createElement('fieldset');
  #legend = document.createElement('legend');
  #options = document.createElement('div');
  #views = new Map<HTMLElement, OptionView>();
  #selectedOption: HTMLElement | null = null;
  #observer = new MutationObserver(() => this.#render());

  static get observedAttributes() {
    return ['label', 'disabled'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    this.#options.className = 'options';
    this.#fieldset.append(this.#legend, this.#options);
    shadow.append(style, this.#fieldset);

    // Native input events already cross the boundary; forwarding them again
    // would duplicate delivery for capturing listeners. Only forward change.
    for (const type of ['input', 'change']) {
      shadow.addEventListener(type, event => {
        const selected = [...this.#views].find(([, view]) => view.input === event.target);
        if (!selected) return;
        this.#selectedOption = selected[0];
        if (type === 'change') {
          event.stopPropagation();
          this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }
      });
    }
  }

  connectedCallback() {
    this.#render();
    this.#updateGroup();
    this.#observer.observe(this, {
      childList: true, subtree: true, attributes: true, characterData: true,
    });
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback() {
    this.#updateGroup();
  }

  get value(): string {
    // Native checkedness changes before input starts propagating, so even
    // capture-phase consumers see the current value.
    return [...this.#views.values()].find(view => view.input.checked)?.input.value ?? '';
  }

  set value(value: string) {
    const options = this.#readOptions();
    const selected = options.find(option => option.getAttribute('value') === value);
    if (value !== '' && !selected) {
      throw new RangeError(`Unknown radio-group value: ${value}`);
    }
    this.#render();
    this.#selectedOption = selected ?? null;
    this.#syncSelection();
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
  }

  #updateGroup() {
    this.#legend.textContent = this.getAttribute('label') ?? '';
    this.#legend.hidden = !this.#legend.textContent;
    this.#fieldset.disabled = this.disabled;
  }

  #readOptions(): HTMLElement[] {
    const options = Array.from(this.children) as HTMLElement[];
    const values = new Set<string>();
    for (const option of options) {
      if (option.localName !== 'radio-option') {
        throw new TypeError('radio-group children must be radio-option declarations.');
      }
      const value = option.getAttribute('value');
      if (!value || values.has(value)) {
        throw new TypeError('radio-option values must be nonempty and unique within their group.');
      }
      values.add(value);
    }
    return options;
  }

  #render() {
    // Validate before changing the existing controls.
    const options = this.#readOptions();
    if (this.#selectedOption && !options.includes(this.#selectedOption)) {
      this.#selectedOption = null;
    }
    for (const [option, view] of this.#views) {
      if (!options.includes(option)) {
        view.label.remove();
        this.#views.delete(option);
      }
    }

    options.forEach((option, index) => {
      let view = this.#views.get(option);
      const checked = option.hasAttribute('checked');
      if (!view) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        // Each instance has a separate shadow tree, so this name is local.
        input.name = 'options';
        const content = document.createElement('span');
        content.className = 'content';
        const popover = document.createElement('span');
        popover.className = 'popover';
        // The input's aria-label carries this text; don't announce it twice.
        popover.setAttribute('aria-hidden', 'true');
        label.append(input, content, popover);
        view = { label, input, content, popover, defaultChecked: false };
        this.#views.set(option, view);
      }
      if (checked !== view.defaultChecked) {
        if (checked) this.#selectedOption = option;
        else if (this.#selectedOption === option) this.#selectedOption = null;
      }
      view.defaultChecked = checked;
      view.input.value = option.getAttribute('value');
      view.input.disabled = option.hasAttribute('disabled');
      view.content.replaceChildren(...Array.from(option.childNodes, node => node.cloneNode(true)));
      const caption = option.getAttribute('label');
      view.popover.textContent = caption ?? '';
      if (caption) {
        view.label.append(view.popover);
        view.input.setAttribute('aria-label', caption);
      } else {
        view.popover.remove();
        view.input.removeAttribute('aria-label');
      }

      // Reuse existing controls so content/attribute edits preserve keyboard focus.
      if (this.#options.children[index] !== view.label) {
        this.#options.insertBefore(view.label, this.#options.children[index] ?? null);
      }
    });
    this.#syncSelection();
  }

  #syncSelection() {
    for (const [option, view] of this.#views) {
      view.input.checked = option === this.#selectedOption;
    }
  }
}

customElements.define('radio-group', RadioGroup);

export default RadioGroup;

declare global {
  interface HTMLElementTagNameMap {
    'radio-group': RadioGroup;
  }
}
