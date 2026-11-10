/**
 * Usage tracking for the AE and BDR Cockpit.
 *
 * Counts are kept in the browser and sent to CockpitUsageController about once a
 * minute, and right away when the seller switches browser tabs or leaves the page.
 * One small Apex call a minute at most, never one per click.
 * Nothing here can throw into the page: a failed send drops that batch.
 *
 * Use from the cockpit shell:
 *   import { startUsage, trackTab, trackEvent, stopUsage } from 'c/ckUsage';
 *   connectedCallback()    { startUsage('AE'); trackTab(this.activeTab); }
 *   handleTabChange(e)     { trackTab(e.detail.key); }       // 'day', 'actions', 'pipe', 'build' ...
 *   handleDone()           { trackEvent('action:done'); }
 *   disconnectedCallback() { stopUsage(); }
 *
 * Event keys: record:open, action:done, action:dismiss, update:save, email:draft,
 * assistant:ask, account:lookup. Unknown keys are dropped by the server.
 */
import track from '@salesforce/apex/CockpitUsageController.track';

const FLUSH_MS = 60000;
const TICK_MS = 15000;
const IDLE_MS = 60000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];

let cockpit = null;
let counts = {};
let activeSeconds = 0;
let lastInput = 0;
let flushTimer = null;
let tickTimer = null;
let lastActivityMark = 0;

function bump(key, n = 1) {
    if (!cockpit || !key) {
        return;
    }
    counts[key] = (counts[key] || 0) + n;
}

function visible() {
    return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

function onInput() {
    // Cheap: mousemove fires constantly, so only stamp once a second.
    const now = Date.now();
    if (now - lastActivityMark > 1000) {
        lastActivityMark = now;
        lastInput = now;
    }
}

function tick() {
    if (visible() && Date.now() - lastInput < IDLE_MS) {
        activeSeconds += TICK_MS / 1000;
    }
}

function onVisibility() {
    if (!visible()) {
        flush();
    }
}

export function flush() {
    if (!cockpit) {
        return;
    }
    const keys = Object.keys(counts);
    if (!keys.length && activeSeconds <= 0) {
        return;
    }
    const payload = JSON.stringify({ cockpit, counts, activeSeconds });
    counts = {};
    activeSeconds = 0;
    try {
        track({ payloadJson: payload }).catch(() => {});
    } catch (e) {
        // Tracking never breaks the page.
    }
}

export function startUsage(which) {
    if (cockpit) {
        return; // already running for this page
    }
    cockpit = which === 'BDR' ? 'BDR' : 'AE';
    counts = {};
    activeSeconds = 0;
    lastInput = Date.now();
    bump('session');
    try {
        ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }));
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', flush);
    } catch (e) {
        // Listeners are a nice to have; counts still flush on the timer.
    }
    tickTimer = setInterval(tick, TICK_MS);
    flushTimer = setInterval(flush, FLUSH_MS);
    // Send the page load right away so a quick look still counts.
    setTimeout(flush, 3000);
}

export function trackTab(tabKey) {
    if (tabKey) {
        bump('tab:' + tabKey);
    }
}

export function trackEvent(eventKey) {
    bump(eventKey);
}

export function stopUsage() {
    if (!cockpit) {
        return;
    }
    flush();
    clearInterval(tickTimer);
    clearInterval(flushTimer);
    try {
        ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onInput));
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', flush);
    } catch (e) {
        // ignore
    }
    cockpit = null;
}
