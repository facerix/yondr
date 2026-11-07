/* Reusable popover web component for information tooltips */

const CSS = `
:host {
  --popover-bg: var(--primary-color, #7c0028);
  --popover-text: white;
  --popover-width: 250px;
  --icon-color: var(--text-muted, rgba(124, 0, 40, 0.5));
  --icon-hover-color: var(--primary-color, #7c0028);
  --focus-color: var(--focus-color, rgba(124, 0, 40, 0.5));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  cursor: help;
  color: var(--icon-color);
  position: relative;
  flex-shrink: 0;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.info-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.info-icon:hover,
.info-icon:focus-visible {
  color: var(--icon-hover-color);
  outline: none;
}

.info-icon:focus-visible {
  outline: 2px double var(--focus-color);
  outline-offset: 2px;
  border-radius: 50%;
}

.popover {
  position: absolute;
  bottom: calc(100% + 0.5em);
  left: 50%;
  transform: translateX(-50%);
  background: var(--popover-bg);
  color: var(--popover-text);
  padding: 0.75em 1em;
  border-radius: 4px;
  font-size: 0.875em;
  white-space: normal;
  width: var(--popover-width);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  line-height: 1.4;
  text-align: left;
}

.popover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--popover-bg);
}

.wrapper:hover .popover,
.info-icon:hover ~ .popover,
.info-icon:focus-visible ~ .popover,
:host(:hover) .popover,
:host(:focus-within) .popover {
  opacity: 1;
  visibility: visible;
}

/* Variant: dark background */
:host([variant="dark"]) {
  --popover-bg: #333;
}

/* Variant: nowrap (no fixed width) */
:host([nowrap]) .popover {
  white-space: nowrap;
  width: auto;
  min-width: auto;
}

/* Variant: smaller width */
:host([width="small"]) {
  --popover-width: 200px;
}

/* Variant: larger width */
:host([width="large"]) {
  --popover-width: 300px;
}

/* Size variants */
:host([size="small"]) .info-icon {
  width: 0.875em;
  height: 0.875em;
}

:host([size="large"]) .info-icon {
  width: 1.25em;
  height: 1.25em;
}
`;

class PopoverInfo extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Only attach shadow DOM if it doesn't exist
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: "open" });
      const styles = document.createElement("style");
      styles.innerHTML = CSS;
      shadow.appendChild(styles);

      const wrapper = document.createElement("div");
      wrapper.className = "wrapper";
      shadow.appendChild(wrapper);
    }

    // Update content
    this.#updateContent();
  }

  #updateContent() {
    if (!this.shadowRoot) return;

    const wrapper = this.shadowRoot.querySelector(".wrapper");
    if (!wrapper) return;

    const content = this.getAttribute("content") || "";
    const ariaLabel = this.getAttribute("aria-label") || "Information";

    // Check if icon already exists
    let icon = wrapper.querySelector(".info-icon");
    let popover = wrapper.querySelector(".popover");

    if (!icon) {
      icon = document.createElement("span");
      icon.className = "info-icon";
      icon.setAttribute("tabindex", "0");
      icon.setAttribute("role", "button");
      icon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      `;
      wrapper.appendChild(icon);
    }

    icon.setAttribute("aria-label", ariaLabel);

    if (!popover) {
      popover = document.createElement("span");
      popover.className = "popover";
      wrapper.appendChild(popover);
    }

    popover.textContent = content;
  }


  static get observedAttributes() {
    return ["content", "aria-label", "variant", "nowrap", "width", "size"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "content" || name === "aria-label") {
      this.#updateContent();
    }
  }
}

customElements.define("popover-info", PopoverInfo);

export default PopoverInfo;


declare global {
  interface HTMLElementTagNameMap {
    "popover-info": PopoverInfo;
  }
}
