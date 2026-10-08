import { eventSource, event_types } from '../../../../../script.js';
import { DOMPurify } from '../../../../../lib.js';

/**
 * Discord-style "User Profile" popout for the currently selected character.
 *
 * Renders a frosted-glass card on the left side of the screen with the
 * character's banner, avatar, name, description, personality, scenario,
 * creator/version metadata and tags. Updates automatically when the
 * selected character or chat changes.
 *
 * Character data is read from the global SillyTavern context (window.*)
 * rather than named imports, so a missing/renamed export can never break
 * the whole theme — the popout simply degrades gracefully.
 */

const POPOUT_ID = 'nad-char-profile';
const TOGGLE_ID = 'nad-char-profile-toggle';
const STORAGE_KEY = 'nad-char-profile-open';

let popoutEl = null;
let toggleEl = null;
let isOpen = false;
let enabled = true;

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

function getCurrentCharacter() {
    try {
        const chid = window.this_chid;
        const chars = window.characters;
        if (chid === undefined || chid === null || chid === 'undefined') return null;
        if (!Array.isArray(chars)) return null;
        return chars[Number(chid)] || null;
    } catch (e) {
        return null;
    }
}

function getAvatarUrl(character) {
    if (!character || !character.avatar) return '';
    try {
        if (typeof window.getThumbnailUrl === 'function') {
            return window.getThumbnailUrl('avatar', character.avatar);
        }
    } catch (e) { /* ignore */ }
    return `/thumbnail?type=avatar&file=${encodeURIComponent(character.avatar)}`;
}

function substitute(text) {
    if (!text) return '';
    let out = String(text);
    try {
        if (typeof window.substituteParams === 'function') {
            out = window.substituteParams(out);
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
    const description = sanitize(character.description);
    const personality = sanitize(character.personality);
    const scenario = sanitize(character.scenario);
    const creator = character.creator ? escapeHtml(character.creator) : '';
    const version = character.character_version ? escapeHtml(character.character_version) : '';
    const tags = Array.isArray(character.tags) ? character.tags.filter(Boolean) : [];

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
    renderProfile(getCurrentCharacter());
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

    const eventNames = [
        'CHARACTER_SELECTED',
        'CHAT_CHANGED',
        'CHAT_LOADED',
        'CHARACTER_EDITED',
        'CHARACTER_DELETED',
        'CHARACTER_DUPLICATED',
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
