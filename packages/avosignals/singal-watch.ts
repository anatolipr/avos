import { LitElement, html } from "lit";
import { Signal, SignalWatcher } from "./avosignals";
import { customElement, property } from "lit/decorators.js";
import { singalToJSON } from "./avosignals-util";

@customElement("signal-watch")
export class SignalWatch extends LitElement {
    watcher = new SignalWatcher(this);

    @property() accessor signals: Signal<unknown>[] = [];
    _subscribers: (() => void)[] = [];

    render() {
        // JSON viewer is included in storybook-head
        // also see https://github.com/alenaksu/json-viewer
        return html`
            ${this.signals.map(signal => 
                html`
                <div>
                    <pre>Signal [${signal.name || 'unnamed_' + signal.id}]</pre>
                    <json-viewer .data=${singalToJSON(signal)}></json-viewer>
                </div>
                `
            )}
        `
    }

}