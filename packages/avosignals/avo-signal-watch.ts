import { LitElement, html } from "lit";
import { Signal, SignalWatcher } from "./avosignals";
import { customElement, property } from "lit/decorators.js";
import { signalToJSON } from "./avosignals-util";



@customElement("avo-signal-watch")
export class AvoSignalWatch extends LitElement {
    #watcher = new SignalWatcher(this);

    @property({ attribute: false }) accessor signals: Signal<unknown>[] = [];

    render() {
        // JSON viewer is included in storybook-head
        // also see https://github.com/alenaksu/json-viewer
        return html`
            ${this.signals.map(signal => 
                html`
                <div>
                    <pre>Signal [${signal.name || 'unnamed_' + signal.id}]</pre>
                    <json-viewer .data=${signalToJSON(signal)}></json-viewer>
                </div>
                `
            )}
        `
    }

    connectedCallback(): void {
        super.connectedCallback();

        if (document.querySelector("script[src='https://unpkg.com/@alenaksu/json-viewer@2.1.0/dist/json-viewer.bundle.js']")) {
            return;
        }
        
        const watcherScript = document.createElement("script")
        watcherScript.src = "https://unpkg.com/@alenaksu/json-viewer@2.1.0/dist/json-viewer.bundle.js";
        document.head.appendChild(watcherScript);
        console.log("loaded json-viewer script", watcherScript);
        
    }

}

declare global {
    interface HTMLElementTagNameMap {
        "avo-signal-watch": AvoSignalWatch;
    }
}