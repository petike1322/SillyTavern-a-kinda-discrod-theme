import { eventSource, event_types, getThumbnailUrl, name1 } from '../../../../../script.js';
import { power_user } from '../../../../power-user.js';
import { user_avatar } from '../../../../personas.js';
import { toggleDrawer } from './drawerClickOverride.js';

const BAR_ID = 'nad-user-profile-bar';

let barEl = null;
let listenersBound = false;
let composerObserver = null;

function syncComposerHeight() {
    const composer = document.getElementById('send_form');
    if (!composer) return;

    const height = composer.getBoundingClientRect().height;
    if (height > 0) {
        document.body.style.setProperty('--nad-composer-height', `${height}px`);
    }
}

function refreshUserProfile() {
    if (!barEl) return;

    const avatarId = user_avatar;
    const personaName = avatarId ? power_user.personas?.[avatarId] : '';
    const displayName = personaName || name1 || 'User';
    const image = barEl.querySelector('img');
    const name = barEl.querySelector('.nad-user-profile-name');
    const avatar = barEl.querySelector('.nad-user-profile-avatar');

    name.textContent = displayName;
    image.alt = displayName;
    image.hidden = !avatarId;
    avatar.classList.toggle('has-avatar', !!avatarId);

    if (avatarId) {
        image.src = getThumbnailUrl('persona', avatarId);
    } else {
        image.removeAttribute('src');
    }
}

function createUserProfileBar() {
    const existingBar = document.getElementById(BAR_ID);
    if (existingBar) {
        barEl = existingBar;
        return;
    }

    barEl = document.createElement('button');
    barEl.id = BAR_ID;
    barEl.className = 'nad-user-profile-bar';
    barEl.type = 'button';
    barEl.setAttribute('aria-label', 'Toggle persona manager');
    barEl.innerHTML = `
        <span class="nad-user-profile-avatar">
            <img alt="">
            <i class="fa-solid fa-user" aria-hidden="true"></i>
        </span>
        <span class="nad-user-profile-name"></span>
        <i class="nad-user-profile-menu fa-solid fa-ellipsis" aria-hidden="true"></i>`;

    barEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const toggle = document.querySelector('#persona-management-button > .drawer-toggle');
        if (toggle) toggleDrawer(toggle);
    });

    document.body.appendChild(barEl);
}

function bindEvents() {
    if (listenersBound) return;
    listenersBound = true;

    const refresh = () => refreshUserProfile();
    [event_types?.PERSONA_CHANGED, event_types?.CHAT_CHANGED].filter(Boolean).forEach((eventType) => {
        eventSource.on(eventType, refresh);
    });
}

export function initUserProfileBar() {
    createUserProfileBar();
    bindEvents();
    refreshUserProfile();

    const composer = document.getElementById('send_form');
    if (composer && typeof ResizeObserver === 'function') {
        composerObserver?.disconnect();
        composerObserver = new ResizeObserver(syncComposerHeight);
        composerObserver.observe(composer);
        syncComposerHeight();
    }
}
