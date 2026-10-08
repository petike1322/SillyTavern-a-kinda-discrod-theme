import { eventSource, event_types, this_chid, characters, substituteParams } from '../../../../../script.js';
import { DOMPurify } from '../../../../../lib.js';

/**
 * Discord-style "User Profile" popout for the currently selected character.
 *
 * Renders a frosted-glass card on the left side of the screen with the
 * character's banner, avatar, name, description, personality, scenario,
 * creator/version metadata and tags. Updates automatically when the
 * selected character or chat changes.
 *
 * `this_chid` and `characters` are live ES-module bindings exported by
 * SillyTavern's script.js, so they always reflect the current selection.
 * Characters may be "shallow" (lazy-loaded) — we unshallow on demand.
 */

const POPOUT_ID = 'nad-char-profile';
const TOGGLE_ID = 'nad-char-profile-toggle';
const STORAGE_KEY = 'nad-char-profile-open';

let popoutEl = null;
let toggleEl = null;
let isOpen = false;
let enabled = true;
let unshallowing = false;

/**
 * Lazily resolves SillyTavern's `unshallowCharacter` helper.
 * Loaded via dynamic import so that older SillyTavern versions (which don't
 * export it) don't cause a module link error that would break the theme.
 * @returns {Promise<Function|null>}
 */
let unshallowCharacterFn;
async function getUnshallowCharacter() {
    if (unshallowCharacterFn !== undefined) return unshallowCharacterFn;
    try {
        const mod = await import('../../../../../script.js');
        unshallowCharacterFn = typeof mod.unshallowCharacter === 'function' ? mod.unshallowCharacter : null;
    } catch (e) {
        unshallowCharacterFn = null;
    }
    return unshallowCharacterFn;
}

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

function getCurrentCharacter() {
    try {
        if (this_chid === undefined || this_chid === null || this_chid === 'undefined') return null;
        if (!Array.isArray(characters)) return null;
        return characters[Number(this_chid)] || null;
    } catch (e) {
        return null;
    }
}

/**
 * Reads a character field, falling back to the V2 `data` object.
 * Works for both full and shallow character objects.
 */
function readField(character, key) {
    if (!character) return '';
    const value = character[key] ?? character.data?.[key];
    return value ?? '';
}

function getAvatarUrl(character) {
    if (!character || !character.avatar) return '';
    // Standard SillyTavern thumbnail endpoint.
    return `/thumbnail?type=avatar&file=${encodeURIComponent(character.avatar)}`;
}

function substitute(text) {
    if (!text) return '';
    let out = String(text);
    try {
        const fn = typeof substituteParams === 'function' ? substituteParams : window.substituteParams;
        if (typeof fn === 'function') {
            out = fn(out);
        }
    } catch (e) { /* ignore */ }
    return out;
}

function sanitize(text) {
    const raw = substitute(text);
    if (!raw) return '';
    try {
        return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    } catch (e) {
        return '';
    }
}

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toUsername(name) {
    const slug = String(name || 'unknown')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_.]/g, '');
    return '@' + (slug || 'unknown');
}

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */

function section(title, html) {
    if (!html) return '';
    return `
        <div class="nad-profile-section">
            <div class="nad-profile-section-title">${escapeHtml(title)}</div>
            <div class="nad-profile-section-body">${html}</div>
        </div>`;
}

function renderProfile(character) {
    if (!popoutEl) return;

    if (!character) {
        popoutEl.style.removeProperty('--nad-profile-banner');
        popoutEl.innerHTML = `
            <div class="nad-profile-empty">
                <i class="fa-solid fa-user-slash"></i>
                <span>No character selected</span>
            </div>`;
        return;
    }

    const name = character.name || 'Unknown';
    const avatarUrl = getAvatarUrl(character);
    const username = toUsername(name);
    const description = sanitize(readField(character, 'description'));
    const personality = sanitize(readField(character, 'personality'));
    const scenario = sanitize(readField(character, 'scenario'));
    const creator = readField(character, 'creator') ? escapeHtml(readField(character, 'creator')) : '';
    const version = readField(character, 'character_version') ? escapeHtml(readField(character, 'character_version')) : '';
    const rawTags = readField(character, 'tags');
    const tags = Array.isArray(rawTags) ? rawTags.filter(Boolean) : [];

    const metaRows = [];
    if (creator) {
        metaRows.push(`<div class="nad-profile-meta-row"><span>Created by</span><b>${creator}</b></div>`);
    }
    if (version) {
        metaRows.push(`<div class="nad-profile-meta-row"><span>Version</span><b>${version}</b></div>`);
    }

    const tagsHtml = tags.length
        ? `<div class="nad-profile-section">
                <div class="nad-profile-section-title">Tags</div>
                <div class="nad-profile-tags">
                    ${tags.map(t => `<span class="nad-profile-tag">${escapeHtml(t)}</span>`).join('')}
                </div>
           </div>`
        : '';

    popoutEl.style.setProperty('--nad-profile-banner', `url("${avatarUrl}")`);

    popoutEl.innerHTML = `
        <div class="nad-profile-banner"></div>
        <div class="nad-profile-close" title="Close"><i class="fa-solid fa-xmark"></i></div>
        <div class="nad-profile-header">
            <div class="nad-profile-avatar">
                <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" />
                <span class="nad-profile-status"></span>
            </div>
            <div class="nad-profile-names">
                <div class="nad-profile-displayname">${escapeHtml(name)}</div>
                <div class="nad-profile-username">${escapeHtml(username)}</div>
            </div>
        </div>
        <div class="nad-profile-body">
            ${section('About Me', description)}
            ${section('Personality', personality)}
            ${section('Scenario', scenario)}
            ${metaRows.length
                ? `<div class="nad-profile-section">
                       <div class="nad-profile-section-title">Details</div>
                       <div class="nad-profile-meta">${metaRows.join('')}</div>
                   </div>`
                : ''}
            ${tagsHtml}
        </div>
        <div class="nad-profile-footer">
            <div class="nad-profile-action" id="nad-profile-focus-chat">
                <i class="fa-solid fa-comment"></i> Message
            </div>
        </div>`;
}

function refreshProfile() {
    if (!popoutEl) return;

    const character = getCurrentCharacter();
    renderProfile(character);

    // If the character is lazy-loaded ("shallow"), its description/personality
    // fields are empty. Fetch the full data once, then re-render.
    if (character && character.shallow && !unshallowing) {
        unshallowing = true;
        getUnshallowCharacter()
            .then((fn) => (fn ? fn(String(this_chid)) : null))
            .then(() => {
                unshallowing = false;
                renderProfile(getCurrentCharacter());
            })
            .catch((e) => {
                unshallowing = false;
                console.warn('[NADTheme] Failed to unshallow character:', e);
            });
    }
}

/* ------------------------------------------------------------------ */
/*  Open / close                                                       */
/* ------------------------------------------------------------------ */

function openProfile() {
    if (!popoutEl || !enabled) return;
    isOpen = true;
    popoutEl.classList.add('nad-profile-open');
    toggleEl?.classList.add('nad-profile-toggle-active');
    refreshProfile();
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
}

function closeProfile() {
    if (!popoutEl) return;
    isOpen = false;
    popoutEl.classList.remove('nad-profile-open');
    toggleEl?.classList.remove('nad-profile-toggle-active');
    try { localStorage.setItem(STORAGE_KEY, '0'); } catch (e) { /* ignore */ }
}

function toggleProfile() {
    if (isOpen) {
        closeProfile();
    } else {
        openProfile();
    }
}

function onDocumentClick(event) {
    if (!isOpen) return;
    if (popoutEl && popoutEl.contains(event.target)) return;
    if (toggleEl && toggleEl.contains(event.target)) return;
    closeProfile();
}

/* ------------------------------------------------------------------ */
/*  DOM construction                                                   */
/* ------------------------------------------------------------------ */

function createToggle() {
    if (document.getElementById(TOGGLE_ID)) {
        toggleEl = document.getElementById(TOGGLE_ID);
        return;
    }

    const holder = document.getElementById('top-settings-holder');
    if (!holder) return;

    toggleEl = document.createElement('div');
    toggleEl.id = TOGGLE_ID;
    toggleEl.className = 'nad-profile-toggle';
    toggleEl.title = 'Character Profile';
    toggleEl.setAttribute('tabindex', '0');
    toggleEl.innerHTML = '<div class="drawer-icon fa-solid fa-id-card"></div>';
    toggleEl.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleProfile();
    });
    toggleEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleProfile();
        }
    });

    holder.appendChild(toggleEl);
}

function createPopout() {
    if (document.getElementById(POPOUT_ID)) {
        popoutEl = document.getElementById(POPOUT_ID);
        return;
    }

    popoutEl = document.createElement('div');
    popoutEl.id = POPOUT_ID;
    popoutEl.className = 'nad-profile-popout';
    popoutEl.addEventListener('click', (event) => {
        if (event.target.closest('.nad-profile-close')) {
            closeProfile();
            return;
        }
        if (event.target.closest('#nad-profile-focus-chat')) {
            document.getElementById('send_textarea')?.focus();
        }
    });

    document.body.appendChild(popoutEl);
}

function bindEvents() {
    const refresh = () => refreshProfile();

    // Confirmed SillyTavern event names (see public/scripts/events.js).
    // Selecting a character fires CHAT_CHANGED / CHAT_LOADED.
    const eventNames = [
        'CHAT_CHANGED',
        'CHAT_LOADED',
        'CHARACTER_EDITED',
        'CHARACTER_DELETED',
        'CHARACTER_DUPLICATED',
        'CHARACTER_RENAMED',
        'GROUP_UPDATED',
    ];

    eventNames.forEach((name) => {
        const type = event_types?.[name];
        if (type && typeof eventSource?.on === 'function') {
            eventSource.on(type, refresh);
        }
    });

    document.addEventListener('click', onDocumentClick);

    // Re-attach the toggle if SillyTavern re-renders the nav rail.
    // Debounced so it stays cheap during frequent DOM updates (e.g. streaming).
    let reattachScheduled = false;
    const observer = new MutationObserver(() => {
        if (reattachScheduled) return;
        reattachScheduled = true;
        requestAnimationFrame(() => {
            reattachScheduled = false;
            if (!document.getElementById(TOGGLE_ID)) {
                createToggle();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function restoreState() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }

    // Default to open on first run so the feature is discoverable.
    if (saved === null || saved === '1') {
        openProfile();
    }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function initCharacterProfile() {
    createToggle();
    createPopout();
    bindEvents();
    restoreState();
    refreshProfile();
}

export function setCharacterProfileEnabled(value) {
    enabled = !!value;

    if (toggleEl) {
        toggleEl.style.display = enabled ? '' : 'none';
    }

    if (!enabled) {
        closeProfile();
    }
}
