import { h } from "../src/utils.js";

const CSS = `
:host {
  --primary-color: #7c0028;
  --border-color: rgba(124, 0, 40, 0.2);
  --focus-color: rgba(124, 0, 40, 0.5);
  --modal-bg: #ffffff;

  dialog[open] {
    display: flex;
    flex-direction: column;
    min-width: 30vw;
    max-width: 500px;
    width: 90vw;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--modal-bg);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  ::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  header {
    padding: 1em 2em;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 1.5em;
      color: var(--primary-color);
      font-weight: 400;
    }

    #close-modal {
      background: none;
      border: none;
      padding: 0;
      width: 1.5em;
      height: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
  
      img {
        height: 1.5em;
        width: 1.5em;
        filter: brightness(0) saturate(100%) invert(28%) sepia(100%) saturate(1000%) hue-rotate(326deg) brightness(96%) contrast(101%);
      }

      &:hover {
        opacity: 0.7;
      }

      &:focus {
        outline: none;
      }

      &:focus-visible {
        outline: 2px double var(--focus-color);
        outline-offset: 2px;
      }
    }
  }

  form {
    flex: 1;
    padding: 2em;
    display: flex;
    flex-direction: column;
    gap: 1.5em;

    #message {
      margin: 0;
      color: #303030;
      font-size: 1em;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 1em;
      justify-content: flex-end;
      margin-top: 0.5em;

      input[type="button"],
      input[type="submit"] {
        padding: 0.75em 1.5em;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1em;
        font-family: inherit;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
        }

        &:focus-visible {
          outline: 2px double var(--focus-color);
          outline-offset: 2px;
        }
      }

      #btnCancel {
        background-color: transparent;
        color: var(--primary-color);

        &:hover {
          background-color: rgba(124, 0, 40, 0.05);
          border-color: var(--primary-color);
        }
      }

      #btnOk {
        background-color: var(--primary-color);
        color: white;
        border: none;

        &:hover {
          opacity: 0.9;
          box-shadow: 0 2px 4px rgba(124, 0, 40, 0.3);
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }

  dialog, ::backdrop {
    transition: all 0.25s allow-discrete;
    opacity: 0;
  }
  
  [open],
  [open]::backdrop {
    opacity: 1;
  }
  
  @starting-style {
    [open],
    [open]::backdrop {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    @starting-style {
      [open] {
        transform: translateY(-20px);
      }
    
      [open],
      [open]::backdrop {
        opacity: 0;
      }
    }
    
    [open] {
      animation: slideIn 0.3s ease;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
`;

class ConfirmationModal extends HTMLElement {
  #ready = false;
  #message = "";
  #modal = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // Create shadow root
    const shadow = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    styles.innerHTML = CSS;
    shadow.appendChild(styles);

    // create the internal implementation
    this.#modal = h("dialog", { closedby: "any" }, [
      h("header", {}, [
        h("h3", { innerText: "Confirmation" }),
        h("button", { id: "close-modal" }, [
          h("img", { src: "/images/close.svg", alt: "close", width: 32 })
        ])
      ]),
      h("form", { method: "dialog", autocomplete: "off" }, [
        h("p", { id: "message", innerText: "Are you sure?" }),
        h("div", { className: "actions" }, [
          h("input", { type: "button", id: "btnCancel", value: "Cancel" }),
          h("input", { type: "submit", id: "btnOk", value: "OK" }),
        ])
      ])
    ]);
    shadow.appendChild(this.#modal);
  }

  #onClose(evt) {
    evt.preventDefault();
    this.#emit("cancel");
    this.#modal?.close();
  }

  #init() {
    const closeHandler = this.#onClose.bind(this);
    this.shadowRoot.querySelector("#close-modal").addEventListener("click", closeHandler);
    this.shadowRoot.querySelector("#btnCancel").addEventListener("click", closeHandler);

    this.shadowRoot.querySelector("dialog form").addEventListener("submit", (evt) => {
      if (evt.submitter.id === "btnOk") {
        this.#emit("confirm");
      }
    });
    this.#ready = true;
  }

  #emit(eventName, detail = {}) {
    const customEvent = new CustomEvent(eventName, { detail });
    this.dispatchEvent(customEvent);
  }

  render() {
    // if we've already been attached to the document, 
    // replace the contents of each slot with the latest data
    if (this.#ready) {
      this.shadowRoot.querySelector("#message").innerText = this.#message;
    }
  }

  showModal(caption) {
    this.#message = caption;
    if (!this.#ready) {
      this.#init();
    }
    this.render();
    this.#modal?.showModal();
  }
}

window.customElements.define('confirmation-modal', ConfirmationModal);
