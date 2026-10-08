# Slightly A Discord Theme
![image-2](https://github.com/user-attachments/assets/e52f80be-949c-41d9-9ffe-025820995604)

![image](https://github.com/user-attachments/assets/980c12bf-1dba-415d-9f17-6efc06b8028e)

![image](https://github.com/user-attachments/assets/d1a42247-ddbc-498a-9a04-bb0760895aca)

You will need:

1. Turn off other themes
2. Install theme extension https://github.com/IceFog72/SillyTavern-Not-A-Discord-Theme
3. Reload page
4. Select 'Slightly A Discord Theme' as UI Theme for colors

## What's new in v2 (Glass)

- **Modern glassmorphism** — frosted, translucent panels, popups, menus and drawers with
  soft depth, consistent radii and a proper focus ring. Falls back to solid surfaces on
  browsers without `backdrop-filter`, and respects `prefers-reduced-motion`.
- **Overlay panels** — secondary right-side panels (World Info, Quick Replies, Gallery,
  Tracker, Codex, Notebook, …) now float *over* the chat as frosted cards instead of
  squeezing it. Toggle **Overlay Panels** off in Theme Customization to restore the
  classic push layout.
- **Rebuilt theme settings** — the Theme Customization drawer is now organized into
  grouped cards (Layout, Appearance, Chat, Avatars, Colors, Behavior) with a **search
  box** and **per-group reset** buttons.
- **New settings** — Accent Color, Corner Roundness, Interface Density (Comfortable /
  Compact), and Overlay Panels.
- **Character Profile Popout** — a Discord-style "user profile" card for the current
  character, docked to the left side of the screen. Shows the character's banner, avatar,
  name, description, personality, scenario, creator/version and tags. Toggle it from the
  **id-card icon** in the left nav rail, or disable it entirely via the
  **Character Profile Popout** setting.
- **User Profile Bar** — a fixed bottom-left dock showing the active persona.
  It floats with a 4px inset inside the character panel, matches the composer height,
  and sits 7px above the bottom edge. The character selector stays visible above it
  while the chat and composer reserve space for the full dock. Click the bar to open
  Persona Management.

All existing settings and CSS variables are preserved, so your saved configuration keeps
working after upgrading.

What I recommended to have too:

- [SillyTavern-WorldInfoDrawer](https://github.com/LenAnderson/SillyTavern-WorldInfoDrawer)
- [Extension-TopInfoBar](https://github.com/SillyTavern/Extension-TopInfoBar)
- [SillyTavern-CssSnippets](https://github.com/LenAnderson/SillyTavern-CssSnippets)
- [Dialogue Colorizer](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer)

If you are using QuickReplies:

- [SimpleQRBarToggle](https://github.com/IceFog72/SillyTavern-SimpleQRBarToggle)
- [SillyTavern-QuickRepliesDrawer](https://github.com/LenAnderson/SillyTavern-QuickRepliesDrawer)

List of Extensions adapted to theme UI:

- [Chat Top Bar](https://github.com/SillyTavern/Extension-TopInfoBar)
- [Codex](https://github.com/LenAnderson/SillyTavern-Codex)
- [Extension Manager](https://github.com/LenAnderson/SillyTavern-ExtensionManager)
- [Notebook](https://github.com/SillyTavern/Extension-Notebook)
- [Objective](https://github.com/SillyTavern/Extension-Objective)
- [Quick Replies Drawer](https://github.com/LenAnderson/SillyTavern-QuickRepliesDrawer)
- [WorldInfoDrawer](https://github.com/LenAnderson/SillyTavern-WorldInfoDrawer)
- [SillyTavern-Tracker](https://github.com/kaldigo/SillyTavern-Tracker)
- And maybe others I forget
  
Additional Info:

1. For better quality of card img in chat, you need to edit config.yaml -> 
```
thumbnails:
  enabled: false 
```

> **Caution for people with thousands of cards! It will make all image load in full size in Character List Panel!**


2. Don't forget to try 

![image](https://github.com/user-attachments/assets/7c560faa-b03b-473c-b720-625cede9eb11)

3. Size of main Split panels(Chat/WI/Quick Replies) can be resized. Pull all the way to right to reset to auto.

![image-1](https://github.com/user-attachments/assets/1f2e412b-b9d4-4327-92e3-45ee08124ee6)

4. Mobile? : it's works but not optimized for touch and will not be (only major problem fixes)
5. I'm using PWAsForFirefox, any other PWA solution is ok too

## Feedback

My discord [https://discord.gg/2tJcWeMjFQ](https://discord.gg/2tJcWeMjFQ)
Or you can catch me on ST discord channel

[ko-fi](https://ko-fi.com/icefog72)
