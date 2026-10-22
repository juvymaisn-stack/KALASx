"auto";
var APP_VERSION = 44;                    // the Admin panel raises this automatically on every publish
// In a packaged APK the bundled script is read-only, so updates are saved here and run instead of the bundled copy.
var UPDATED_PATH = (function () {
    try { return String(context.getFilesDir().getAbsolutePath()) + "/klassx_launcher_updated.js"; }
    catch (e) { return "/sdcard/KlassX/klassx_launcher_updated.js"; }
})();
(function () {
    try {
        var me = "";
        try { me = String(engines.myEngine().source); } catch (e) {}
        if (me === UPDATED_PATH || !files.exists(UPDATED_PATH)) return;
        var m = /var APP_VERSION = (\d+);/.exec(files.read(UPDATED_PATH));
        if (!m || Number(m[1]) <= APP_VERSION) return;       // bundled copy is newer or equal -> keep it
        engines.execScriptFile(UPDATED_PATH);
        sleep(500);
        exit();
    } catch (e) { /* fall through and run the bundled script */ }
})();
// KlassX Online launcher - floating window with logo background
// Works with AutoX.js / Auto.js (v4.1+)

var APP_NAME = "KlassX Online";
var TEMPLATE_DIR = "/sdcard/脚本/templates/";   // captcha digit + confirm templates
var SELECT_DELAY_MS = 8000;  // fallback fixed wait if screen capture isn't allowed (ms)
var TAP_MS = 120;            // finger-down time of each tap (ms) - games often ignore instant taps
var STABLE_NEEDED = 2;       // Select Server must be seen this many checks in a row before tapping
var COOLDOWN_MS = 10000;     // after a run, wait this long before watching for the screen again (ms)
var WAIT_MAX_MS = 60000;     // give up waiting for the main screen after this long (ms)
var LIST_DELAY_MS = 700;    // wait for the server list to open (ms)
var CHANNEL_DELAY_MS = 700;  // wait for the Channel List to appear after picking a server (ms)

// All coordinates measured on a 2576x1177 landscape screenshot
var REF_W = 2576, REF_H = 1177;

// ---- Device layout adapter (works on any screen size / aspect ratio) ----
// Every coordinate in this script is a point on the 2576x1177 reference screen. The adapter converts it to the
// real screen. Game UI is anchored to the screen edges, so points near the left/right/top/bottom stay glued to
// that edge and centred points stay centred. Modes (override: put one word in /sdcard/KlassX/layout.txt):
//   auto    (default) same aspect ratio as the reference (phones ~2.2:1) -> exact stretch; any other ratio
//           (tablets 4:3 / 16:10, foldables, narrow or wide phones) -> fit mode below
//   fit     uniform scale = min(W/REF_W, H/REF_H), UI glued to the screen edges - best for narrower screens such as tablets
//   height  uniform scale = H/REF_H (UI scaled by screen height)
//   width   uniform scale = W/REF_W (UI scaled by screen width)
//   stretch old behaviour: stretch X and Y independently
var LAYOUT_FILE = "/sdcard/KlassX/layout.txt";
var LAYOUT_MODE = "auto";
try {
    if (files.exists(LAYOUT_FILE)) {
        var _lm = String(files.read(LAYOUT_FILE)).replace(/\s/g, "").toLowerCase();
        if (/^(auto|match|fit|height|width|stretch)$/.test(_lm)) LAYOUT_MODE = _lm;
    } else {   // no layout.txt -> use the mode saved by the "Match screen" button
        var _sv = String(storages.create("klassx_launcher").get("layoutMode", "")).toLowerCase();
        if (/^(auto|match|fit|height|width|stretch)$/.test(_sv)) LAYOUT_MODE = _sv;
    }
} catch (e) {}
function layoutOf(W, H) {
    var kw = W / REF_W, kh = H / REF_H;
    var mode = LAYOUT_MODE;
    if (mode === "auto") {      // same aspect ratio as the reference -> exact stretch, otherwise edge-anchored fit
        var ar = W / H, rar = REF_W / REF_H;
        mode = Math.abs(ar - rar) / rar < 0.04 ? "stretch" : "match";
    }
    if (mode === "stretch") return { kx: kw, ky: kh, W: W, H: H, stretch: true };
    // "match" = what the game itself does (canvas scaler, width/height blend 0.5): scale = sqrt(kw*kh). Measured on a 2048x1280 tablet: HUD scale 0.929 = sqrt(0.795*1.0875)
    var sc = mode === "height" ? kh : (mode === "width" ? kw : (mode === "fit" ? Math.min(kw, kh) : Math.sqrt(kw * kh)));
    return { kx: sc, ky: sc, W: W, H: H, stretch: false };
}
// anc: "l"/"c"/"r" (X) or "t"/"c"/"b" (Y); omitted = chosen from where the point sits on the reference screen
function mapX(L, x, anc) {
    if (L.stretch) return Math.round(x * L.kx);
    anc = anc || (x < REF_W * 0.30 ? "l" : (x > REF_W * 0.70 ? "r" : "c"));
    if (anc === "l") return Math.round(x * L.kx);
    if (anc === "r") return Math.round(L.W - (REF_W - x) * L.kx);
    return Math.round(L.W / 2 + (x - REF_W / 2) * L.kx);
}
function mapY(L, y, anc) {
    if (L.stretch) return Math.round(y * L.ky);
    anc = anc || (y < REF_H * 0.30 ? "t" : (y > REF_H * 0.70 ? "b" : "c"));
    if (anc === "t") return Math.round(y * L.ky);
    if (anc === "b") return Math.round(L.H - (REF_H - y) * L.ky);
    return Math.round(L.H / 2 + (y - REF_H / 2) * L.ky);
}
var SELECT_X = 1481, SELECT_Y = 1030;   // "Select Server" button
var LIST_X = 1272;                      // server names x position

// Channel List (appears to the right after a server is picked)
var CHANNEL_X = 1440;
var CHANNEL_YS = [488, 587, 686, 784];  // rows: 0, 1, 2, 3 Channel
var CHANNEL_IDX = 2;                    // which channel to tap -> "2 Channel"
var TAP_CONNECT = true;                 // tap the Connect button after the channel (false = skip)
var CONNECT_X = 1846, CONNECT_Y = 903;

// Character Profile screen (Start button): tap Start to enter the game whenever it appears
var TAP_START = true;                   // false = don't auto-tap Start
var START_X = 2377, START_Y = 1093;     // "Start" button, bottom-right
var START_COOLDOWN_MS = 700;           // pause after a Start tap before watching again (ms)

// Character screen (Server Select / Create buttons): tap the character whenever it appears
var TAP_CHARACTER = true;               // false = don't auto-tap the character
var CHAR_X = 800, CHAR_Y = 700;         // the character in the middle-left of the screen
var CHAR_COOLDOWN_MS = 2000;            // pause after a character tap before watching again (ms)

// Login screen: tapped automatically whenever it appears (the game remembers the account)
var TAP_LOGIN = true;                   // false = don't auto-tap Login
var LOGIN_X = 1486, LOGIN_Y = 774;
var LOGIN_COOLDOWN_MS = 700;           // pause after a Login tap before watching again (ms)
var LOGIN_MAX_FAILS = 2;
// Loot button (round button with a white hand, in-game): tapped every time it shows up
var TAP_LOOT = true;                    // false = don't auto-loot
var LOOT_X = 1434, LOOT_Y = 805;        // center of the hand button
var LOOT_COOLDOWN_MS = 350;             // pause between loot taps while the button stays on screen (ms)
var LOOT_MAX_TAPS = 6;                  // taps per loot-button appearance; if the button is STILL there (items the hand cannot pick up) the script goes back to attacking
var LOOT_PAUSE_MS = 12000;              // how long loot taps are paused after LOOT_MAX_TAPS, so auto attack can keep tapping (ms)
// Revive dialog ("Do you wish to be revived?"): the Revive button is tapped every time it shows up
var TAP_REVIVE = true;                  // false = don't auto-revive
var REVIVE_X = 1288, REVIVE_Y = 676;    // center of the Revive button
var REVIVE_COOLDOWN_MS = 1500;          // pause between Revive taps while the dialog stays (ms)
// After Revive: use a quick slot (slot 1 = the item that takes you back to where you died)
var TAP_RETURN = true;                  // false = don't tap a slot after reviving
var RETURN_SLOT = 0;                    // index in QUICK (0 = slot 1, 1 = slot 2, ...)
var RETURN_DELAY_MS = 3000;             // wait this long after Revive before tapping (let the game load) (ms)
var RETURN_EXPIRE_MS = 60000;           // give up if the game screen does not come back within this time (ms)
var RETURN_TAPS = 1;                    // how many times to tap the slot
var RETURN_NOHUD_MS = 4000;             // if the HUD is not detected, tap the slot anyway this long after RETURN_DELAY_MS (ms)
var RETURN_SETTLE_MS = 800;             // short pause before the tap so the quick bar is ready after loading (ms)
// "Disconnected from Server!" dialog: the OK button is tapped every time it shows up
var TAP_DISCONNECT = true;              // false = don't auto-tap OK
var OK_X = 1288, OK_Y = 676;            // center of the OK button
var DISC_COOLDOWN_MS = 1500;            // pause between OK taps while the dialog stays (ms)

// Auto attack: taps the skill buttons (bottom-right of the game screen) while you are in the game.
// Pick which slots to use in the "Skills" panel. Positions are on the 2576x1177 reference screenshot.
var SKILLS = [
    { name: "Atk", x: 2322, y: 922  },   // big center attack button
    { name: "S1",  x: 2180, y: 783  },   // swirl, upper left
    { name: "S2",  x: 2326, y: 732  },   // kick, top
    { name: "S3",  x: 2469, y: 801  },   // purple, upper right
    { name: "S4",  x: 2135, y: 934  },   // swirl, left
    { name: "S5",  x: 2204, y: 1070 }    // swirl, bottom
];
// Quick slots: the bottom bar (items 1-6). Every selected slot is tapped once per round while you are in the game.
var QUICK = [
    { name: "1", x: 1055, y: 1092 },
    { name: "2", x: 1148, y: 1092 },
    { name: "3", x: 1240, y: 1092 },
    { name: "4", x: 1333, y: 1092 },
    { name: "5", x: 1426, y: 1092 },
    { name: "6", x: 1518, y: 1092 }
];
var QUICK_GAPS = [1000, 3000, 5000, 10000, 30000, 60000];   // choices for the time between rounds (ms)
// Pet: quick slot 3 holds the pet item. It is tapped ONCE per Play run (when you first enter the game),
// then the pet pop-up that opens gets its "Use" button tapped. That slot is skipped in the repeating quick rounds.
var PET_ON = true, PET_SLOT = 2;                 // PET_SLOT = index in QUICK (2 = slot 3)
var PET_USE = { x: 1488, y: 997 };               // "Use" button of the pet pop-up (reference screen 2576x1177)
var petDone = false;
// Buff (skill S5): the little buff icon under the Lv. plate (top-left) has a green duration bar. When the icon/bar
// is gone (only the GREEN BAR is checked) for BUFF_MISS_NEEDED checks in a row, S5 is tapped to re-buff. S5 is not used in the normal attack rotation.
var BUFF_ON = true, BUFF_SKILL = 5;                      // BUFF_SKILL = index in SKILLS (5 = S5)
var BUFF_BAR  = [173, 248, 181, 296];   // green duration bar at the right edge of the buff icon (measured on the 2576x1177 reference screenshot)
var BUFF_ICON = [121, 245, 171, 295];   // the buff icon itself (not used for the trigger any more)
var BUFF_RED_ON = true;                 // true = re-buff as soon as RED shows up in the buff bar (the bar turns red when the buff is about to run out)
var BUFF_RED_MIN = 0.02;                // share of the bar box that must be red to count (0.02 = a few pixels)
var BUFF_YELLOW_MIN = 0.04;             // share of the bar box that is YELLOW (buff running low) -> counts as "still active": never re-buff in the yellow state
var BUFF_GONE_ON = true;                // true = ALSO re-buff when the bar / icon is gone completely (no green and no red)
var BUFF_BAR_MIN = 0.04;                // share of the bar box that must still be green; below that the bar counts as gone
var BUFF_CHECK_MS = 1000, BUFF_MISS_NEEDED = 3, BUFF_RETAP_MS = 6000;
var buffMiss = 0, lastBuffCheck = 0, lastBuffTap = 0;
var ATK_GAPS = [250, 400, 600, 900, 1300];   // choices for the pause between skill taps (ms)

// Auto target: while attacking, if no mob is selected the script taps one so the skills have something to hit.
//  1) BEST: put a cropped picture of a mob (its body or name plate, cut from a 2576x1177 screenshot) in
//     /sdcard/脚本/templates/ as mob.png (extra mobs: mob2.png, mob3.png). The script finds the mob NEAREST to your
//     character and taps it.
//  2) Optional: crop the target frame that appears when a mob is selected (mob HP bar / name box at the top) and save
//     it as target.png. Then the script only re-targets when that frame is gone (e.g. the mob died).
//  3) No mob.png: it sweeps taps around the character (TARGET_RING) every TARGET_RETRY_MS until something is selected.
var TARGET_CHECK_MS = 1200;                 // how often the screen is checked for a target / mob (ms)
var TARGET_RETRY_MS = 3000;                 // sweep mode: pause between blind taps when the target state is unknown (ms)
var TARGET_SWEEP_MS = 1500;                 // sweep mode: pause between taps when target.png says nothing is selected (ms)
var TARGET_THRESHOLD = 0.75;                // template match strictness (0-1, higher = stricter)
var TARGET_PLAY = [450, 220, 2050, 900];    // mob search area on the reference screen (keeps joystick / skills / HUD out)
var TARGET_FRAME_REGION = [800, 20, 1800, 220];   // where the selected-target frame shows up (reference screen)
var TARGET_TAP_DY = 0;                      // tap this many reference px below the template centre (use if mob.png is a name plate)
var TARGET_CHAR = [1288, 588];              // where your character stands on the reference screen
var TARGET_RING = [                         // sweep points (reference screen), clockwise around the character
    [1288, 400], [1560, 470], [1620, 600], [1540, 740],
    [1288, 790], [1020, 740], [960, 600], [1020, 470]
];
// Name-plate trigger (no picture needed): hostile mobs show their name in RED with a red HP line, players / pets / NPCs
// do not. When a red name plate shows up and no target is selected, the mob under it is tapped (nearest one to you first).
// "Selected" = the red HP bar of the target frame at the top centre of the screen.
// All areas are fractions of the screen (0-1) so they work on any device.
var TARGET_NAME_ON = true;
// Black-box plate detection: a mob plate = a near-black box (the plate background) with red name text inside it.
// Players / NPCs also have dark boxes but no red text, dark chairs / shadows have no red text either.
var TARGET_BOX_ON = true;                          // true = find plates by their black background (false = old red-text-only detection)
var TARGET_BOX_DARK = 68;                          // a pixel is "black" when its brightest channel is <= this (plate background is ~20-60, floor ~110+)
var TARGET_BOX_MINW = 0.035, TARGET_BOX_MAXW = 0.20;   // plate width (fraction of screen width)
var TARGET_BOX_MINH = 0.008, TARGET_BOX_MAXH = 0.05;   // plate height (fraction of screen height)
var TARGET_BOX_MINDARK = 0.30;                     // at least this share of the box must be black
var TARGET_BOX_MINRED = 12;                        // at least this many red text pixels (sampled) inside the box = hostile mob
var TARGET_NAME_SCAN = [0.24, 0.20, 0.78, 0.80];   // where plates are looked for [x0, y0, x1, y1] (keeps HUD, KlassX panel, joystick, skills out)
var TARGET_LOCK_SCAN = [0.30, 0.04, 0.70, 0.13];   // target frame HP bar (top centre) -> "a mob is selected"
var TARGET_NAME_MINW = 0.05;                       // a plate is at least this wide (fraction of screen width)
var TARGET_NAME_DY = 0.06;                         // tap this far BELOW the plate (fraction of screen height) = on the mob's body
var TARGET_NAME_CHAR = [0.5, 0.62];                // where your character stands (fraction of screen) - nearest plate wins
var TARGET_TAP_GAP_MS = 700;                       // minimum time between two target taps (ms)
var TARGET_SWEEP_ON = false;                       // true = also tap around the character when no plate / template is found
var RETARGET_ON = true;                            // true = even while a mob is selected, tap a mob again every RETARGET_MS (stops the character standing stuck on one spot / one mob)
var RETARGET_MS = 700;                             // retarget interval (ms)
// Auto move: when the character is NOT attacking (no mob selected, or the selected mob is too far away) for MOVE_IDLE_MS,
// the joystick is swiped to walk a short distance toward the nearest mob plate (or in a rotating direction when no plate is
// visible) so the attack can start again. Nothing happens while a mob is selected and close = while attacking.
var MOVE_ON = true;                                // false = never touch the joystick
var MOVE_IDLE_MS = 1000;                           // not attacking for this long -> swipe the joystick (ms)
var MOVE_JOY = [295, 877];                         // joystick centre on the 2576x1177 reference screen (left-bottom anchored)
var MOVE_RADIUS = 110;                             // how far the stick is pushed from the centre (reference px)
var MOVE_MS = 700;                                 // how long the stick is held = how far the character walks (ms)
var MOVE_GAP_MS = 1500;                            // minimum pause between two walks (ms)
var MOVE_FAR_ON = false;                           // true = also walk when a mob is selected but far away (off: a selected mob always means "attacking" -> joystick stays still)
var MOVE_FAR_FRAC = 0.14;                          // a selected mob farther than this (fraction of screen width) from the character is "out of reach" = not attacking
var MOVE_RANDOM_ON = true;                         // true = every swipe goes in a RANDOM direction with a random length (false = toward the mob)
var MOVE_RANDOM_NEEDS_MOB = true;                  // true = random swipes only while a mob plate was seen recently (no monster around -> still); false = random swipe whenever not attacking
var MOVE_MS_MIN = 400, MOVE_MS_MAX = 1000;         // random hold time range (ms) = random walking distance
var MOVE_RADIUS_MIN = 0.7;                         // random stick push: 70%..100% of MOVE_RADIUS
var MOVE_BLIND_ON = false;                         // false = no mob plate on screen -> never move (default); true = walk in MOVE_BLIND_DIRS (rotating) anyway
var MOVE_BLIND_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up, right, down, left (screen directions)
var mvDirAt = 0, MOVE_DIR_FRESH_MS = 2000;           // the mob direction is only used while it was seen this recently (ms)
var mvIdleSince = 0, mvLastAt = 0, mvBlind = 0, mvLocked = null, mvStateAt = 0, mvDir = null, mvFar = false;
var tgtCheckAt = 0, tgtTapAt = 0, tgtRing = 0, tgtTaps = 0, tgtLogAt = 0, tgtLastPt = null;

// Server List = 8 names in game order, only ~4 are visible at a time. The list opens at the TOP, and the script
// only ever swipes UP (never down):
//   from: "top"    -> no swipe (Strife, Havoc, Fury rows are already visible)
//         "mid"    -> one slow swipe UP of `drag` ref px from the top so Kalayaan comes into view
//         "bottom" -> swipe UP until the list is at the bottom (Alab, Tala, Alamat, Wrath rows)
// y = tap position of that row AFTER scrolling (reference 2576x1177 screen, taken from your screenshots).
// Alab sits half-clipped at the top edge when the list is at the bottom, so it is tapped a bit lower (470).
var SERVERS = [
    { name: "Strife",   from: "top",    y: 490 },
    { name: "Havoc",    from: "top",    y: 610 },
    { name: "Fury",     from: "top",    y: 732 },
    { name: "Kalayaan", from: "mid",    y: 519, drag: 334 },   // swipe up ~334 from the top -> Kalayaan ~519 (your 3rd screenshot)
    { name: "Alab",     from: "bottom", y: 470 },
    { name: "Tala",     from: "bottom", y: 562 },
    { name: "Alamat",   from: "bottom", y: 681 },
    { name: "Wrath",    from: "bottom", y: 802 }
];
var LIST_SWIPES = 4;                 // swipes used to reach the top / bottom of the list
var LIST_SWIPE_MS = 400;             // duration of each scroll swipe (ms)
var LIST_SWIPE_FROM = 800, LIST_SWIPE_TO = 440;   // swipe path inside the list (reference y)

// --- logging: console + file (/sdcard/klassx_launcher.log) ---
var LOG_FILE = "/sdcard/klassx_launcher.log";
var stopFlag = false;
function nap(ms) {            // sleep that can be cancelled with the Stop button
    var end = Date.now() + ms;
    while (Date.now() < end) {
        if (stopFlag) throw "STOPPED";
        sleep(Math.max(1, Math.min(100, end - Date.now())));
    }
}

var logShown = false;
var LOG_LINES = [];          // last lines, shown in the on-screen log
var LOG_KEEP = 60;
function refreshLogView() {
    if (!w || !w.logview) return;
    ui.run(function () {
        w.logview.setText(LOG_LINES.join("\n"));
        w.logscroll.post(function () { w.logscroll.fullScroll(130); });   // stick to bottom
    });
}
function log(msg) {
    var d = new Date();
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    var line = p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds()) + " " + msg;
    console.log(line);
    try { files.append(LOG_FILE, line + "\n"); } catch (e) {}
    LOG_LINES.push(line);
    if (LOG_LINES.length > LOG_KEEP) LOG_LINES.shift();
    if (logShown) refreshLogView();
}
function logErr(where, e) {
    log("ERROR in " + where + ": " + e + (e && e.stack ? "\n" + e.stack : ""));
}
try {   // keep the log file from growing forever
    if (files.exists(LOG_FILE) && files.read(LOG_FILE).length > 200000) files.remove(LOG_FILE);
} catch (e) {}
log("layout mode " + LAYOUT_MODE + " (ref " + REF_W + "x" + REF_H + ")");
log("==== script started | screen " + device.width + "x" + device.height + " | " + device.brand + " " + device.model + " | android " + device.release + " ====");

var store = storages.create("klassx_launcher");
var serverIdx = 0;
(function () {                       // restore the chosen server by NAME (the list order changed when servers were added)
    var nm = store.get("serverName", null);
    if (!nm) { var legacy = ["Strife", "Havoc", "Fury", "Alab", "Tala"]; nm = legacy[store.get("server", 0)] || "Strife"; }
    for (var i = 0; i < SERVERS.length; i++) if (SERVERS[i].name === nm) { serverIdx = i; return; }
})();

var pickOn = store.get("pickOn", true);   // server auto-select ON/OFF
(function () {                       // restore the chosen channel (0..CHANNEL_YS.length-1)
    var c = parseInt(store.get("chIdx", CHANNEL_IDX), 10);
    if (!isNaN(c) && c >= 0 && c < CHANNEL_YS.length) CHANNEL_IDX = c;
})();

var atkOn = store.get("atkOn", true);              // auto attack ON/OFF
var targetOn = store.get("targetOn", true);        // auto target ON/OFF
var captchaOn = store.get("captchaOn", true);      // captcha solver ON/OFF
var teachOn = store.get("teachOn", true);          // captcha teach (ask for the code when a digit shape is unknown) ON/OFF
var skillSel = String(store.get("skillSel", "100000"));   // one 0/1 per slot: which skills to use
while (skillSel.length < SKILLS.length) skillSel += "0";
var gapIdx = store.get("gapIdx", 1);
if (gapIdx >= ATK_GAPS.length) gapIdx = 1;
function skillEnabled(i) { return skillSel.charAt(i) === "1"; }

var QUICK_SECTION = false;                                // false = Quick buttons hidden and the repeating quick rounds never run
var quickOn = QUICK_SECTION && store.get("quickOn", true);   // quick slots ON/OFF
var quickSel = String(store.get("quickSel", "000000"));   // one 0/1 per slot
while (quickSel.length < QUICK.length) quickSel += "0";
var quickGapIdx = store.get("quickGapIdx", 2);
if (quickGapIdx >= QUICK_GAPS.length) quickGapIdx = 2;
function quickEnabled(i) { return quickSel.charAt(i) === "1"; }

var busy = false;

// ---- Monitor: every signed-in copy uploads a small status + its last log lines (Firestore monitor/{uid});
//      the Admin panel lists the users and shows a user's log when you tap the name ----
var MON_PUSH_MS = 60000;        // how often each copy uploads its status + log (ms) - lower = fresher but more Firestore writes
var MON_ONLINE_MS = 150000;     // a user counts as online if the last upload is newer than this (ms)
var MON_REFRESH_MS = 10000;     // admin panel auto-refresh while it is open (ms)
var MON_LOG_LINES = 40;         // log lines uploaded per user
var monShown = false, monView = "", monDocs = {}, monBusy = false, monFetching = false, monTok = null, monWarned = false;
var KICK_CHECK_MS = 30000;     // how often each copy checks whether an admin kicked it (ms) - one small Firestore read each time
var kickSeen = null, kickBusy = false, kickWarned = false, monKickArm = 0;
var monState = "Idle";

// Background image (KlassX logo), embedded so the script stays one file
var BG_B64 = "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";

// Medium-size panel: 210 x 156 dp, logo background + dark overlay for readability
// ---- First-run permission helper (added) ----
// Runs once. Asks for accessibility, overlay and storage, and auto-taps the screen-capture popup.
// Android only lets the user switch on Accessibility / overlay by hand, so those open their settings page and wait.
(function () {
    try {
        var _fr = storages.create("klassx_firstrun");
        if (_fr.get("done", false)) return;
        toast("First run: allow each permission once");
        try { if (!auto.service) auto.waitFor(); } catch (e) {}
        try {
            if (!floaty.checkPermission()) {
                floaty.requestPermission();
                var _t0 = Date.now();
                while (!floaty.checkPermission() && Date.now() - _t0 < 120000) sleep(500);
            }
        } catch (e) {}
        try { runtime.requestPermissions(["android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE"]); } catch (e) {}
        threads.start(function () {   // tap "Start now" / "Allow" on the screen-capture and storage popups
            var end = Date.now() + 90000;
            while (Date.now() < end) {
                try {
                    var b = textMatches(/^(Start now|Start|Allow|While using the app|ALLOW|立即开始|允许)$/).findOne(1500);
                    if (b) { b.click(); sleep(600); }
                } catch (e) {}
            }
        });
        _fr.put("done", true);
    } catch (e) {}
})();

var w = floaty.window(
    <frame>
        <img id="bg" w="*" h="*" scaleType="centerCrop"/>
        <vertical bg="#99000000" w="210" h="auto" padding="6">
            <horizontal>
                <text id="drag" text="⠿ KlassX  (drag)" textColor="#ffffff" textSize="12sp" gravity="center" layout_weight="1" w="0" h="28"/>
                <button id="mini" text="—" w="44" h="28" textSize="12sp" padding="0" margin="1" alpha="0.9"/>
            </horizontal>
            <scroll id="mainscroll" w="*" h="auto">
            <vertical id="mainbody" w="*" h="auto">
            <vertical id="auth" w="*" h="auto" bg="#CC000000" margin="2" padding="4">
                <horizontal>
                    <button id="tabLogin" text="Login" layout_weight="1" w="0" h="32" textSize="11sp" margin="1"/>
                    <button id="tabReg" text="Register" layout_weight="1" w="0" h="32" textSize="11sp" margin="1" alpha="0.5"/>
                </horizontal>
                <input id="authUser" hint="Username" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="20"/>
                <input id="authPass" hint="Password" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword"/>
                <input id="authPass2" hint="Confirm password" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword" visibility="gone"/>
                <input id="authKey" hint="Activation key (KLX-XXXX-XXXX-XXXX)" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="40" visibility="gone"/>
                <text id="authMsg" text="" w="*" h="auto" textColor="#ff8a80" textSize="11sp" gravity="center"/>
                <button id="authGo" text="Login" w="*" h="38" textSize="13sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="2"/>
                <horizontal>
                    <button id="authRemember" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="authExit" text="Exit" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button id="updBtnA" text="⟳ Update" w="*" h="32" textSize="11sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
            </vertical>
            <vertical id="updbar" w="*" h="auto" visibility="gone" bg="#CC1B5E20" margin="2" padding="4">
                <text id="updText" text="" w="*" h="auto" textColor="#ffffff" textSize="11sp" gravity="center"/>
                <button id="updGo" text="Update now" w="*" h="34" textSize="12sp" textStyle="bold" textColor="#ffffff" bg="#2E7D32" margin="1"/>
            </vertical>
            <vertical id="subpanel" w="*" h="auto" visibility="gone" bg="#CC4A148C" margin="2" padding="4">
                <text id="subTitle" text="Subscription required" w="*" h="auto" textColor="#ffffff" textSize="12sp" textStyle="bold" gravity="center"/>
                <text id="subMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="11sp" gravity="center"/>
                <input id="subKey" hint="Subscription key (KLX-XXXX-XXXX-XXXX)" w="*" h="40" textSize="11sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="40"/>
                <horizontal>
                    <button id="subPaste" text="Paste" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="subGo" text="Activate" layout_weight="1" w="0" h="34" textSize="11sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="1"/>
                </horizontal>
                <button id="updBtnS" text="⟳ Update" w="*" h="32" textSize="11sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
                <button id="subLogout" text="Logout" w="*" h="30" textSize="11sp" margin="1" alpha="0.9"/>
            </vertical>
            <vertical id="controls" w="*" h="auto" visibility="gone">
            <text id="subInfo" text="" w="*" h="auto" textColor="#ce93d8" textSize="10sp" gravity="center"/>
            <horizontal>
                <button id="pick" text="" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
                <button id="server" text="" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            </horizontal>
            <button id="channel" text="" w="*" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            <button id="play" text="▶ Play" w="*" h="40" textSize="14sp" textStyle="bold" textColor="#ffffff" bg="#2E7D32" margin="2"/>
            </vertical>
            <scroll id="logscroll" w="*" h="110" visibility="gone" bg="#CC000000" margin="2">
                <text id="logview" w="*" text="" textColor="#66ff99" textSize="10sp" padding="4"/>
            </scroll>
            <vertical id="controls2" w="*" h="auto" visibility="gone">
            <button id="toolsBtn" text="Tools ▾" w="*" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            <vertical id="toolpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
            <horizontal>
                <button id="atk" text="" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
                <button id="skills" text="Skills ▾" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            </horizontal>
            <vertical id="skillpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
                <horizontal>
                    <button id="k0" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="k1" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="k2" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                </horizontal>
                <horizontal>
                    <button id="k3" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="k4" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="k5" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button id="gap" text="" w="*" h="34" textSize="11sp" margin="1" alpha="0.9"/>
            </vertical>
                <button id="captcha" text="" w="*" h="36" textSize="12sp" margin="1" alpha="0.9"/>
                <button id="teach" text="" w="*" h="36" textSize="12sp" margin="1" alpha="0.9"/>
                <button id="tgt" text="" w="*" h="36" textSize="12sp" margin="1" alpha="0.9"/>
                <button id="matchScr" text="Match screen" w="*" h="36" textSize="12sp" margin="1" alpha="0.9"/>
            </vertical>
            <horizontal visibility="gone">
                <button id="quick" text="" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
                <button id="qslots" text="Quick ▾" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            </horizontal>
            <vertical id="quickpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
                <horizontal>
                    <button id="q0" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="q1" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="q2" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                </horizontal>
                <horizontal>
                    <button id="q3" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="q4" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                    <button id="q5" text="" layout_weight="1" w="0" h="34" textSize="11sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button id="qgap" text="" w="*" h="34" textSize="11sp" margin="1" alpha="0.9"/>
            </vertical>
            <button id="updBtnC" text="⟳ Update" w="*" h="32" textSize="11sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
            <button id="logout" text="Logout" w="*" h="32" textSize="11sp" margin="2" alpha="0.9"/>
            <vertical id="keybar" w="*" h="auto" visibility="gone" bg="#CC4A148C" margin="2" padding="3">
                <horizontal>
                    <input id="admDays" text="30" hint="Days (1-30) or 12h" inputType="text" layout_weight="1" w="0" h="40" textSize="12sp" gravity="center" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="5" margin="1"/>
                    <button id="admGenKey" text="Generate key" layout_weight="2" w="0" h="40" textSize="12sp" textStyle="bold" textColor="#ffffff" bg="#6A1B9A" margin="1"/>
                </horizontal>
                <text id="keyMsg" text="" w="*" h="auto" textColor="#a5d6a7" textSize="11sp" gravity="center"/>
            </vertical>
            <button id="admin" text="Admin ▾" visibility="gone" w="*" h="32" textSize="11sp" margin="2" alpha="0.9"/>
            <scroll id="admscroll" w="*" h="190" visibility="gone" margin="2">
            <vertical id="adminpanel" w="*" h="auto" bg="#CC000000" padding="4">
                <text id="admInfo" text="" w="*" h="auto" textColor="#ffffff" textSize="11sp" gravity="center"/>
                <horizontal>
                    <input id="admRepo" hint="Repo: owner/name" layout_weight="1" w="0" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="120"/>
                    <button id="admRepoSave" text="Save" w="64" h="38" textSize="11sp" margin="1" textColor="#ffffff" bg="#2E7D32"/>
                </horizontal>
                <button id="admBrowse" text="Browse / upload file..." w="*" h="32" textSize="11sp" margin="1" alpha="0.9"/>
                <input id="admFile" hint="File to publish (empty = this script)" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true"/>
                <input id="admToken" hint="GitHub token" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword"/>
                <button id="admPaste" text="Paste token from clipboard" w="*" h="32" textSize="11sp" margin="1" alpha="0.9"/>
                <input id="admNotes" hint="What's new (shown to users)" w="*" h="40" textSize="12sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="120"/>
                <text id="admMsg" text="" w="*" h="auto" textColor="#a5d6a7" textSize="11sp" gravity="center"/>
                <button id="admPublish" text="Publish update" w="*" h="36" textSize="12sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="1"/>
            </vertical>
            </scroll>
            <button id="monBtn" text="Users ▾" visibility="gone" w="*" h="32" textSize="11sp" margin="2" alpha="0.9"/>
            <horizontal id="usrtabs" w="*" h="auto" visibility="gone">
                <button id="tabMon" text="Monitor" layout_weight="1" w="0" h="32" textSize="11sp" margin="2"/>
                <button id="tabDev" text="Devices" layout_weight="1" w="0" h="32" textSize="11sp" margin="2"/>
            </horizontal>
            <vertical id="monpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="4">
                <horizontal>
                    <button id="monBack" text="◀" visibility="gone" w="40" h="30" textSize="12sp" margin="1"/>
                    <text id="monTitle" text="Users" layout_weight="1" w="0" h="30" gravity="center_vertical" textColor="#ffffff" textSize="12sp" textStyle="bold"/>
                    <button id="monKick" text="Kick" visibility="gone" w="56" h="30" textSize="11sp" margin="1" textColor="#ffffff" bg="#C62828"/>
                    <button id="monRefresh" text="⟳" w="40" h="30" textSize="12sp" margin="1"/>
                </horizontal>
                <text id="monMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="10sp" gravity="center"/>
                <scroll id="monscroll" w="*" h="160">
                    <vertical id="monlist" w="*" h="auto"/>
                </scroll>
                <scroll id="monlogscroll" w="*" h="200" visibility="gone">
                    <text id="monlogtext" w="*" text="" textColor="#66ff99" textSize="10sp" padding="4"/>
                </scroll>
            </vertical>
            <vertical id="devpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="4">
                <horizontal>
                    <text id="devTitle" text="User devices" layout_weight="1" w="0" h="30" gravity="center_vertical" textColor="#ffffff" textSize="12sp" textStyle="bold"/>
                    <button id="devRefresh" text="⟳" w="40" h="30" textSize="12sp" margin="1"/>
                </horizontal>
                <text id="devMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="10sp" gravity="center"/>
                <text id="devSel" text="Tap a user to select" w="*" h="auto" textColor="#ce93d8" textSize="10sp" gravity="center"/>
                <horizontal>
                    <input id="devInput" hint="Device ID to allow" layout_weight="1" w="0" h="38" textSize="11sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="64"/>
                    <button id="devAllow" text="Allow" w="60" h="38" textSize="11sp" margin="1" textColor="#ffffff" bg="#2E7D32"/>
                    <button id="devReset" text="Reset" w="60" h="38" textSize="11sp" margin="1" textColor="#ffffff" bg="#C62828"/>
                </horizontal>
                <scroll id="devscroll" w="*" h="260">
                    <vertical id="devlist" w="*" h="auto"/>
                </scroll>
            </vertical>
            <horizontal>
                <button id="log" text="Log" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
                <button id="exit" text="Exit" layout_weight="1" w="0" h="36" textSize="12sp" margin="2" alpha="0.9"/>
            </horizontal>
            </vertical>
            </vertical>
            </scroll>
        </vertical>
    </frame>
);
w.setPosition(device.width - 520, 200);

// Panel scroll: the panel is capped to the screen height (landscape is short), the rest scrolls with a finger swipe.
function fitMain() {
    try {
        var sv = w.mainscroll, body = w.mainbody;
        var pt = new android.graphics.Point();
        context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRealSize(pt);
        var dens = context.getResources().getDisplayMetrics().density;
        var cap = Math.max(Math.round(120 * dens), pt.y - Math.round(w.getY()) - Math.round(56 * dens));
        var want = body.getHeight() > cap ? cap : android.view.ViewGroup.LayoutParams.WRAP_CONTENT;
        var lp = sv.getLayoutParams();
        if (lp.height != want) { lp.height = want; sv.setLayoutParams(lp); }
    } catch (e) {}
}
ui.run(function () {
    try {
        w.mainbody.getViewTreeObserver().addOnGlobalLayoutListener(new android.view.ViewTreeObserver.OnGlobalLayoutListener({
            onGlobalLayout: function () { fitMain(); }
        }));
        // inner scrolls (log, admin) keep their own swipe instead of the panel stealing it
        var keepInner = function (v, e) { try { v.getParent().requestDisallowInterceptTouchEvent(true); } catch (e2) {} return false; };
        w.logscroll.setOnTouchListener(keepInner);
        w.admscroll.setOnTouchListener(keepInner);
        w.monscroll.setOnTouchListener(keepInner);
        w.monlogscroll.setOnTouchListener(keepInner);
        w.devscroll.setOnTouchListener(keepInner);
    } catch (e) {}
});

ui.run(function () {
    try {
        var bytes = android.util.Base64.decode(BG_B64, 0);
        var bmp = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        w.bg.setImageBitmap(bmp);
    } catch (e) {
        w.bg.setBackgroundColor(android.graphics.Color.parseColor("#101010"));
    }
});

function refreshServerLabel() {
    w.server.setText("Srv: " + SERVERS[serverIdx].name);
    w.pick.setText(pickOn ? "Pick: ON" : "Pick: OFF");
    w.server.setAlpha(pickOn ? 1 : 0.4);
    try { refreshChannelLabel(); } catch (e) {}
}
ui.run(refreshServerLabel);
function refreshChannelLabel() {
    w.channel.setText("Channel: " + CHANNEL_IDX + " Channel (tap to change)");
    w.channel.setAlpha(pickOn ? 1 : 0.4);
}
ui.run(refreshChannelLabel);

// --- Dynamic Captcha Solver Functions ---
// Templates are loaded once and cached (never recycled: repeated read/recycle churn and
// recycling shared native images is what causes SIGSEGV crashes in AutoX).
var tplCache = {};
function getTemplate(name) {
    if (tplCache.hasOwnProperty(name)) return tplCache[name];
    var t = null;
    try {
        var p = TEMPLATE_DIR + name + ".png";
        if (files.exists(p)) t = images.read(p);
    } catch (e) { logErr("template " + name, e); t = null; }
    if (t) tplCache[name] = t;           // only cache successful loads so a template added later is picked up
    return t || null;
}

// Templates are cropped from a 2576x1177 (reference size) screenshot. On any other screen the template is scaled
// by the same factor as the layout adapter, then cached (never recycled).
var tplScaled = {};
function getTemplateFit(name, L) {
    var t = getTemplate(name);
    if (!t) return null;
    if (Math.abs(L.kx - 1) < 0.02 && Math.abs(L.ky - 1) < 0.02) return t;
    var key = name + "@" + L.kx.toFixed(3) + "x" + L.ky.toFixed(3);
    if (!tplScaled.hasOwnProperty(key)) {
        try { tplScaled[key] = images.scale(t, L.kx, L.ky); } catch (e) { logErr("scale template " + name, e); tplScaled[key] = t; }
    }
    return tplScaled[key];
}

// ===================== Captcha reader (pixel based - no template images needed) =====================
// The "Human Verification" popup is always centred, so everything is addressed in REF_W x REF_H coordinates.
var CAP_BOX = [897, 205, 781, 253];                 // the code picture (cream box with 5 black digits)
var KEY_CX = [973, 1130, 1287, 1445, 1602], KEY_CY = [625, 724];   // 2 rows x 5 keypad buttons (labels are shuffled)
var CONFIRM_PT = [1287, 960];
var CAP_GW = 12, CAP_GH = 16;
var CAP_SAMPLE_DIR = "/sdcard/脚本/captcha_samples/";
var CAP_SAMPLE_MAX = 400;                           // max files kept in captcha_samples (it used to stop at 40)
var CAP_BANK_FILE = "/sdcard/脚本/templates/code_bank.json";   // optional: extra code-digit shapes {"0":["0101..."],...}
var CAP_ACCEPT = 0.06, CAP_MARGIN = 0.01;            // max distance to accept a digit / min gap to the runner-up digit
var CAP_CODE_BANK = capParseBank({"2": ["000001111110000111111110011100000111000100000111000000000111000000001111000000011100000000111000000001110000000011100000001110000000001110000000111100000000111000000000111100011110111111111110|0.733", "000111111110001110000111011100000111000000000111000000000111000000000110000000011100000001110000000001100000000011000000001110000000001000000000111000000000111000000000111000000000111111111110|0.744", "001111110000111111111100111000011100000000011100000000001100000000001100000000111000000000111000000001110000000011100000000111000000000111000000001110000000001110000000001110000000001111111111|0.820", "000001110000011111111100011000011100111000011100000000011100000000011000000000111000000001110000000001100000000011100000000011000000000110000000001110000000001110001111001111111000000110000000|0.763", "011111110000011111111000111000011100000000011100000000011100000000001110000000111000000001110000000001110000000011100000001110000000011110000000011100000000011100000000001111010110000111111111|0.767"], "3": ["000101100000001111111110011100000111011000000111000000000111000000001111000000011100000011111100000111111000000000011100000000011110000000001111000000001111111000001111111111001111001111111100|0.700", "000000010000000111111000011000011100111000001100000000001110000000011000000000011000000000010000000011111000000000001100000000000111000000000111000000000011000010000011001111011110000011100000|0.765", "000011111000001111001110111000001110001000001110000000001110000000001100000000011100000000011000000011111000000000011100000000000111000000000111000000000111000000000110001110000110000111111000|0.735"], "4": ["000000001110000000011110000000111110000011111110000011011110001111011110011100011100111100011100111100011100111111111111101000011110000000011100000000011100000000011100000000011100000000111100|0.687", "000000001111000000111110000001111110000011111110001111011110111100011110111100011110111100011110111111111100001111111111000000011110000000011100000000111100000000111100000000111100000000111000|0.695", "000000001111000000011110000000111110000001111110000011111110001111011110011100011110111100011100111100011110111111111111111000111100000000011100000000011100000000111100000000111100000000111000|0.667", "000000111000000000111100000001111100000111111100000110111100001110011100111000011100111000011100111100111110111111111111000000011110000000011100000000011100000000001110000000001110000000001110|0.674", "000000000111000000011111000001111111000101111110011111001110111100001110111000011110111000011110001110011100000001111110000000011110000000011100000000111100000000111000000000111000000001111000|0.688"], "5": ["111111100000111000111100111000000000111000000000111000000000011000000000011111111000000000001100000000000110000000000110000000000111000000000111000000000111001110000111000010000011000011111110|0.741", "001111000000001111111111001110000000001110000000011100000000011100000000011111111000000000111100000000001110000000001110000000001110000000011100111000011100111000011100011111111000000011110000|0.772"], "6": ["000111110000001111111000001110000000111000000000111000000000111000000000111111111100011100001100011100001111011100000111011100000111011100000111011100000111011100000111001111011111000011111110|0.711", "000000011100000011111000000110000000001110000000111100000000111100000000111111111110111111000111111100000111111100000111111100000111111100000111111100000111111100000111111111111100001100000000|0.634", "000011111110000011000010000111000000011100000000011100000000011100000000011111111110111100000110111100000111111100000111111100000111111100000111111000000111111000000111101000000111001111111100|0.692", "000000000110000011111100000111000000001110000000011100000000011100000000111111111100111111111111111100000111111100000111111100000111111100000111111100000111111100001110011111111100011111100000|0.645", "000000011000000111111000000110000000011100000000011100000000111100000000111101111110111110001110111100001111011100000111011100000111011100000111011100000111011100000110011111111100000111000000|0.725"], "7": ["111111111100111111111111000000001111000000001111000000001111000000111100000000111100000011111000000011110000000011110000001111000000001111000000001111000000111100000000111100000000111000000000|0.663", "111110000000001111111110000000000111000000000111000000000111000000011110000000011100000000011100000001111000000001111000000001110000000111100000000111100000001111000000011110000000001110000000|0.667", "111111111110111111111111000000000111000000000111000000001111000000011110000000011110000000111100000000111100000000111100000001111000000001110000000001110000000111100000000011100000000011100000|0.686", "111111111100111111111110000000000111000000000111000000000111000000011100000000011110000000111000000000111000000000111000000001111000000011110000000001110000000111000000000111000000000111000000|0.686"], "8": ["000110000000001111111110011110001110011110000111011100000111000100000111011111100111011100111100111100001110111100001110111000001110111000001110111000001110011000001110001111111110000000111000|0.714", "000011111000000111111110001110000111001100000111011100000111011100001110001111111100011100101100011100001110111100001110111000001110111000011110111000011110111000011100011111111100011111111000|0.750", "000011110000001111011000111000001100111000001100111000001100111000001100001111111000001100001110011100001110011100001110011100000110011100000111001100000111001100000111001111111110000011111100|0.756", "000000011110000011111110001110000111001110000111001110000111001110000111000111111100001111011110011100001110011100001110011100001110011100001110111000011100111000011100111111111000011111110000|0.784", "001111010000111111110000111000001100111000001100111000001110001000001110001111111000011100001010011100001110011100001110011100000110001100000111001100000111001100000111000100000110000011111100|0.750", "000010000000000011111110001110000110001100000011001100000111001100000111000111100111011100011100011100000110011100001110011000001110111000001110111000001110111000001100011111011100000000111000|0.733", "000010000000001111110000001110011110001110000110001100000111000100000111011111100111011100111110011100001100111000001110111000001110111000001110011000011100011100011100000111111100000000110000|0.758"], "9": ["001111111000001111111110111000001110111000001110111100001111111100001111111100001111011111111111001111111111000000000111000000000111000000000111000000000110000000011110000000011000000111111000|0.716", "001111111100111111111110111100001111111100001111111100001111111100000111111100000111001111111111000111111111000000000111000000000111000000000111000000000110000000011110000001111000000111111000|0.721", "000000011000001111111110011100001110111000001110111000001110111000001110111100001110011101111111011111101111000000000111000000000111000000000110000000001110000000001100000001111000000111100000|0.719", "001111111000001111111100111000001110111000000111111100000111111100000111111100000111011111111111001111111111000000000111000000000111000000000111000000000111000000001110000000011110000111111000|0.709"]});
var CAP_KEY_BANK = capParseBank({"0": ["000011111100000111111110001100000111011000000011011000000001110000000001110000000001110000000001110000000001110000000001110000000001111000000001011000000001011000000011001100000011001111111110|0.619"], "1": ["000000001111000000111111111111111111001100111111000000001111000000001111000000001111000000001111000000001111000000001111000000001111000000001111000000001111000000001111000000001111111111111111|0.300"], "2": ["001111111000011111111100110000001110000000000111000000000011000000000111000000000111000000001110000000001100000000111000000001100000000011100000000111000000011100000000011000000000111111111111|0.571"], "3": ["001111111100011111111110010000000111000000000011000000000011000000000011000000011110000011111000000000011100000000000110000000000011000000000011000000000011000000000011100000000110111111111110|0.619"], "4": ["000000001100000000011110000000111100000001111100000001001110000010001100001110001110011000001100110000001100111111111111111111111111000000001110000000001100000000001100000000001110000000001110|0.667"], "5": ["111111111111111111111111111000000000111000000000111000000000111000000000111111100000111111111100000000001110000000000111000000000111000000000111000000000111000000000110000000001110111111111100|0.524"], "6": ["000001111110000011111110001110000000011100000000011000000000110000000000110011111000111111111110111000000111110000000011110000000011110000000011110000000011111000000011011100000111001111111110|0.619"], "7": ["111111111111111111111111000000000011000000000011000000000111000000000110000000001100000000011000000000011000000001110000000001100000000011100000000111000000000110000000001110000000011100000000|0.571"], "8": ["000111111100001100001110011000000011111000000011111000000011011000000011011111000110000111111100000110111100011000001110110000000001110000000001110000000001111000000001011000000011001111111110|0.619"], "9": ["000011111000001111011100011100000110011000000011111000000011111000000001111000000001011100000011001111010111000011111011000000000011000000000011000000000111000000001110001000111000001111110000|0.636"]});
// extra keypad "1" shape (thin 1 with a base, seen at brightness 195 on a 0.70-scale screenshot) - the stock one missed it
CAP_KEY_BANK["1"].push(capTpl("000111110000000111110000111111110000000001110000000001110000000001110000000001110000000001110000000001110000000001110000000001110000000001110000000001110000000001110000000111111111111111111111|0.357"));

function capR(c) { return (c >> 16) & 255; }
function capG(c) { return (c >> 8) & 255; }
function capB(c) { return c & 255; }

// Is the popup on screen? -> the cream code box must be mostly cream with a fair share of black digits.
// The popup can be DRAGGED anywhere (it is not always centred), so: 1) try the usual centred spot, 2) otherwise look for the
// cream code box anywhere on the screen and shift/scale every captcha coordinate (code box, keypad, Confirm) to where it is.
var capL = null;                                   // layout of the popup where it was found (null = the usual centred position)
function capLayout(W, H) { return capL || layoutOf(W, H); }
function capIsCream(c) { var r = capR(c), g = capG(c), b = capB(c); return r >= 200 && g >= 195 && b >= 170 && r - b <= 70; }
function capCheckBox(img, L) {
    var n = 0, cream = 0, dark = 0, i, j, c, r, g, b;
    for (j = 0; j < 10; j++) {
        for (i = 0; i < 40; i++) {
            var px = mapX(L, CAP_BOX[0] + (i + 0.5) * CAP_BOX[2] / 40, "c"), py = mapY(L, CAP_BOX[1] + (j + 0.5) * CAP_BOX[3] / 10, "c");
            if (px < 0 || py < 0 || px >= img.getWidth() || py >= img.getHeight()) return false;
            c = img.pixel(px, py);
            r = capR(c); g = capG(c); b = capB(c); n++;
            if (r >= 200 && g >= 195 && b >= 170 && r - b <= 70) cream++;
            else if (Math.min(r, g, b) < 70) dark++;
        }
    }
    return cream / n >= 0.45 && dark / n >= 0.06;
}
// find the cream code box anywhere on the screen -> {x, y, w, h} in capture pixels, or null
function capLocate(img, W, H) {
    var st = Math.max(6, Math.round(W / 160)), gw = Math.floor(W / st), gh = Math.floor(H / st), x, y, k;
    var cells = new Array(gw * gh);
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) cells[y * gw + x] = capIsCream(img.pixel(x * st + (st >> 1), y * st + (st >> 1))) ? 1 : 0;
    var seen = new Array(gw * gh), best = null, bestArea = 0;
    for (k = 0; k < gw * gh; k++) {
        if (!cells[k] || seen[k]) continue;
        var stack = [k], cnt = 0, x0 = gw, y0 = gh, x1 = -1, y1 = -1;
        seen[k] = 1;
        while (stack.length) {
            var q = stack.pop(), qx = q % gw, qy = (q - qx) / gw;
            cnt++;
            if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
            for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
                var nx = qx + dx, ny = qy + dy;
                if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
                var nk = ny * gw + nx;
                if (cells[nk] && !seen[nk]) { seen[nk] = 1; stack.push(nk); }
            }
        }
        var bw = x1 - x0 + 1, bh = y1 - y0 + 1, asp = bw / bh;
        if (bw < gw * 0.15 || bh < 4 || asp < 2.4 || asp > 3.9) continue;     // the code box is about 3.1 times wider than tall
        if (cnt / (bw * bh) < 0.45) continue;                                  // mostly cream (digits are the only dark part)
        if (cnt > bestArea) { bestArea = cnt; best = [x0 * st, y0 * st, (x1 + 1) * st, (y1 + 1) * st]; }
    }
    if (!best) return null;
    // refine the four edges to the exact pixel (the grid is only accurate to a few pixels)
    function cr(px, py) { return px >= 0 && py >= 0 && px < W && py < H && capIsCream(img.pixel(px, py)); }
    function med(a) { a.sort(function (m, n) { return m - n; }); return a[a.length >> 1]; }
    var bx0 = best[0], by0 = best[1], bx1 = best[2], by1 = best[3], r = 2 * st, t, i, v;
    var fr = [0.15, 0.5, 0.85], ls = [], rs = [], ts = [], bs = [];
    for (i = 0; i < 3; i++) {
        var yy = Math.round(by0 + (by1 - by0) * fr[i]), xx = Math.round(bx0 + (bx1 - bx0) * fr[i]);
        for (v = bx0 - r; v <= bx0 + r; v++) if (cr(v, yy) && cr(v + 4, yy) && cr(v + 8, yy)) { ls.push(v); break; }
        for (v = bx1 + r; v >= bx1 - r; v--) if (cr(v, yy) && cr(v - 4, yy) && cr(v - 8, yy)) { rs.push(v + 1); break; }
        for (v = by0 - r; v <= by0 + r; v++) if (cr(xx, v) && cr(xx, v + 4) && cr(xx, v + 8)) { ts.push(v); break; }
        for (v = by1 + r; v >= by1 - r; v--) if (cr(xx, v) && cr(xx, v - 4) && cr(xx, v - 8)) { bs.push(v + 1); break; }
    }
    if (ls.length) bx0 = med(ls); if (rs.length) bx1 = med(rs); if (ts.length) by0 = med(ts); if (bs.length) by1 = med(bs);
    return { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
}
function capPopupShown(img, W, H) {
    capL = null;
    if (capCheckBox(img, layoutOf(W, H))) return true;               // the usual centred spot
    var bx = null;
    try { bx = capLocate(img, W, H); } catch (e) { logErr("captcha locate", e); }
    if (!bx || bx.w < 20 || bx.h < 8) return false;
    var sx = bx.w / CAP_BOX[2], sy = bx.h / CAP_BOX[3];
    var L2 = { kx: sx, ky: sy, stretch: false,
        W: 2 * (bx.x + (REF_W / 2 - CAP_BOX[0]) * sx), H: 2 * (bx.y + (REF_H / 2 - CAP_BOX[1]) * sy) };   // mapX/mapY(L2, ref, "c") land inside the found popup
    if (!capCheckBox(img, L2)) return false;
    capL = L2;
    capDiag("popup found off-centre at " + bx.x + "," + bx.y + " size " + bx.w + "x" + bx.h + " (scale " + sx.toFixed(2) + ")", "loc");
    return true;
}

// turn a mask (rows of 0/1) into digit glyphs: split into columns, bbox, resample to CAP_GW x CAP_GH
function capGlyphs(mask, nx, ny, minCols, wantCount) {
    var cols = [], x, y, runs = [], s = -1;
    for (x = 0; x < nx; x++) { var t = 0; for (y = 0; y < ny; y++) t += mask[y][x]; cols.push(t); }
    for (x = 0; x <= nx; x++) {
        var on = x < nx && cols[x] >= 2;
        if (on && s < 0) s = x;
        if (!on && s >= 0) { if (x - s >= minCols) runs.push([s, x]); s = -1; }
    }
    if (wantCount) {
        // touching digits: split the widest block at its thinnest column; split digits: merge the closest blocks
        var guard = 0, k2, bi, bw2, cut, m2;
        while (runs.length > wantCount && guard++ < 10) {
            bi = 0; m2 = 1e9;
            for (k2 = 0; k2 + 1 < runs.length; k2++) { var gp = runs[k2 + 1][0] - runs[k2][1]; if (gp < m2) { m2 = gp; bi = k2; } }
            runs.splice(bi, 2, [runs[bi][0], runs[bi + 1][1]]);
        }
        while (runs.length > 0 && runs.length < wantCount && guard++ < 10) {
            bi = 0; bw2 = 0;
            for (k2 = 0; k2 < runs.length; k2++) if (runs[k2][1] - runs[k2][0] > bw2) { bw2 = runs[k2][1] - runs[k2][0]; bi = k2; }
            if (bw2 < 2 * minCols + 6) break;
            var lo = runs[bi][0] + Math.floor(bw2 * 0.3), hi = runs[bi][0] + Math.ceil(bw2 * 0.7);
            cut = lo; m2 = 1e9;
            for (x = lo; x <= hi; x++) if (cols[x] < m2) { m2 = cols[x]; cut = x; }
            runs.splice(bi, 1, [runs[bi][0], cut], [cut + 1, runs[bi][1]]);
        }
        if (runs.length !== wantCount) return { runs: runs.length, glyphs: null };
    }
    var out = [];
    for (var k = 0; k < runs.length; k++) {
        var x0 = runs[k][0], x1 = runs[k][1], y0 = -1, y1 = -1;
        for (y = 0; y < ny; y++) {
            var rs = 0; for (x = x0; x < x1; x++) rs += mask[y][x];
            if (rs >= 2) { if (y0 < 0) y0 = y; y1 = y + 1; }
        }
        if (y0 < 0) return { runs: runs.length, glyphs: null };
        var bw = x1 - x0, bh = y1 - y0, bits = "";
        for (var gy = 0; gy < CAP_GH; gy++) for (var gx = 0; gx < CAP_GW; gx++) {
            var sx0 = x0 + Math.floor(gx * bw / CAP_GW), sx1 = Math.max(sx0 + 1, x0 + Math.floor((gx + 1) * bw / CAP_GW));
            var sy0 = y0 + Math.floor(gy * bh / CAP_GH), sy1 = Math.max(sy0 + 1, y0 + Math.floor((gy + 1) * bh / CAP_GH));
            var cnt = 0, tot = 0;
            for (y = sy0; y < sy1; y++) for (x = sx0; x < sx1; x++) { cnt += mask[y][x]; tot++; }
            bits += (cnt * 2 >= tot) ? "1" : "0";
        }
        out.push({ bits: bits, ratio: bw / bh, bx: x0, by: y0, bw: bw, bh: bh });
    }
    return { runs: runs.length, glyphs: out };
}

function capDil(bits) {                 // 3x3 dilation of a CAP_GW x CAP_GH bit string -> 0/1 array
    var out = [], x, y, dx, dy, v;
    for (y = 0; y < CAP_GH; y++) for (x = 0; x < CAP_GW; x++) {
        v = 0;
        for (dy = -1; dy <= 1 && !v; dy++) for (dx = -1; dx <= 1; dx++) {
            var xx = x + dx, yy = y + dy;
            if (xx >= 0 && xx < CAP_GW && yy >= 0 && yy < CAP_GH && bits.charAt(yy * CAP_GW + xx) === "1") { v = 1; break; }
        }
        out.push(v);
    }
    return out;
}
function capTpl(str) {                  // "bits|ratio" -> template object
    var p = String(str).split("|");
    return { b: p[0], r: p.length > 1 ? parseFloat(p[1]) : null, d: capDil(p[0]) };
}
function capParseBank(raw) {
    var out = {}, k;
    for (k in raw) { out[k] = []; for (var i = 0; i < raw[k].length; i++) out[k].push(capTpl(raw[k][i])); }
    return out;
}
// distance glyph<->template: ink of one that is not within 1 cell of the other's ink (both ways) + aspect-ratio gap
function capDist(g, t) {
    var gd = g.d, a = 0, b = 0, ga = 0, tb = 0, i;
    for (i = 0; i < g.b.length; i++) {
        if (g.b.charAt(i) === "1") { ga++; if (!t.d[i]) a++; }
        if (t.b.charAt(i) === "1") { tb++; if (!gd[i]) b++; }
    }
    var d = 0.5 * (a / (ga || 1) + b / (tb || 1));
    if (t.r !== null && g.r !== null) d += 0.5 * Math.abs(g.r - t.r);
    return d;
}
// best digit for a glyph from a parsed bank; returns {d, dist, second}
function capClassify(glyph, bank) {
    var g = { b: glyph.bits, r: glyph.ratio, d: capDil(glyph.bits) };
    var best = "?", bd = 9, sd = 9, dig;
    for (dig in bank) {
        var m = 9;
        for (var i = 0; i < bank[dig].length; i++) m = Math.min(m, capDist(g, bank[dig][i]));
        if (m < bd) { sd = bd; bd = m; best = dig; } else if (m < sd) { sd = m; }
    }
    return { d: best, dist: bd, second: sd };
}
// stricter while some digit shapes are unknown (an unseen 0/1 must not be mistaken for a known digit)
function capAcceptNow() { return capMissingDigits() ? 0.06 : CAP_ACCEPT; }
function capMissingDigits() {
    var miss = "";
    for (var d = 0; d <= 9; d++) if (!CAP_CODE_BANK[String(d)] || !CAP_CODE_BANK[String(d)].length) miss += d;
    return miss;
}

// read the 5-digit code from the picture; returns {text, info, glyphs}
function capReadCode(img, W, H) {
    var L = capLayout(W, H);
    var x0 = mapX(L, CAP_BOX[0], "c"), y0 = mapY(L, CAP_BOX[1], "c");
    var w = Math.round(CAP_BOX[2] * L.kx), h = Math.round(CAP_BOX[3] * L.ky);
    var st = Math.max(1, Math.round(2 * L.kx)), nx = Math.floor(w / st), ny = Math.floor(h / st), mask = [], x, y;
    for (y = 0; y < ny; y++) {
        var row = [];
        for (x = 0; x < nx; x++) row.push(Math.min(capR(img.pixel(x0 + x * st, y0 + y * st)), capG(img.pixel(x0 + x * st, y0 + y * st)), capB(img.pixel(x0 + x * st, y0 + y * st))) < 70 ? 1 : 0);
        mask.push(row);
    }
    var gl = capGlyphs(mask, nx, ny, 4, 5);
    if (!gl.glyphs) return { text: "", info: "found " + gl.runs + " digit blocks (need 5)", glyphs: null };
    var text = "", info = [], ok = true, guess = [], sure = [];
    for (var i = 0; i < 5; i++) {
        var c = capClassify(gl.glyphs[i], CAP_CODE_BANK);
        var good = c.dist <= capAcceptNow() && (c.second - c.dist) >= CAP_MARGIN;
        text += good ? c.d : "?";
        guess.push(c.d); sure.push(good);
        info.push((good ? c.d : "?") + "(" + c.d + " " + c.dist.toFixed(2) + "/" + c.second.toFixed(2) + ")");
    }
    return { text: text, info: info.join(" "), glyphs: gl.glyphs, ox: x0, oy: y0, st: st, guess: guess, sure: sure };
}

// read the shuffled keypad labels; returns {digit: [x, y]} or null. The pad holds 0-9 exactly once, so the
// 10 buttons are matched to the 10 digits as a whole (more robust than reading each one alone).
var capKeyInfo = "";
function capReadKeypad(img, W, H, needText) {
    var need = {}, ni; for (ni = 0; ni < (needText || "").length; ni++) need[needText.charAt(ni)] = true;
    var hasNeed = !!needText, perKey = "";
    var L = capLayout(W, H), thrs = [215, 195, 175, 155], t, r, c, x, y;
    var hw = Math.round(32 * L.kx), hh = Math.round(26 * L.ky), st = Math.max(1, Math.round(L.kx));
    var nx = Math.floor(2 * hw / st), ny = Math.floor(2 * hh / st);
    var px = [];                                   // read every pixel once, reuse for each threshold
    for (r = 0; r < 2; r++) for (c = 0; c < 5; c++) {
        var cx = mapX(L, KEY_CX[c], "c"), cy = mapY(L, KEY_CY[r], "c"), br = [];
        for (y = 0; y < ny; y++) {
            var row = [];
            for (x = 0; x < nx; x++) { var p = img.pixel(cx - hw + x * st, cy - hh + y * st); row.push(Math.min(capR(p), capG(p), capB(p))); }
            br.push(row);
        }
        px.push({ br: br, cx: cx, cy: cy });
    }
    capKeyInfo = "";
    for (t = 0; t < thrs.length; t++) {
        var gls = [], ok = true, i;
        for (i = 0; i < 10 && ok; i++) {
            var mask = [];
            for (y = 0; y < ny; y++) { var mr = []; for (x = 0; x < nx; x++) mr.push(px[i].br[y][x] >= thrs[t] ? 1 : 0); mask.push(mr); }
            var gl = capGlyphs(mask, nx, ny, 2, 1);
            if (!gl.glyphs) ok = false; else gls.push(gl.glyphs[0]);
        }
        if (!ok) { capKeyInfo += (capKeyInfo ? " | " : "") + "br" + thrs[t] + ": key " + i + " label not found"; continue; }
        var dm = [], dg;
        for (i = 0; i < 10; i++) {
            var gg = { b: gls[i].bits, r: gls[i].ratio, d: capDil(gls[i].bits) }, row2 = {};
            for (dg = 0; dg <= 9; dg++) {
                var m = 9, tp = CAP_KEY_BANK[String(dg)];
                for (var q = 0; q < tp.length; q++) m = Math.min(m, capDist(gg, tp[q]));
                row2[dg] = m;
            }
            dm.push(row2);
        }
        var usedS = {}, usedD = {}, map = {}, worst = 0, n, keyDist = [];      // greedy: smallest distance first
        for (n = 0; n < 10; n++) {
            var bs = -1, bd = -1, bv = 9;
            for (i = 0; i < 10; i++) { if (usedS[i]) continue; for (dg = 0; dg <= 9; dg++) { if (usedD[dg]) continue; if (dm[i][dg] < bv) { bv = dm[i][dg]; bs = i; bd = dg; } } }
            usedS[bs] = true; usedD[bd] = true; map[bd] = [px[bs].cx, px[bs].cy]; keyDist[bs] = bd + ":" + bv.toFixed(2);
            if (!hasNeed || need[String(bd)]) worst = Math.max(worst, bv);      // only the keys we must press have to match
        }
        capKeyInfo += (capKeyInfo ? " | " : "") + "br" + thrs[t] + " " + (hasNeed ? "needed-keys " : "") + "worst " + worst.toFixed(2) + " [" + keyDist.join(" ") + "]";
        if (worst <= 0.22) return map;
    }
    return null;
}

var lastCapSample = 0, lastCapText = "", lastCapAt = 0, capDiagAt = {};
function capDiag(msg, key) {                  // throttled per message type, so the log shows every kind of failure
    key = key || "x";
    if (Date.now() - (capDiagAt[key] || 0) < 5000) return;
    capDiagAt[key] = Date.now();
    log("Captcha: " + msg);
}
// extra code-digit shapes (optional file, strings "bits" or "bits|ratio")
(function () {
    try {
        if (!files.exists(CAP_BANK_FILE)) return;
        var extra = JSON.parse(files.read(CAP_BANK_FILE));
        for (var d in extra) { if (!CAP_CODE_BANK[d]) CAP_CODE_BANK[d] = []; for (var i = 0; i < extra[d].length; i++) CAP_CODE_BANK[d].push(capTpl(extra[d][i])); }
    } catch (e) { logErr("code_bank.json", e); }
})();
// keep a copy of the code picture so unknown/wrong digits can be learned later (max 40 files)
function capSaveSample(img, W, H, text) {
    if (Date.now() - lastCapSample < 20000) return;
    lastCapSample = Date.now();
    try {
        files.ensureDir(CAP_SAMPLE_DIR + "x");
        if (files.listDir(CAP_SAMPLE_DIR).length >= CAP_SAMPLE_MAX) return;
        var L = capLayout(W, H);
        var clip = images.clip(img, mapX(L, CAP_BOX[0], "c"), mapY(L, CAP_BOX[1], "c"), Math.round(CAP_BOX[2] * L.kx), Math.round(CAP_BOX[3] * L.ky));
        if (clip) { images.save(clip, CAP_SAMPLE_DIR + "cap_" + Date.now() + "_" + text.replace(/\?/g, "x") + ".png"); try { clip.recycle(); } catch (e2) {} }
    } catch (e) { logErr("captcha sample", e); }
}

// after a solved popup, remember the shapes it showed (new digits / odd fonts) so the bank grows by itself
function capLearn(rd) {
    try {
        var extra = {}, changed = false, i;
        if (files.exists(CAP_BANK_FILE)) { try { extra = JSON.parse(files.read(CAP_BANK_FILE)); } catch (e0) { extra = {}; } }
        for (i = 0; i < 5; i++) {
            var d = rd.text.charAt(i), g = rd.glyphs[i];
            var c = capClassify(g, CAP_CODE_BANK);
            if (c.d === d && c.dist < 0.015) continue;                 // already well known
            if (!CAP_CODE_BANK[d]) CAP_CODE_BANK[d] = [];
            if (CAP_CODE_BANK[d].length >= 10) continue;
            var str = g.bits + "|" + g.ratio.toFixed(3);
            CAP_CODE_BANK[d].push(capTpl(str));
            if (!extra[d]) extra[d] = [];
            extra[d].push(str); changed = true;
        }
        if (changed) { files.write(CAP_BANK_FILE, JSON.stringify(extra)); log("Captcha: learned new digit shapes, missing now [" + capMissingDigits() + "]"); }
    } catch (e) { logErr("capLearn", e); }
}
var lastKeySave = 0;
function capSaveKeypad(img, W, H) {            // picture of the keypad so wrong templates can be fixed
    if (Date.now() - lastKeySave < 30000) return;
    lastKeySave = Date.now();
    try {
        files.ensureDir(CAP_SAMPLE_DIR + "x");
        var L = capLayout(W, H), x0 = mapX(L, KEY_CX[0] - 60, "c"), y0 = mapY(L, KEY_CY[0] - 40, "c");
        var clip = images.clip(img, x0, y0, mapX(L, KEY_CX[4] + 60, "c") - x0, mapY(L, KEY_CY[1] + 40, "c") - y0);
        if (clip) { images.save(clip, CAP_SAMPLE_DIR + "keypad_" + Date.now() + ".png"); try { clip.recycle(); } catch (e2) {} }
    } catch (e) { logErr("keypad sample", e); }
}
// Teach (auto crop): a code with a digit shape the reader has never seen (the built-in bank has no 0 or 1) cannot be read.
// Instead of asking you to type anything, the script crops every digit it does NOT recognise (tight box around the digit)
// plus the whole code picture, and saves them in captcha_samples:
//   digit_<time>_p<position 1-5>_guess<closest known digit>.png   <- one file per unknown digit (these are the 0 / 1 shapes)
//   cap_<time>_<read text>.png                                    <- the whole code picture ("?" = unknown digit, shown as x)
// The same popup is saved once only (it is compared by its digit shapes).
var lastTeachSig = "", teachFullLogged = false;
function capTeachSave(img, W, H, rd) {
    try {
        var i, sig = "";
        for (i = 0; i < 5; i++) sig += rd.glyphs[i].bits;
        if (sig === lastTeachSig) return false;                 // same popup is still showing - already saved
        lastTeachSig = sig;
        files.ensureDir(CAP_SAMPLE_DIR + "x");
        if (files.listDir(CAP_SAMPLE_DIR).length >= CAP_SAMPLE_MAX - 6) {
            if (!teachFullLogged) { teachFullLogged = true; log("Captcha teach: captcha_samples is full (" + CAP_SAMPLE_MAX + " files) - delete old ones to save more"); }
            return false;
        }
        var ts = Date.now(), pad = Math.max(2, Math.round(rd.st * 2)), saved = [];
        for (i = 0; i < 5; i++) {
            if (rd.sure[i]) continue;                           // this digit is already known
            var g = rd.glyphs[i];
            var cx = Math.max(0, rd.ox + g.bx * rd.st - pad), cy = Math.max(0, rd.oy + g.by * rd.st - pad);
            var cw = Math.min(W - cx, g.bw * rd.st + 2 * pad), ch = Math.min(H - cy, g.bh * rd.st + 2 * pad);
            var clip = images.clip(img, cx, cy, cw, ch);
            if (clip) {
                images.save(clip, CAP_SAMPLE_DIR + "digit_" + ts + "_p" + (i + 1) + "_guess" + String(rd.guess[i]).replace(/\?/g, "x") + ".png");
                try { clip.recycle(); } catch (e2) {}
                saved.push(i + 1);
            }
        }
        var L = capLayout(W, H);
        var full = images.clip(img, mapX(L, CAP_BOX[0], "c"), mapY(L, CAP_BOX[1], "c"), Math.round(CAP_BOX[2] * L.kx), Math.round(CAP_BOX[3] * L.ky));
        if (full) {
            images.save(full, CAP_SAMPLE_DIR + "cap_" + ts + "_" + (rd.text || "none").replace(/\?/g, "x") + ".png");
            try { full.recycle(); } catch (e3) {}
        }
        log("Captcha teach: saved " + saved.length + " digit crop(s) (position " + (saved.join(",") || "-") + ") + the code picture in " + CAP_SAMPLE_DIR);
        return true;
    } catch (e) { logErr("captcha teach save", e); return false; }
}
function solveCaptchaOnScreen(screenImg) {
    var img = screenImg || grabScreen();
    if (!img) return;
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return;   // portrait capture = not the game
    if (!capPopupShown(img, W, H)) return;          // no verification popup -> nothing to do

    var rd = capReadCode(img, W, H);
    capDiag("popup detected -> read " + rd.text + (rd.info ? "  [" + rd.info + "]" : ""), "p");
    if (!rd.glyphs || rd.text.length !== 5 || rd.text.indexOf("?") >= 0) {
        if (teachOn && rd.glyphs) capTeachSave(img, W, H, rd); else capSaveSample(img, W, H, rd.text || "none");
        capDiag("cannot read all 5 digits confidently (shapes still unknown: [" + capMissingDigits() + "]) - not typing, samples saved in " + CAP_SAMPLE_DIR + (teachOn ? "" : " (turn Teach crop ON to also save every unknown digit as its own picture)"), "u");
        return;
    }
    capSaveSample(img, W, H, rd.text);
    if (rd.text === lastCapText && Date.now() - lastCapAt < 60000) {
        capDiag("same code " + rd.text + " is still showing after submit - not retyping it (wrong digit?)", "s");
        return;
    }
    var keys = capReadKeypad(img, W, H, rd.text);
    if (!keys) { capSaveKeypad(img, W, H); capDiag("could not read the keypad labels (" + capKeyInfo + ") - not typing", "k"); return; }

    log("Captcha typing " + rd.text);
    for (var i = 0; i < 5; i++) {
        var pt = keys[rd.text.charAt(i)];
        press(pt[0], pt[1], TAP_MS);
        nap(350);
    }
    nap(200);
    press(mapX(capLayout(W, H), CONFIRM_PT[0], "c"), mapY(capLayout(W, H), CONFIRM_PT[1], "c"), TAP_MS);
    lastCapText = rd.text; lastCapAt = Date.now();
    log("Captcha submitted " + rd.text);
    nap(1200);
    var after = grabScreen();
    if (after && capPopupShown(after, after.getWidth(), after.getHeight())) log("Captcha: popup still showing after Confirm (code probably wrong)");
    else { log("Captcha: popup closed - solved"); capLearn(rd); }
}

// --- minimize: hides every control and the log screen ---
var minimized = false;
w.mini.click(function () {
    minimized = !minimized;
    w.mini.setText(minimized ? "▢" : "—");
    inputFocus(false);
    if (minimized) { try { closeServerPopup(); closeChannelPopup(); } catch (e) {} }
    applyPanels();
});

// --- skill panel (auto attack) ---
function refreshSkillUI() {
    for (var i = 0; i < SKILLS.length; i++) {
        var b = w["k" + i];
        b.setText(SKILLS[i].name + (skillEnabled(i) ? " ✔" : " ✖"));
        b.setAlpha(skillEnabled(i) ? 1 : 0.45);
    }
    w.atk.setText("Attack: " + (atkOn ? "ON" : "OFF"));
    w.atk.setAlpha(atkOn ? 1 : 0.5);
    w.captcha.setText("Captcha: " + (captchaOn ? "ON" : "OFF"));
    w.captcha.setAlpha(captchaOn ? 1 : 0.5);
    w.teach.setText("Teach crop: " + (teachOn ? "ON" : "OFF"));
    w.teach.setAlpha(teachOn ? 1 : 0.5);
    w.tgt.setText("Auto target: " + (targetOn ? "ON" : "OFF"));
    w.tgt.setAlpha(targetOn ? 1 : 0.5);
    w.gap.setText("Gap " + (ATK_GAPS[gapIdx] / 1000) + "s (tap to change)");
}
ui.run(refreshSkillUI);
function bindSkill(i) {
    w["k" + i].click(function () {
        skillSel = skillSel.substr(0, i) + (skillEnabled(i) ? "0" : "1") + skillSel.substr(i + 1);
        store.put("skillSel", skillSel);
        log("Skill " + SKILLS[i].name + " -> " + (skillEnabled(i) ? "ON" : "OFF"));
        refreshSkillUI();
    });
}
for (var si = 0; si < SKILLS.length; si++) bindSkill(si);
w.atk.click(function () {
    atkOn = !atkOn;
    store.put("atkOn", atkOn);
    log("Attack -> " + (atkOn ? "ON" : "OFF"));
    refreshSkillUI();
});
w.tgt.click(function () {
    targetOn = !targetOn;
    store.put("targetOn", targetOn);
    log("Auto target -> " + (targetOn ? "ON" : "OFF"));
    refreshSkillUI();
});
w.teach.click(function () {
    teachOn = !teachOn;
    store.put("teachOn", teachOn);
    log("Captcha teach -> " + (teachOn ? "ON" : "OFF") + (teachOn ? " (every unknown digit is cropped and saved in captcha_samples)" : ""));
    refreshSkillUI();
});
w.captcha.click(function () {
    captchaOn = !captchaOn;
    store.put("captchaOn", captchaOn);
    log("Captcha solver -> " + (captchaOn ? "ON" : "OFF"));
    refreshSkillUI();
});
w.gap.click(function () {
    gapIdx = (gapIdx + 1) % ATK_GAPS.length;
    store.put("gapIdx", gapIdx);
    log("Attack gap -> " + ATK_GAPS[gapIdx] + "ms");
    refreshSkillUI();
});
// ---- "Match screen" button ----
// Finds the layout mode (see layoutOf) that makes ALL image / pixel detection and every tap line up on THIS device.
// It takes one screenshot, tries every mode, counts how many detectors (HUD bars, Select/Login/Start/Character buttons,
// Login + Start image templates, loot button, Revive / Disconnected dialogs) recognise their spot under that mode,
// then keeps the best one. The result is saved (store + /sdcard/KlassX/layout.txt) and used by every detector and tap.
// Press it while the game is on any recognisable screen (login, select server, character, or in-game).
var matchScrBusy = false;
function effectiveMode(m, W, H) {
    if (m !== "auto") return m;
    var ar = W / H, rar = REF_W / REF_H;
    return Math.abs(ar - rar) / rar < 0.04 ? "stretch" : "match";
}
function refreshMatchUI() {
    w.matchScr.setText(matchScrBusy ? "Matching screen..." : "Match screen: " + LAYOUT_MODE.toUpperCase());
}
ui.run(refreshMatchUI);
function scoreLayout(img, W, H) {            // uses LAYOUT_MODE as currently set
    var sc = 0, ok = 0, i;
    try { if (matchHud(img, W, H)) { sc += 4; ok++; } sc += hudBars * 0.5; } catch (e) {}
    var specs = [SCREENS.select, SCREENS.login, SCREENS.start, SCREENS.character];
    for (i = 0; i < specs.length; i++) {
        try { if (matchSpec(img, specs[i], W, H)) { sc += 4; ok++; } } catch (e) {}
    }
    try { if (matchLoginTpl(img, W, H)) { sc += 5; ok++; } } catch (e) {}
    try { if (matchStartTpl(img, W, H)) { sc += 5; ok++; } } catch (e) {}
    try { if (matchLoot(img, W, H)) { sc += 3; ok++; } } catch (e) {}
    try { if (matchDisc(img, W, H)) { sc += 3; ok++; } else if (matchRevive(img, W, H)) { sc += 3; ok++; } } catch (e) {}
    return { score: sc, ok: ok };
}
function applyLayoutMode(m) {
    LAYOUT_MODE = m;
    try { store.put("layoutMode", m); } catch (e) {}
    try { files.createWithDirs(LAYOUT_FILE); files.write(LAYOUT_FILE, m); } catch (e) { logErr("save layout.txt", e); }
    lastLoginPt = null; lastStartPt = null;   // detections made under a trial mode must not be reused
}
function autoMatchScreen() {
    if (matchScrBusy) return;
    if (busy) { toast("Press Stop first, then Match screen"); return; }
    matchScrBusy = true;
    ui.run(refreshMatchUI);
    threads.start(function () {
        var prev = LAYOUT_MODE, note = "";
        try {
            if (!captureOk) {
                applyLayoutMode("auto");
                note = "Screen capture is off - set to AUTO. Log in (allow capture), then press again.";
            } else {
                var img = grabScreen();
                if (!img) throw "capture returned null";
                var W = img.getWidth(), H = img.getHeight();
                if (W < H) throw "capture is portrait " + W + "x" + H;
                lastW = W; lastH = H; syncTapSpace(W, H);
                var modes = ["auto", "stretch", "match", "fit", "height", "width"], best = null, rows = [], k;
                for (k = 0; k < modes.length; k++) {
                    LAYOUT_MODE = modes[k];
                    var r = scoreLayout(img, W, H);
                    rows.push(modes[k] + "=" + r.score.toFixed(1) + "(" + r.ok + ")");
                    if (!best || r.score > best.score + 0.5) best = { mode: modes[k], score: r.score, ok: r.ok };   // ties keep the earlier (auto first)
                }
                LAYOUT_MODE = prev;
                log("Match screen: capture " + W + "x" + H + " | " + rows.join(" "));
                if (best.ok === 0) {
                    applyLayoutMode("auto");
                    note = "No game screen recognised (" + W + "x" + H + ") - set to AUTO. Open the game on login / select server / in-game and press again.";
                } else {
                    applyLayoutMode(best.mode);
                    note = "Matched " + W + "x" + H + " -> " + best.mode.toUpperCase() + (best.mode === "auto" ? " (" + effectiveMode("auto", W, H) + ")" : "") + ", " + best.ok + " detector(s) agree";
                }
            }
        } catch (e) {
            LAYOUT_MODE = prev;
            logErr("match screen", e);
            note = "Match screen failed: " + String(e).slice(0, 60);
        }
        log(note);
        toast(note);
        matchScrBusy = false;
        ui.run(refreshMatchUI);
    });
}
w.matchScr.click(function () { inputFocus(false); autoMatchScreen(); });
var toolPanelShown = false;
w.toolsBtn.click(function () {
    toolPanelShown = !toolPanelShown;
    w.toolpanel.setVisibility(toolPanelShown ? android.view.View.VISIBLE : android.view.View.GONE);
    w.toolsBtn.setText(toolPanelShown ? "Tools ▴" : "Tools ▾");
});
var skillPanelShown = false;
w.skills.click(function () {
    skillPanelShown = !skillPanelShown;
    w.skillpanel.setVisibility(skillPanelShown ? android.view.View.VISIBLE : android.view.View.GONE);
    w.skills.setText(skillPanelShown ? "Skills ▴" : "Skills ▾");
});

// --- quick slot panel (bottom bar items 1-6) ---
function refreshQuickUI() {
    for (var i = 0; i < QUICK.length; i++) {
        var b = w["q" + i];
        b.setText(QUICK[i].name + (quickEnabled(i) ? " ✔" : " ✖"));
        b.setAlpha(quickEnabled(i) ? 1 : 0.45);
    }
    w.quick.setText("Quick: " + (quickOn ? "ON" : "OFF"));
    w.quick.setAlpha(quickOn ? 1 : 0.5);
    w.qgap.setText("Every " + (QUICK_GAPS[quickGapIdx] / 1000) + "s (tap to change)");
}
ui.run(refreshQuickUI);
function bindQuick(i) {
    w["q" + i].click(function () {
        quickSel = quickSel.substr(0, i) + (quickEnabled(i) ? "0" : "1") + quickSel.substr(i + 1);
        store.put("quickSel", quickSel);
        log("Quick slot " + QUICK[i].name + " -> " + (quickEnabled(i) ? "ON" : "OFF"));
        refreshQuickUI();
    });
}
for (var qi0 = 0; qi0 < QUICK.length; qi0++) bindQuick(qi0);
w.quick.click(function () {
    quickOn = !quickOn;
    store.put("quickOn", quickOn);
    log("Quick -> " + (quickOn ? "ON" : "OFF"));
    refreshQuickUI();
});
w.qgap.click(function () {
    quickGapIdx = (quickGapIdx + 1) % QUICK_GAPS.length;
    store.put("quickGapIdx", quickGapIdx);
    log("Quick interval -> " + QUICK_GAPS[quickGapIdx] + "ms");
    refreshQuickUI();
});
var quickPanelShown = false;
w.qslots.click(function () {
    if (!QUICK_SECTION) return;
    quickPanelShown = !quickPanelShown;
    w.quickpanel.setVisibility(quickPanelShown ? android.view.View.VISIBLE : android.view.View.GONE);
    w.qslots.setText(quickPanelShown ? "Quick ▴" : "Quick ▾");
});

// --- drag the window by the title ---
var x, y, wx, wy;
w.drag.setOnTouchListener(function (view, e) {
    switch (e.getAction()) {
        case e.ACTION_DOWN:
            x = e.getRawX(); y = e.getRawY();
            wx = w.getX();   wy = w.getY();
            return true;
        case e.ACTION_MOVE:
            w.setPosition(wx + (e.getRawX() - x), wy + (e.getRawY() - y));
            return true;
        case e.ACTION_UP:
            ui.run(fitMain);
            return true;
    }
    return true;
});

// --- login / register gate: Firebase Authentication (email + password, REST API) ---
// Setup: Firebase console > Authentication > Sign-in method > enable "Email/Password",
// then paste the project's Web API key (Project settings > General) below.
var FIREBASE_API_KEY = "AIzaSyATlXwJ5OBuzahU27xAvGdqn7hoIqnpiHg";   // project new-klass
var FB_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts:";
var FB_TOKEN = "https://securetoken.googleapis.com/v1/token";
// --- updates through GitHub (users download; admins publish from the Admin panel) ---
var GH_OWNER  = "juvymaisn-stack";     // GitHub user/org that owns the repo (PUBLIC repo: users download without a token)
var GH_REPO   = "KLASSX";            // repo name
var GH_BRANCH = "main";
var GH_SCRIPT = "klassx_launcher.js";   // file name of the script inside the repo
var GH_VERSION = "version.json";        // small file users check for new versions
var ADMIN_USERS = ["admin", "test1"];            // usernames that see the Admin panel (lowercase)
var REGISTER_ADMIN_ONLY = false;        // false = anyone with a valid activation key can register (true = only ADMIN_USERS names)
var SCRIPT_PATH = "";                   // leave empty = auto-detect; or set e.g. "/sdcard/Scripts/klassx.js"
var UPDATE_CHECK_MS = 30 * 60 * 1000;   // how often to look for a new version while running
var updateInfo = null, admShown = false, admBusy = false, updBusy = false;
var FIRESTORE_PROJECT = "new-klass";   // Firestore project id (database must be created in the console)
var MIN_PASS = 6;                       // Firebase's own minimum
var USER_RE = /^[A-Za-z0-9_]{3,20}$/;   // allowed usernames
var AUTH_DOMAIN = "klassx.app";         // Firebase needs an email: username -> username@klassx.app (never emailed)
function userToEmail(name) { return name.toLowerCase() + "@" + AUTH_DOMAIN; }
function emailToUser(email) { return String(email).split("@")[0]; }
var AUTH_MAX_FAILS = 5;                 // wrong attempts before a short local lockout
var AUTH_LOCK_MS = 30000;

var authStore = storages.create("klassx_launcher_auth");
(function () {                            // repo chosen in the Admin panel (saved on this phone) overrides GH_OWNER / GH_REPO
    try {
        var m = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(String(authStore.get("ghRepo", "")));
        if (m) { GH_OWNER = m[1]; GH_REPO = m[2]; }
    } catch (e) {}
})();
var authed = false, currentUser = "", regMode = false, authBusy = false;
var authFails = 0, authLockUntil = 0, captureStarted = false;
var subUntil = 0, subChecking = false, subBusy = false, sessRefresh = "", myUid = "";   // subscription state (ms epoch)
var MAX_KEY_HOURS = 720;                                                                // hour keys: type e.g. 12h in the admin box
var MAX_KEY_DAYS = 30, DEFAULT_KEY_DAYS = 30;                                        // generated keys: 1..MAX_KEY_DAYS days (change MAX_KEY_DAYS to raise the limit)
var rememberOn = authStore.get("remember", true);      // "Stay" = auto sign-in + saved username/password (default ON)
function saveCreds(name, pw) {          // kept on THIS device only (never sent to Firebase/database)
    if (!rememberOn) return;
    authStore.put("savedUser", name);
    authStore.put("savedPass", pw);
}
function fillSaved() {                  // put the saved username/password back into the login fields
    var u = authStore.get("savedUser", ""), p = authStore.get("savedPass", "");
    if (rememberOn && u) ui.run(function () { w.authUser.setText(u); w.authPass.setText(p); });
}

function inputFocus(on) {               // floating windows only take keyboard input while focusable
    try { if (on) w.requestFocus(); else w.disableFocus(); } catch (e) {}
}
function keyMissing() { return FIREBASE_API_KEY.indexOf("PASTE") === 0; }

// --- Firebase REST helpers (blocking: always call from a background thread) ---
function fbResult(res) {
    var j = null, status = 0;
    try { status = res.statusCode; j = res.body.json(); } catch (e) {}
    if (status === 200 && j && !j.error) return { ok: true, data: j };
    var code = (j && j.error && j.error.message) ? String(j.error.message) : ("HTTP " + status);
    return { ok: false, error: code.split(/[\s:]/)[0] };
}
function fbPost(url, body) {
    try { return fbResult(http.postJson(url + "?key=" + FIREBASE_API_KEY, body)); }
    catch (e) { logErr("fbPost", e); return { ok: false, error: "NETWORK" }; }
}
function fbRefresh(refreshToken) {
    try {
        return fbResult(http.post(FB_TOKEN + "?key=" + FIREBASE_API_KEY,
            { grant_type: "refresh_token", refresh_token: refreshToken }));
    } catch (e) { logErr("fbRefresh", e); return { ok: false, error: "NETWORK" }; }
}
// Save a user record (username + date, NEVER the password) in Firestore: users/{uid}
function saveUserRecord(name, uid, idToken) {
    try {
        if (!uid || !idToken) { log("user record skipped (no uid/token)"); return false; }
        var url = "https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT +
            "/databases/(default)/documents/users?documentId=" + encodeURIComponent(uid);
        var body = { fields: {
            username:  { stringValue: name },
            createdAt: { timestampValue: new Date().toISOString() }
        } };
        var res = http.postJson(url, body, { headers: { "Authorization": "Bearer " + idToken } });
        if (res.statusCode === 200) { log("user record saved: " + name); return true; }
        log("user record FAILED (HTTP " + res.statusCode + "): " + String(res.body.string()).slice(0, 200));
    } catch (e) { logErr("saveUserRecord", e); }
    return false;
}
function friendlyError(code) {
    switch (code) {
        case "EMAIL_EXISTS": return "That username is taken.";
        case "INVALID_EMAIL": return "Invalid username.";
        case "WEAK_PASSWORD": return "Password too weak (" + MIN_PASS + "+ characters).";
        case "EMAIL_NOT_FOUND":
        case "INVALID_PASSWORD":
        case "INVALID_LOGIN_CREDENTIALS": return "Wrong username or password.";
        case "USER_DISABLED": return "This account is disabled.";
        case "TOO_MANY_ATTEMPTS_TRY_LATER": return "Too many attempts. Try again later.";
        case "OPERATION_NOT_ALLOWED": return "Email/Password sign-in is off in Firebase.";
        case "API_KEY_INVALID":
        case "INVALID_API_KEY": return "Bad Firebase API key in the script.";
        case "NETWORK": return "No connection to Firebase.";
        default: return "Error: " + code;
    }
}

function setAuthMsg(text, good) {
    ui.run(function () {
        w.authMsg.setText(text);
        w.authMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ff8a80"));
    });
}
function applyPanels() {                // show login panel OR controls, depending on state
    ui.run(function () {
        var V = android.view.View;
        w.mainscroll.setVisibility(minimized ? V.GONE : V.VISIBLE);   // minimized = only the title bar stays
        w.auth.setVisibility(!authed && !minimized ? V.VISIBLE : V.GONE);
        var subOkNow = authed && subOk();
        w.controls.setVisibility(subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.controls2.setVisibility(subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.subpanel.setVisibility(authed && !subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.logout.setText("Logout (" + currentUser + ")");
        var adm = authed && isAdmin();
        w.admin.setVisibility(adm ? V.VISIBLE : V.GONE);
        w.monBtn.setVisibility(adm && subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.monpanel.setVisibility(adm && monShown && subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.keybar.setVisibility(adm && subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.usrtabs.setVisibility(adm && usersShown && subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.devpanel.setVisibility(adm && devShown && subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.admscroll.setVisibility(adm && admShown ? V.VISIBLE : V.GONE);
        w.updbar.setVisibility(!minimized && updateInfo ? V.VISIBLE : V.GONE);
    });
}
function refreshAuthUI() {
    ui.run(function () {
        w.tabLogin.setAlpha(regMode ? 0.5 : 1);
        w.tabReg.setAlpha(regMode ? 1 : 0.5);
        w.authPass2.setVisibility(regMode ? android.view.View.VISIBLE : android.view.View.GONE);
        w.authKey.setVisibility(regMode ? android.view.View.VISIBLE : android.view.View.GONE);
        w.authGo.setText(regMode ? "Create account" : "Login");
        w.authRemember.setText("Stay: " + (rememberOn ? "ON" : "OFF"));
        w.authMsg.setText("");
    });
}
function clearAuthFields() {
    ui.run(function () {
        w.authUser.setText("");
        w.authPass.setText("");
        w.authPass2.setText("");
        w.authKey.setText("");
    });
}
// ===== DEVICE LOCK (normal users only; ADMIN_USERS are never locked) =====
// users/{uid}.deviceId is written once, on the first login from a device. Any other device is refused.
// To move a user to a new phone: delete the deviceId field of that user in the Firestore console.
var deviceOk = false;
function myDeviceId() {
    try { return String(device.getAndroidId()); } catch (e) {}
    return "";
}
function deviceFail(msg) {
    log("device lock: " + msg);
    doLogout();
    setAuthMsg(msg, false);
}
function deviceCheck() {
    try {
        if (isAdmin()) { deviceOk = true; applyPanels(); refreshSubUI(); return; }
        var id = myDeviceId();
        if (!id) { deviceFail("Cannot read device ID."); return; }
        var t = getIdToken();
        if (!t) { deviceFail("Cannot verify device (offline?). Log in again."); return; }
        var r = fsReq("GET", fsUrl("users/" + t.uid), t.token);
        if (r.status === 404) {                         // old account without a record: create it, then bind
            saveUserRecord(currentUser, t.uid, t.token);
            r = fsReq("GET", fsUrl("users/" + t.uid), t.token);
        }
        if (r.status !== 200 || !r.json) { deviceFail("Cannot verify device (HTTP " + r.status + ")."); return; }
        var f = r.json.fields || {};
        var saved = (f.deviceId && f.deviceId.stringValue) ? String(f.deviceId.stringValue) : "";
        if (saved === id) { deviceOk = true; applyPanels(); refreshSubUI(); return; }
        if (saved) { deviceFail("This account is locked to another device."); return; }
        var base = fsBase();
        var commit = { writes: [ {
            update: { name: base + "/users/" + t.uid, fields: { deviceId: { stringValue: id } } },
            updateMask: { fieldPaths: ["deviceId"] },
            currentDocument: { updateTime: r.json.updateTime }      // fails if another device bound first
        } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 200) { log("device bound"); deviceOk = true; applyPanels(); refreshSubUI(); return; }
        deviceFail(c.status === 403 ? "Server refused device bind (Firestore rules)." : "Device bind failed (HTTP " + c.status + ").");
    } catch (e) { logErr("deviceCheck", e); deviceFail("Device check error."); }
}

function onAuthed(email, refreshToken) {
    authed = true;
    deviceOk = false;
    authStore.put("loggedOut", false);
    currentUser = emailToUser(email);
    authFails = 0;
    sessRefresh = refreshToken || sessRefresh;
    subUntil = 0; subChecking = true;
    if (rememberOn && refreshToken) authStore.put("session", refreshToken); else authStore.remove("session");
    clearAuthFields();
    inputFocus(false);
    applyPanels();
    log("login OK: " + currentUser);
    threads.start(deviceCheck);          // device lock (skipped for admins)
    threads.start(loadSub);              // subscription decides whether the controls unlock
    threads.start(pushMonitor);          // first status upload for the admin Monitor
    kickSeen = null; kickWarned = false;
    threads.start(kickCheck);            // remember the current kick stamp (a kick sent later = log out)
    threads.start(checkUpdate);
    if (!captureStarted) {              // ask for screen capture only after login
        captureStarted = true;
        threads.start(initCapture);
    }
}

function isAdminName(name) { return ADMIN_USERS.indexOf(String(name).toLowerCase()) >= 0; }
// Look the key up in Firestore. t = { token, uid }. Blocking: call from a background thread.
function checkKey(t, key) {
    var g = fsReq("GET", fsUrl("keys/" + key), t.token);
    if (g.status === 404 || g.status === 403) return { ok: false, msg: "Invalid key." };
    if (g.status !== 200 || !g.json) return { ok: false, msg: "Could not check key (HTTP " + g.status + ")." };
    var f = g.json.fields || {};
    if (f.redeemedBy && f.redeemedBy.stringValue) return { ok: false, msg: "That key was already used." };
    var days = fsInt(f.days), hours = fsInt(f.hours);
    if (days <= 0 && hours <= 0) return { ok: false, msg: "Invalid key." };
    var ms = Math.max(0, hours) * 3600000 + Math.max(0, days) * 86400000;
    var label = hours > 0 ? (hours + (hours === 1 ? " hour" : " hours")) + (days > 0 ? " + " + days + " days" : "") : (days + " days");
    return { ok: true, days: days, hours: hours, ms: ms, label: label, updateTime: g.json.updateTime };
}
// Mark the key used and extend users/{uid}.subUntil in one atomic commit. chk = result of checkKey, cur = current subUntil.
function commitKey(t, key, chk, cur) {
    var now = Date.now();
    var until = Math.max(now, cur) + chk.ms;       // extends an active subscription
    var base = fsBase();
    var commit = { writes: [
        { update: { name: base + "/keys/" + key, fields: { redeemedBy: { stringValue: t.uid }, redeemedAt: { integerValue: String(now) } } },
          updateMask: { fieldPaths: ["redeemedBy", "redeemedAt"] },
          currentDocument: { updateTime: chk.updateTime } },
        { update: { name: base + "/users/" + t.uid, fields: { subUntil: { integerValue: String(until) }, lastKey: { stringValue: key } } },
          updateMask: { fieldPaths: ["subUntil", "lastKey"] } }
    ] };
    var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
    if (c.status !== 200) {
        log("redeem failed: HTTP " + c.status + " " + JSON.stringify(c.json).slice(0, 200));
        return { ok: false, msg: c.status === 403 ? "Server refused (Firestore rules not set up?)." :
                 (c.status === 400 || c.status === 409) ? "That key was already used." : "Redeem failed (HTTP " + c.status + ")." };
    }
    return { ok: true, until: until };
}
function submitAuth() {
    if (authBusy) return;
    if (keyMissing()) { setAuthMsg("Set FIREBASE_API_KEY in the script first.", false); return; }
    var now = Date.now();
    if (now < authLockUntil) {
        setAuthMsg("Too many attempts. Wait " + Math.ceil((authLockUntil - now) / 1000) + "s.", false);
        return;
    }
    var name = String(w.authUser.getText()).trim();
    var pw = String(w.authPass.getText());
    var pw2 = String(w.authPass2.getText());
    var regKey = String(w.authKey.getText()).trim().toUpperCase();
    var reg = regMode;
    if (!USER_RE.test(name)) { setAuthMsg("Username: 3-20 letters, numbers or _", false); return; }
    var email = userToEmail(name);
    if (reg) {
        if (REGISTER_ADMIN_ONLY && ADMIN_USERS.indexOf(name.toLowerCase()) < 0) { setAuthMsg("Registration is closed.", false); return; }
        if (pw.length < MIN_PASS) { setAuthMsg("Password needs " + MIN_PASS + "+ characters.", false); return; }
        if (pw !== pw2) { setAuthMsg("Passwords do not match.", false); return; }
        if (!isAdminName(name)) {       // admins need no key; everyone else must enter one
            if (!regKey) { setAuthMsg("Enter your activation key.", false); return; }
            if (!/^[A-Z0-9-]{8,40}$/.test(regKey)) { setAuthMsg("That is not a valid key.", false); return; }
        }
    } else if (!pw) { setAuthMsg("Enter your password.", false); return; }
    authBusy = true;
    setAuthMsg(reg ? "Creating account..." : "Logging in...", true);
    threads.start(function () {
        try {
            var r = fbPost(FB_AUTH + (reg ? "signUp" : "signInWithPassword"),
                { email: email, password: pw, returnSecureToken: true });
            if (r.ok) {
                if (reg) {
                    log("registered: " + name);
                    var t0 = { token: r.data.idToken, uid: r.data.localId };
                    var needKey = !isAdminName(name);
                    var chk = null;
                    if (needKey) {
                        setAuthMsg("Checking key...", true);
                        chk = checkKey(t0, regKey);
                        if (!chk.ok) {          // bad key: remove the new account so the username stays free
                            fbPost(FB_AUTH + "delete", { idToken: r.data.idToken });
                            log("registration cancelled for '" + name + "': " + chk.msg);
                            setAuthMsg(chk.msg, false);
                            return;
                        }
                    }
                    saveUserRecord(name, t0.uid, t0.token);
                    if (needKey) {
                        var rd = commitKey(t0, regKey, chk, 0);
                        if (!rd.ok) {           // account exists but key failed: user can retry in the key panel
                            log("key redeem at registration failed: " + rd.msg);
                            toast(rd.msg);
                        } else log("registered with key: +" + chk.label);
                    }
                }
                saveCreds(name, pw);
                onAuthed(r.data.email || email, r.data.refreshToken);
            } else {
                log((reg ? "register" : "login") + " failed for '" + name + "': " + r.error);
                if (!reg && /^(EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS)$/.test(r.error)) {
                    authFails++;
                    if (authFails >= AUTH_MAX_FAILS) {
                        authFails = 0;
                        authLockUntil = Date.now() + AUTH_LOCK_MS;
                        setAuthMsg("Too many attempts. Locked for " + (AUTH_LOCK_MS / 1000) + "s.", false);
                        return;
                    }
                }
                setAuthMsg(friendlyError(r.error), false);
            }
        } catch (e) {
            logErr("submitAuth", e);
            setAuthMsg("Error - see log", false);
        } finally {
            authBusy = false;
        }
    });
}
function doLogout() {
    if (busy) stopFlag = true;          // stop the bot loop first
    log("logout: " + currentUser);
    authed = false;
    currentUser = "";
    subUntil = 0; sessRefresh = ""; myUid = ""; deviceOk = false; subWasActive = false;
    devShown = false; devDocs = {}; devSelId = ""; usersShown = false;
    monShown = false; monView = ""; monTok = null; monState = "Logged out";
    kickSeen = null;
    authStore.remove("session");
    authStore.put("loggedOut", true);   // no auto sign-in until you log in again
    regMode = false;
    clearAuthFields();
    fillSaved();
    refreshAuthUI();
    applyPanels();
}

function pasteInto(f, digitsOnly) {     // paste the clipboard at the cursor (replaces any selected text)
    try {
        var c = getClip();
        var t = c ? String(c).replace(/[\r\n]+/g, " ").trim() : "";
        if (digitsOnly) t = t.replace(/\D/g, "");
        if (!t) { toast("Clipboard is empty"); return; }
        ui.run(function () {
            var ed = f.getText();
            var a = Math.max(0, f.getSelectionStart()), b = Math.max(0, f.getSelectionEnd());
            ed.replace(Math.min(a, b), Math.max(a, b), t);
        });
        toast("Pasted");
    } catch (e) { logErr("pasteInto", e); toast("Could not read clipboard"); }
}
function bindAuthField(f, digitsOnly) { // tapping a field lets the keyboard open; long-press = paste
    f.setOnTouchListener(function (v, e) {
        if (e.getAction() == e.ACTION_DOWN) { inputFocus(true); v.requestFocus(); }
        return false;
    });
    f.on("long_click", function () { pasteInto(f, digitsOnly); return true; });
}
bindAuthField(w.authUser);
bindAuthField(w.authPass);
bindAuthField(w.authPass2);
bindAuthField(w.authKey);
w.tabLogin.click(function () { inputFocus(false); regMode = false; refreshAuthUI(); });
w.tabReg.click(function () { inputFocus(false); regMode = true; refreshAuthUI(); });
w.authGo.click(function () { inputFocus(false); submitAuth(); });
w.authRemember.click(function () {
    rememberOn = !rememberOn;
    authStore.put("remember", rememberOn);
    if (!rememberOn) { authStore.remove("session"); authStore.remove("savedUser"); authStore.remove("savedPass"); }
    refreshAuthUI();
});
w.authExit.click(function () {
    log("Exit pressed (login screen)");
    w.close();
    exit();
});
w.logout.click(doLogout);
ui.run(function () { refreshAuthUI(); applyPanels(); });

// auto sign-in at startup: remembered session first, then the saved username/password
function autoSignIn() {
    sleep(500);
    setAuthMsg("Signing in...", true);
    var rt = authStore.get("session", "");
    if (rt) {
        var r = fbRefresh(rt);
        if (r.ok) {
            var lk = fbPost(FB_AUTH + "lookup", { idToken: r.data.id_token });
            var email = (lk.ok && lk.data.users && lk.data.users[0] && lk.data.users[0].email) || "";
            if (email) { onAuthed(email, r.data.refresh_token || rt); return; }
        } else {
            log("session restore failed: " + r.error);
            if (r.error === "NETWORK") { setAuthMsg("Offline - log in when connected.", false); return; }
        }
        authStore.remove("session");
    }
    var u = authStore.get("savedUser", ""), p = authStore.get("savedPass", "");
    if (!u || !p) { setAuthMsg("Session expired. Log in again.", false); return; }
    var r2 = fbPost(FB_AUTH + "signInWithPassword", { email: userToEmail(u), password: p, returnSecureToken: true });
    if (r2.ok) { onAuthed(r2.data.email || userToEmail(u), r2.data.refreshToken); return; }
    log("auto sign-in failed: " + r2.error);
    if (/^(EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS)$/.test(r2.error)) authStore.remove("savedPass");
    setAuthMsg(friendlyError(r2.error), false);
}
fillSaved();
if (rememberOn && !authStore.get("loggedOut", false) && !keyMissing() &&
    (authStore.get("session", "") || authStore.get("savedUser", ""))) {
    threads.start(autoSignIn);
}

// ================= subscription keys (Firestore) =================
// keys/{KEY}  : days, createdAt, createdBy, redeemedBy ("" until used), redeemedAt
// users/{uid} : subUntil (ms epoch), lastKey   -> see firestore.rules
function subOk() { return isAdmin() || (deviceOk && subUntil > Date.now()); }
function fmtLeft(ms) {
    var d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return d > 0 ? d + "d " + h + "h" : (h > 0 ? h + "h " + m + "m" : m + "m");
}
function fsBase() { return "projects/" + FIRESTORE_PROJECT + "/databases/(default)/documents"; }
function fsUrl(path) { return "https://firestore.googleapis.com/v1/" + fsBase() + (path ? "/" + path : ""); }
function fsReq(method, url, tok, body) {
    var opt = { headers: { "Authorization": "Bearer " + tok } };
    var res = (method === "GET") ? http.get(url, opt) : http.postJson(url, body, opt);
    var j = null;
    try { j = res.body.json(); } catch (e) {}
    return { status: res.statusCode, json: j };
}
function fsInt(f) { return (f && f.integerValue !== undefined) ? Number(f.integerValue) : 0; }
function getIdToken() {                 // fresh Firebase ID token + uid from the refresh token
    if (!sessRefresh) return null;
    var r = fbRefresh(sessRefresh);
    if (!r.ok) { log("token refresh failed: " + r.error); return null; }
    if (r.data.refresh_token) sessRefresh = r.data.refresh_token;
    myUid = r.data.user_id || myUid;
    return { token: r.data.id_token, uid: r.data.user_id };
}
function setSubMsg(text, good) {
    ui.run(function () {
        w.subMsg.setText(text);
        w.subMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ffcc80"));
    });
}
function refreshSubUI() {
    ui.run(function () {
        var left = subUntil - Date.now();
        w.subInfo.setText(isAdmin() ? "Admin - no subscription needed" : (left > 0 ? "Subscription: " + fmtLeft(left) + " left" : "No active subscription"));
    });
}
function loadSub() {                    // read users/{uid}.subUntil from the server
    var ok = false;
    try {
        var t = getIdToken();
        if (t) {
            var r = fsReq("GET", fsUrl("users/" + t.uid), t.token);
            if (r.status === 200 && r.json) {
                subUntil = fsInt((r.json.fields || {}).subUntil);
                ok = true;
            } else if (r.status === 404) {
                saveUserRecord(currentUser, t.uid, t.token);    // old account without a record: create it
                subUntil = 0; ok = true;
            } else log("subscription check failed: HTTP " + r.status);
        }
    } catch (e) { logErr("loadSub", e); }
    subChecking = false;
    log("subscription: " + (ok ? (subOk() ? "active" : "none/expired") : "could not check"));
    applyPanels();
    refreshSubUI();
    if (!subOk()) {
        setSubMsg(!ok ? "Could not check subscription. Tap Activate to retry." :
                  (subUntil > 0 ? "Subscription expired. Enter a new key." : "No active subscription. Enter a key."), false);
    }
    return ok;
}
function redeemKey() {
    if (subBusy) return;
    var key = String(w.subKey.getText()).trim().toUpperCase();
    if (!key) {                         // empty box = just re-check the server
        subBusy = true; setSubMsg("Checking...", true);
        threads.start(function () { try { loadSub(); } finally { subBusy = false; } });
        return;
    }
    if (!/^[A-Z0-9-]{8,40}$/.test(key)) { setSubMsg("That is not a valid key.", false); return; }
    subBusy = true;
    setSubMsg("Checking key...", true);
    threads.start(function () {
        try {
            var t = getIdToken();
            if (!t) { setSubMsg("Not signed in - log in again.", false); return; }
            var chk = checkKey(t, key);
            if (!chk.ok) { setSubMsg(chk.msg, false); return; }
            var days = chk.label;
            var u = fsReq("GET", fsUrl("users/" + t.uid), t.token);
            var cur = (u.status === 200 && u.json) ? fsInt((u.json.fields || {}).subUntil) : 0;
            if (u.status === 404) saveUserRecord(currentUser, t.uid, t.token);
            var rd = commitKey(t, key, chk, cur);
            if (!rd.ok) { setSubMsg(rd.msg, false); return; }
            var until = rd.until;
            subUntil = until;
            log("key redeemed: +" + days);
            ui.run(function () { w.subKey.setText(""); });
            setSubMsg("Activated: +" + days + " \u2713", true);
            applyPanels();
            refreshSubUI();
        } catch (e) {
            logErr("redeemKey", e);
            setSubMsg("Error - see log", false);
        } finally {
            subBusy = false;
        }
    });
}
function setKeyMsg(text, good) {
    ui.run(function () {
        w.keyMsg.setText(text);
        w.keyMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ff8a80"));
    });
}
function genKeyString() {               // KLX-XXXX-XXXX-XXXX, no look-alike characters
    var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", rnd = new java.security.SecureRandom(), out = "KLX";
    for (var g = 0; g < 3; g++) {
        out += "-";
        for (var i = 0; i < 4; i++) out += abc.charAt(rnd.nextInt(abc.length));
    }
    return out;
}
function generateKey() {
    if (admBusy) return;
    if (!authed || !isAdmin()) { setKeyMsg("Admins only.", false); return; }
    var raw = String(w.admDays.getText()).trim().toLowerCase(), isHours = /h$/.test(raw);
    var days = parseInt(raw, 10), hours = 0;
    if (isHours) { hours = days; days = 0; }
    if (isNaN(isHours ? hours : days) || (isHours ? (hours < 1 || hours > MAX_KEY_HOURS) : (days < 1 || days > MAX_KEY_DAYS))) {
        setKeyMsg(isHours ? "Hours must be 1 to " + MAX_KEY_HOURS + " (e.g. 12h)." : "Days must be 1 to " + MAX_KEY_DAYS + " (or e.g. 12h for hours).", false);
        return;
    }
    var unitLabel = isHours ? hours + " hours" : days + " days", unitShort = isHours ? hours + "h" : days + "d";
    admBusy = true;
    setKeyMsg("Creating key...", true);
    threads.start(function () {
        try {
            var t = getIdToken();
            if (!t) { setKeyMsg("Not signed in - log in again.", false); return; }
            var key = genKeyString();
            var body = { fields: {
                days:       { integerValue: String(days) },
                hours:      { integerValue: String(hours) },
                createdAt:  { integerValue: String(Date.now()) },
                createdBy:  { stringValue: currentUser },
                redeemedBy: { stringValue: "" }
            } };
            var r = fsReq("POST", fsUrl("keys") + "?documentId=" + encodeURIComponent(key), t.token, body);
            if (r.status !== 200) {
                log("generate key failed: HTTP " + r.status + " " + JSON.stringify(r.json).slice(0, 200));
                setKeyMsg(r.status === 403 ? "Refused - add your uid to firestore.rules." : "Failed (HTTP " + r.status + ").", false);
                return;
            }
            setClip(key);
            log("key created: " + key + " (" + unitLabel + ")");
            setKeyMsg("Key copied: " + key + " (" + unitShort + ")", true);
        } catch (e) {
            logErr("generateKey", e);
            setKeyMsg("Error - see log", false);
        } finally {
            admBusy = false;
        }
    });
}
bindAuthField(w.subKey);
w.subPaste.click(function () {
    inputFocus(false);
    try {
        var c = getClip();
        if (c && String(c).trim()) ui.run(function () { w.subKey.setText(String(c).trim()); });
        else toast("Clipboard is empty");
    } catch (e) { toast("Could not read clipboard"); }
});
w.subGo.click(function () { inputFocus(false); redeemKey(); });
w.subLogout.click(doLogout);
bindAuthField(w.admDays);              // type the number of days (1 to MAX_KEY_DAYS)
ui.run(function () { w.admDays.setText(String(DEFAULT_KEY_DAYS)); });
w.admGenKey.click(function () { inputFocus(false); generateKey(); });
w.admInfo.on("long_click", function () { if (myUid) { setClip(myUid); toast("uid copied"); } return true; });
var subWasActive = false;               // true once this login session had an active subscription
setInterval(function () {               // subscription ran out while logged in -> stop the bot and log out automatically
    if (!authed || subChecking) return;
    if (!isAdmin() && deviceOk && subUntil > Date.now()) subWasActive = true;
    if (subOk()) return;
    if (subWasActive && deviceOk && !isAdmin() && subUntil <= Date.now()) {
        subWasActive = false;
        log("subscription expired - logging out");
        try { toast("Subscription expired - logged out"); } catch (e) {}
        ui.run(function () {
            doLogout();
            try { setAuthMsg("Subscription expired. Log in and enter a new key.", false); } catch (e2) {}
        });
        return;
    }
    if (busy) { stopFlag = true; toast("Subscription ended"); log("subscription ended - stopping"); }
    applyPanels(); refreshSubUI();
}, 10000);

// ================= updates through GitHub =================
function isAdmin() { return ADMIN_USERS.indexOf(String(currentUser).toLowerCase()) >= 0; }
function ghConfigured() { return GH_OWNER.indexOf("YOUR_") !== 0 && GH_REPO.indexOf("YOUR_") !== 0; }
function rawUrl(file) {
    return "https://raw.githubusercontent.com/" + GH_OWNER + "/" + GH_REPO + "/" + GH_BRANCH + "/" + file + "?t=" + Date.now();
}
function scriptPath() {
    if (SCRIPT_PATH) return SCRIPT_PATH;
    try { if (typeof LAUNCHER_PATH !== "undefined" && LAUNCHER_PATH && files.exists(LAUNCHER_PATH)) return LAUNCHER_PATH; } catch (e) {}
    try { var a = String(engines.myEngine().source); if (a && files.exists(a)) return a; } catch (e) {}
    try { var b = String(engines.myEngine().getSource()); if (b && files.exists(b)) return b; } catch (e) {}
    return "";
}
function sha256Hex(text) {
    var md = java.security.MessageDigest.getInstance("SHA-256");
    var b = md.digest(new java.lang.String(String(text)).getBytes("UTF-8"));
    var out = "";
    for (var i = 0; i < b.length; i++) { var v = b[i] & 0xff; out += (v < 16 ? "0" : "") + v.toString(16); }
    return out;
}
function b64OfText(text) {
    return android.util.Base64.encodeToString(new java.lang.String(String(text)).getBytes("UTF-8"), android.util.Base64.NO_WRAP);
}
function textOfB64(b64) {
    var bytes = android.util.Base64.decode(String(b64).replace(/\s/g, ""), 0);
    return String(new java.lang.String(bytes, "UTF-8"));
}

// ---- user side: look for a newer version, install it on demand ----
function setUpdBtnText(t) {
    ui.run(function () {
        try { w.updBtnA.setText(t); w.updBtnS.setText(t); w.updBtnC.setText(t); } catch (e) {}
    });
}
function setUpdUI() {
    ui.run(function () {
        if (updateInfo) {
            var n = updateInfo.notes ? ": " + updateInfo.notes : "";
            w.updText.setText("Update v" + updateInfo.version + " available" + n);
        }
    });
    setUpdBtnText(updateInfo ? "⟳ Update to v" + updateInfo.version : "⟳ Update");
    applyPanels();
}
// Update button (login, subscription and main panels): installs a newer version, or checks for one first
function onUpdateBtn() {
    if (updBusy) { toast("Update in progress..."); return; }
    if (updateInfo) { installUpdate(); return; }
    threads.start(function () {
        try {
            if (!ghConfigured()) { toast("Update server not configured"); return; }
            toast("Checking for update...");
            setUpdBtnText("⟳ Checking...");
            checkUpdate();
            if (updateInfo) { toast("Update v" + updateInfo.version + " found - installing"); installUpdate(); }
            else { toast("Up to date (v" + APP_VERSION + ")"); setUpdBtnText("⟳ Update"); }
        } catch (e) { logErr("onUpdateBtn", e); setUpdBtnText("⟳ Update"); }
    });
}
function checkUpdate() {
    if (!ghConfigured()) return;
    try {
        var r = http.get(rawUrl(GH_VERSION));
        if (r.statusCode !== 200) { if (r.statusCode !== 404) log("update check: HTTP " + r.statusCode); return; }
        var info = JSON.parse(r.body.string());
        if (info && Number(info.version) > APP_VERSION && info.sha256) {
            if (!updateInfo || updateInfo.version !== info.version) log("update available: v" + info.version);
            updateInfo = info;
        } else {
            updateInfo = null;
        }
        setUpdUI();
    } catch (e) { logErr("checkUpdate", e); }
}
function installUpdate() {
    if (updBusy || !updateInfo) return;
    updBusy = true;
    if (busy) stopFlag = true;                       // stop the bot loop first
    threads.start(function () {
        try {
            ui.run(function () { w.updText.setText("Downloading v" + updateInfo.version + "..."); });
            var r = http.get(rawUrl(GH_SCRIPT));
            if (r.statusCode !== 200) throw "download HTTP " + r.statusCode;
            var text = r.body.string();
            if (sha256Hex(text) !== String(updateInfo.sha256)) throw "download corrupted (checksum mismatch)";
            if (text.indexOf("var APP_VERSION") < 0) throw "downloaded file is not the launcher";
            var path = scriptPath(), wrote = false;
            if (path && path !== UPDATED_PATH) {
                try { files.copy(path, path + ".bak"); } catch (e) {}
                try { files.write(path, text); wrote = (files.read(path) === text); } catch (e) { log("write to " + path + " failed: " + e); }
            }
            if (!wrote) {                                  // packaged APK / read-only script -> use the writable copy
                path = UPDATED_PATH;
                files.ensureDir(path);
                files.write(path, text);
                if (files.read(path) !== text) throw "cannot save update to " + path;
            }
            log("updated to v" + updateInfo.version + " - restarting");
            toast("Updated to v" + updateInfo.version + " - restarting");
            engines.execScriptFile(path);
            sleep(800);
            w.close();
            exit();
        } catch (e) {
            logErr("installUpdate", e);
            toast("Update failed: " + e);
            ui.run(function () { w.updText.setText("Update failed: " + String(e).slice(0, 60) + " - tap to retry"); });
        } finally {
            updBusy = false;
        }
    });
}

// ---- admin side: publish this script to GitHub ----
function setAdmMsg(text, good) {
    ui.run(function () {
        w.admMsg.setText(text);
        w.admMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ff8a80"));
    });
}
function refreshAdminUI() {
    ui.run(function () {
        w.admInfo.setText("Local v" + APP_VERSION + " | repo " + (ghConfigured() ? GH_OWNER + "/" + GH_REPO : "NOT SET") + (myUid ? "\nuid (hold to copy): " + myUid : ""));
        var t = authStore.get("ghToken", "");
        if (t && !String(w.admToken.getText())) w.admToken.setText(t);
        if (!String(w.admRepo.getText()) && ghConfigured()) w.admRepo.setText(GH_OWNER + "/" + GH_REPO);
    });
}
function ghApi(method, path, token, body) {
    var url = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + path;
    var headers = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "User-Agent": "klassx-launcher" };
    var res;
    if (method === "GET") res = http.get(url + "?ref=" + encodeURIComponent(GH_BRANCH), { headers: headers });
    else res = http.request(url, { method: "PUT", headers: headers, contentType: "application/json", body: JSON.stringify(body) });
    var j = null;
    try { j = res.body.json(); } catch (e) {}
    return { status: res.statusCode, json: j };
}
function ghErrText(r) {
    if (r.status === 401) return "Bad GitHub token.";
    if (r.status === 403) return "Token has no write access (or rate limited).";
    if (r.status === 404) return "Repo/branch not found (check GH_OWNER, GH_REPO, token access).";
    if (r.status === 409 || r.status === 422) return "Conflict - try again.";
    return "GitHub error HTTP " + r.status + (r.json && r.json.message ? ": " + r.json.message : "");
}
function resetAdminPanel() {           // after a successful publish: clear the form and fold the panel back up
    ui.run(function () {
        try {
            w.admFile.setText("");
            w.admNotes.setText("");
            w.admToken.setText("");             // the token stays saved; it is filled in again when the panel is opened
            w.drag.setText("⠿ KlassX v" + APP_VERSION + " (drag)");
        } catch (e) {}
    });
    inputFocus(false);
    setTimeout(function () {                    // let the "Published vN" message be read first
        admShown = false;
        ui.run(function () { w.admin.setText("Admin ▾"); w.admMsg.setText(""); });
        applyPanels();
    }, 3000);
}
function publishUpdate() {
    if (admBusy) return;
    if (!authed || !isAdmin()) { setAdmMsg("Admins only.", false); return; }
    if (!ghConfigured()) { setAdmMsg("Set GH_OWNER and GH_REPO in the script.", false); return; }
    var token = String(w.admToken.getText()).trim();
    var notes = String(w.admNotes.getText()).trim();
    if (!token) { setAdmMsg("Paste your GitHub token.", false); return; }
    var picked = String(w.admFile.getText()).trim();
    var path = picked || scriptPath() || (files.exists(UPDATED_PATH) ? UPDATED_PATH : "");
    if (!path) { setAdmMsg("Cannot find script file (set SCRIPT_PATH or choose a file).", false); return; }
    if (!files.exists(path)) { setAdmMsg("File not found: " + path, false); return; }
    if (picked) log("publishing uploaded file: " + picked);
    admBusy = true;
    setAdmMsg("Reading repo...", true);
    threads.start(function () {
        try {
            var rv = ghApi("GET", GH_VERSION, token);       // current published version (404 = first publish)
            var remoteVer = 0, verSha = null;
            if (rv.status === 200 && rv.json && rv.json.content) {
                verSha = rv.json.sha;
                try { remoteVer = Number(JSON.parse(textOfB64(rv.json.content)).version) || 0; } catch (e) {}
            } else if (rv.status !== 404) { setAdmMsg(ghErrText(rv), false); return; }

            var newVer = Math.max(remoteVer, APP_VERSION) + 1;
            var src = files.read(path);
            if (!/var APP_VERSION = \d+;/.test(src)) { setAdmMsg("That file has no 'var APP_VERSION = N;' line - it is not a KlassX script.", false); return; }
            var patched = src.replace(/var APP_VERSION = \d+;/, "var APP_VERSION = " + newVer + ";");

            setAdmMsg("Uploading v" + newVer + "...", true);
            var rs = ghApi("GET", GH_SCRIPT, token);         // script first, version file last
            var scriptSha = null;
            if (rs.status === 200 && rs.json) scriptSha = rs.json.sha;
            else if (rs.status !== 404) { setAdmMsg(ghErrText(rs), false); return; }
            var body = { message: "Release v" + newVer, content: b64OfText(patched), branch: GH_BRANCH };
            if (scriptSha) body.sha = scriptSha;
            var ps = ghApi("PUT", GH_SCRIPT, token, body);
            if (ps.status !== 200 && ps.status !== 201) { setAdmMsg(ghErrText(ps), false); return; }

            var info = {
                version: newVer,
                notes: notes || ("Update v" + newVer),
                sha256: sha256Hex(patched),
                file: GH_SCRIPT,
                published: new Date().toISOString()
            };
            var vb = { message: "Version v" + newVer, content: b64OfText(JSON.stringify(info, null, 2)), branch: GH_BRANCH };
            if (verSha) vb.sha = verSha;
            var pv = ghApi("PUT", GH_VERSION, token, vb);
            if (pv.status !== 200 && pv.status !== 201) { setAdmMsg("Script uploaded but version file failed: " + ghErrText(pv), false); return; }

            files.write(path, patched);                      // keep the admin's own copy in step
            APP_VERSION = newVer;
            authStore.put("ghToken", token);
            log("published v" + newVer + " to GitHub");
            setAdmMsg("Published v" + newVer + " ✓", true);
            refreshAdminUI();
            resetAdminPanel();
        } catch (e) {
            logErr("publishUpdate", e);
            setAdmMsg("Error - see log", false);
        } finally {
            admBusy = false;
        }
    });
}

bindAuthField(w.admToken);
bindAuthField(w.admRepo);
w.admRepoSave.click(function () {
    inputFocus(false);
    var v = String(w.admRepo.getText()).trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/\/+$/, "");
    var m = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(v);
    if (!m) { setAdmMsg("Repo must look like owner/name.", false); return; }
    GH_OWNER = m[1]; GH_REPO = m[2];
    authStore.put("ghRepo", v);
    ui.run(function () { w.admRepo.setText(v); });
    refreshAdminUI();
    setAdmMsg("Repo set to " + v + " ✓", true);
});
bindAuthField(w.admNotes);
bindAuthField(w.admFile);
function pasteToken() {                 // read the clipboard straight into the token field
    try {
        var c = getClip();
        if (!c || !String(c).trim()) { toast("Clipboard is empty - copy the token first"); return; }
        var t = String(c).trim();
        ui.run(function () { w.admToken.setText(t); });
        toast("Token pasted (" + t.length + " chars)");
    } catch (e) { logErr("pasteToken", e); toast("Could not read clipboard"); }
}
function listCandidateScripts() {       // newest .js files in the usual download/script folders
    var dirs = ["/sdcard/Download", "/sdcard/Scripts", "/sdcard/Documents", "/sdcard/脚本", "/sdcard"];
    var out = [], seen = {};
    for (var i = 0; i < dirs.length; i++) {
        try {
            if (!files.isDir(dirs[i])) continue;
            var names = files.listDir(dirs[i], function (n) { return /\.js$/i.test(n); });
            for (var j = 0; j < names.length; j++) {
                var full = files.join(dirs[i], names[j]);
                if (seen[full]) continue;
                seen[full] = true;
                out.push({ path: full, name: names[j], t: Number(new java.io.File(full).lastModified()) });
            }
        } catch (e) {}
    }
    out.sort(function (a, b) { return b.t - a.t; });
    return out.slice(0, 30);
}
w.admBrowse.click(function () {
    inputFocus(false);
    threads.start(function () {
        try {
            var list = listCandidateScripts();
            if (!list.length) { toast("No .js files found - type the path in the file box"); return; }
            var labels = ["(this running script)"];
            for (var i = 0; i < list.length; i++) labels.push(list[i].path.replace("/sdcard/", ""));
            var k = dialogs.select("Choose file to publish", labels);
            if (k < 0) return;
            var chosen = k === 0 ? "" : list[k - 1].path;
            ui.run(function () { w.admFile.setText(chosen); });
            setAdmMsg(chosen ? "Will publish: " + list[k - 1].name : "Will publish this running script", true);
        } catch (e) { logErr("browse", e); toast("Could not list files"); }
    });
});
w.admPaste.click(function () { inputFocus(false); pasteToken(); });
w.admToken.on("long_click", function () { pasteToken(); return true; });
w.admin.click(function () {
    admShown = !admShown;
    inputFocus(false);
    ui.run(function () { w.admin.setText(admShown ? "Admin ▴" : "Admin ▾"); });
    applyPanels();
    if (admShown) refreshAdminUI();
});
w.admPublish.click(function () { inputFocus(false); publishUpdate(); });
w.updGo.click(function () { installUpdate(); });
w.updBtnA.click(function () { inputFocus(false); onUpdateBtn(); });
w.updBtnS.click(function () { inputFocus(false); onUpdateBtn(); });
w.updBtnC.click(function () { onUpdateBtn(); });
ui.run(function () { w.drag.setText("⠿ KlassX v" + APP_VERSION + " (drag)"); });
log("Captcha solver build F: multi-threshold keypad reader, shapes still unknown: [" + capMissingDigits() + "]");

// --- detect screens by their button ---
// A button is dark neutral gray AND its white label is visible. Both must be present, so we
// only tap once the button is fully shown. Points are in the 2576x1177 reference screenshot
// and scale to any resolution.
function makeSpec(btnXs, btnYs, txtX0, txtX1, txtXStep, txtY0, txtY1, txtYStep) {
    var spec = { btn: [], txt: [], textMin: 20, hit: 0, white: 0 }, i, j;
    for (j = 0; j < btnYs.length; j++)
        for (i = 0; i < btnXs.length; i++)
            spec.btn.push([btnXs[i], btnYs[j]]);
    for (j = txtY0; j < txtY1; j += txtYStep)
        for (i = txtX0; i < txtX1; i += txtXStep)
            spec.txt.push([i, j]);
    return spec;
}
function range(a, b, step) { var r = []; for (var v = a; v < b; v += step) r.push(v); return r; }

var SCREENS = {
    // "Select Server" button on the main screen
    select: makeSpec(range(1325, 1645, 40), [990, 1010, 1050, 1070], 1390, 1578, 4, 1010, 1052, 3),
    // "Login" button on the login screen
    login:  makeSpec(range(1335, 1645, 40), [745, 760, 790, 805],     1435, 1545, 3, 752, 800, 3)
};
// Character screen: "Server Select" (bottom-left) + "Create" (bottom-right) buttons
function gridPts(x0, x1, xs, y0, y1, ys) {
    var r = [];
    for (var y = y0; y < y1; y += ys) for (var x = x0; x < x1; x += xs) r.push([x, y]);
    return r;
}
SCREENS.character = {
    btn: [].concat(gridPts(2245, 2520, 40, 1062, 1123, 10), gridPts(60, 345, 40, 1062, 1123, 10))
           .filter(function (p) { return p[1] <= 1072 || p[1] >= 1112; }),
    txt: [].concat(gridPts(2330, 2430, 4, 1078, 1112, 3), gridPts(100, 300, 5, 1078, 1112, 3)),
    textMin: 20, hit: 0, white: 0
};
// Profile screen: "Start" (bottom-right) + "Delete Character" (bottom-middle) buttons.
// Only the "Delete Character" label is checked for white text: it is what tells this screen
// apart from the character list (which has "Create" instead).
SCREENS.start = {
    btn: [].concat(gridPts(2245, 2520, 40, 1062, 1123, 10), gridPts(470, 740, 40, 1062, 1123, 10))
           .filter(function (p) { return p[1] <= 1072 || p[1] >= 1112; }),
    txt: gridPts(480, 730, 5, 1078, 1112, 3),
    textMin: 20, hit: 0, white: 0
};
var CHECK_PTS = SCREENS.select.btn;

// true if the button's dark body and white label are both visible
function matchSpec(img, spec, W, H) {
    var L = layoutOf(W, H), hit = 0, white = 0, i, c;
    for (i = 0; i < spec.btn.length; i++) {
        c = img.pixel(mapX(L, spec.btn[i][0]), mapY(L, spec.btn[i][1]));
        var r = colors.red(c), g = colors.green(c), bl = colors.blue(c);
        var mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
        if (mx <= 140 && mx - mn <= 14) hit++;
    }
    if (hit >= spec.btn.length * 0.8) {          // button is there - now check the white label
        for (i = 0; i < spec.txt.length; i++) {
            c = img.pixel(mapX(L, spec.txt[i][0]), mapY(L, spec.txt[i][1]));
            if (Math.min(colors.red(c), colors.green(c), colors.blue(c)) >= 200) white++;
        }
    }
    spec.hit = hit;
    spec.white = white;
    return hit >= spec.btn.length * 0.8 && white >= spec.textMin;
}

// Loot button: dark disc (r~40) + white ring (r~47) + white hand in the middle (r<26).
// All radii are in reference pixels and scale with the screen.
var lootDark = 0, lootRing = 0, lootWhite = 0;
function matchLoot(img, W, H) {
    var L = layoutOf(W, H), cx = mapX(L, LOOT_X, "c"), cy = mapY(L, LOOT_Y, "b");
    var dark = 0, ring = 0, white = 0, a, c, mx, mn, cs, sn, dx, dy;
    for (a = 0; a < 360; a += 15) {
        cs = Math.cos(a * Math.PI / 180); sn = Math.sin(a * Math.PI / 180);
        c = img.pixel(Math.round(cx + 40 * L.kx * cs), Math.round(cy + 40 * L.kx * sn));
        mx = Math.max(colors.red(c), colors.green(c), colors.blue(c));
        mn = Math.min(colors.red(c), colors.green(c), colors.blue(c));
        if (mx <= 70 && mx - mn <= 14) dark++;
        c = img.pixel(Math.round(cx + 47 * L.kx * cs), Math.round(cy + 47 * L.kx * sn));
        if (Math.min(colors.red(c), colors.green(c), colors.blue(c)) >= 170) ring++;
    }
    for (dy = -26; dy <= 26; dy += 4) {
        for (dx = -26; dx <= 26; dx += 4) {
            if (dx * dx + dy * dy > 676) continue;
            c = img.pixel(Math.round(cx + dx * L.kx), Math.round(cy + dy * L.kx));
            if (Math.min(colors.red(c), colors.green(c), colors.blue(c)) >= 225) white++;
        }
    }
    lootDark = dark; lootRing = ring; lootWhite = white;
    return dark >= 19 && ring >= 7 && white >= 20;
}

// In-game check: the HP / MP / SP / EXP bars at the top-left of the game screen.
// Skills are only tapped while these are showing, so menus and login screens are never tapped by accident.
var hudBars = 0;
function matchHud(img, W, H) {
    var L = layoutOf(W, H), xs = [205, 240], ys = [40, 80, 116, 153];
    var bars = 0, k, i, c, r, g, b, ok, hpOk = false, mpOk = false;
    for (k = 0; k < 4; k++) {
        ok = false;
        for (i = 0; i < xs.length; i++) {
            c = img.pixel(mapX(L, xs[i]), mapY(L, ys[k]));
            r = colors.red(c); g = colors.green(c); b = colors.blue(c);
            if (k === 0 && r >= 110 && g <= 45 && b <= 45) ok = true;                  // HP red
            if (k === 1 && b >= 140 && r <= 45 && g <= 70) ok = true;                   // MP blue
            if (k === 2 && g >= 90 && r <= 60 && b <= 40) ok = true;                    // SP green
            if (k === 3 && r >= 120 && g >= 50 && g <= 130 && b <= 40) ok = true;       // EXP orange
        }
        if (ok) { bars++; if (k === 0) hpOk = true; if (k === 1) mpOk = true; }
    }
    hudBars = bars;
    // The floating KlassX log window can cover the SP / EXP bars in the capture, so HP + MP alone also counts as "in game".
    return bars >= 3 || (hpOk && mpOk);
}

// Revive dialog: wide gray button + white "Revive" label + white question text + dark dialog panel.
var reviveBody = 0, reviveText = 0, reviveLabel = 0, revivePanel = 0;
function whiteCount(img, L, x0, x1, y0, y1, step, th) {
    var n = 0, x, y, c;
    for (y = y0; y < y1; y += step) {
        for (x = x0; x < x1; x += step) {
            c = img.pixel(mapX(L, x, "c"), mapY(L, y, "c"));
            if (Math.min(colors.red(c), colors.green(c), colors.blue(c)) >= th) n++;
        }
    }
    return n;
}
// Shared by the Revive / Disconnected dialogs: dark panel + wide gray button at the same spot.
function dialogBase(img, L) {
    var body = 0, panel = 0, x, y, c, mx, mn, i;
    for (y = 660; y <= 700; y += 10) {
        for (x = 1020; x < 1580; x += 80) {
            c = img.pixel(mapX(L, x, "c"), mapY(L, y, "c"));
            mx = Math.max(colors.red(c), colors.green(c), colors.blue(c));
            mn = Math.min(colors.red(c), colors.green(c), colors.blue(c));
            if (mx <= 140 && mx - mn <= 14) body++;
        }
    }
    var pp = [[1000, 600], [1500, 600], [1100, 560], [1450, 560]];
    for (i = 0; i < pp.length; i++) {
        c = img.pixel(mapX(L, pp[i][0], "c"), mapY(L, pp[i][1], "c"));
        if (Math.max(colors.red(c), colors.green(c), colors.blue(c)) <= 40) panel++;
    }
    reviveBody = body; revivePanel = panel;
    return body >= 22 && panel >= 3;
}
function matchRevive(img, W, H) {
    var L = layoutOf(W, H);
    reviveText = 0; reviveLabel = 0;
    if (!dialogBase(img, L)) return false;
    reviveText = whiteCount(img, L, 1080, 1500, 480, 522, 3, 200);
    reviveLabel = whiteCount(img, L, 1245, 1335, 660, 695, 3, 200);
    return reviveText >= 60 && reviveLabel >= 15;
}

// "Disconnected from Server!": the message text is matched against a stored pattern of its white pixels
// (x,y pairs on the 2576x1177 reference screenshot), so other dialogs are not mistaken for it.
var DISC_PTS = [1283,487,1304,487,1307,487,1094,490,1100,490,1103,490,1106,490,1244,490,1283,490,1304,490,1385,490,1394,490,1481,490,1094,493,1109,493,1145,493,1160,493,1181,493,1199,493,1217,493,1235,493,1244,493,1262,493,1277,493,1283,493,1304,493,1331,493,1349,493,1382,493,1406,493,1454,493,1094,496,1109,496,1124,496,1133,496,1139,496,1142,496,1148,496,1157,496,1166,496,1172,496,1175,496,1184,496,1193,496,1196,496,1202,496,1211,496,1220,496,1229,496,1238,496,1244,496,1256,496,1265,496,1274,496,1283,496,1304,496,1313,496,1316,496,1319,496,1325,496,1334,496,1343,496,1346,496,1352,496,1355,496,1364,496,1382,496,1403,496,1412,496,1418,496,1421,496,1424,496,1430,496,1442,496,1448,496,1457,496,1466,496,1469,496,1472,496,1094,499,1109,499,1124,499,1139,499,1154,499,1166,499,1172,499,1184,499,1193,499,1202,499,1211,499,1223,499,1229,499,1244,499,1268,499,1283,499,1304,499,1313,499,1325,499,1337,499,1343,499,1355,499,1364,499,1385,499,1388,499,1391,499,1400,499,1412,499,1418,499,1430,499,1439,499,1448,499,1460,499,1466,499,1094,502,1109,502,1124,502,1127,502,1130,502,1139,502,1154,502,1166,502,1172,502,1184,502,1193,502,1202,502,1211,502,1214,502,1217,502,1220,502,1223,502,1244,502,1256,502,1259,502,1262,502,1265,502,1271,502,1283,502,1304,502,1313,502,1325,502,1337,502,1343,502,1355,502,1364,502,1394,502,1400,502,1403,502,1406,502,1409,502,1412,502,1418,502,1433,502,1439,502,1448,502,1451,502,1454,502,1457,502,1460,502,1466,502,1094,505,1109,505,1133,505,1139,505,1154,505,1166,505,1172,505,1184,505,1193,505,1202,505,1211,505,1229,505,1244,505,1283,505,1304,505,1313,505,1325,505,1337,505,1343,505,1355,505,1364,505,1394,505,1400,505,1418,505,1433,505,1439,505,1448,505,1466,505,1094,508,1106,508,1133,508,1139,508,1157,508,1166,508,1172,508,1184,508,1193,508,1202,508,1211,508,1229,508,1244,508,1256,508,1274,508,1283,508,1304,508,1313,508,1325,508,1343,508,1355,508,1364,508,1382,508,1394,508,1403,508,1418,508,1436,508,1448,508,1466,508,1094,511,1097,511,1100,511,1124,511,1127,511,1130,511,1145,511,1148,511,1160,511,1184,511,1193,511,1202,511,1214,511,1217,511,1220,511,1232,511,1235,511,1247,511,1250,511,1259,511,1262,511,1265,511,1277,511,1313,511,1328,511,1331,511,1343,511,1355,511,1364,511,1385,511,1388,511,1391,511,1406,511,1409,511,1418,511,1436,511,1451,511,1454,511,1457,511,1466,511];
var discHit = 0, discTotal = 0;
function matchDisc(img, W, H) {
    var L = layoutOf(W, H), i, c, hit = 0, n = DISC_PTS.length / 2;
    discHit = 0; discTotal = 0;
    if (!dialogBase(img, L)) return false;
    for (i = 0; i < DISC_PTS.length; i += 2) {
        c = img.pixel(mapX(L, DISC_PTS[i], "c"), mapY(L, DISC_PTS[i + 1], "c"));
        if (Math.min(colors.red(c), colors.green(c), colors.blue(c)) >= 180) hit++;
    }
    discHit = hit;
    if (hit < n * 0.8) return false;
    discTotal = whiteCount(img, L, 1070, 1510, 475, 525, 3, 200);
    return discTotal <= n * 1.6;
}


// FIX (tablets with a portrait-native panel, e.g. 1200x1920): captureScreen() can return the raw PORTRAIT buffer while the
// game runs in landscape, so nothing was ever detected ("capture 1200x1920", "-1/32 button") and nothing was tapped.
// Rotate the capture upright. Direction comes from the display rotation; override with 90 or 270 in /sdcard/KlassX/rotate.txt
var ROT_FILE = "/sdcard/KlassX/rotate.txt";
var lastRotImg = null, rotLogged = false;
function captureRotDeg() {
    try {
        if (files.exists(ROT_FILE)) {
            var v = parseInt(String(files.read(ROT_FILE)).replace(/\s/g, ""), 10);
            if (v === 90 || v === 180 || v === 270 || v === 0) return v;
        }
    } catch (e) {}
    try {
        var r = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRotation();
        if (r === 3) return 270;
    } catch (e) {}
    return 90;
}
function grabScreen() {
    var img = captureScreen();
    if (!img) return img;
    var W = img.getWidth(), H = img.getHeight();
    if (W >= H) return img;                       // already landscape
    var deg = captureRotDeg();
    if (!deg) return img;
    var out = null;
    try { out = images.rotate(img, deg); } catch (e) { logErr("rotate capture", e); }
    if (!out) return img;
    if (lastRotImg) { try { lastRotImg.recycle(); } catch (e) {} }   // our own copy only (never AutoX's captureScreen image)
    lastRotImg = out;
    if (!rotLogged) { rotLogged = true; log("capture is portrait " + W + "x" + H + " -> rotated " + deg + " deg to landscape " + out.getWidth() + "x" + out.getHeight()); }
    return out;
}
var captureOk = captureOk || false;   // keep a value the initCapture thread may already have set (auto sign-in starts it before this line runs)
function initCapture() {
    try { captureOk = requestScreenCapture(true); } catch (e) { captureOk = false; logErr("requestScreenCapture", e); }
    log("screen capture permission: " + (captureOk ? "GRANTED" : "DENIED"));
    if (!captureOk) toast("Screen capture denied - using fixed delays");
}

// Image detection of the Login button on the "LOG IN TO YOUR ACCOUNT" pop-up.
// Template: /sdcard/脚本/templates/login_btn.png (crop of the Login button from a 2576x1177 screenshot).
// If the file is missing, only the old pixel check (SCREENS.login) is used.
var LOGIN_TPL_BOX = [1250, 700, 1720, 850];   // search area (reference px) - the pop-up is always centred
var LOGIN_TPL_THRESHOLD = 0.8;
var lastLoginPt = null;                       // pixel centre of the detected Login button, or null
function matchLoginTpl(img, W, H) {
    lastLoginPt = null;
    var L = layoutOf(W, H), tpl = getTemplateFit("login_btn", L);
    if (!tpl) return false;
    var x0 = mapX(L, LOGIN_TPL_BOX[0], "c"), y0 = mapY(L, LOGIN_TPL_BOX[1], "c");
    var x1 = mapX(L, LOGIN_TPL_BOX[2], "c"), y1 = mapY(L, LOGIN_TPL_BOX[3], "c");
    var pt = null;
    try { pt = images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: LOGIN_TPL_THRESHOLD }); }
    catch (e) { logErr("login findImage", e); }
    if (!pt) return false;
    lastLoginPt = [pt.x + Math.round(tpl.getWidth() / 2), pt.y + Math.round(tpl.getHeight() / 2)];
    return true;
}
// Image detection of the Start button on the Character Profile screen (template start_btn.png in TEMPLATE_DIR).
// The Start button sits at the bottom-right, so the search box is edge-anchored. Missing file -> pixel check only.
var START_TPL_BOX = [2150, 1020, 2576, 1177];   // search area (reference px)
var START_TPL_THRESHOLD = 0.8;
var lastStartPt = null;                         // pixel centre of the detected Start button, or null
function matchStartTpl(img, W, H) {
    lastStartPt = null;
    var L = layoutOf(W, H), tpl = getTemplateFit("start_btn", L);
    if (!tpl) return false;
    var x0 = mapX(L, START_TPL_BOX[0], "r"), y0 = mapY(L, START_TPL_BOX[1], "b");
    var x1 = mapX(L, START_TPL_BOX[2], "r"), y1 = mapY(L, START_TPL_BOX[3], "b");
    var pt = null;
    try { pt = images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: START_TPL_THRESHOLD }); }
    catch (e) { logErr("start findImage", e); }
    if (!pt) return false;
    lastStartPt = [pt.x + Math.round(tpl.getWidth() / 2), pt.y + Math.round(tpl.getHeight() / 2)];
    return true;
}
var lastHit = 0, lastWhite = 0, lastDims = "", lastW = 0, lastH = 0, lastLoginSeen = false, lastCharSeen = false, lastStartSeen = false, lastLootSeen = false, lastHudSeen = false, lastReviveSeen = false, lastDiscSeen = false;
// Is the Select Server button showing? With alsoOthers, also sets lastLoginSeen / lastCharSeen.
function isMainScreen(alsoOthers) {
    lastLoginSeen = false;
    lastCharSeen = false;
    lastStartSeen = false;
    lastLootSeen = false;
    lastHudSeen = false;
    lastReviveSeen = false;
    lastDiscSeen = false;
    var img = grabScreen();
    if (!img) { log("captureScreen returned null"); return false; }
    var sel = false;
    try {
        var W = img.getWidth(), H = img.getHeight();
        lastDims = W + "x" + H;
        if (W >= H) { lastW = W; lastH = H; syncTapSpace(W, H); }
        if (W < H) { lastHit = -1; return false; }   // game screen is landscape
        sel = matchSpec(img, SCREENS.select, W, H);
        lastHit = SCREENS.select.hit;
        lastWhite = SCREENS.select.white;
        if (alsoOthers) {
            lastLoginSeen = matchSpec(img, SCREENS.login, W, H);
            if (matchLoginTpl(img, W, H)) lastLoginSeen = true;   // image detection of the Login button
            lastStartSeen = matchSpec(img, SCREENS.start, W, H);
            if (matchStartTpl(img, W, H)) lastStartSeen = true;   // image detection of the Start button
            if (TAP_LOOT) lastLootSeen = matchLoot(img, W, H);
            lastHudSeen = matchHud(img, W, H);
            if (TAP_DISCONNECT) lastDiscSeen = matchDisc(img, W, H);
            if (TAP_REVIVE && !lastDiscSeen) lastReviveSeen = matchRevive(img, W, H);
            // the profile screen also looks like the character list, so Start wins
            lastCharSeen = !lastStartSeen && matchSpec(img, SCREENS.character, W, H);
        }
    } finally {
        // no img.recycle(): captureScreen() images are managed by AutoX (avoids native double-free SIGSEGV)
    }
    return sel;
}

// Wait until the main screen (Select Server button) is showing AND stays for a few checks.
function waitForMainScreen(timeoutMs, fallbackDelayMs) {
    if (!captureOk) {
        log("capture off -> fixed wait " + fallbackDelayMs + "ms");
        nap(fallbackDelayMs);
        return true;
    }
    log("waiting for Select Server screen (max " + timeoutMs + "ms)...");
    var t0 = Date.now(), lastLog = 0, streak = 0;
    while (Date.now() - t0 < timeoutMs) {
        var seen = false;
        try { seen = isMainScreen(); } catch (e) { logErr("isMainScreen", e); }
        if (seen) {
            streak++;
            if (streak >= STABLE_NEEDED) {
                log("Select Server screen DETECTED & stable (" + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite + ", capture " + lastDims + ")");
                return true;
            }
        } else {
            streak = 0;
        }
        if (Date.now() - lastLog > 5000) {   // progress line every 5s
            lastLog = Date.now();
            log("  not yet: " + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite +
                (lastHit === -1 ? " (capture is portrait " + lastDims + ")" : " (capture " + lastDims + ")"));
        }
        nap(400);
    }
    log("TIMEOUT waiting for Select Server screen (last " + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite + ", capture " + lastDims + ")");
    return false;
}

// Wait until the main screen is GONE (e.g. the server list opened and covers the buttons).
function waitMainGone(timeoutMs) {
    if (!captureOk) { nap(LIST_DELAY_MS); return true; }
    var t0 = Date.now(), gone = 0;
    while (Date.now() - t0 < timeoutMs) {
        var seen = true;
        try { seen = isMainScreen(); } catch (e) { logErr("isMainScreen", e); }
        gone = seen ? 0 : gone + 1;
        if (gone >= 2) return true;
        nap(300);
    }
    return false;
}

// Real landscape screen size in pixels (from the capture; falls back to device size)
// Optional manual override: put e.g. 2576x1177 in /sdcard/KlassX/screen.txt (leave it out for auto-detect)
var SCREEN_FILE = "/sdcard/KlassX/screen.txt";
var SCREEN_FIXED = null;
try {
    if (files.exists(SCREEN_FILE)) {
        var _sm = /(\d{3,5})\s*[xX*,]\s*(\d{3,5})/.exec(String(files.read(SCREEN_FILE)));
        if (_sm) SCREEN_FIXED = [Math.max(+_sm[1], +_sm[2]), Math.min(+_sm[1], +_sm[2])];
    }
} catch (e) {}
var REAL_SIZE = null;
function realDisplaySize() {          // full physical display incl. navigation bar / cutout, landscape order
    if (REAL_SIZE) return REAL_SIZE;
    try {
        var pt = new android.graphics.Point();
        context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRealSize(pt);
        if (pt.x > 0 && pt.y > 0) REAL_SIZE = { W: Math.max(pt.x, pt.y), H: Math.min(pt.x, pt.y) };
    } catch (e) {}
    return REAL_SIZE;
}
function screenSize() {
    if (SCREEN_FIXED) return { W: SCREEN_FIXED[0], H: SCREEN_FIXED[1] };
    if (lastW > 0) return { W: Math.max(lastW, lastH), H: Math.min(lastW, lastH) };   // size of the real screen capture
    var rs = realDisplaySize();
    if (rs) return rs;
    return { W: Math.max(device.width, device.height), H: Math.min(device.width, device.height) };
}
// Convert a point from the 2576x1177 reference screenshot to real screen pixels
function toPx(x, y, ax, ay) {   // ax/ay = optional edge anchor ("l"/"c"/"r", "t"/"c"/"b"); HUD buttons pass their real anchor
    var d = screenSize(), L = layoutOf(d.W, d.H);
    var px = mapX(L, x, ax), py = mapY(L, y, ay);
    return [Math.max(0, Math.min(d.W - 1, px)), Math.max(0, Math.min(d.H - 1, py))];
}

// FIX (tablets): tap coordinates must be in the same pixel space as the screen capture. On many tablets the capture
// size differs from the real display size (nav bar, scaled display mode...), so every tap drifted. Tell AutoX that our
// coordinates are in capture pixels and it scales them to the real display.
var metricsW = 0, metricsH = 0;
function syncTapSpace(W, H) {
    if (W <= 0 || H <= 0 || (W === metricsW && H === metricsH)) return;
    metricsW = W; metricsH = H;
    try {
        var rs = realDisplaySize();
        if (rs && (Math.abs(rs.W - W) > 2 || Math.abs(rs.H - H) > 2)) {
            setScreenMetrics(W, H);
            log("tap space synced to capture " + W + "x" + H + " (real display " + rs.W + "x" + rs.H + ")");
        }
    } catch (e) { logErr("setScreenMetrics", e); }
}

// method 0 = press (hold TAP_MS), 1 = click, 2 = tiny swipe. Different methods help if one is ignored.
var TAP_METHODS = ["press", "click", "swipe"];
function tapAt(x, y, what, method, ax, ay) {
    method = method || 0;
    var p = toPx(x, y, ax, ay), d = screenSize();
    log("tap " + what + " ref(" + x + "," + y + ") -> px(" + p[0] + "," + p[1] + ") screen " + d.W + "x" + d.H + " via " + TAP_METHODS[method]);
    if (method === 1) click(p[0], p[1]);
    else if (method === 2) swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
    else press(p[0], p[1], TAP_MS);
}

// Quiet tap (no log line) for taps that repeat many times
function quickTap(x, y, method, ax, ay) {
    var p = toPx(x, y, ax, ay);
    if (method === 1) click(p[0], p[1]);
    else if (method === 2) swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
    else press(p[0], p[1], TAP_MS);
}

// Launch the game, open the server list, and pick the chosen server
function setPlayState(running) {
    monState = running ? "Running" : "Stopped";
    ui.run(function () {
        w.play.setText(running ? "■ Stop" : "▶ Play");
        w.play.setBackgroundColor(android.graphics.Color.parseColor(running ? "#C62828" : "#2E7D32"));
    });
}
// Bring the game to the front (launch it) if it isn't already in the foreground
var APP_PKG = null;
function ensureGame() {
    var cur = "";
    try { cur = currentPackage(); } catch (e) {}
    if (!APP_PKG) APP_PKG = getPackageName(APP_NAME);
    if (APP_PKG && cur === APP_PKG) return false;
    log("game not in foreground (now: " + cur + ") -> launching");
    var ok = launchApp(APP_NAME);
    log("launchApp('" + APP_NAME + "') -> " + ok);
    if (!ok) toast("App not found: " + APP_NAME);
    return true;
}

// Scroll the Server List (UP swipes only) so the chosen server's row is on screen at the y values in SERVERS.
// Swiping a whole page past the end is harmless: the list just stops at the bottom.
function swipeListUp(fromY, dist, ms) {
    var a = toPx(LIST_X, fromY, "c", "c"), b = toPx(LIST_X, fromY - dist, "c", "c");
    swipe(a[0], a[1], b[0], b[1], ms);
}
function findServerRow(s) {
    log("find server " + s.name + " (list: " + s.from + ")");
    if (s.from === "bottom") {
        for (var i = 0; i < LIST_SWIPES; i++) {          // swipe up until the list is at the bottom
            swipeListUp(LIST_SWIPE_FROM, LIST_SWIPE_FROM - LIST_SWIPE_TO, LIST_SWIPE_MS);
            nap(350);
        }
    } else if (s.from === "mid") {
        swipeListUp(LIST_SWIPE_FROM, s.drag, 1200);      // one slow swipe up = no fling
    }                                                    // "top": nothing to do, the list opens at the top
    nap(500);                                            // let the list settle
}

// Select Server screen is showing: tap Select Server -> server -> channel -> Connect.
// Returns true if the whole sequence ran.
function runSequence() {
    var s = SERVERS[serverIdx];
    log("--- sequence | pick=" + (pickOn ? "ON" : "OFF") + " | server=" + s.name + " | channel " + CHANNEL_IDX + " ---");

    var opened = false;
    for (var attempt = 1; attempt <= 3 && !opened; attempt++) {
        tapAt(SELECT_X, SELECT_Y, "Select Server (attempt " + attempt + ")", attempt - 1);
        opened = waitMainGone(3000);
        log(opened ? "server list opened" : "list did not open (Select Server still showing)");
    }
    if (!opened) { toast("Select Server tap did not work - see log"); return false; }
    nap(LIST_DELAY_MS);              // let the list finish opening (0.7s)
    if (!pickOn) { log("pick OFF: server list opened, choose manually"); return true; }

    findServerRow(s);                // swipe the list to where this server is visible
    tapAt(LIST_X, s.y, "server " + s.name, 0, "c", "c");

    // Channel List opens on the right: wait until the chosen "N Channel" row is detected (template ch_0..ch_3), tap it,
    // then wait until the Connect button is detected and tap it. No template file -> the old fixed taps are used.
    var cy = CHANNEL_YS[CHANNEL_IDX];
    waitTapTemplate("ch_" + CHANNEL_IDX, [CHANNEL_BOX_X0, cy - 45, CHANNEL_BOX_X1, cy + 45], CHANNEL_X, cy, "channel " + CHANNEL_IDX);
    if (TAP_CONNECT) {
        nap(CHANNEL_DELAY_MS);       // let the Connect button light up after the channel is chosen
        waitTapTemplate("connect_btn", CONNECT_BOX, CONNECT_X, CONNECT_Y, "Connect", true);   // Login is tapped automatically when its screen appears
    }
    return true;
}

// Image detection for the Channel List / Connect button.
// Save these crops (from a 2576x1177 screenshot) in /sdcard/脚本/templates/ :
//   ch_0.png ch_1.png ch_2.png ch_3.png  -> only the label text ("0 Channel [PK]" ...), not the Smooth/Busy word
//   connect_btn.png                      -> the Connect button when it is lit (after a channel is chosen)
var CHANNEL_BOX_X0 = 1320, CHANNEL_BOX_X1 = 1580;     // search box for the channel labels (reference px)
var CONNECT_BOX = [1740, 855, 1960, 950];             // search box for the Connect button (reference px)
var TPL_THRESHOLD = 0.75, TPL_WAIT_MS = 4000, TPL_POLL_MS = 200;
function findTplIn(img, tpl, box, L) {                // returns the pixel centre [x, y] of the match, or null
    var x0 = mapX(L, box[0], "c"), y0 = mapY(L, box[1], "c"), x1 = mapX(L, box[2], "c"), y1 = mapY(L, box[3], "c");
    var pt = null;
    try { pt = images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: TPL_THRESHOLD }); }
    catch (e) { logErr("findImage", e); }
    return pt ? [pt.x + Math.round(tpl.getWidth() / 2), pt.y + Math.round(tpl.getHeight() / 2)] : null;
}
function waitTapTemplate(name, box, fx, fy, what, retry) {   // wait for the template to appear, then tap it
    var d = screenSize(), L = layoutOf(d.W, d.H);
    var tpl = getTemplateFit(name, L);
    if (!tpl) {
        nap(CHANNEL_DELAY_MS);
        tapAt(fx, fy, what + " (no " + name + ".png template - fixed point)", 0, "c", "c");
        return false;
    }
    var end = Date.now() + TPL_WAIT_MS;
    while (Date.now() < end) {
        nap(TPL_POLL_MS);
        var img = null;
        try { img = grabScreen(); } catch (e) {}
        if (!img) continue;
        var p = findTplIn(img, tpl, box, L);
        if (p) {
            press(p[0], p[1], TAP_MS);
            log(what + " detected -> tapped (template " + name + ")");
            // a tap that is ignored (common on tablets) would stall the flow: if the button is STILL there, tap again
            for (var rr = 0; retry && rr < 2; rr++) {
                nap(700);
                var img2 = null;
                try { img2 = grabScreen(); } catch (e) {}
                if (!img2 || !findTplIn(img2, tpl, box, L)) break;
                log(what + " still showing -> tapping again (" + (rr + 1) + ")");
                if (rr === 0) click(p[0], p[1]); else swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
            }
            return true;
        }
    }
    tapAt(fx, fy, what + " (template " + name + " not found - fixed point)", 0, "c", "c");
    return false;
}

// A screen is showing: tap (x,y) with a different tap method per attempt until the screen goes away.
// seenFn() re-checks the screen. Returns true if the screen went away.
function tapUntilGone(what, x, y, seenFn) {
    for (var attempt = 1; attempt <= 6; attempt++) {   // ALWAYS TAP: keep trying, cycling tap methods
        tapAt(x, y, what + " (attempt " + attempt + ")", (attempt - 1) % 3);
        var t0 = Date.now(), gone = 0;
        while (Date.now() - t0 < 3000) {
            nap(300);
            var seen = true;
            try { isMainScreen(true); seen = seenFn(); } catch (e) { logErr("isMainScreen", e); }
            gone = seen ? 0 : gone + 1;
            if (gone >= 2) { log(what + ": screen gone"); return true; }
        }
        log(what + ": screen still showing");
    }
    return false;
}
function tapLogin() {                   // taps the image-detected Login button (fixed point if only the pixel check matched)
    for (var attempt = 1; attempt <= 6; attempt++) {
        var m = (attempt - 1) % 3, p = lastLoginPt;
        if (p) {
            log("tap Login (attempt " + attempt + ") image match px(" + p[0] + "," + p[1] + ") via " + TAP_METHODS[m]);
            if (m === 1) click(p[0], p[1]);
            else if (m === 2) swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
            else press(p[0], p[1], TAP_MS);
        } else {
            tapAt(LOGIN_X, LOGIN_Y, "Login (attempt " + attempt + ")", m);
        }
        var t0 = Date.now(), gone = 0;
        while (Date.now() - t0 < 3000) {
            nap(300);
            var seen = true;
            try { isMainScreen(true); seen = lastLoginSeen; } catch (e) { logErr("isMainScreen", e); }
            gone = seen ? 0 : gone + 1;
            if (gone >= 2) { log("Login: screen gone"); return true; }
        }
        log("Login: screen still showing");
    }
    return false;
}

function tapStart() {                   // taps the image-detected Start button (fixed point if only the pixel check matched)
    for (var attempt = 1; attempt <= 6; attempt++) {
        var m = (attempt - 1) % 3, p = lastStartPt;
        if (p) {
            log("tap Start (attempt " + attempt + ") image match px(" + p[0] + "," + p[1] + ") via " + TAP_METHODS[m]);
            if (m === 1) click(p[0], p[1]);
            else if (m === 2) swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
            else press(p[0], p[1], TAP_MS);
        } else {
            tapAt(START_X, START_Y, "Start (attempt " + attempt + ")", m);
        }
        var t0 = Date.now(), gone = 0;
        while (Date.now() - t0 < 3000) {
            nap(300);
            var seen = true;
            try { isMainScreen(true); seen = lastStartSeen; } catch (e) { logErr("isMainScreen", e); }
            gone = seen ? 0 : gone + 1;
            if (gone >= 2) { log("Start: screen gone"); return true; }
        }
        log("Start: screen still showing");
    }
    return false;
}
// Play ON: keep running until Stop is tapped.
// Launches the game if needed, watches for the Select Server screen, and runs the sequence
// every time it shows up (first launch, after a disconnect, after a restart...).
function petPopupShown(img, W, H) {     // the pet pop-up has a light-grey bar along its top edge
    var L = layoutOf(W, H), xs = [1000, 1150, 1288, 1450, 1600], ok = 0, i, c, r, g, b;
    for (i = 0; i < xs.length; i++) {
        c = img.pixel(mapX(L, xs[i], "c"), mapY(L, 127, "c"));
        r = capR(c); g = capG(c); b = capB(c);
        if (r >= 120 && r <= 200 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14) ok++;
    }
    return ok >= 4;
}
// Template of the pet pop-up's "Use" button. Crop it from a screenshot and save it as
// /sdcard/脚本/templates/use_btn.png (same folder as the captcha templates). If the file is missing,
// the grey-bar check (petPopupShown) + the fixed PET_USE point are used instead.
var PET_WAIT_MS = 5000, PET_POLL_MS = 150;
var PET_USE_REGION = [1300, 920, 1700, 1060];    // search area for the Use button (reference 2576x1177, pop-up is centred)
function findPetUse(img, tpl, L) {               // returns [x, y] pixel centre of the Use button, or null
    var x0 = mapX(L, PET_USE_REGION[0], "c"), y0 = mapY(L, PET_USE_REGION[1], "c");
    var x1 = mapX(L, PET_USE_REGION[2], "c"), y1 = mapY(L, PET_USE_REGION[3], "c");
    var pt = null;
    tpl = getTemplateFit("use_btn", L) || tpl;
    try {
        pt = images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: 0.8 });
    } catch (e) { logErr("pet findImage", e); }
    return pt ? [pt.x + Math.round(tpl.getWidth() / 2), pt.y + Math.round(tpl.getHeight() / 2)] : null;
}
function summonPet() {
    petDone = true;
    var q = QUICK[PET_SLOT];
    quickTap(q.x, q.y, 0, "c", "b");
    log("Pet: tapped quick slot " + q.name + " once");
    var tpl = getTemplate("use_btn");            // cached, never recycled (recycling causes native crashes)
    var end = Date.now() + PET_WAIT_MS;
    while (Date.now() < end) {                   // wait for the pop-up, then tap Use
        nap(PET_POLL_MS);
        var img = null;
        try { img = grabScreen(); } catch (e) {}
        if (!img) continue;
        var W = img.getWidth(), H = img.getHeight(), L = layoutOf(W, H), p = null;
        if (tpl) p = findPetUse(img, tpl, L);                                   // 1) template match on the Use button
        else if (petPopupShown(img, W, H)) p = toPx(PET_USE.x, PET_USE.y, "c", "c");   // 2) fallback: grey bar + fixed point
        if (p) {
            press(p[0], p[1], TAP_MS);
            log("Pet: pop-up -> tapped Use" + (tpl ? " (template)" : ""));
            nap(700);
            return true;
        }
    }
    log("Pet: no pop-up appeared (pet already out?) - skipped" + (tpl ? "" : " [no use_btn.png template]"));
    return false;
}

function buffFrac(img, L, box, kind) {     // share of pixels in the box that look like the buff icon (orange) or its bar (green)
    var x0 = mapX(L, box[0], "l"), y0 = mapY(L, box[1], "t"), x1 = mapX(L, box[2], "l"), y1 = mapY(L, box[3], "t");
    var n = 0, t = 0, x, y, c, r, g, b;
    for (y = y0; y <= y1; y++) {
        for (x = x0; x <= x1; x++) {
            c = img.pixel(x, y); r = capR(c); g = capG(c); b = capB(c); n++;
            if (kind === "g") { if (g > 140 && r < 130 && b < 120 && g - r > 50) t++; }
            else if (kind === "y") { if (r >= 200 && g >= 180 && b <= 110 && r - b > 100) t++; }   // yellow bar
            else if (kind === "r") { if (r >= 190 && g <= 60 && b <= 60) t++; }          // pure red of the expiring bar
            else if (r > 150 && r - b > 90 && g > 40 && g < 190) t++;
        }
    }
    return n ? t / n : 0;
}
function buffActive(img, W, H) {
    var L = layoutOf(W, H);
    if (BUFF_RED_ON && buffFrac(img, L, BUFF_BAR, "r") >= BUFF_RED_MIN) return false;   // red in the bar -> re-buff now
    if (buffFrac(img, L, BUFF_BAR, "y") >= BUFF_YELLOW_MIN) return true;                 // yellow bar -> do NOT cast
    if (!BUFF_GONE_ON && BUFF_RED_ON) return true;                                       // only red triggers
    return buffFrac(img, L, BUFF_BAR, "g") >= BUFF_BAR_MIN;     // no green bar left (icon gone) -> re-buff
}
function checkBuff() {                      // called while attacking; taps S5 when the buff icon has been gone for a few checks
    if (!BUFF_ON || Date.now() - lastBuffCheck < BUFF_CHECK_MS) return;
    lastBuffCheck = Date.now();
    var img = null;
    try { img = grabScreen(); } catch (e) {}
    if (!img) return;
    if (buffActive(img, img.getWidth(), img.getHeight())) { buffMiss = 0; return; }
    buffMiss++;
    if (buffMiss >= BUFF_MISS_NEEDED && Date.now() - lastBuffTap >= BUFF_RETAP_MS) {
        var sk = SKILLS[BUFF_SKILL], sp = toPx(sk.x, sk.y, "r", "b");
        press(sp[0], sp[1], TAP_MS);
        lastBuffTap = Date.now(); buffMiss = 0;
        log("Buff bar red / gone -> tapped " + sk.name);
        nap(600);
    }
}

// ---- Auto target ----
function targetLocked(img, L) {            // true = a target frame is showing, false = none, null = unknown (no target.png)
    var tpl = getTemplateFit("target", L);
    if (!tpl) return null;
    var x0 = mapX(L, TARGET_FRAME_REGION[0], "c"), y0 = mapY(L, TARGET_FRAME_REGION[1], "t");
    var x1 = mapX(L, TARGET_FRAME_REGION[2], "c"), y1 = mapY(L, TARGET_FRAME_REGION[3], "t");
    try { return !!images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: TARGET_THRESHOLD }); }
    catch (e) { logErr("target frame", e); return null; }
}
function findMob(img, L) {                 // nearest mob template match to the character -> [x, y] in capture pixels, or null
    var names = ["mob", "mob2", "mob3"], best = null, bd = 1e18, n, i;
    var x0 = mapX(L, TARGET_PLAY[0], "c"), y0 = mapY(L, TARGET_PLAY[1], "c");
    var x1 = mapX(L, TARGET_PLAY[2], "c"), y1 = mapY(L, TARGET_PLAY[3], "c");
    var cx = mapX(L, TARGET_CHAR[0], "c"), cy = mapY(L, TARGET_CHAR[1], "c");
    for (n = 0; n < names.length; n++) {
        var tpl = getTemplateFit(names[n], L);
        if (!tpl) continue;
        var pts = [], opt = { region: [x0, y0, x1 - x0, y1 - y0], threshold: TARGET_THRESHOLD };
        try {
            var res = images.matchTemplate(img, tpl, { region: opt.region, threshold: opt.threshold, max: 8 });
            if (res && res.matches) for (i = 0; i < res.matches.length; i++) pts.push(res.matches[i].point);
        } catch (e) {
            try { var one = images.findImage(img, tpl, opt); if (one) pts.push(one); } catch (e2) { logErr("find mob", e2); }
        }
        for (i = 0; i < pts.length; i++) {
            var px = pts[i].x + Math.round(tpl.getWidth() / 2);
            var py = pts[i].y + Math.round(tpl.getHeight() / 2) + Math.round(TARGET_TAP_DY * L.ky);
            var d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
            if (d < bd) { bd = d; best = [px, py]; }
        }
    }
    return best;
}
function isMobRed(c) {                     // name-plate / HP-bar red (also catches the brighter glow of the selected mob)
    var r = capR(c), g = capG(c), b = capB(c);
    return r >= 140 && r - g >= 80 && r - b >= 70;
}
function redBlobs(img, W, H, S, sx, sy, minRun, gap, blobGapRows) {   // wide red horizontal runs merged into blobs [xa, xb, ya, yb]
    var x0 = Math.round(W * S[0]), y0 = Math.round(H * S[1]), x1 = Math.round(W * S[2]), y1 = Math.round(H * S[3]);
    var blobs = [], x, y, start, last, k, b, i;
    function addRun(xa, xb, yy) {
        for (k = 0; k < blobs.length; k++) {
            b = blobs[k];
            if (yy - b[3] <= blobGapRows * sy && xa <= b[1] && xb >= b[0]) {
                if (xa < b[0]) b[0] = xa;
                if (xb > b[1]) b[1] = xb;
                b[3] = yy;
                return;
            }
        }
        blobs.push([xa, xb, yy, yy]);
    }
    for (y = y0; y < y1; y += sy) {
        start = -1; last = -1;
        for (x = x0; x < x1; x += sx) {
            if (!isMobRed(img.pixel(x, y))) continue;
            if (start < 0) start = x;
            else if (x - last > gap) {
                if (last - start >= minRun) addRun(start, last, y);
                start = x;
            }
            last = x;
        }
        if (start >= 0 && last - start >= minRun) addRun(start, last, y);
    }
    return blobs;
}
function isDarkPx(c) { return Math.max(capR(c), capG(c), capB(c)) <= TARGET_BOX_DARK; }
function isRedLoose(c) { var r = capR(c), g = capG(c), b = capB(c); return r >= 90 && r - g >= 60 && r - b >= 55; }
function darkBoxes(img, W, H, S) {          // black plate backgrounds that contain red text -> [[xa, xb, ya, yb], ...]
    var x0 = Math.round(W * S[0]), y0 = Math.round(H * S[1]), x1 = Math.round(W * S[2]), y1 = Math.round(H * S[3]);
    var sx = 4, sy = 3, minRun = Math.round(W * TARGET_BOX_MINW), gap = Math.max(8, Math.round(W * 0.008));
    var blobs = [], x, y, start, last, k, b, c, out = [], i;
    function addRun(xa, xb, yy) {
        for (k = 0; k < blobs.length; k++) {
            b = blobs[k];
            if (yy - b[3] <= 4 * sy && xa <= b[1] && xb >= b[0]) {
                if (xa < b[0]) b[0] = xa;
                if (xb > b[1]) b[1] = xb;
                b[3] = yy;
                return;
            }
        }
        blobs.push([xa, xb, yy, yy]);
    }
    for (y = y0; y < y1; y += sy) {             // the red letters sit inside the black box, so "black or red" runs keep the box in one piece
        start = -1; last = -1;
        for (x = x0; x < x1; x += sx) {
            c = img.pixel(x, y);
            if (!(isDarkPx(c) || isRedLoose(c))) continue;
            if (start < 0) start = x;
            else if (x - last > gap) {
                if (last - start >= minRun) addRun(start, last, y);
                start = x;
            }
            last = x;
        }
        if (start >= 0 && last - start >= minRun) addRun(start, last, y);
    }
    for (i = 0; i < blobs.length; i++) {
        b = blobs[i];
        var w = b[1] - b[0], h = b[3] - b[2] + sy;
        if (w > W * TARGET_BOX_MAXW || h < H * TARGET_BOX_MINH || h > H * TARGET_BOX_MAXH) continue;
        var nd = 0, nr = 0, tot = 0, xx, yy;
        for (yy = b[2]; yy <= b[3]; yy += 2) for (xx = b[0]; xx <= b[1]; xx += 2) {
            c = img.pixel(xx, yy); tot++;
            if (isDarkPx(c)) nd++; else if (isRedLoose(c)) nr++;
        }
        if (tot && nd / tot >= TARGET_BOX_MINDARK && nr >= TARGET_BOX_MINRED) out.push(b);
    }
    return out;
}
function barLocked(img, W, H) {            // red HP bar of the target frame (top centre) showing = a mob is selected
    var bl = redBlobs(img, W, H, TARGET_LOCK_SCAN, 3, 2, Math.round(W * 0.08), Math.max(8, Math.round(W * 0.012)), 2);
    return bl.length > 0;
}
function findNamePlate(img, W, H, avoid) {        // nearest red name plate to the character -> [x, y] tap point (on the mob), or null; avoid = [x, y] of the last tap (a different plate is preferred)
    var bl = TARGET_BOX_ON ? darkBoxes(img, W, H, TARGET_NAME_SCAN) : redBlobs(img, W, H, TARGET_NAME_SCAN, 4, 3, Math.round(W * TARGET_NAME_MINW), Math.max(8, Math.round(W * 0.012)), 5);
    var cx = W * TARGET_NAME_CHAR[0], cy = H * TARGET_NAME_CHAR[1], best = null, bd = 1e18, alt = null, ad = 1e18, i, d, px, py, ar = W * 0.05;
    for (i = 0; i < bl.length; i++) {
        if (bl[i][3] - bl[i][2] > H * 0.08) continue;            // too tall to be a name plate (a red costume, effect...)
        px = Math.round((bl[i][0] + bl[i][1]) / 2);
        py = Math.min(H - 1, Math.round(bl[i][3] + H * TARGET_NAME_DY));
        d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
        if (avoid && Math.abs(px - avoid[0]) < ar && Math.abs(py - avoid[1]) < ar) { if (d < ad) { ad = d; alt = [px, py]; } continue; }
        if (d < bd) { bd = d; best = [px, py]; }
    }
    return best || alt;                                          // only the avoided plate on screen -> tap it anyway
}
function autoTarget() {                    // called while attacking; selects a mob when none is selected
    if (!targetOn) return false;
    var now = Date.now();
    if (now - tgtCheckAt < (RETARGET_ON ? Math.min(TARGET_CHECK_MS, 250) : TARGET_CHECK_MS)) return false;
    tgtCheckAt = now;
    var img = null;
    try { img = grabScreen(); } catch (e) {}
    if (!img) return false;
    var L = layoutOf(img.getWidth(), img.getHeight());
    var W = img.getWidth(), H = img.getHeight();
    var locked = targetLocked(img, L);                         // target.png (if you made one) ...
    if (locked === null && TARGET_NAME_ON) locked = barLocked(img, W, H);   // ... else the red HP bar at the top centre
    mvLocked = locked; mvStateAt = now;                        // for autoMove()
    var retarget = false;
    if (locked === true) {                                     // a mob is already selected
        if (!RETARGET_ON || now - tgtTapAt < RETARGET_MS) return false;
        retarget = true;                                       // ... but tap a mob again every RETARGET_MS
    }
    if (now - tgtTapAt < (retarget ? RETARGET_MS : TARGET_TAP_GAP_MS)) return false;
    var mob = retarget ? null : findMob(img, L), tx, ty, how;
    if (mob) { tx = mob[0]; ty = mob[1]; how = "mob"; }
    else if (TARGET_NAME_ON && (mob = findNamePlate(img, W, H, retarget ? tgtLastPt : null))) { tx = mob[0]; ty = mob[1]; how = retarget ? "retarget" : "name plate"; }
    else if (retarget && (mob = findMob(img, L))) { tx = mob[0]; ty = mob[1]; how = "retarget"; }
    else {
        if (!retarget) { mvDir = null; mvFar = false; }          // no plate on screen
        if (!TARGET_SWEEP_ON || retarget) return false;        // nothing on screen to target (no blind sweeping while a mob is already selected)
        if (now - tgtTapAt < (locked === false ? TARGET_SWEEP_MS : TARGET_RETRY_MS)) return false;
        var rp = TARGET_RING[tgtRing % TARGET_RING.length]; tgtRing++;
        tx = mapX(L, rp[0], "c"); ty = mapY(L, rp[1], "c"); how = "sweep";
    }
    press(tx, ty, TAP_MS);
    tgtTapAt = Date.now(); tgtTaps++; tgtLastPt = [tx, ty];
    if (how === "sweep") { mvDir = null; mvFar = false; }
    else {                                                     // remember where the mob is relative to the character (for autoMove)
        var mdx = tx - W * TARGET_NAME_CHAR[0], mdy = ty - H * TARGET_NAME_CHAR[1], mdl = Math.sqrt(mdx * mdx + mdy * mdy);
        mvDir = mdl > 1 ? [mdx / mdl, mdy / mdl] : null; mvDirAt = Date.now();
        mvFar = mdl > W * MOVE_FAR_FRAC;
    }
    if ((how !== "sweep" && how !== "retarget") || Date.now() - tgtLogAt > 15000) {
        tgtLogAt = Date.now();
        log("Auto target: tapped (" + tx + "," + ty + ") " + how + (locked === false ? " [no target selected]" : "") + " #" + tgtTaps);
    }
    nap(250);
    return true;
}

function autoMove() {                      // called while attacking; walks with the joystick when the character is not attacking
    if (!MOVE_ON || !targetOn) return false;
    var now = Date.now();
    if (now - mvStateAt > 2500) { mvIdleSince = 0; return false; }          // no fresh target info
    var idle = mvLocked === false || (MOVE_FAR_ON && mvLocked === true && mvFar);         // no target, or target out of reach
    if (!idle) { mvIdleSince = 0; return false; }                          // attacking -> never move
    if (!mvIdleSince) { mvIdleSince = now; return false; }
    if (now - mvIdleSince < MOVE_IDLE_MS || now - mvLastAt < MOVE_GAP_MS) return false;
    var d = (mvDir && now - mvDirAt <= MOVE_DIR_FRESH_MS) ? mvDir : null, how = "toward mob", holdMs = MOVE_MS, rad = MOVE_RADIUS;   // stale / no plate = no monster around
    if (MOVE_RANDOM_ON && (d || !MOVE_RANDOM_NEEDS_MOB)) {                   // random direction / length / push
        var ang = Math.random() * Math.PI * 2;
        d = [Math.cos(ang), Math.sin(ang)];
        holdMs = Math.round(MOVE_MS_MIN + Math.random() * (MOVE_MS_MAX - MOVE_MS_MIN));
        rad = MOVE_RADIUS * (MOVE_RADIUS_MIN + Math.random() * (1 - MOVE_RADIUS_MIN));
        how = "random " + Math.round(ang * 180 / Math.PI) + "deg " + holdMs + "ms";
    }
    if (!d) {
        if (!MOVE_BLIND_ON) { mvIdleSince = now; return false; }                    // no monster around -> stay still
        d = MOVE_BLIND_DIRS[mvBlind % MOVE_BLIND_DIRS.length]; mvBlind++; how = "no plate, direction " + mvBlind;
    }
    var a = toPx(MOVE_JOY[0], MOVE_JOY[1], "l", "b");
    var b = toPx(MOVE_JOY[0] + d[0] * rad, MOVE_JOY[1] + d[1] * rad, "l", "b");
    try { gesture(holdMs, [a[0], a[1]], [b[0], b[1]], [b[0], b[1]]); }    // drag out, then hold
    catch (e) { try { swipe(a[0], a[1], b[0], b[1], holdMs); } catch (e2) { logErr("auto move", e2); return false; } }
    mvLastAt = Date.now(); mvIdleSince = mvLastAt; mvStateAt = 0;           // wait for a fresh look before deciding again
    log("Auto move: joystick swipe (" + how + ")");
    nap(150);
    return true;
}

function runLoop() {
    if (!authed) { toast("Log in first"); return; }
    if (!subOk()) { toast("No active subscription"); return; }
    if (busy) { log("Play ignored (already running)"); return; }
    busy = true;
    stopFlag = false;
    petDone = false;
    buffMiss = 0; lastBuffCheck = 0; lastBuffTap = 0;
    tgtCheckAt = 0; tgtTapAt = 0; tgtRing = 0; tgtTaps = 0;
    setPlayState(true);
    try {
        log("=== Play ON === (tap Stop to end)");
        log("device " + device.width + "x" + device.height);
        ensureGame();

        if (!captureOk) {            // no screen capture: can't watch, so do a single timed run
            log("no screen capture -> single run with fixed delay");
            nap(SELECT_DELAY_MS);
            runSequence();
            return;
        }

        var streak = 0, loginStreak = 0, charStreak = 0, startStreak = 0, loginFails = 0, lastStatus = 0, lastLaunch = Date.now(), lootActive = false, lootTaps = 0, lootPauseUntil = 0, lastNoSkillLog = 0, hudStreak = 0, inGame = false, skillPtr = -1, atkTaps = 0, reviveActive = false, reviveTaps = 0, discActive = false, discTaps = 0, lastQuick = 0, quickUses = 0, returnPending = false, returnAt = 0, returnExpire = 0, lastCaptcha = 0;
        // Login flow (Select Server -> channel -> Connect -> Login -> Character -> Start) runs ONCE per session.
        // It is armed at Play, then disarmed when the character is in game. It is re-armed only if the game is
        // force closed or "Disconnected from Server!" shows up.
        var flowArmed = true, lastPkgCheck = 0, pkgMiss = 0;
        var armFlow = function (why) {
            flowArmed = true; inGame = false; loginFails = 0;
            streak = 0; loginStreak = 0; charStreak = 0; startStreak = 0;
            lastLaunch = Date.now();
            monState = "Login flow (" + why + ")";
            log("Login flow ARMED (" + why + ")");
        };
        log("watching for the Select Server screen...");
        while (true) {
            if (!subOk()) { toast("Subscription ended"); log("subscription ended - stopping"); throw "STOPPED"; }
            var seen = false;
            try { seen = isMainScreen(true); } catch (e) { logErr("isMainScreen", e); }
            streak = seen ? streak + 1 : 0;
            loginStreak = lastLoginSeen ? loginStreak + 1 : 0;
            charStreak = lastCharSeen ? charStreak + 1 : 0;
            startStreak = lastStartSeen ? startStreak + 1 : 0;
            hudStreak = lastHudSeen ? hudStreak + 1 : 0;

            // Character is in game -> login flow is finished, stop touching the login screens.
            if (flowArmed && hudStreak >= STABLE_NEEDED) {
                flowArmed = false;
                pkgMiss = 0;
                monState = "In game";
                log("In game -> login flow DONE (will run again only after force close / disconnect)");
            }
            // Force close: the game is no longer the foreground app for a few checks in a row -> relaunch + re-arm.
            if (!flowArmed && Date.now() - lastPkgCheck >= 2000) {
                lastPkgCheck = Date.now();
                var curPkg = "";
                try { curPkg = String(currentPackage()); } catch (pe) {}
                if (!APP_PKG) { try { APP_PKG = getPackageName(APP_NAME); } catch (pe2) {} }
                pkgMiss = (APP_PKG && curPkg && curPkg !== APP_PKG) ? pkgMiss + 1 : 0;
                if (pkgMiss >= 3) {
                    pkgMiss = 0;
                    log("Game closed (foreground: " + curPkg + ") -> relaunching");
                    ensureGame();
                    armFlow("game force closed");
                }
            }

            // Captcha: the popup is drawn OVER the game, so the HUD bars are still visible -> never gate on the HUD.
            // This runs before the loot/revive/login branches (they 'continue' every loop and would starve it).
            if (captchaOn && Date.now() - lastCaptcha >= 3000) {
                lastCaptcha = Date.now();
                var cimg = null;
                try { cimg = grabScreen(); } catch (ce0) { logErr("captcha capture", ce0); }
                if (cimg) {
                    try { solveCaptchaOnScreen(cimg); } catch (ce) { if (String(ce).indexOf("STOPPED") >= 0) throw ce; logErr("captcha", ce); }
                    // no cimg.recycle(): managed by AutoX
                }
            }

            if (flowArmed && streak >= STABLE_NEEDED) {
                log("Select Server screen DETECTED & stable (" + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite + ", capture " + lastDims + ")");
                streak = 0;
                loginFails = 0;
                runSequence();           // whether it worked or not, keep looping until Stop
                nap(COOLDOWN_MS);
                lastLaunch = Date.now();
                continue;
            }

            if (TAP_DISCONNECT && lastDiscSeen) {         // "Disconnected from Server!" -> always tap OK
                if (!discActive) {
                    discActive = true;
                    discTaps = 0;
                    armFlow("disconnected");
                    monState = "Disconnected"; log("Disconnected dialog DETECTED (pattern " + discHit + "/" + (DISC_PTS.length / 2) + ") -> tapping OK");
                }
                quickTap(OK_X, OK_Y, discTaps % 3);
                discTaps++;
                nap(DISC_COOLDOWN_MS);
                continue;
            } else if (discActive) {
                discActive = false;
                log("Disconnected dialog gone after " + discTaps + " taps");
            }

            if (TAP_REVIVE && lastReviveSeen) {          // "Do you wish to be revived?" -> always tap Revive
                if (!reviveActive) {
                    reviveActive = true;
                    reviveTaps = 0;
                    monState = "Dead - reviving"; log("Revive dialog DETECTED (body " + reviveBody + ", panel " + revivePanel + ", text " + reviveText + ", label " + reviveLabel + ") -> tapping Revive");
                }
                quickTap(REVIVE_X, REVIVE_Y, reviveTaps % 3);
                reviveTaps++;
                nap(REVIVE_COOLDOWN_MS);
                continue;
            } else if (reviveActive) {
                reviveActive = false;
                monState = "Revived"; log("Revive dialog gone after " + reviveTaps + " taps");
                if (TAP_RETURN) {
                    returnPending = true;
                    returnAt = Date.now() + RETURN_DELAY_MS;
                    returnExpire = Date.now() + RETURN_EXPIRE_MS;
                    log("Revived -> will tap quick slot " + QUICK[RETURN_SLOT].name + " in " + (RETURN_DELAY_MS / 1000) + "s to go back");
                }
            }

            if (TAP_LOOT && lastLootSeen && Date.now() >= lootPauseUntil) {          // hand button visible -> tap it (a few times)
                if (!lootActive) {
                    lootActive = true;
                    lootTaps = 0;
                    log("Loot button DETECTED (dark " + lootDark + ", ring " + lootRing + ", hand " + lootWhite + ") -> tapping");
                }
                lootTaps++;
                var lp = toPx(LOOT_X, LOOT_Y, "c", "b");   // loot button: centred horizontally, glued to the bottom
                press(lp[0], lp[1], TAP_MS);
                if (lootTaps >= LOOT_MAX_TAPS) {
                    // The hand button stays on screen for items it cannot pick up (Bread, potions, ...). Tapping it forever
                    // starved the attack branch below (it never ran), so give up for a while and go back to attacking.
                    lootActive = false;
                    lootPauseUntil = Date.now() + LOOT_PAUSE_MS;
                    log("Loot button still showing after " + lootTaps + " taps -> pausing loot " + (LOOT_PAUSE_MS / 1000) + "s so auto attack keeps tapping");
                    lootTaps = 0;
                }
                nap(LOOT_COOLDOWN_MS);
                continue;
            } else if (lootActive && !lastLootSeen) {
                lootActive = false;
                log("Loot button gone after " + lootTaps + " taps");
            }

            if (flowArmed && TAP_LOGIN && loginStreak >= STABLE_NEEDED) {
                log("Login screen DETECTED & stable (" + SCREENS.login.hit + "/" + SCREENS.login.btn.length + " button, label " + SCREENS.login.white + (lastLoginPt ? ", image match" : "") + ")");
                loginStreak = 0;
                if (tapLogin()) loginFails = 0; else loginFails++;
                nap(LOGIN_COOLDOWN_MS);
                continue;
            }

            if (flowArmed && TAP_START && startStreak >= 1) {
                log("Profile screen DETECTED & stable (" + SCREENS.start.hit + "/" + SCREENS.start.btn.length + " button, label " + SCREENS.start.white + (lastStartPt ? ", image match" : "") + ")");
                startStreak = 0;
                loginFails = 0;
                tapStart();
                nap(START_COOLDOWN_MS);
                continue;
            }

            if (flowArmed && TAP_CHARACTER && charStreak >= STABLE_NEEDED) {
                log("Character screen DETECTED & stable (" + SCREENS.character.hit + "/" + SCREENS.character.btn.length + " button, label " + SCREENS.character.white + ")");
                charStreak = 0;
                loginFails = 0;
                tapUntilGone("Character", CHAR_X, CHAR_Y, function () { return lastCharSeen; });
                nap(CHAR_COOLDOWN_MS);
                continue;
            }

            if (returnPending) {                              // revived: use the "go back" slot before attacking again
                var nowR = Date.now();
                if (nowR > returnExpire) {
                    returnPending = false;
                    log("Return slot: gave up (no tap possible within " + (RETURN_EXPIRE_MS / 1000) + "s)");
                } else {
                    var hudOkR = hudStreak >= STABLE_NEEDED;
                    // tap once the delay passed AND the game HUD is back; if the HUD is never detected, tap anyway
                    if (nowR >= returnAt && (hudOkR || nowR >= returnAt + RETURN_NOHUD_MS)) {
                        if (!hudOkR) log("Return slot: HUD not detected -> tapping anyway");
                        nap(RETURN_SETTLE_MS);
                        for (var rt = 0; rt < RETURN_TAPS; rt++) {
                            quickTap(QUICK[RETURN_SLOT].x, QUICK[RETURN_SLOT].y, rt % 3, "c", "b");
                            if (rt < RETURN_TAPS - 1) nap(1000);
                        }
                        monState = "In game";
                        log("Tapped quick slot " + QUICK[RETURN_SLOT].name + " after revive (go back to where you died)");
                        returnPending = false;
                        lastLaunch = Date.now();
                        lastQuick = Date.now();           // don't start the normal quick round right on top of it
                        nap(1500);
                    } else {
                        nap(300);
                    }
                    continue;
                }
            }

            if (quickOn && hudStreak >= STABLE_NEEDED && Date.now() - lastQuick >= QUICK_GAPS[quickGapIdx]) {
                var qn = 0, qnames = [];                       // bottom bar items: tap each selected slot once
                for (var qi = 0; qi < QUICK.length; qi++) {
                    if (!quickEnabled(qi)) continue;
                    if (PET_ON && qi === PET_SLOT) continue;   // pet slot is used once, not every round
                    quickTap(QUICK[qi].x, QUICK[qi].y, 0, "c", "b");   // quick bar: centred, glued to the bottom
                    qnames.push(QUICK[qi].name);
                    qn++;
                    nap(300);
                }
                lastQuick = Date.now();
                if (qn > 0) {
                    quickUses++;
                    lastLaunch = Date.now();
                    if (quickUses === 1 || quickUses % 10 === 0) log("quick slots " + qnames.join(",") + " tapped (round " + quickUses + ")");
                    continue;
                }
            }

            if (atkOn && hudStreak >= STABLE_NEEDED) {           // in the game -> tap the chosen skills
                if (!inGame) {
                    inGame = true;
                    atkTaps = 0;
                    log("In game (HUD " + hudBars + "/4) -> auto attack");
                    if (PET_ON && !petDone) summonPet();
                }
                checkBuff();
                autoTarget();
                if (autoMove()) continue;
                var n = SKILLS.length, tries = 0;
                while (tries < n) {
                    skillPtr = (skillPtr + 1) % n;
                    if (skillEnabled(skillPtr) && !(BUFF_ON && skillPtr === BUFF_SKILL)) break;
                    tries++;
                }
                if (tries < n) {
                    var sk = SKILLS[skillPtr], sp = toPx(sk.x, sk.y, "r", "b");   // skill cluster: glued to the bottom-right corner
                    press(sp[0], sp[1], TAP_MS);
                    atkTaps++;
                    lastLaunch = Date.now();
                    if (Date.now() - lastStatus > 20000) {
                        lastStatus = Date.now();
                        log("attacking... " + atkTaps + " taps (last " + sk.name + ")");
                    }
                    nap(ATK_GAPS[gapIdx]);
                    continue;
                } else if (Date.now() - lastNoSkillLog > 20000) {
                    lastNoSkillLog = Date.now();
                    log("Attack is ON but no skill is selected to tap (S5 is reserved for the buff) - tick Atk / S1-S4 in Skills");
                }
            } else if (inGame && hudStreak === 0) {
                inGame = false;
                log("HUD gone after " + atkTaps + " attack taps");
            }

            var now = Date.now();
            if (now - lastStatus > 20000) {
                lastStatus = now;
                log("watching... start " + SCREENS.start.hit + "/" + SCREENS.start.btn.length + " label " + SCREENS.start.white + " | hud " + hudBars + "/4 | loot " + lootDark + "/" + lootRing + "/" + lootWhite + " | (" + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite + ", capture " + lastDims + ")");
            }
            if (now - lastLaunch > 15000) {   // game left the foreground? bring it back
                lastLaunch = now;
                if (ensureGame()) armFlow("game relaunched");
            }
            nap(500);
        }
    } catch (e) {
        if (String(e).indexOf("STOPPED") >= 0) { log("stopped by user"); }
        else { logErr("runLoop", e); toast("Error - see log (Log button)"); }
    } finally {
        busy = false;
        setPlayState(false);
    }
}

// Turn server auto-select on/off
w.pick.click(function () {
    pickOn = !pickOn;
    store.put("pickOn", pickOn);
    log("Pick -> " + (pickOn ? "ON" : "OFF"));
    refreshServerLabel();
});

// Tap "Srv" -> a pop-up with the list of servers and a check box for each one; tick a box to set the server.
var svPop = null;
var SV_ROWS = 12;                                    // the pop-up has room for 12 servers (rows beyond SERVERS.length are hidden)
function closeServerPopup() {
    if (svPop) { try { svPop.close(); } catch (e) {} svPop = null; }
}
function openServerPopup() {
    if (svPop) { closeServerPopup(); return; }       // tapping Srv again closes it
    svPop = floaty.window(
        <vertical bg="#F0FFFFFF" padding="8" w="210" h="auto">
            <text text="Select server" textColor="#222222" textSize="14sp" textStyle="bold" gravity="center" h="30"/>
            <scroll w="*" h="250">
                <vertical w="*" h="auto">
                    <checkbox id="sv0" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv1" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv2" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv3" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv4" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv5" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv6" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv7" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv8" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv9" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv10" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                    <checkbox id="sv11" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
                </vertical>
            </scroll>
            <button id="svclose" text="Close" w="*" h="38" textSize="12sp" margin="2"/>
        </vertical>
    );
    var pop = svPop, rows = [], i;
    for (i = 0; i < SV_ROWS; i++) rows.push(pop["sv" + i]);
    function showChecks() {
        for (var j = 0; j < SV_ROWS; j++) if (j < SERVERS.length) rows[j].setChecked(j === serverIdx);
    }
    for (i = 0; i < SV_ROWS; i++) {
        if (i >= SERVERS.length) { rows[i].setVisibility(android.view.View.GONE); continue; }
        rows[i].setText(SERVERS[i].name);
        (function (k) {
            rows[k].click(function () {              // one server at a time: ticking a box unticks the others
                serverIdx = k;
                store.put("server", serverIdx);
                store.put("serverName", SERVERS[serverIdx].name);
                log("Server -> " + SERVERS[serverIdx].name);
                showChecks();
                refreshServerLabel();
                setTimeout(function () { ui.run(function () { if (svPop === pop) closeServerPopup(); }); }, 300);
            });
        })(i);
    }
    showChecks();
    pop.svclose.click(function () { closeServerPopup(); });
    try {                                            // centre the pop-up on the screen
        var d = context.getResources().getDisplayMetrics().density;
        pop.setPosition(Math.max(0, Math.round((device.width - 210 * d) / 2)), Math.max(10, Math.round((device.height - 360 * d) / 2)));
    } catch (e) { logErr("server popup position", e); }
}
w.server.click(function () { openServerPopup(); });

// Tap "Channel" -> a pop-up with a check box for each channel (0-3); tick one to set the channel used at login.
var chPop = null;
var CH_ROWS = 4;                                     // pop-up rows; only CHANNEL_YS.length are shown
function closeChannelPopup() {
    if (chPop) { try { chPop.close(); } catch (e) {} chPop = null; }
}
function openChannelPopup() {
    if (chPop) { closeChannelPopup(); return; }      // tapping Channel again closes it
    chPop = floaty.window(
        <vertical bg="#F0FFFFFF" padding="8" w="210" h="auto">
            <text text="Select channel" textColor="#222222" textSize="14sp" textStyle="bold" gravity="center" h="30"/>
            <checkbox id="chk0" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
            <checkbox id="chk1" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
            <checkbox id="chk2" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
            <checkbox id="chk3" text="" textColor="#222222" textSize="14sp" w="*" h="40" padding="4"/>
            <button id="chclose" text="Close" w="*" h="38" textSize="12sp" margin="2"/>
        </vertical>
    );
    var pop = chPop, rows = [], i;
    for (i = 0; i < CH_ROWS; i++) rows.push(pop["chk" + i]);
    function showChecks() {
        for (var j = 0; j < CH_ROWS; j++) if (j < CHANNEL_YS.length) rows[j].setChecked(j === CHANNEL_IDX);
    }
    for (i = 0; i < CH_ROWS; i++) {
        if (i >= CHANNEL_YS.length) { rows[i].setVisibility(android.view.View.GONE); continue; }
        rows[i].setText(i + " Channel");
        (function (k) {
            rows[k].click(function () {              // one channel at a time: ticking a box unticks the others
                CHANNEL_IDX = k;
                store.put("chIdx", CHANNEL_IDX);
                log("Channel -> " + CHANNEL_IDX);
                showChecks();
                refreshChannelLabel();
                setTimeout(function () { ui.run(function () { if (chPop === pop) closeChannelPopup(); }); }, 300);
            });
        })(i);
    }
    showChecks();
    pop.chclose.click(function () { closeChannelPopup(); });
    try {                                            // centre the pop-up on the screen
        var d = context.getResources().getDisplayMetrics().density;
        pop.setPosition(Math.max(0, Math.round((device.width - 210 * d) / 2)), Math.max(10, Math.round((device.height - 270 * d) / 2)));
    } catch (e) { logErr("channel popup position", e); }
}
w.channel.click(function () { openChannelPopup(); });

// Play button toggles: tap to start (keeps running), tap again (shows "Stop") to end
w.play.click(function () {
    if (busy) {
        stopFlag = true;
        log("Stop requested");
        return;
    }
    if (!authed) { toast("Log in first"); return; }
    if (!subOk()) { toast("No active subscription"); return; }
    threads.start(runLoop);
});

// ================= Monitor (users upload status + log; admins view them) =================
function monToken() {                    // cached Firebase token (45 min) so a heartbeat is one request, not three
    var now = Date.now();
    if (monTok && now < monTok.exp) return monTok;
    var t = getIdToken();
    if (t) monTok = { token: t.token, uid: t.uid, exp: now + 45 * 60 * 1000 };
    return monTok;
}
function pushMonitor() {                 // every signed-in copy: status + last log lines -> monitor/{uid}
    if (!authed || monBusy) return;
    monBusy = true;
    try {
        var t = monToken();
        if (!t) return;
        var tail = LOG_LINES.slice(-MON_LOG_LINES).join("\n").replace(/KLX-[A-Za-z0-9-]+/g, "KLX-****");
        if (tail.length > 6000) tail = tail.slice(-6000);
        var base = fsBase();
        var commit = { writes: [ {
            update: { name: base + "/monitor/" + t.uid, fields: {
                username: { stringValue: String(currentUser) },
                lastSeen: { integerValue: String(Date.now()) },
                state:    { stringValue: String(monState) },
                running:  { booleanValue: !!busy },
                version:  { integerValue: String(APP_VERSION) },
                subUntil: { integerValue: String(subUntil) },
                logTail:  { stringValue: tail }
            } },
            updateMask: { fieldPaths: ["username", "lastSeen", "state", "running", "version", "subUntil", "logTail"] }
        } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 401) monTok = null;
        if (c.status === 200) monWarned = false;
        else if (!monWarned) {
            monWarned = true;
            log("monitor upload failed: HTTP " + c.status + (c.status === 403 ? " (add the monitor rules to firestore.rules)" : ""));
        }
    } catch (e) { logErr("pushMonitor", e); }
    finally { monBusy = false; }
}
function monAgo(ms) {
    var s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
}
function monMsg(text) { ui.run(function () { w.monMsg.setText(text || ""); }); }
function monShowLog(u) {                 // fill the log view for one user (keeps it pinned to the newest line)
    ui.run(function () {
        w.monTitle.setText(u.name + (u.online ? "  (online)" : "  (offline " + monAgo(u.lastSeen) + ")"));
        w.monlogtext.setText(u.log ? u.log : "(no log uploaded yet)");
        w.monlogscroll.post(function () { w.monlogscroll.fullScroll(130); });
    });
}
function monRender(list) {
    ui.run(function () {
        try {
            var V = android.view.View;
            if (monView) { var cur = monDocs[monView]; if (cur) monShowLog(cur); return; }
            var dens = context.getResources().getDisplayMetrics().density;
            function dp(n) { return Math.round(n * dens); }
            w.monlist.removeAllViews();
            if (!list.length) {
                var none = new android.widget.TextView(context);
                none.setText("No users have reported yet.");
                none.setTextColor(android.graphics.Color.parseColor("#9e9e9e"));
                none.setTextSize(11);
                none.setPadding(dp(6), dp(8), dp(6), dp(8));
                w.monlist.addView(none);
            }
            list.forEach(function (u) {
                var tv = new android.widget.TextView(context);
                tv.setText((u.online ? "● " : "○ ") + u.name + "\n" + u.state + " · v" + u.version + " · " + monAgo(u.lastSeen));
                tv.setTextColor(android.graphics.Color.parseColor(u.online ? "#a5d6a7" : "#9e9e9e"));
                tv.setTextSize(11);
                tv.setPadding(dp(8), dp(7), dp(8), dp(7));
                tv.setBackgroundColor(android.graphics.Color.parseColor("#33FFFFFF"));
                var lp = new android.widget.LinearLayout.LayoutParams(-1, -2);
                lp.setMargins(0, 0, 0, dp(3));
                tv.setOnClickListener(new android.view.View.OnClickListener({
                    onClick: function () {
                        monView = u.id;
                        w.monscroll.setVisibility(V.GONE);
                        w.monlogscroll.setVisibility(V.VISIBLE);
                        w.monBack.setVisibility(V.VISIBLE);
                        w.monKick.setVisibility(V.VISIBLE);
                        monShowLog(u);
                    }
                }));
                w.monlist.addView(tv, lp);
            });
        } catch (e) { logErr("monRender", e); }
    });
}
function monFetch() {                    // admin: read every monitor/{uid}
    if (monFetching || !authed || !isAdmin()) return;
    monFetching = true;
    try {
        var t = monToken();
        if (!t) { monMsg("Not signed in - log in again."); return; }
        var r = fsReq("GET", fsUrl("monitor") + "?pageSize=200", t.token);
        if (r.status === 401) monTok = null;
        if (r.status !== 200) {
            monMsg(r.status === 403 ? "Refused - add the monitor rules for admins to firestore.rules." : "Failed (HTTP " + r.status + ").");
            return;
        }
        monMsg("");
        var docs = (r.json && r.json.documents) || [], list = [], now = Date.now();
        monDocs = {};
        for (var i = 0; i < docs.length; i++) {
            var f = docs[i].fields || {}, id = String(docs[i].name).split("/").pop();
            var u = {
                id: id,
                name: f.username ? String(f.username.stringValue) : id,
                lastSeen: fsInt(f.lastSeen),
                state: f.state ? String(f.state.stringValue) : "?",
                version: fsInt(f.version),
                log: f.logTail ? String(f.logTail.stringValue) : ""
            };
            u.online = now - u.lastSeen < MON_ONLINE_MS;
            monDocs[id] = u;
            list.push(u);
        }
        list.sort(function (a, b) { return (b.online - a.online) || (b.lastSeen - a.lastSeen); });
        monRender(list);
    } catch (e) { logErr("monFetch", e); monMsg("Error - see log"); }
    finally { monFetching = false; }
}
function monBackToList() {
    monView = "";
    ui.run(function () {
        var V = android.view.View;
        w.monlogscroll.setVisibility(V.GONE);
        w.monBack.setVisibility(V.GONE);
        w.monKick.setVisibility(V.GONE);
        w.monKick.setText("Kick");
        monKickArm = 0;
        w.monscroll.setVisibility(V.VISIBLE);
        w.monTitle.setText("Users");
    });
    threads.start(monFetch);
}
var usersShown = false, usersTab = "mon";      // one admin button: tabs Monitor | Devices
function setUsersView() {
    monShown = usersShown && usersTab === "mon";
    devShown = usersShown && usersTab === "dev";
    ui.run(function () {
        w.monBtn.setText(usersShown ? "Users ▴" : "Users ▾");
        w.tabMon.setAlpha(usersTab === "mon" ? 1 : 0.5);
        w.tabDev.setAlpha(usersTab === "dev" ? 1 : 0.5);
    });
    applyPanels();
    if (monShown) { monView = ""; monBackToList(); }
    if (devShown) { devMsg("Loading..."); threads.start(devFetch); }
}
w.monBtn.click(function () { inputFocus(false); usersShown = !usersShown; setUsersView(); });
w.tabMon.click(function () { inputFocus(false); usersTab = "mon"; setUsersView(); });
w.tabDev.click(function () { inputFocus(false); usersTab = "dev"; setUsersView(); });
w.monBack.click(monBackToList);
w.monRefresh.click(function () { monMsg("Refreshing..."); threads.start(monFetch); });
w.monlogtext.on("long_click", function () {
    var u = monDocs[monView];
    if (u) { setClip(u.name + "\n" + u.log); toast("Log copied"); }
    return true;
});
setInterval(function () { if (authed) threads.start(pushMonitor); }, MON_PUSH_MS);
setInterval(function () { if (monShown && authed && isAdmin() && !minimized) threads.start(monFetch); }, MON_REFRESH_MS);

// ---- Devices panel (admin): see which phone each user is locked to and let them use a new one ----
// Tap a user, then tap again within 4 s = "Reset": removes users/{uid}.deviceId, so the next login of that user binds
// whatever phone they log in on. Needs the admin read/update rule for users/{uid} in firestore.rules.
var devShown = false, devBusy = false, devDocs = {}, devArm = "", devArmAt = 0, devSelId = "";
function devMsg(text) { ui.run(function () { w.devMsg.setText(text || ""); }); }
function devRender(list) {
    ui.run(function () {
        try {
            var dens = context.getResources().getDisplayMetrics().density;
            function dp(n) { return Math.round(n * dens); }
            w.devlist.removeAllViews();
            if (!list.length) {
                var none = new android.widget.TextView(context);
                none.setText("No users found.");
                none.setTextColor(android.graphics.Color.parseColor("#9e9e9e"));
                none.setTextSize(11);
                none.setPadding(dp(6), dp(8), dp(6), dp(8));
                w.devlist.addView(none);
            }
            list.forEach(function (u) {
                var tv = new android.widget.TextView(context);
                var sel = (devSelId === u.id);
                tv.setText((sel ? "▶ " : (u.device ? "🔒 " : "○ ")) + u.name + "\n" +
                    (u.device ? ("device " + u.device.slice(0, 6) + "…" + u.device.slice(-4)) : "no device yet - next login binds"));
                tv.setTextColor(android.graphics.Color.parseColor(sel ? "#ffffff" : (u.device ? "#a5d6a7" : "#9e9e9e")));
                tv.setTextSize(11);
                tv.setPadding(dp(8), dp(7), dp(8), dp(7));
                tv.setBackgroundColor(android.graphics.Color.parseColor(sel ? "#664A148C" : "#33FFFFFF"));
                var lp = new android.widget.LinearLayout.LayoutParams(-1, -2);
                lp.setMargins(0, 0, 0, dp(3));
                tv.setOnTouchListener(function (v, e) { try { v.getParent().requestDisallowInterceptTouchEvent(true); } catch (e2) {} return false; });
                tv.setOnClickListener(new android.view.View.OnClickListener({
                    onClick: function () {
                        if (isAdminName(u.name)) { devMsg("Admins are never locked."); return; }
                        devSelId = u.id;
                        devArm = ""; ui.run(function () { w.devReset.setText("Reset"); });
                        w.devSel.setText("Selected: " + u.name + (u.device ? "  (" + u.device + ")" : "  (no device)"));
                        devMsg("Type or paste a device ID, then tap Allow.");
                        devRender(devSorted());
                    }
                }));
                w.devlist.addView(tv, lp);
            });
        } catch (e) { logErr("devRender", e); }
    });
}
function devSorted() {
    var a = [], k;
    for (k in devDocs) a.push(devDocs[k]);
    a.sort(function (x, y) { return (!!y.device - !!x.device) || String(x.name).localeCompare(String(y.name)); });
    return a;
}
function devFetch() {
    if (devBusy || !authed || !isAdmin()) return;
    devBusy = true;
    try {
        var t = monToken();
        if (!t) { devMsg("Not signed in - log in again."); return; }
        var r = fsReq("GET", fsUrl("users") + "?pageSize=300", t.token);
        if (r.status === 401) monTok = null;
        if (r.status !== 200) {
            devMsg(r.status === 403 ? "Refused - add the admin rule for users/{uid} to firestore.rules." : "Failed (HTTP " + r.status + ").");
            return;
        }
        devMsg("");
        var docs = (r.json && r.json.documents) || [];
        devDocs = {};
        for (var i = 0; i < docs.length; i++) {
            var f = docs[i].fields || {}, id = String(docs[i].name).split("/").pop();
            devDocs[id] = {
                id: id,
                name: f.username ? String(f.username.stringValue) : id,
                device: (f.deviceId && f.deviceId.stringValue) ? String(f.deviceId.stringValue) : ""
            };
        }
        devRender(devSorted());
    } catch (e) { logErr("devFetch", e); devMsg("Error - see log"); }
    finally { devBusy = false; }
}
function devReset(u) {
    try {
        var t = monToken();
        if (!t || !authed || !isAdmin()) { devMsg("Admins only."); return; }
        var base = fsBase();
        var commit = { writes: [ { update: { name: base + "/users/" + u.id, fields: {} }, updateMask: { fieldPaths: ["deviceId"] } } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 401) monTok = null;
        if (c.status === 200) { log("device reset: " + u.name); devMsg("Reset " + u.name + " - next login binds a new phone."); u.device = ""; ui.run(function () { w.devSel.setText("Selected: " + u.name + "  (no device)"); }); devRender(devSorted()); }
        else devMsg(c.status === 403 ? "Refused - add the admin rule for users/{uid} to firestore.rules." : "Reset failed (HTTP " + c.status + ").");
    } catch (e) { logErr("devReset", e); devMsg("Reset error - see log"); }
}
function devAllow() {
    try {
        var u = devDocs[devSelId];
        if (!u) { devMsg("Long-press a user first."); return; }
        var id = String(w.devInput.getText()).trim();
        if (!/^[A-Za-z0-9]{8,64}$/.test(id)) { devMsg("Device ID: 8-64 letters/numbers."); return; }
        var t = monToken();
        if (!t || !authed || !isAdmin()) { devMsg("Admins only."); return; }
        var base = fsBase();
        var commit = { writes: [ { update: { name: base + "/users/" + u.id, fields: { deviceId: { stringValue: id } } }, updateMask: { fieldPaths: ["deviceId"] } } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 401) monTok = null;
        if (c.status === 200) {
            log("device allowed for " + u.name);
            u.device = id;
            devMsg("Allowed " + id.slice(0, 6) + "… for " + u.name + ".");
            ui.run(function () { w.devSel.setText("Selected: " + u.name + "  (" + id + ")"); w.devInput.setText(""); });
            inputFocus(false);
            devRender(devSorted());
        } else devMsg(c.status === 403 ? "Refused - update firestore.rules (admin can set deviceId)." : "Allow failed (HTTP " + c.status + ").");
    } catch (e) { logErr("devAllow", e); devMsg("Allow error - see log"); }
}
bindAuthField(w.devInput);
w.devAllow.click(function () { inputFocus(false); threads.start(devAllow); });
w.devReset.click(function () {
    inputFocus(false);
    var u = devDocs[devSelId];
    if (!u) { devMsg("Tap a user first."); return; }
    if (!u.device) { devMsg(u.name + " has no device saved."); return; }
    if (devArm !== u.id || Date.now() - devArmAt > 4000) {       // first tap arms, second tap (within 4 s) resets
        devArm = u.id; devArmAt = Date.now();
        ui.run(function () { w.devReset.setText("Sure?"); });
        devMsg("Tap Reset again within 4s to clear " + u.name + "'s device.");
        setTimeout(function () { if (Date.now() - devArmAt >= 3900) { devArm = ""; ui.run(function () { w.devReset.setText("Reset"); }); devMsg(""); } }, 4100);
        return;
    }
    devArm = "";
    ui.run(function () { w.devReset.setText("Reset"); });
    threads.start(function () { devReset(u); });
});
w.devRefresh.click(function () { devMsg("Refreshing..."); threads.start(devFetch); });

// ---- Force logout (kick) ----
// Admin: open a user in the Monitor, tap Kick twice -> writes kicks/{uid} (server stamps the change).
// Every copy: checks its own kicks/{uid} every KICK_CHECK_MS; when the server stamp changes after it signed in, it logs out
// (stops the bot, drops the saved session, back to the login screen). Uses the server's updateTime, so device clocks don't matter.
// Needs this in firestore.rules (use the SAME admin condition you use for the monitor rules):
//   match /kicks/{uid} {
//     allow get: if request.auth != null && request.auth.uid == uid;
//     allow write: if <your admin check>;
//   }
function forceKicked(by) {
    log("KICKED: logged out by admin" + (by ? " (" + by + ")" : ""));
    try { toast("You were logged out by an admin"); } catch (e) {}
    ui.run(function () {
        doLogout();
        try { setAuthMsg("You were logged out by an admin.", false); } catch (e2) {}
    });
}
function kickCheck() {
    if (!authed || kickBusy) return;
    kickBusy = true;
    try {
        var t = monToken();
        if (!t) return;
        var r = fsReq("GET", fsUrl("kicks/" + t.uid), t.token), stamp;
        if (r.status === 401) { monTok = null; return; }
        if (r.status === 200 && r.json && r.json.updateTime) stamp = String(r.json.updateTime);
        else if (r.status === 404) stamp = "";                         // never kicked
        else {
            if (!kickWarned) { kickWarned = true; log("kick check failed: HTTP " + r.status + (r.status === 403 ? " (add the kicks rule to firestore.rules)" : "")); }
            return;
        }
        if (kickSeen === null) { kickSeen = stamp; return; }           // first look after login = baseline
        if (stamp && stamp !== kickSeen) {
            kickSeen = stamp;
            var f = (r.json && r.json.fields) || {};
            forceKicked(f.by ? String(f.by.stringValue) : "");
        }
    } catch (e) { logErr("kickCheck", e); }
    finally { kickBusy = false; }
}
function doKick(u) {                     // admin: kick one user from the Monitor
    try {
        var t = monToken();
        if (!t || !authed || !isAdmin()) { monMsg("Admins only."); return; }
        if (u.id === t.uid) { monMsg("You can't kick yourself."); return; }
        if (isAdminName(u.name)) { monMsg("Admins can't be kicked."); return; }
        var base = fsBase();
        var commit = { writes: [ { update: { name: base + "/kicks/" + u.id, fields: {
            at: { integerValue: String(Date.now()) },
            by: { stringValue: String(currentUser) }
        } } } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 401) monTok = null;
        if (c.status === 200) { log("kick sent: " + u.name); monMsg("Kicked " + u.name + " - logged out within " + Math.round(KICK_CHECK_MS / 1000) + "s."); }
        else monMsg(c.status === 403 ? "Refused - add the kicks rule for admins to firestore.rules." : "Kick failed (HTTP " + c.status + ").");
    } catch (e) { logErr("doKick", e); monMsg("Kick error - see log"); }
}
w.monKick.click(function () {
    var u = monDocs[monView];
    if (!u) return;
    if (Date.now() - monKickArm > 4000) {            // first tap arms it, second tap (within 4 s) sends
        monKickArm = Date.now();
        ui.run(function () { w.monKick.setText("Sure?"); });
        monMsg("Tap again within 4s to log out " + u.name);
        setTimeout(function () {
            if (Date.now() - monKickArm >= 3900) { monKickArm = 0; ui.run(function () { w.monKick.setText("Kick"); }); monMsg(""); }
        }, 4100);
        return;
    }
    monKickArm = 0;
    ui.run(function () { w.monKick.setText("Kick"); });
    threads.start(function () { doKick(u); });
});
setInterval(function () { if (authed) threads.start(kickCheck); }, KICK_CHECK_MS);

// Show / hide the on-screen log inside the panel (long-press the log text to copy it)
w.log.click(function () {
    logShown = !logShown;
    ui.run(function () {
        w.logscroll.setVisibility(logShown ? android.view.View.VISIBLE : android.view.View.GONE);
        w.log.setText(logShown ? "Hide" : "Log");
    });
    if (logShown) refreshLogView();
});
w.logview.on("long_click", function () {
    setClip(LOG_LINES.join("\n"));
    toast("Log copied");
    return true;
});

w.exit.click(function () {
    log("Exit pressed");
    w.close();
    exit();
});

// screen capture is requested by onAuthed() right after a successful login (or restored session)

setInterval(function () {}, 1000);   // keep the script (and the floating window) alive
setInterval(function () { if (authed && !updBusy) threads.start(checkUpdate); }, UPDATE_CHECK_MS);
setInterval(function () { if (authed && !subChecking && !subBusy) threads.start(loadSub); }, UPDATE_CHECK_MS);   // re-read the subscription from the server
