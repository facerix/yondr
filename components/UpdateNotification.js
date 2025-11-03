/**
 * UpdateNotification Web Component
 * Displays a notification when a service worker update is available
 * Uses Shadow DOM with encapsulated styles
 */

class UpdateNotification extends HTMLElement {
    constructor() {
        super();
        this.pendingWorker = null;
        this.isVisible = false;
        this.boundHandleUpdateNow = this.handleUpdateNow.bind(this);
        this.boundHandleUpdateLater = this.handleUpdateLater.bind(this);

        // Attach shadow DOM
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          .update-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #7c0028;
            color: white;
            padding: 1.5em;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 300px;
            display: none;
            font-family: Futura, "Trebuchet MS", Arial, sans-serif;
            font-size: 1em;
            line-height: 1.4;
          }
          
          .update-notification strong {
            display: block;
            margin-bottom: 0.75em;
            font-size: 1.2em;
            font-weight: bold;
          }
          
          .update-notification p {
            margin: 0 0 1.25em 0;
            line-height: 1.4;
          }
          
          .update-notification button {
            background: transparent;
            color: white;
            border: 2px solid white;
            padding: 0.5em 1em;
            border-radius: 5px;
            margin: 0.5em 0.5em 0 0;
            cursor: pointer;
            font-weight: normal;
            font-size: 0.95em;
            font-family: inherit;
            transition: all 0.2s ease;
          }
          
          .update-notification button:hover,
          .update-notification button:focus-visible {
            background: rgba(255, 255, 255, 0.2);
            outline: 2px double white;
            outline-offset: -4px;
          }
          
          .update-notification button:active {
            transform: scale(0.98);
          }
          
          .update-notification button.update-now {
            background: rgba(255, 255, 255, 0.9);
            color: #7c0028;
            font-weight: bold;
            border-color: rgba(255, 255, 255, 0.9);
          }
          
          .update-notification button.update-now:hover,
          .update-notification button.update-now:focus-visible {
            background: white;
            border-color: white;
            outline: 2px double #7c0028;
            outline-offset: -4px;
          }
        </style>
        <div class="update-notification">
          <strong>Update Available!</strong>
          <p>A new version of Yondr is ready.</p>
          <button class="update-now">Update Now</button>
          <button class="update-later">Later</button>
        </div>
      `;
    }

    setupEventListeners() {
        const updateNowBtn = this.shadowRoot.querySelector('.update-now');
        const updateLaterBtn = this.shadowRoot.querySelector('.update-later');

        if (updateNowBtn) {
            updateNowBtn.addEventListener('click', this.boundHandleUpdateNow);
        }

        if (updateLaterBtn) {
            updateLaterBtn.addEventListener('click', this.boundHandleUpdateLater);
        }
    }

    cleanupEventListeners() {
        const updateNowBtn = this.shadowRoot.querySelector('.update-now');
        const updateLaterBtn = this.shadowRoot.querySelector('.update-later');

        if (updateNowBtn) {
            updateNowBtn.removeEventListener('click', this.boundHandleUpdateNow);
        }

        if (updateLaterBtn) {
            updateLaterBtn.removeEventListener('click', this.boundHandleUpdateLater);
        }
    }

    /**
     * Show the update notification
     * @param {ServiceWorker} pendingWorker - The pending service worker
     */
    show(pendingWorker) {
        this.pendingWorker = pendingWorker;
        const notification = this.shadowRoot.querySelector('.update-notification');

        if (notification) {
            notification.style.display = 'block';
            this.isVisible = true;

            // Dispatch custom event for analytics or other tracking
            this.dispatchEvent(new CustomEvent('update-notification-shown', {
                detail: { pendingWorker },
                bubbles: true,
                composed: true
            }));
        } else {
            console.error('[UpdateNotification] Could not find .update-notification element');
        }
    }

    /**
     * Hide the update notification
     */
    hide() {
        const notification = this.shadowRoot.querySelector('.update-notification');

        if (notification) {
            notification.style.display = 'none';
            this.isVisible = false;

            // Dispatch custom event
            this.dispatchEvent(new CustomEvent('update-notification-hidden', {
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Handle user accepting the update
     */
    handleUpdateNow() {
        // Dispatch custom event before updating
        this.dispatchEvent(new CustomEvent('update-accepted', {
            detail: { pendingWorker: this.pendingWorker },
            bubbles: true,
            composed: true
        }));

        // Delegate to ServiceWorkerManager for the actual update logic
        if (window.serviceWorkerManager) {
            window.serviceWorkerManager.handleUpdateNow(this.pendingWorker);
        } else {
            console.error('[UpdateNotification] ServiceWorkerManager not available');
        }
        this.hide();
    }

    /**
     * Handle user dismissing the update
     */
    handleUpdateLater() {
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('update-dismissed', {
            bubbles: true,
            composed: true
        }));

        this.hide();
    }

    /**
     * Check if notification is currently visible
     */
    get visible() {
        return this.isVisible;
    }

    /**
     * Get the pending worker
     */
    get pendingWorkerInstance() {
        return this.pendingWorker;
    }
}

// Register the custom element
customElements.define('update-notification', UpdateNotification);

export default UpdateNotification;
