"auto";
var APP_VERSION = 107;
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

// Crash/restart-loop guard: if the script was started 3+ times within 2 minutes, updates stay OFF for this run.
var UPDATES_PAUSED = false;
try {
    var __bs = storages.create("klassx_boot"), __now = Date.now();
    var __ts = JSON.parse(__bs.get("starts", "[]")).filter(function (t) { return __now - t < 120000; });
    __ts.push(__now);
    __bs.put("starts", JSON.stringify(__ts.slice(-10)));
    if (__ts.length >= 3) UPDATES_PAUSED = true;
} catch (e) {}
var APP_NAME = "KlassX Online";

// ---- Language: English / 中文 (button in the title bar; the choice is saved and the script restarts to apply it) ----
var LANG_STORE = null;
try { LANG_STORE = storages.create("klassx_lang"); } catch (e) {}
var LANG = "en";
try { if (LANG_STORE && String(LANG_STORE.get("lang", "en")) === "zh") LANG = "zh"; } catch (e) {}
var ZH_EXACT = {
    "+ Add": "+ 添加",
    "ALL OFF": "全部关闭",
    "ALL ON": "全部开启",
    "Activate": "激活",
    "Activation key (KLX-XXXX-XXXX-XXXX)": "激活码 (KLX-XXXX-XXXX-XXXX)",
    "Admin": "管理",
    "All white names": "全部白名",
    "Allow": "允许",
    "Arrow": "箭矢",
    "Box": "箱子",
    "Browse / upload file...": "浏览 / 上传文件...",
    "CLOSE": "关闭",
    "Close": "关闭",
    "Cloth": "布料",
    "Confirm password": "确认密码",
    "Copy": "复制",
    "Days (1-30) or 12h": "天数 (1-30) 或 12h",
    "Days (e.g. 30, or -5)": "天数 (如 30 或 -5)",
    "Device ID to allow": "要允许的设备ID",
    "Devices": "设备",
    "Every": "每",
    "Exit": "退出",
    "File to publish (empty = this script)": "要发布的文件 (留空 = 本脚本)",
    "Gauntlets": "护手",
    "Generate key": "生成密钥",
    "GitHub token": "GitHub 令牌",
    "Gold": "金币",
    "IGNORE (never loot)": "忽略 (从不拾取)",
    "Kick": "踢出",
    "LOOT FIRST": "先拾取",
    "LURE 1": "引怪 1",
    "LURE 2": "引怪 2",
    "LURE 3": "引怪 3",
    "LURE 4": "引怪 4",
    "Log": "日志",
    "Login": "登录",
    "Logout": "退出登录",
    "Loot items": "拾取物品",
    "MAIN SPOT": "主点位",
    "MAP": "地图",
    "Map go-to": "地图前往",
    "Map location": "地图位置",
    "Map now": "立即查看地图",
    "Match screen": "匹配屏幕",
    "Monitor": "监控",
    "Monsters": "怪物",
    "PICK UP": "拾取",
    "PLAY": "开始",
    "Pants": "裤子",
    "Password": "密码",
    "Paste": "粘贴",
    "Paste token from clipboard": "从剪贴板粘贴令牌",
    "Pill": "药丸",
    "Potion": "药水",
    "Publish update": "发布更新",
    "Quick": "快捷",
    "Register": "注册",
    "Repo: owner/name": "仓库: 所有者/名称",
    "Reset": "重置",
    "Reset ALL": "全部重置",
    "Ring": "戒指",
    "SG HOLE PASSAGE SPOT": "SG 洞口通道点位",
    "SPOT 1": "点位 1",
    "SPOT 2": "点位 2",
    "Save": "保存",
    "Save icons": "保存图标",
    "Scroll": "卷轴",
    "Select channel": "选择频道",
    "Select server": "选择服务器",
    "Set": "设置",
    "Shoes": "鞋子",
    "Skills": "技能",
    "Subscription key (KLX-XXXX-XXXX-XXXX)": "订阅密钥 (KLX-XXXX-XXXX-XXXX)",
    "Subscription required": "需要订阅",
    "Talisman": "护符",
    "Tap a user to select": "点击用户以选择",
    "Tools": "工具",
    "Update now": "立即更新",
    "User devices": "用户设备",
    "Username": "用户名",
    "Users": "用户",
    "Users (0=many)": "用户数 (0=不限)",
    "What's new (shown to users)": "更新内容 (向用户显示)",
    "attack only the ticked ones": "仅攻击已勾选的",
    "▶ Play": "▶ 开始",
    "■ Stop": "■ 停止",
    "STOP": "停止",
    "⟳ Update": "⟳ 更新",
    "⠿ KlassX  (drag)": "⠿ KlassX  (拖动)",
    "⠿ LOOT ITEMS": "⠿ 拾取物品",
    "⠿ Log  (drag)": "⠿ 日志  (拖动)",
    "⠿ MAP LOCATION": "⠿ 地图位置",
    "⠿ MONSTERS": "⠿ 怪物",
    "Hide": "隐藏",
    "Create account": "创建账号",
    "Sure?": "确定？"
};
var ZH_PRE = [      // whole sentences with numbers / names inside (applied first)
    [/^Too many attempts\. Wait (\d+)s\.$/, "尝试次数过多，请等待 $1 秒。"],
    [/^Too many attempts\. Locked for (\d+)s\.$/, "尝试次数过多，已锁定 $1 秒。"],
    [/^Password needs (\d+)\+ characters\.$/, "密码至少需要 $1 个字符。"],
    [/^Password too weak \((\d+)\+ characters\)\.$/, "密码太弱（至少 $1 个字符）。"],
    [/^Days must be 1 to (\d+) \(or e\.g\. 12h for hours\)\.$/, "天数必须为 1 到 $1（或用 12h 表示小时）。"],
    [/^Hours must be 1 to (\d+) \(e\.g\. 12h\)\.$/, "小时数必须为 1 到 $1（如 12h）。"],
    [/^Users per key must be 0 \(many\) to (\d+)\.$/, "每个密钥的用户数必须为 0（不限）到 $1。"],
    [/^Activated: \+(.*)$/, "已激活：+$1"],
    [/^Key copied: (.*)$/, "密钥已复制：$1"],
    [/^Kicked (.*) - logged out within (\d+)s\.$/, "已踢出 $1 - 将在 $2 秒内退出登录。"],
    [/^Reset (.*) - next login binds a new phone\.$/, "已重置 $1 - 下次登录将绑定新手机。"],
    [/^Allowed (\S+)… for (.*)\.$/, "已为 $2 允许 $1…"],
    [/^(.*) has no device saved\.$/, "$1 尚未保存设备。"],
    [/^Tap Reset again within 4s to clear (.*)'s device\.$/, "请在 4 秒内再次点击“重置”以清除 $1 的设备。"],
    [/^Tap again within 4s to log out (.*)$/, "请在 4 秒内再次点击以让 $1 退出登录"],
    [/^Saved (\d+) skill icons$/, "已保存 $1 个技能图标"],
    [/^Token pasted \((\d+) chars\)$/, "令牌已粘贴（$1 个字符）"],
    [/^Published v(\S+)\s*✓$/, "已发布 v$1 ✓"],
    [/^Uploading v(\S+)\.\.\.$/, "正在上传 v$1..."],
    [/^Repo set to (.*?)\s*✓$/, "仓库已设置为 $1 ✓"],
    [/^Will publish: (.*)$/, "将发布：$1"],
    [/^(\d+) Channel$/, "$1 频道"]
];
var ZH_PART = [
    ["Loot hand: ", "拾取手："],
    ["Loot monster: ", "拾取怪物："],
    ["Firestore quota / rate limit (HTTP 429) - auto-refresh paused 5 min. Tap refresh to retry.", "Firestore 配额/频率限制 (HTTP 429) - 自动刷新已暂停 5 分钟，点击刷新重试。"],
    ["Refused - add the admin rule for users/{uid} to firestore.rules (subUntil).", "被拒绝 - 请将 users/{uid} 的管理员规则 (subUntil) 添加到 firestore.rules。"],
    ["Map patrol cannot run: it needed the auto loot scanner, which was removed", "无法执行地图巡逻：需要自动拾取扫描器，但它已被移除"],
    ["That file has no 'var APP_VERSION = N;' line - it is not a KlassX script.", "该文件没有 'var APP_VERSION = N;' 行 - 不是 KlassX 脚本。"],
    ["Firestore quota / rate limit (HTTP 429) - wait a few minutes and retry.", "Firestore 配额/频率限制 (HTTP 429) - 请等待几分钟后重试。"],
    ["Refused - add the admin rule for users/{uid} to firestore.rules.", "被拒绝 - 请将 users/{uid} 的管理员规则添加到 firestore.rules。"],
    ["Repo/branch not found (check GH_OWNER, GH_REPO, token access).", "未找到仓库/分支（请检查 GH_OWNER、GH_REPO 和令牌权限）。"],
    ["Refused - add the monitor rules for admins to firestore.rules.", "被拒绝 - 请将管理员的 monitor 规则添加到 firestore.rules。"],
    ["Tick MAIN SPOT too (the lures go back to it to kill + loot)", "请同时勾选主点位（引怪后会回到该点击杀并拾取）"],
    ["Cannot find script file (set SCRIPT_PATH or choose a file).", "找不到脚本文件（请设置 SCRIPT_PATH 或选择文件）。"],
    ["Refused - add the kicks rule for admins to firestore.rules.", "被拒绝 - 请将管理员的 kicks 规则添加到 firestore.rules。"],
    ["Refused - update firestore.rules (admin can set deviceId).", "被拒绝 - 请更新 firestore.rules（管理员可设置 deviceId）。"],
    ["Could not check subscription. Tap Activate to retry.", "无法检查订阅，请点击“激活”重试。"],
    ["Updates paused: the script restarted too many times", "更新已暂停：脚本重启次数过多"],
    ["No .js files found - type the path in the file box", "未找到 .js 文件 - 请在文件框中输入路径"],
    ["Subscription expired. Log in and enter a new key.", "订阅已过期，请登录并输入新密钥。"],
    ["Language saved - restart the script to apply", "语言已保存 - 请重启脚本以生效"],
    ["Type seconds or minutes, e.g. 30s, 2m, 1m30s", "请输入秒或分钟，如 30s、2m、1m30s"],
    ["Token has no write access (or rate limited).", "令牌没有写入权限（或已被限流）。"],
    ["Set needs 0 or more days (use 0 to expire).", "设置的天数需 ≥ 0（0 表示立即过期）。"],
    ["Screen capture denied - using fixed delays", "截屏被拒绝 - 使用固定延迟"],
    ["Email/Password sign-in is off in Firebase.", "Firebase 中未启用邮箱/密码登录。"],
    ["Refused - add your uid to firestore.rules.", "被拒绝 - 请将你的 uid 添加到 firestore.rules。"],
    ["Type or paste a device ID, then tap Allow.", "请输入或粘贴设备ID，然后点击“允许”。"],
    ["Clipboard is empty - copy the token first", "剪贴板为空 - 请先复制令牌"],
    ["Set FIREBASE_API_KEY in the script first.", "请先在脚本中设置 FIREBASE_API_KEY。"],
    ["Script uploaded but version file failed: ", "脚本已上传，但版本文件失败："],
    ["Select Server tap did not work - see log", "选择服务器点击无效 - 请查看日志"],
    ["Enter a whole number of days (max 3650).", "请输入整数天数（最大 3650）。"],
    ["No icons saved - press Save icons first", "尚未保存图标 - 请先点击“保存图标”"],
    ["Set GH_OWNER and GH_REPO in the script.", "请在脚本中设置 GH_OWNER 和 GH_REPO。"],
    ["Press Stop first, then change language", "请先点击停止，再切换语言"],
    ["Subscription expired. Enter a new key.", "订阅已过期，请输入新密钥。"],
    ["First run: allow each permission once", "首次运行：请逐项允许权限"],
    ["No active subscription. Enter a key.", "没有有效订阅，请输入密钥。"],
    ["Username: 3-20 letters, numbers or _", "用户名：3-20 位字母、数字或下划线"],
    ["Press Stop first, then Match screen", "请先点击停止，再进行匹配屏幕"],
    ["Too many attempts. Try again later.", "尝试次数过多，请稍后再试。"],
    ["Bad Firebase API key in the script.", "脚本中的 Firebase API 密钥无效。"],
    [": position not set yet (LB1_SPOTS)", "：位置尚未设置 (LB1_SPOTS)"],
    ["Subscription expired - logged out", "订阅已过期 - 已退出登录"],
    ["Subscription update failed (HTTP ", "订阅更新失败 (HTTP "],
    ["You were logged out by an admin.", "你已被管理员强制退出登录。"],
    ["no device yet - next login binds", "尚无设备 - 下次登录将绑定"],
    ["Offline - log in when connected.", "离线 - 联网后请重新登录。"],
    ["Will publish this running script", "将发布当前运行的脚本"],
    ["Device ID: 8-64 letters/numbers.", "设备ID：8-64 位字母/数字。"],
    ["You were logged out by an admin", "你已被管理员强制退出登录"],
    ["Repo must look like owner/name.", "仓库格式应为 所有者/名称。"],
    ["Admin - no subscription needed", "管理员 - 无需订阅"],
    ["Monsters panel error - see log", "怪物面板错误 - 请查看日志"],
    ["Session expired. Log in again.", "会话已过期，请重新登录。"],
    ["Not signed in - log in again.", "未登录 - 请重新登录。"],
    ["Error - see log (Log button)", "错误 - 请查看日志（日志按钮）"],
    ["Update server not configured", "未配置更新服务器"],
    ["Subscription error - see log", "订阅错误 - 请查看日志"],
    ["No users have reported yet.", "还没有用户上报。"],
    ["Wrong username or password.", "用户名或密码错误。"],
    ["No connection to Firebase.", "无法连接到 Firebase。"],
    ["Enter your activation key.", "请输入激活码。"],
    ["You already used this key.", "你已使用过此密钥。"],
    ["Could not check key (HTTP ", "无法检查密钥 (HTTP "],
    ["This account is disabled.", "此账号已被停用。"],
    ["Could not read clipboard", "无法读取剪贴板"],
    ["That is not a valid key.", "该密钥无效。"],
    ["Paste your GitHub token.", "请粘贴你的 GitHub 令牌。"],
    ["Admins are never locked.", "管理员不会被锁定。"],
    ["You can't kick yourself.", "你不能踢出自己。"],
    ["Long-press a user first.", "请先长按一个用户。"],
    ["Allow screen capture...", "请允许截屏权限..."],
    ["Switching to English...", "Switching to English..."],
    ["That username is taken.", "该用户名已被占用。"],
    ["Registration is closed.", "注册已关闭。"],
    ["Passwords do not match.", "两次输入的密码不一致。"],
    ["Admins can't be kicked.", "管理员不能被踢出。"],
    ["Checking for update...", "正在检查更新..."],
    ["Choose file to publish", "选择要发布的文件"],
    ["No active subscription", "没有有效订阅"],
    ["(no log uploaded yet)", "(尚未上传日志)"],
    ["Screen capture failed", "截屏失败"],
    ["Update in progress...", "正在更新..."],
    ["\nuid (hold to copy): ", "\nuid (长按复制)："],
    ["Conflict - try again.", "冲突 - 请重试。"],
    ["Allow error - see log", "允许错误 - 请查看日志"],
    ["Reset error - see log", "重置错误 - 请查看日志"],
    ["Could not list files", "无法列出文件"],
    ["Cannot save language", "无法保存语言设置"],
    ["Enter your password.", "请输入密码。"],
    ["Kick error - see log", "踢出错误 - 请查看日志"],
    [" found - installing", " 已发现 - 正在安装"],
    ["sub: none / expired", "订阅：无 / 已过期"],
    ["Creating account...", "正在创建账号..."],
    ["Reset failed (HTTP ", "重置失败 (HTTP "],
    ["Allow failed (HTTP ", "允许失败 (HTTP "],
    ["Clipboard is empty", "剪贴板为空"],
    ["Matching screen...", "正在匹配屏幕..."],
    ["Subscription ended", "订阅已结束"],
    ["Up to date (this v", "已是最新 (当前 v"],
    ["GitHub error HTTP ", "GitHub 错误 HTTP "],
    ["Kick failed (HTTP ", "踢出失败 (HTTP "],
    ["Tick a spot first", "请先勾选一个点位"],
    ["Invalid username.", "用户名无效。"],
    ["Bad GitHub token.", "GitHub 令牌无效。"],
    ["Tap a user first.", "请先点击一个用户。"],
    ["s (tap = change)", "秒 (点击修改)"],
    ["File not found: ", "文件未找到："],
    [" - tap to retry", " - 点击重试"],
    ["App not found: ", "未找到应用："],
    ["Error - see log", "错误 - 请查看日志"],
    ["No users found.", "未找到用户。"],
    ["Update failed: ", "更新失败："],
    ["Checking key...", "正在检查密钥..."],
    ["Creating key...", "正在生成密钥..."],
    ["Reading repo...", "正在读取仓库..."],
    ["Match screen: ", "匹配屏幕："],
    ["Subscription: ", "订阅："],
    ["  (no device)", "  (无设备)"],
    [" - restarting", " - 正在重启"],
    ["Gap: NON-STOP", "间隔：不间断"],
    ["⟳ Update to v", "⟳ 更新到 v"],
    ["Downloading v", "正在下载 v"],
    ["Logging in...", "正在登录..."],
    ["Signing in...", "正在登录..."],
    ["Failed (HTTP ", "失败 (HTTP "],
    ["Refreshing...", "刷新中..."],
    ["Center tap: ", "中心点击："],
    ["Teach crop: ", "教学截图："],
    ["Walk pause: ", "行走暂停："],
    ["Log in first", "请先登录"],
    ["Updated to v", "已更新到 v"],
    ["Admins only.", "仅限管理员。"],
    ["Invalid key.", "密钥无效。"],
    ["  (offline ", "  (离线 "],
    ["Auto Pots: ", "自动药水："],
    ["Auto loot: ", "自动拾取："],
    ["unreachable", "无法连接"],
    ["Checking...", "检查中..."],
    ["  (online)", "  (在线)"],
    [" available", " 可用"],
    ["Selected: ", "已选择："],
    ["Log copied", "日志已复制"],
    ["uid copied", "UID 已复制"],
    ["Loading...", "加载中..."],
    [", server ", ", 服务器 "],
    ["Captcha: ", "验证码："],
    ["Channel: ", "频道："],
    ["Map auto ", "地图自动 "],
    ["Self tap ", "自我点击 "],
    [" Channel", " 频道"],
    [" | repo ", " | 仓库 "],
    ["Detect: ", "检测："],
    ["Logout (", "退出登录 ("],
    ["Update v", "更新 v"],
    [" (drag)", " (拖动)"],
    ["s (tap)", "秒 (点击)"],
    ["Quick: ", "快捷："],
    ["Local v", "本地 v"],
    ["NOT SET", "未设置"],
    ["device ", "设备 "],
    ["Error: ", "错误："],
    [" (tap)", " (点击)"],
    ["Pick: ", "拾取："],
    ["Stay: ", "保持登录："],
    ["Every ", "每 "],
    ["Pasted", "已粘贴"],
    [" left", " 剩余"],
    ["Srv: ", "服务器："],
    ["sub: ", "订阅："],
    ["Gap ", "间隔 "]
];
var ZH_POST = [     // leftovers after the parts: ON / OFF states and "5m ago"
    [/\s*[:：]\s*ON$/, "：开"],
    [/\s*[:：]\s*OFF$/, "：关"],
    [/：IMAGE$/, "：图像"],
    [/：TAP$/, "：点击"],
    [/(\d+)([smhd]) ago/g, function (a, n, u) { return n + ({ s: "秒", m: "分钟", h: "小时", d: "天" })[u] + "前"; }]
];
function trZh(str) {
    if (ZH_EXACT.hasOwnProperty(str)) return ZH_EXACT[str];
    var am = /^(.*\S)( [▾▴])$/.exec(str);            // "Tools ▾" -> translate "Tools", keep the arrow
    if (am) { var b = trZh(am[1]); if (b !== am[1]) return b + am[2]; }
    var out = str, i;
    for (i = 0; i < ZH_PRE.length; i++) out = out.replace(ZH_PRE[i][0], ZH_PRE[i][1]);
    for (i = 0; i < ZH_PART.length; i++) { var p = ZH_PART[i]; if (out.indexOf(p[0]) >= 0) out = out.split(p[0]).join(p[1]); }
    for (i = 0; i < ZH_POST.length; i++) out = out.replace(ZH_POST[i][0], ZH_POST[i][1]);
    return out;
}
function T(s) {                                      // translate one UI text (English mode returns it untouched)
    if (LANG !== "zh") return s;
    try {
        if (s === null || s === undefined) return s;
        var str = String(s);
        if (!/[A-Za-z]/.test(str)) return s;
        var out = trZh(str);
        return out === str ? s : out;
    } catch (e) { return s; }
}
try {                                                // every toast goes through T
    var __toastOrig = toast;
    toast = function (s) { var m; try { m = T(s); } catch (e) { m = s; } return __toastOrig(m); };
} catch (e) {}
function uiTranslateXml(x) {                         // text="..." and hint="..." inside a window layout
    var str = String(x && x.toXMLString ? x.toXMLString() : x);
    return str.replace(/\b(text|hint)="([^"]*)"/g, function (all, name, val) {
        var plain = val.replace(/&apos;/g, "'").replace(/&amp;/g, "&");
        var t = T(plain);
        return t === plain ? all : name + '="' + String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") + '"';
    });
}
var TEMPLATE_DIR = "/sdcard/脚本/templates/";   // captcha digit + confirm templates
var SELECT_DELAY_MS = 8000;  // fallback fixed wait if screen capture isn't allowed (ms)
var SKILL_TAP_MS = 300;      // finger-down time of every skill-slot tap (Atk, S1-S5) in ms
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
// Loot button position (hand button) - only used to recognise the screen layout, it is no longer tapped
var LOOT_X = 1434, LOOT_Y = 805;        // center of the hand button
// Revive dialog ("Do you wish to be revived?"): the Revive button is tapped every time it shows up
var TAP_REVIVE = true;                  // false = don't auto-revive
var REVIVE_X = 1288, REVIVE_Y = 676;    // single-button version of the dialog (button in the middle)
var USE_X = 1451, USE_Y = 676;          // two-button version (Revive | Use): center of the "Use" button, tapped to revive
var USE_WAIT_MS = 5000;                // wait this long after the two-button dialog appears before tapping "Use" (Back Point Pass) (ms)
// Back Point Pass item window (opens after tapping the "go back" quick slot): [Close] [Use] near the bottom of the screen
var BPP_USE_X = 1516, BPP_USE_Y = 957;       // center of its "Use" button (2576x1177 reference)
var BPP_CLOSE_X = 1072;                      // center of its "Close" button (same row)
var BPP_TRIES = 8;                           // Use taps while the window stays (the item has a cooldown, "Skill cooldown time." = try again)
var BPP_WAIT_MS = 6000;                      // how long to wait for the window to show up after the slot tap (ms)
var BPP_GAP_MS = 2500;                       // pause between those taps (ms)
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
var ATK_GAPS = [250, 400, 600, 900, 1300];   // choices for the pause between skill taps (ms)
var multiWarn = false;
var ATK_NONSTOP = true;                     // true = tap the skill slots NON-STOP (ignores the Gap button); false = use the Gap button value
var SKILL_CONT = true;                      // true = S1-S4 are tapped CONTINUOUSLY: a fresh screenshot before every pass, every skill that is NOT on cooldown is tapped at once; only works in NON-STOP mode with Detect = TAP
var SKILL_CONT_CD_CHECK = true;             // true = skip a skill whose icon is dimmed (cooldown) - tune with SKILL_READY_RATIO; false = tap all S1-S4 blindly
var SKILL_CONT_ATK_IDLE = true;             // true = when every skill is on cooldown, tap Atk (basic attack) so the character never stops attacking
var SKILL_CONT_SET = [1, 2, 3, 4];          // which skills are continuous (index in SKILLS: 1 = S1 ... 4 = S4)
var SKILL_CONT_MS = 2000;                   // how long the continuous taps run before the loop looks at the screen again (ms) - lower = loot / buff / captcha react faster, higher = fewer gaps
var SKILL_CONT_TAP_MS = SKILL_TAP_MS;       // finger-down time of each continuous tap (ms)
var ATK_NONSTOP_GAP_MS = 0;                 // pause between two skill taps in non-stop mode (ms) - raise it if the game drops taps

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
var RETARGET_ON = false;                           // true = even while a mob is selected, tap a mob again every RETARGET_MS (stops the character standing stuck on one spot / one mob)
var RETARGET_MS = 700;                             // retarget interval (ms)
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
var minimized = false;          // (re-declared further down; declared here so log() can read it)
var MINI_SHOW_LOG = false;        // true = the minimized panel also shows the last log lines; false = only the name bar
var LOG_LINES = [];          // last lines, shown in the on-screen log
var LOG_KEEP = 60;
var logPop = null;                // the Log pop-up window (null = closed)
function refreshLogView() {
    if (!w) return;
    ui.run(function () {
        try {
            if (logPop) {
                var _lp = logPop;
                _lp.logview.setText(LOG_LINES.join("\n"));
                _lp.logscroll.post(function () { try { _lp.logscroll.fullScroll(130); } catch (e5) {} });   // stick to bottom
            }
        } catch (e6) {}
        try {
            w.minilogview.setText(LOG_LINES.slice(-12).join("\n"));        // compact log shown while minimized
            w.minilogscroll.post(function () { w.minilogscroll.fullScroll(130); });
        } catch (em) {}
    });
}
var LOG_ONCE = {};
var LOG_SCREEN_FILTER = true;            // true = the on-screen log shows ONLY loot and HUD lines (and errors); everything else (Clicker, Hand, ...) goes to the log FILE only
var LOG_SCREEN = /^\[Loot\]|^In game \(HUD|^HUD gone|^ERROR/;
var LOG_ALWAYS = /^\[Loot\]|^Auto target|^Clicker|^ERROR|^====|^In game \(HUD|^HUD gone|^Captcha|^SG patrol|^Auto Potion|^Revive|^Revived|^Tapped quick slot|^tap check|^screen capture|^tap space/;
function log(msg) {
    var d = new Date();
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    var line = p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds()) + " " + msg;
    console.log(line);
    try { files.append(LOG_FILE, line + "\n"); } catch (e) {}
    if (LOG_SCREEN_FILTER && !LOG_SCREEN.test(msg)) return;      // not a loot / HUD line: file only
    // On-screen log: only attack / loot / return-to-spot (and errors) keep repeating.
    // Everything else (login, select server, watching...) is shown ONE time only. The log FILE still gets every line.
    if (!LOG_ALWAYS.test(msg)) {
        var key = String(msg).replace(/[0-9]+/g, "#");
        if (LOG_ONCE[key]) return;
        LOG_ONCE[key] = true;
    }
    LOG_LINES.push(line);
    if (LOG_LINES.length > LOG_KEEP) LOG_LINES.shift();
    if (logShown || minimized) refreshLogView();
}
function logErr(where, e) {
    log("ERROR in " + where + ": " + e + (e && e.stack ? "\n" + e.stack : ""));
}
try {   // keep the log file from growing forever
    if (files.exists(LOG_FILE) && files.read(LOG_FILE).length > 200000) files.remove(LOG_FILE);
} catch (e) {}
log("layout mode " + LAYOUT_MODE + " (ref " + REF_W + "x" + REF_H + ")");
log("==== script started | screen " + device.width + "x" + device.height + " | " + device.brand + " " + device.model + " | android " + device.release + " ====");

// ===== device info (screen, density, refresh rate, model) - logged at start and uploaded with the monitor heartbeat =====
function devInfo() {
    var o = { short: "", full: "" };
    try {
        var dm = new android.util.DisplayMetrics();
        var disp = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
        disp.getRealMetrics(dm);
        var sh = Math.min(dm.widthPixels, dm.heightPixels), lg = Math.max(dm.widthPixels, dm.heightPixels);
        var dpi = dm.densityDpi, bucket = dpi <= 140 ? "ldpi" : dpi <= 200 ? "mdpi" : dpi <= 280 ? "hdpi" : dpi <= 400 ? "xhdpi" : dpi <= 560 ? "xxhdpi" : "xxxhdpi";
        var r = lg / sh, best = "", bd = 9, tbl = [[16 / 9, "16:9"], [16 / 10, "16:10"], [18 / 9, "18:9"], [19 / 9, "19:9"], [19.5 / 9, "19.5:9"], [20 / 9, "20:9"], [21 / 9, "21:9"], [4 / 3, "4:3"], [3 / 2, "3:2"]];
        tbl.forEach(function (t) { var dd = Math.abs(r - t[0]) / t[0]; if (dd < bd) { bd = dd; best = t[1]; } });
        if (bd > 0.02) best = r.toFixed(2) + ":1";
        var inch = Math.sqrt(Math.pow(dm.widthPixels / dm.xdpi, 2) + Math.pow(dm.heightPixels / dm.ydpi, 2));
        var hz = Math.round(disp.getRefreshRate()), rates = [];
        try {
            var modes = disp.getSupportedModes();
            for (var i = 0; i < modes.length; i++) { var rr = Math.round(modes[i].getRefreshRate()); if (rates.indexOf(rr) < 0) rates.push(rr); }
            rates.sort(function (a, b) { return a - b; });
        } catch (e) {}
        var B = android.os.Build, fp = String(B.FINGERPRINT || "") + " " + String(B.HARDWARE || "") + " " + String(B.PRODUCT || "") + " " + String(B.MODEL || "");
        var emu = /generic|emulator|sdk_|ranchu|goldfish|vbox|ldplayer|nox|bluestacks|memu|genymotion|andy|droid4x|mumu|aosp on/i.test(fp);
        o.short = sh + "x" + lg + " " + dpi + "dpi " + best + " · " + device.brand + " " + device.model + (emu ? " (emulator)" : "");
        o.full = "Display " + sh + " x " + lg + " @ " + hz + " Hz · " + dpi + " ppi (" + bucket + ") · " + inch.toFixed(2) + "in · aspect " + best +
            " · " + Math.round(lg / dm.density) + "dp x " + Math.round(sh / dm.density) + "dp · refresh " + (rates.length ? rates.join("/") + " Hz" : hz + " Hz") +
            " · " + device.brand + " " + device.model + " · Android " + device.release + " (API " + device.sdkInt + ") · emulator: " + (emu ? "likely" : "no");
    } catch (e) { o.short = device.width + "x" + device.height + " · " + device.brand + " " + device.model; o.full = o.short; }
    return o;
}
var DEV_INFO = devInfo();
log("device: " + DEV_INFO.full);

var store = storages.create("klassx_launcher");
store.put("autoPotsOn", false);   // Auto Pots forced OFF for now (re-enable with the Tools button or delete this line)
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

var alOn = store.get("autoLootOn", true);       // Auto loot ON/OFF (Tools panel) - see "Simple auto loot" further down
var AL_OCR_LANG = "en";                      // language of the OCR reader (also used by the Map member-number reader)
var alOcrEngine = (typeof gmlkit !== "undefined") ? "gmlkit" : ((typeof paddle !== "undefined") ? "paddle" : "");
// ---- Self tap: tap your own character every few seconds so it stops chasing / clicking mobs (selfTapStep further down) ----
var SELF_TAP_ON = store.get("selfTapOn", true);     // toggled by the "Self tap" button in Tools
var SELF_TAP_MS = 500;                             // time between self taps (ms)
var SELF_TAP_POS = [1288, 665];                    // your character's body on the reference 2576x1177 screen (centred) - move it if the tap misses the character
var SELF_TAP_COUNT = 1;                            // taps each time
var selfTapAt = 0, selfTaps = 0, selfTapWhy = 0;
// ---- Map: tap the minimap (top-right) to open the big map, tap the orange "M" (party leader) to walk back to them, then Close ----
var MAP_AUTO_ON = store.get("mapAutoOn", false);   // toggled by the "Map auto" button in Tools
var MAP_AUTO_MS = Number(store.get("mapAutoMs", 10000)) || 10000;   // time between automatic map runs (ms) - set with the "Every" box in the go-to panel
function mapFmt(ms) {                              // 10000 -> "10s", 120000 -> "2m", 90000 -> "1m30s"
    var t = Math.round(ms / 1000), m = Math.floor(t / 60), r = t % 60;
    return m ? (m + "m" + (r ? r + "s" : "")) : (t + "s");
}
var MAP_MINI = [2290, 190];                        // minimap on the reference 2576x1177 screen (top-right)
var MAP_BOX = [440, 130, 1715, 965];               // area of the big map where the "M" icon is searched (reference px)
var MAP_M_COLOR = "#E4A534", MAP_M_TH = 25;        // orange border of the "M" icon
var MAP_P_COLOR = "#46C0E4", MAP_P_TH = 25;        // cyan border of the numbered party-member icons (2-8) - used when the "M" is not on the map
var MAP_M_FALLBACK = [883, 665];                   // tapped if the icon can't be found
var MAP_CLOSE = [1983, 1020];                      // the big map's Close button (bottom-right)
var MAP_CLOSE_AFTER = true;                        // close the map after tapping M (needed so the next run starts clean)
var mapAutoAt = 0, mapKick = false, mapBusy = false;
// MAP LOCATION patrol (PLAY in the Map location panel): spot A -> kill all mobs + loot -> spot B -> kill all mobs + loot -> back to A ...
var sgPatrol = false, sgGo = false, sgSeq = [], sgPos = 0, sgArriveAt = 0, sgStage = 0, sgVerifyAt = 0;
var SG_CLEAR_MS = 6000;        // a spot counts as cleared when no monster has been near the character for this long (ms)
var SG_LOOT_QUIET_MS = 3000;   // ... and no loot item has been on screen for this long (ms)
var SG_VERIFY_MS = 3500;       // after the centre tap: this long with no monster and no loot before leaving (ms)
var SG_MAX_STAY_MS = 300000;   // safety: leave a spot after this long even if it never looks cleared (0 = never)
var MAP_WALK_OPTS = [3, 5, 8, 12, 15];             // seconds to pause attack / loot / self tap while the character walks to the tapped party member
var MAP_WALK_MS = Number(store.get("mapWalkMs", 8000)) || 8000;
var mapHoldUntil = 0;                              // attack + loot stay paused until this time
var MAP_LABELS = ["M", "2", "3", "4", "5", "6", "7", "8"];   // go-to panel: tick the party members to walk to (tried in this order, first one found on the map wins)
var MAP_SEL = String(store.get("mapSel", "11111111"));
if (MAP_SEL.length !== 8) MAP_SEL = "11111111";
function mapSelOn(i) { return MAP_SEL.charAt(i) === "1"; }
var capSeenAt = 0;                              // last time the captcha popup was on screen
var targetOn = false;        // auto target ON/OFF
var captchaOn = store.get("captchaOn", true);      // captcha solver ON/OFF
var teachOn = store.get("teachOn", true);          // captcha teach (ask for the code when a digit shape is unknown) ON/OFF
var skillSel = String(store.get("skillSel", "100000"));   // one 0/1 per slot: which skills to use
while (skillSel.length < SKILLS.length) skillSel += "0";
var skillDetect = store.get("skillDetect", false);   // false = TAP skills blindly, true = tap a skill only when its saved icon is found on screen
var gapIdx = store.get("gapIdx", 1);
if (gapIdx >= ATK_GAPS.length) gapIdx = 1;
var SKILLS_DISABLED = false;  // false = skill section ON (each skill is tapped while its button in the Skills panel is ON); true = skill taps off
function skillEnabled(i) { return !SKILLS_DISABLED && skillSel.charAt(i) === "1"; }

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
var MON_PUSH_MS = 120000;       // how often each copy uploads its status + log (ms) - lower = fresher but more Firestore writes
var MON_ONLINE_MS = 300000;     // a user counts as online if the last upload is newer than this (ms)
var MON_REFRESH_MS = 60000;     // admin panel auto-refresh while it is open (ms) - each refresh reads every user doc, so keep it slow (Firestore free quota)
var monBackoffUntil = 0;        // after an HTTP 429 (quota / rate limit) the auto-refresh pauses until this time
var MON_LOG_LINES = 40;         // log lines uploaded per user
var monShown = false, monView = "", monDocs = {}, monBusy = false, monFetching = false, monTok = null, monWarned = false;
var KICK_CHECK_MS = 90000;     // how often each copy checks whether an admin kicked it (ms) - one small Firestore read each time
var bgPauseUntil = 0;           // after an HTTP 429 the background Firestore calls (status upload, kick check) pause until this time
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
        if (floaty.checkPermission()) _fr.put("done", true);
    } catch (e) {}
})();

// ---- UI size: UI_SCALE shrinks every floating panel (sizes, margins, padding), UI_TEXT_SCALE shrinks the text. 1 = original size.
// Override without editing: put "0.7 0.8" (panel scale, text scale) in /sdcard/KlassX/ui_scale.txt
var UI_SCALE = 0.75;
var UI_TEXT_SCALE = 0.8;
try {
    var _us = "/sdcard/KlassX/ui_scale.txt";
    if (files.exists(_us)) {
        var _m = String(files.read(_us)).trim().split(/[\s,;]+/).map(Number);
        if (_m[0] >= 0.4 && _m[0] <= 1.5) { UI_SCALE = _m[0]; UI_TEXT_SCALE = (_m[1] >= 0.4 && _m[1] <= 1.5) ? _m[1] : _m[0]; }
    }
} catch (e) {}
var UI_DIM_ATTRS = { w: 1, h: 1, margin: 1, padding: 1, minWidth: 1, minHeight: 1, maxWidth: 1, maxHeight: 1, layout_margin: 1, marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1, paddingTop: 1, paddingBottom: 1, paddingLeft: 1, paddingRight: 1 };
function uiScaleXml(x) {           // XML literal -> same layout with every size and text size scaled
    try { if (LANG === "zh") x = uiTranslateXml(x); } catch (e) {}
    try {
        if (Math.abs(UI_SCALE - 1) < 0.01 && Math.abs(UI_TEXT_SCALE - 1) < 0.01) return x;
        var str = String(x && x.toXMLString ? x.toXMLString() : x);
        return str.replace(/<(\w+)((?:\s+[\w:]+="[^"]*")*)(\s*\/?)>/g, function (all, tag, attrs, end) {
            var attrs2 = attrs.replace(/([\w:]+)="([^"]*)"/g, function (a, name, val) {
                if (name === "textSize") return name + '="' + val.replace(/(\d+(?:\.\d+)?)/, function (n) { return Math.max(6, Math.round(Number(n) * UI_TEXT_SCALE)); }) + '"';
                if (UI_DIM_ATTRS[name] !== 1) return a;
                if (tag === "input" && name === "h") return a;                  // text boxes keep their height, otherwise the typed letters / numbers are cut off
                return name + '="' + val.replace(/(\d+(?:\.\d+)?)/g, function (n) { var v = Number(n); return v > 0 ? Math.max(1, Math.round(v * UI_SCALE)) : n; }) + '"';
            });
            return "<" + tag + attrs2 + end + ">";
        });
    } catch (e) { return x; }
}
var w = floaty.window(uiScaleXml(
    <frame>
        <img id="bg" w="*" h="*" scaleType="fitXY"/>
        <vertical id="panel" bg="#99000000" w="172" h="auto" padding="5">
            <horizontal>
                <text id="drag" text="⠿ KlassX  (drag)" textColor="#ffffff" textSize="8sp" gravity="center" layout_weight="1" w="0" h="25"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="langBtn" text="中文" w="30" h="25" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mini" text="—" w="36" h="25" textSize="9sp" margin="1" alpha="0.9"/>
            </horizontal>
            <scroll id="minilogscroll" w="*" h="80" visibility="gone" bg="#CC000000" margin="2">
                <text id="minilogview" w="*" text="" textColor="#FFEE58" textSize="8sp" padding="2"/>
            </scroll>
            <scroll id="mainscroll" w="*" h="auto">
            <vertical id="mainbody" w="*" h="auto">
            <vertical id="auth" w="*" h="auto" bg="#CC000000" margin="2" padding="3">
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="tabLogin" text="Login" layout_weight="1" w="0" h="29" textSize="9sp" margin="1"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="tabReg" text="Register" layout_weight="1" w="0" h="29" textSize="9sp" margin="1" alpha="0.5"/>
                </horizontal>
                <input id="authUser" hint="Username" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="20"/>
                <input id="authPass" hint="Password" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword"/>
                <input id="authPass2" hint="Confirm password" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword" visibility="gone"/>
                <input id="authKey" hint="Activation key (KLX-XXXX-XXXX-XXXX)" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="40" visibility="gone"/>
                <text id="authMsg" text="" w="*" h="auto" textColor="#ff8a80" textSize="9sp" gravity="center"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="authGo" text="Login" w="*" h="34" textSize="10sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="2"/>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="authRemember" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="authExit" text="Exit" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="updBtnA" text="⟳ Update" w="*" h="29" textSize="9sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
            </vertical>
            <vertical id="updbar" w="*" h="auto" visibility="gone" bg="#CC1B5E20" margin="2" padding="3">
                <text id="updText" text="" w="*" h="auto" textColor="#ffffff" textSize="9sp" gravity="center"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="updGo" text="Update now" w="*" h="31" textSize="9sp" textStyle="bold" textColor="#ffffff" bg="#2E7D32" margin="1"/>
            </vertical>
            <vertical id="subpanel" w="*" h="auto" visibility="gone" bg="#CC4A148C" margin="2" padding="3">
                <text id="subTitle" text="Subscription required" w="*" h="auto" textColor="#ffffff" textSize="9sp" textStyle="bold" gravity="center"/>
                <text id="subMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="9sp" gravity="center"/>
                <input id="subKey" hint="Subscription key (KLX-XXXX-XXXX-XXXX)" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="40"/>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="subPaste" text="Paste" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="subGo" text="Activate" layout_weight="1" w="0" h="31" textSize="9sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="1"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="updBtnS" text="⟳ Update" w="*" h="29" textSize="9sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="subLogout" text="Logout" w="*" h="27" textSize="9sp" margin="1" alpha="0.9"/>
            </vertical>
            <vertical id="controls" w="*" h="auto" visibility="gone">
            <text id="subInfo" text="" w="*" h="auto" textColor="#FFD54F" textSize="9sp" gravity="center"/>
            <text id="msTxt" text="" w="*" h="auto" visibility="gone" textColor="#FFD54F" textSize="8sp" gravity="center"/>
            <horizontal id="capRow" w="*" h="auto" bg="#99000000" margin="2" padding="2" visibility="gone" gravity="center_vertical">
                <img id="capImg" w="84" h="28" scaleType="fitCenter"/>
                <text id="capTxt" text="" layout_weight="1" w="0" h="auto" textColor="#FFE600" textSize="10sp" textStyle="bold" gravity="center"/>
            </horizontal>
            <horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="pick" text="" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="server" text="" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            </horizontal>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="channel" text="" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="play" text="▶ Play" w="*" h="36" textSize="10sp" textStyle="bold" textColor="#ffffff" bg="#2E7D32" margin="2"/>
            </vertical>
            <vertical id="controls2" w="*" h="auto" visibility="gone">
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="toolsBtn" text="Tools ▾" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="sgbtn" text="Map location ▾" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="lootbtn" text="Loot items ▾" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="monbtn" text="Monsters ▾" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="skills" text="Skills ▾" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            <vertical id="skillpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k0" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k1" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k2" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k3" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k4" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="k5" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="gap" text="" w="*" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="detect" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="saveicons" text="Save icons" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
            </vertical>
            <vertical id="toolpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="selftap" text="" w="*" h="32" textSize="9sp" margin="2" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="captcha" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="teach" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="apots" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="autoloot" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="ctap" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="handtap" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="montap" text="" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mapgo" text="Map now" layout_weight="1" w="0" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mapauto" text="" layout_weight="1" w="0" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="maptgt" text="Map go-to ▾" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
                <vertical id="mappanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
                    <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt0" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt1" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt2" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt3" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    </horizontal>
                    <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt4" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt5" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt6" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mt7" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    </horizontal>
                    <horizontal>
                        <text text="Every" textColor="#ffffff" textSize="9sp" w="34" h="34" gravity="center"/>
                        <input id="mapEvery" hint="30s / 2m" layout_weight="1" w="0" h="34" textSize="9sp" gravity="center" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="10"/>
                        <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mapEverySet" text="Set" w="46" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#2E7D32"/>
                    </horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mapwalk" text="" w="*" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </vertical>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="matchScr" text="Match screen" w="*" h="32" textSize="9sp" margin="1" alpha="0.9"/>
            </vertical>
            <horizontal visibility="gone">
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="quick" text="" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="qslots" text="Quick ▾" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            </horizontal>
            <vertical id="quickpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="2">
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q0" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q1" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q2" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q3" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q4" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="q5" text="" layout_weight="1" w="0" h="31" textSize="9sp" margin="1" alpha="0.9"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="qgap" text="" w="*" h="31" textSize="9sp" margin="1" alpha="0.9"/>
            </vertical>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="updBtnC" text="⟳ Update" w="*" h="29" textSize="9sp" textColor="#ffffff" bg="#2E7D32" margin="2" alpha="0.95"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="logout" text="Logout" w="*" h="29" textSize="9sp" margin="2" alpha="0.9"/>
            <vertical id="keybar" w="*" h="auto" visibility="gone" bg="#CC4A148C" margin="2" padding="2">
                <horizontal>
                    <input id="admDays" text="30" hint="Days (1-30) or 12h" inputType="text" layout_weight="1" w="0" h="36" textSize="9sp" gravity="center" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="5" margin="1"/>
                    <input id="admUses" text="10" hint="Users (0=many)" inputType="number" layout_weight="1" w="0" h="36" textSize="9sp" gravity="center" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="4" margin="1"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admGenKey" text="Generate key" layout_weight="2" w="0" h="36" textSize="9sp" textStyle="bold" textColor="#ffffff" bg="#6A1B9A" margin="1"/>
                </horizontal>
                <text id="keyMsg" text="" w="*" h="auto" textColor="#a5d6a7" textSize="9sp" gravity="center"/>
            </vertical>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admin" text="Admin ▾" visibility="gone" w="*" h="29" textSize="9sp" margin="2" alpha="0.9"/>
            <scroll id="admscroll" w="*" h="171" visibility="gone" margin="2">
            <vertical id="adminpanel" w="*" h="auto" bg="#CC000000" padding="3">
                <text id="admInfo" text="" w="*" h="auto" textColor="#ffffff" textSize="9sp" gravity="center"/>
                <horizontal>
                    <input id="admRepo" hint="Repo: owner/name" layout_weight="1" w="0" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="120"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admRepoSave" text="Save" w="52" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#2E7D32"/>
                </horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admBrowse" text="Browse / upload file..." w="*" h="29" textSize="9sp" margin="1" alpha="0.9"/>
                <input id="admFile" hint="File to publish (empty = this script)" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true"/>
                <input id="admToken" hint="GitHub token" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" inputType="textPassword"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admPaste" text="Paste token from clipboard" w="*" h="29" textSize="9sp" margin="1" alpha="0.9"/>
                <input id="admNotes" hint="What's new (shown to users)" w="*" h="36" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="120"/>
                <text id="admMsg" text="" w="*" h="auto" textColor="#a5d6a7" textSize="9sp" gravity="center"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admPublish" text="Publish update" w="*" h="32" textSize="9sp" textStyle="bold" textColor="#ffffff" bg="#1565C0" margin="1"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="admReset" text="Reset publish settings" w="*" h="29" textSize="9sp" margin="1" alpha="0.9"/>
            </vertical>
            </scroll>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="monBtn" text="Users ▾" visibility="gone" w="*" h="29" textSize="9sp" margin="2" alpha="0.9"/>
            <horizontal id="usrtabs" w="*" h="auto" visibility="gone">
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="tabMon" text="Monitor" layout_weight="1" w="0" h="29" textSize="9sp" margin="2"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="tabDev" text="Devices" layout_weight="1" w="0" h="29" textSize="9sp" margin="2"/>
            </horizontal>
            <vertical id="monpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="3">
                <horizontal>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="monBack" text="◀" visibility="gone" w="33" h="27" textSize="9sp" margin="1"/>
                    <text id="monTitle" text="Users" layout_weight="1" w="0" h="27" gravity="center_vertical" textColor="#ffffff" textSize="9sp" textStyle="bold"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="monKick" text="Kick" visibility="gone" w="46" h="27" textSize="9sp" margin="1" textColor="#ffffff" bg="#C62828"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="monRefresh" text="⟳" w="33" h="27" textSize="9sp" margin="1"/>
                </horizontal>
                <text id="monMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="9sp" gravity="center"/>
                <scroll id="monscroll" w="*" h="144">
                    <vertical id="monlist" w="*" h="auto"/>
                </scroll>
                <scroll id="monlogscroll" w="*" h="180" visibility="gone">
                    <text id="monlogtext" w="*" text="" textColor="#FFEE58" textSize="9sp" padding="3"/>
                </scroll>
            </vertical>
            <vertical id="devpanel" w="*" h="auto" visibility="gone" bg="#CC000000" margin="2" padding="3">
                <horizontal>
                    <text id="devTitle" text="User devices" layout_weight="1" w="0" h="27" gravity="center_vertical" textColor="#ffffff" textSize="9sp" textStyle="bold"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devResetAll" text="Reset ALL" w="64" h="27" textSize="9sp" margin="1" textColor="#ffffff" bg="#C62828"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devRefresh" text="⟳" w="33" h="27" textSize="9sp" margin="1"/>
                </horizontal>
                <text id="devMsg" text="" w="*" h="auto" textColor="#ffcc80" textSize="9sp" gravity="center"/>
                <text id="devSel" text="Tap a user to select" w="*" h="auto" textColor="#FFD54F" textSize="9sp" gravity="center"/>
                <horizontal>
                    <input id="devDays" hint="Days (e.g. 30, or -5)" layout_weight="1" w="0" h="34" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="5"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devAddDays" text="+ Add" w="49" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#1565C0"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devSetDays" text="Set" w="49" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#6A1B9A"/>
                </horizontal>
                <horizontal>
                    <input id="devInput" hint="Device ID to allow" layout_weight="1" w="0" h="34" textSize="9sp" textColor="#ffffff" textColorHint="#99ffffff" singleLine="true" maxLength="64"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devAllow" text="Allow" w="49" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#2E7D32"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="devReset" text="Reset" w="49" h="34" textSize="9sp" margin="1" textColor="#ffffff" bg="#C62828"/>
                </horizontal>
                <scroll id="devscroll" w="*" h="234">
                    <vertical id="devlist" w="*" h="auto"/>
                </scroll>
            </vertical>
            <horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="log" text="Log" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="exit" text="Exit" layout_weight="1" w="0" h="32" textSize="9sp" margin="2" alpha="0.9"/>
            </horizontal>
            </vertical>
            </vertical>
            </scroll>
        </vertical>
    </frame>
));
w.setPosition(Math.max(0, device.width - Math.round(520 * UI_SCALE)), Math.max(0, Math.min(200, device.height - 120)));

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
        w.admscroll.setOnTouchListener(keepInner);
        w.monscroll.setOnTouchListener(keepInner);
        w.monlogscroll.setOnTouchListener(keepInner);
        w.devscroll.setOnTouchListener(keepInner);
    } catch (e) {}
});

// Background: the logo is cropped + scaled (centre-crop) to exactly the panel's pixel size, so it always fills the whole
// panel - portrait 720x1280 and landscape 1280x720 (the panel is shorter there) - with no gap and no overhang.
var bgSrc = null, bgShown = null, bgLastW = 0, bgLastH = 0;
function applyBg() {
    try {
        var pw = w.panel.getWidth(), ph = w.panel.getHeight();
        if (pw <= 0 || ph <= 0 || !bgSrc) return;
        if (pw === bgLastW && ph === bgLastH) return;
        bgLastW = pw; bgLastH = ph;
        var sw = bgSrc.getWidth(), sh = bgSrc.getHeight();
        var sc = Math.max(pw / sw, ph / sh);
        var cw = Math.min(sw, Math.max(1, Math.round(pw / sc))), ch = Math.min(sh, Math.max(1, Math.round(ph / sc)));
        var cx = Math.max(0, Math.round((sw - cw) / 2)), cy = Math.max(0, Math.round((sh - ch) / 2));
        var crop = android.graphics.Bitmap.createBitmap(bgSrc, cx, cy, cw, ch);
        var out = android.graphics.Bitmap.createScaledBitmap(crop, pw, ph, true);
        if (crop !== out && crop !== bgSrc) { try { crop.recycle(); } catch (e3) {} }
        var old = bgShown; bgShown = out;
        w.bg.setImageBitmap(out);
        if (old && old !== out) { try { old.recycle(); } catch (e4) {} }
    } catch (e) {}
}
ui.run(function () {
    try {
        var bytes = android.util.Base64.decode(BG_B64, 0);
        bgSrc = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        w.panel.getViewTreeObserver().addOnGlobalLayoutListener(new android.view.ViewTreeObserver.OnGlobalLayoutListener({
            onGlobalLayout: function () { applyBg(); }
        }));
        applyBg();
    } catch (e) {
        w.bg.setBackgroundColor(android.graphics.Color.parseColor("#101010"));
    }
});

// ---- Glowing yellow theme (UI_THEME_YELLOW = false -> original colours) ----
// Restyles the panel once after it is built: buttons get a glowing yellow edge + glowing yellow text, main action buttons are solid yellow,
// panels get a thin yellow edge, headings glow. Stop / Kick / Reset stay red so danger buttons are still obvious.
var UI_THEME_YELLOW = true;
var UI_YELLOW = "#FFE600";        // main glow colour
var UI_YELLOW_DARK = "#1A1400";   // text on solid yellow buttons
var UI_HALO = "#88FFE600";        // soft outer glow of the borders
function uiPx(n) { return Math.max(1, Math.round(n * context.getResources().getDisplayMetrics().density)); }
function uiShape(fill, stroke, sw, r) {
    var g = new android.graphics.drawable.GradientDrawable();
    g.setColor(fill); g.setCornerRadius(r);
    if (sw > 0) g.setStroke(sw, stroke);
    return g;
}
function uiGlowBg(fill, r) {      // bright inner edge + soft halo around it
    var inner = uiShape(fill, android.graphics.Color.parseColor(UI_YELLOW), uiPx(1.2), r);
    try {
        var outer = uiShape(0, android.graphics.Color.parseColor(UI_HALO), uiPx(3), r + uiPx(1));
        var ld = new android.graphics.drawable.LayerDrawable([outer, inner]);
        ld.setLayerInset(1, uiPx(2), uiPx(2), uiPx(2), uiPx(2));
        return ld;
    } catch (e) { return inner; }
}
function uiSetBg(v, d) {          // swap the background without losing the view's padding
    var l = v.getPaddingLeft(), t = v.getPaddingTop(), r = v.getPaddingRight(), b = v.getPaddingBottom();
    v.setBackground(d); v.setPadding(l, t, r, b);
}
function uiPlayStyle(btn, running) {
    var C = android.graphics.Color;
    if (running) { uiSetBg(btn, uiShape(C.parseColor("#C62828"), 0, 0, uiPx(6))); btn.setTextColor(C.WHITE); btn.setShadowLayer(0, 0, 0, 0); }
    else { uiSetBg(btn, uiGlowBg(C.parseColor(UI_YELLOW), uiPx(6))); btn.setTextColor(C.parseColor(UI_YELLOW_DARK)); btn.setShadowLayer(0, 0, 0, 0); }
}
function uiYellowApply() {
    try {
        var C = android.graphics.Color, CD = android.graphics.drawable.ColorDrawable;
        var yel = C.parseColor(UI_YELLOW), outlineFill = C.parseColor("#CC1A1500"), panelFill = C.parseColor("#CC2B2300");
        var ACCENT = { "2E7D32": 1, "1565C0": 1, "6A1B9A": 1 }, topDone = false;
        var walk = function (v) {
            var bgd = null, c = 0, hex = "";
            try { bgd = v.getBackground(); if (bgd instanceof CD) { c = bgd.getColor(); hex = ("000000" + (c & 0xFFFFFF).toString(16)).slice(-6).toUpperCase(); } } catch (e) {}
            try {
                if (v instanceof android.widget.Button) {
                    if (hex === "C62828") { uiSetBg(v, uiShape(c, 0, 0, uiPx(6))); }                                    // danger button: keep red, just round it
                    else if (ACCENT[hex]) { uiSetBg(v, uiGlowBg(yel, uiPx(6))); v.setTextColor(C.parseColor(UI_YELLOW_DARK)); }   // main action: solid yellow
                    else { uiSetBg(v, uiGlowBg(outlineFill, uiPx(6))); v.setTextColor(yel); v.setShadowLayer(uiPx(4), 0, 0, yel); }
                } else if (v instanceof android.widget.EditText) {
                    try { v.setBackgroundTintList(android.content.res.ColorStateList.valueOf(yel)); } catch (e2) {}
                } else if (v instanceof android.widget.TextView) {
                    if (v.getCurrentTextColor() === C.WHITE) { v.setTextColor(yel); v.setShadowLayer(uiPx(5), 0, 0, yel); }   // white headings -> glowing yellow
                } else if (v instanceof android.view.ViewGroup && bgd instanceof CD) {
                    if (hex === "000000" && (c >>> 24) !== 0xFF) {
                        if (!topDone) { topDone = true; uiSetBg(v, uiGlowBg(c, uiPx(8))); }           // the whole panel glows
                        else uiSetBg(v, uiShape(c, C.parseColor("#B3FFE600"), uiPx(1), uiPx(5)));      // inner boxes: thin yellow edge
                    } else if (hex === "4A148C" || hex === "1B5E20") {
                        uiSetBg(v, uiShape(panelFill, C.parseColor("#B3FFE600"), uiPx(1), uiPx(5)));   // purple / green notice boxes -> amber
                    }
                }
            } catch (e3) {}
            if (v instanceof android.view.ViewGroup) for (var i = 0; i < v.getChildCount(); i++) walk(v.getChildAt(i));
        };
        walk(w.mainbody.getRootView());
    } catch (e) { try { log("yellow theme error: " + e); } catch (e4) {} }
}
if (UI_THEME_YELLOW) ui.run(uiYellowApply);

function refreshServerLabel() {
    w.server.setText(T("Srv: " + SERVERS[serverIdx].name));
    w.pick.setText(T(pickOn ? "Pick: ON" : "Pick: OFF"));
    w.server.setAlpha(pickOn ? 1 : 0.4);
    try { refreshChannelLabel(); } catch (e) {}
}
ui.run(refreshServerLabel);
function refreshChannelLabel() {
    w.channel.setText(T("Channel: " + CHANNEL_IDX + " (tap)"));
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

// Find the keypad tiles and the Confirm button from the picture itself (the popup is scaled/laid out differently
// on every phone, so fixed reference coordinates drift). bx = the located code box. Returns null if unsure.
var capKp = null;
function capFindKeys(img, W, H, bx) {
    var st = Math.max(2, Math.round(bx.w / 200)), x, y;
    var xa = Math.max(0, bx.x), xb = Math.min(W - 1, bx.x + bx.w);
    var ya = Math.max(0, bx.y + Math.round(bx.h * 1.1)), yb = Math.min(H - 1, bx.y + Math.round(bx.h * 3.3));
    function lit(px, py) { var c = img.pixel(px, py); return Math.min(capR(c), capG(c), capB(c)) >= 60; }
    var runs = [], inRun = false, s = 0, last = 0, gap = 0;
    for (y = ya; y <= yb; y += st) {
        var n = 0, tot = 0;
        for (x = xa; x <= xb; x += st) { tot++; if (lit(x, y)) n++; }
        if (tot > 0 && n / tot >= 0.6) { if (!inRun) { inRun = true; s = y; } last = y; gap = 0; }
        else if (inRun) { gap += st; if (gap > st) { runs.push([s, last]); inRun = false; } }
    }
    if (inRun) runs.push([s, last]);
    var good = [], i;
    for (i = 0; i < runs.length; i++) if (runs[i][1] - runs[i][0] >= bx.h * 0.10) good.push(runs[i]);
    if (good.length < 2) return null;
    var r1 = good[0], r2 = good[1], h1 = r1[1] - r1[0], h2 = r2[1] - r2[0];
    if (Math.abs(h1 - h2) > 0.35 * Math.max(h1, h2)) return null;
    var yl = Math.round(r1[0] + h1 * 0.2), xl = -1, xr = -1, xs = Math.max(0, bx.x - Math.round(bx.w * 0.06)), xe = Math.min(W - 4, bx.x + bx.w + Math.round(bx.w * 0.06));
    for (x = xs; x <= xe; x += 2) if (lit(x, yl) && lit(x + 2, yl) && lit(x + 4, yl)) { xl = x; break; }
    for (x = xe; x >= xs; x -= 2) if (lit(x, yl) && lit(x - 2, yl) && lit(x - 4, yl)) { xr = x; break; }
    if (xl < 0 || xr - xl < bx.w * 0.7 || xr - xl > bx.w * 1.15) return null;
    var tw = (xr - xl) / 5, cx = [];
    for (i = 0; i < 5; i++) cx.push(xl + tw * (i + 0.5));
    var kp = { cx: cx, cy: [(r1[0] + r1[1]) / 2, (r2[0] + r2[1]) / 2], tw: tw, th: (h1 + h2) / 2, confirm: null };
    if (good.length >= 4) {                         // 3rd bar = Clear, 4th bar = Confirm
        var rc = good[2], rf = good[3], hc = rc[1] - rc[0], hf = rf[1] - rf[0];
        if (Math.abs(hc - hf) <= 0.5 * Math.max(hc, hf)) {
            kp.clear = [Math.round((xl + xr) / 2), Math.round((rc[0] + rc[1]) / 2)];
            kp.confirm = [Math.round((xl + xr) / 2), Math.round((rf[0] + rf[1]) / 2)];
        }
    }
    return kp;
}
function capPopupShown(img, W, H) {
    capL = null; capKp = null;
    var usual = capCheckBox(img, layoutOf(W, H));       // the usual centred spot
    var bx = null;
    try { bx = capLocate(img, W, H); } catch (e) { logErr("captcha locate", e); }
    var okBx = !!(bx && bx.w >= 20 && bx.h >= 8);
    if (okBx) {
        try { capKp = capFindKeys(img, W, H, bx); } catch (e2) { logErr("keypad locate", e2); capKp = null; }
        if (capKp) capDiag("keypad located: tiles " + Math.round(capKp.tw) + " wide, rows at y " + Math.round(capKp.cy[0]) + "/" + Math.round(capKp.cy[1]) + ", Confirm " + (capKp.confirm ? "at y " + capKp.confirm[1] : "not found (using default spot)"), "kp");
        else if (usual) capDiag("keypad not located from the picture (using default spots)", "kp");
    }
    if (usual) return true;
    if (!okBx) return false;
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
    if (capKp) { hw = Math.round(capKp.tw * 0.205); hh = Math.round((capKp.cy[1] - capKp.cy[0]) * 0.263); st = Math.max(1, Math.round(capKp.tw / 134)); }
    var nx = Math.floor(2 * hw / st), ny = Math.floor(2 * hh / st);
    var px = [];                                   // read every pixel once, reuse for each threshold
    for (r = 0; r < 2; r++) for (c = 0; c < 5; c++) {
        var cx = capKp ? Math.round(capKp.cx[c]) : mapX(L, KEY_CX[c], "c"), cy = capKp ? Math.round(capKp.cy[r]) : mapY(L, KEY_CY[r], "c"), br = [];
        for (y = 0; y < ny; y++) {
            var row = [];
            for (x = 0; x < nx; x++) { var p = img.pixel(cx - hw + x * st, cy - hh + y * st); row.push(Math.min(capR(p), capG(p), capB(p))); }
            br.push(row);
        }
        px.push({ br: br, cx: cx, cy: cy });
    }
    capKeyInfo = ""; capKeyLast = null;
    var bestCand = null;
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
        var usedS = {}, usedD = {}, map = {}, worst = 0, n, keyDist = [], bad = 0, keyD = {}, keyG = {};      // greedy: smallest distance first
        for (n = 0; n < 10; n++) {
            var bs = -1, bd = -1, bv = 9;
            for (i = 0; i < 10; i++) { if (usedS[i]) continue; for (dg = 0; dg <= 9; dg++) { if (usedD[dg]) continue; if (dm[i][dg] < bv) { bv = dm[i][dg]; bs = i; bd = dg; } } }
            usedS[bs] = true; usedD[bd] = true; map[bd] = [px[bs].cx, px[bs].cy]; keyDist[bs] = bd + ":" + bv.toFixed(2);
            if (bv > 0.22) bad++;
            keyD[bd] = bv; keyG[bd] = gls[bs];
            if (!hasNeed || need[String(bd)]) worst = Math.max(worst, bv);      // only the keys we must press have to match
        }
        capKeyInfo += (capKeyInfo ? " | " : "") + "br" + thrs[t] + " " + (hasNeed ? "needed-keys " : "") + "worst " + worst.toFixed(2) + " [" + keyDist.join(" ") + "]";
        if (worst <= 0.22) { capKeyLast = { keyD: keyD, keyG: keyG }; return map; }
        // one poorly matching key while the other 9 match well: the pad holds 0-9 exactly once, so it is the leftover digit
        if (bad <= 1 && worst <= 0.6 && (!bestCand || worst < bestCand.worst)) bestCand = { map: map, worst: worst, thr: thrs[t], keyD: keyD, keyG: keyG };
    }
    if (bestCand) {
        capKeyInfo += " => accepted by elimination at br" + bestCand.thr + " (worst " + bestCand.worst.toFixed(2) + ")";
        capKeyLast = { keyD: bestCand.keyD, keyG: bestCand.keyG };
        return bestCand.map;
    }
    return null;
}
var capKeyLast = null;
var CAP_KEYBANK_FILE = CAP_BANK_FILE.replace("code_bank.json", "key_bank.json");
(function () {                                  // keypad shapes learned from earlier solved popups
    try {
        if (!files.exists(CAP_KEYBANK_FILE)) return;
        var ex = JSON.parse(files.read(CAP_KEYBANK_FILE));
        for (var d in ex) for (var i = 0; i < ex[d].length; i++) CAP_KEY_BANK[d].push(capTpl(ex[d][i]));
    } catch (e) { logErr("key_bank.json", e); }
})();
function capLearnKeys() {                       // after a solved popup: keep the key shapes that matched poorly
    try {
        if (!capKeyLast) return;
        var ex = {}, changed = false, d;
        if (files.exists(CAP_KEYBANK_FILE)) { try { ex = JSON.parse(files.read(CAP_KEYBANK_FILE)); } catch (e0) { ex = {}; } }
        for (d in capKeyLast.keyD) {
            if (capKeyLast.keyD[d] < 0.1 || CAP_KEY_BANK[d].length >= 8) continue;
            var g = capKeyLast.keyG[d], str = g.bits + "|" + g.ratio.toFixed(3);
            CAP_KEY_BANK[d].push(capTpl(str));
            if (!ex[d]) ex[d] = [];
            ex[d].push(str); changed = true;
        }
        if (changed) { files.ensureDir(CAP_KEYBANK_FILE); files.write(CAP_KEYBANK_FILE, JSON.stringify(ex)); log("Captcha: learned new keypad shapes"); }
    } catch (e) { logErr("capLearnKeys", e); }
}

var lastCapSample = 0, lastCapText = "", lastCapAt = 0, capDiagAt = {}, capTries = 0;
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
        var cw = mapX(L, KEY_CX[4] + 60, "c") - x0, ch = mapY(L, KEY_CY[1] + 40, "c") - y0;
        if (capKp) { x0 = Math.max(0, Math.round(capKp.cx[0] - capKp.tw)); y0 = Math.max(0, Math.round(capKp.cy[0] - capKp.th)); cw = Math.round(capKp.tw * 7); ch = Math.round(capKp.th * 3.2); }
        var clip = images.clip(img, x0, y0, Math.min(cw, W - x0), Math.min(ch, H - y0));
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
// ---- captcha shown in the panel: the code picture + the digits the script read + what it is doing with them ----
var capShownBmp = null;
function capPanelShow(img, W, H, code, status) {
    try {
        var bmp2 = null;
        try {
            var L = capLayout(W, H);
            var clip = images.clip(img, mapX(L, CAP_BOX[0], "c"), mapY(L, CAP_BOX[1], "c"), Math.round(CAP_BOX[2] * L.kx), Math.round(CAP_BOX[3] * L.ky));
            if (clip) { bmp2 = android.graphics.Bitmap.createBitmap(clip.getBitmap()); try { clip.recycle(); } catch (e1) {} }
        } catch (e0) { bmp2 = null; }
        ui.run(function () {
            try {
                w.capRow.setVisibility(android.view.View.VISIBLE);
                if (bmp2) { var old = capShownBmp; w.capImg.setImageBitmap(bmp2); capShownBmp = bmp2; if (old) { try { old.recycle(); } catch (e2) {} } }
                w.capTxt.setText(String(code || "?????").replace(/\?/g, "_") + "\n" + status);
            } catch (e3) {}
        });
    } catch (e) {}
}
function capPanelStatus(code, status) {
    ui.run(function () { try { w.capTxt.setText(String(code || "?????").replace(/\?/g, "_") + "\n" + status); } catch (e) {} });
}
// ===================== Clicker stop / resume (the blue button of the floating clicker control) =====================
// The clicker control shows a blue SQUARE while the clicker runs and a blue TRIANGLE (play) while it is stopped.
// When the captcha popup shows up the script finds the blue square on the screen (wherever you dragged the control),
// taps it so the clicker stops, solves the captcha, and when the popup is gone taps the blue triangle so the clicker
// (and the attack) starts again.
var CLICKER_STOP = true;                 // false = never touch the clicker button
var CLICKER_RESUME = true;               // true = tap the blue triangle again after the captcha is gone
var CLICKER_AUTOFIND = true;             // true = look for the blue button on the screen; false = only look around CLICKER_PT below
var CLICKER_PT = [235, 348];             // only used when CLICKER_AUTOFIND is false: centre of the button in REF_W x REF_H coordinates
var CAPTCHA_CHECK_MS = 1500;             // how often the screen is checked for the captcha popup (ms)
var clickerStoppedByUs = false, clickerWarnAt = 0, clickerPos = null, clickerMissAt = 0, clickerLootAt = 0;
var clickerReasons = { captcha: false, loot: false, map: false, mon: false, s5: false};     // why the clicker is held - it starts again only when no reason is left
function isClickerBlue(c) {                // the blue of the clicker button, about rgb(40,121,254)
    var cr = colors.red(c), cg = colors.green(c), cb = colors.blue(c);
    return cb > 180 && cb - cr > 100 && cb - cg > 40;
}
// scan the screen on a coarse grid and group the blue cells; a group is "sq" when it is a solid square of the right size
function clickerRectNear(H) {              // small area around the known clicker button (the full-screen scan below needs ~3 s, this one ~0.1 s)
    if (!clickerPos) return null;
    var m = H * 0.16;
    return [clickerPos[0] - m, clickerPos[1] - m, clickerPos[0] + m, clickerPos[1] + m];
}
function clickerFind(img, W, H, rect) {
    var step = Math.max(4, Math.round(H / 120)), gw = Math.floor(W / step), gh = Math.floor(H / step), g = [], x, y;
    var gx0 = 0, gy0 = 0, gx1 = gw, gy1 = gh;
    if (rect) { gx0 = Math.max(0, Math.floor(rect[0] / step)); gy0 = Math.max(0, Math.floor(rect[1] / step)); gx1 = Math.min(gw, Math.ceil(rect[2] / step)); gy1 = Math.min(gh, Math.ceil(rect[3] / step)); }
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) g.push((x >= gx0 && x < gx1 && y >= gy0 && y < gy1 && isClickerBlue(images.pixel(img, x * step + (step >> 1), y * step + (step >> 1)))) ? 1 : 0);
    var groups = [], nBlue = 0;
    for (y = 0; y < gh; y++) {
        for (x = 0; x < gw; x++) {
            if (g[y * gw + x] !== 1) continue;
            var st = [[x, y]], cnt = 0, x0 = x, x1 = x, y0 = y, y1 = y;
            g[y * gw + x] = 2;
            while (st.length) {
                var q = st.pop(), qx = q[0], qy = q[1];
                cnt++; if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
                var nb = [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]];
                for (var k = 0; k < 4; k++) {
                    var nx = nb[k][0], ny = nb[k][1];
                    if (nx < 0 || ny < 0 || nx >= gw || ny >= gh || g[ny * gw + nx] !== 1) continue;
                    g[ny * gw + nx] = 2; st.push([nx, ny]);
                }
            }
            nBlue += cnt;
            var bw = (x1 - x0 + 1) * step, bh = (y1 - y0 + 1) * step, ratio = bw / bh, fill = cnt / ((x1 - x0 + 1) * (y1 - y0 + 1));
            if (bw < H * 0.03 || bw > H * 0.16 || bh < H * 0.03 || bh > H * 0.16 || ratio < 0.6 || ratio > 1.67) continue;   // not button sized
            groups.push({ cnt: cnt, x: Math.round((x0 + x1 + 1) * step / 2), y: Math.round((y0 + y1 + 1) * step / 2), w: bw, h: bh, sq: fill >= 0.8 && ratio >= 0.75 && ratio <= 1.33 });
        }
    }
    return { groups: groups, blueCells: nBlue };
}
function clickerPick(f, W, H, wantSquare) {     // the best button-like group (optionally only squares, and near the saved / fixed spot)
    var ref = null;
    if (!CLICKER_AUTOFIND) { var L = layoutOf(W, H); ref = [mapX(L, CLICKER_PT[0], "l"), mapY(L, CLICKER_PT[1], "t")]; }
    else if (!wantSquare && clickerPos) ref = clickerPos;
    var best = null;
    f.groups.forEach(function (gp) {
        if (wantSquare && !gp.sq) return;
        if (ref && Math.abs(gp.x - ref[0]) > H * 0.12 || ref && Math.abs(gp.y - ref[1]) > H * 0.12) return;
        if (!best || gp.cnt > best.cnt) best = gp;
    });
    return best;
}
function clickerStop(img, W, H, reason) {
    reason = reason || "captcha";
    if (!CLICKER_STOP) return;
    clickerReasons[reason] = true;
    if (reason === "loot" && !clickerLootAt) clickerLootAt = Date.now();
    if (clickerStoppedByUs) return;
    if (Date.now() - clickerMissAt < 4000) return;                 // looked a moment ago and found no blue square - do not scan again every time
    var f = clickerFind(img, W, H, clickerRectNear(H)), sq = clickerPick(f, W, H, true);
    if (!sq && clickerPos) { f = clickerFind(img, W, H); sq = clickerPick(f, W, H, true); }      // moved? look on the whole screen
    if (!sq) {
        clickerMissAt = Date.now();
        if (Date.now() - clickerWarnAt > 30000) { clickerWarnAt = Date.now(); log("Clicker: no blue square found on the screen (" + f.blueCells + " blue cells) - clicker is stopped already or its control is hidden - not tapping"); }
        return;
    }
    clickerPos = [sq.x, sq.y];
    press(sq.x, sq.y, TAP_MS);
    clickerStoppedByUs = true;
    log("Clicker: " + (reason === "loot" ? "looting" : reason === "map" ? "map open" : reason === "mon" ? "no ticked monster" : reason === "s5" ? "S5 skill" : "captcha showing") + " -> tapped the blue square at " + sq.x + "," + sq.y + " (screen " + W + "x" + H + ") - clicker stopped");
    nap(400);
}
function clickerResume(img, W, H, reason) {
    reason = reason || "captcha";
    clickerReasons[reason] = false;
    if (reason === "loot") clickerLootAt = 0;
    if (clickerReasons.captcha || clickerReasons.loot || clickerReasons.map || clickerReasons.mon || clickerReasons.s5) return;     // another reason still holds the clicker
    if (!clickerStoppedByUs) return;
    if (!CLICKER_RESUME) { clickerStoppedByUs = false; return; }
    var f = clickerFind(img, W, H, clickerRectNear(H));
    if (clickerPick(f, W, H, true)) { clickerStoppedByUs = false; log("Clicker: blue square is back - already running"); return; }     // square = it runs, never toggle it off
    var tri = clickerPick(f, W, H, false);                                  // the blue triangle (play) of the stopped clicker
    var tx = tri ? tri.x : (clickerPos ? clickerPos[0] : 0), ty = tri ? tri.y : (clickerPos ? clickerPos[1] : 0);
    if (!tx && !ty) { clickerStoppedByUs = false; return; }
    clickerStoppedByUs = false;
    press(tx, ty, TAP_MS);
    log("Clicker: " + (reason === "loot" ? "loot done" : reason === "map" ? "map closed" : reason === "mon" ? "monster back" : reason === "s5" ? "S5 done" : "captcha gone") + " -> tapped the blue " + (tri ? "triangle" : "button spot") + " at " + tx + "," + ty + " - clicker running again");
    nap(300);
    for (var vt = 1; vt <= 3; vt++) {                                       // check that the clicker really started (blue square back); if not, tap the triangle again
        nap(500);
        var vim = grabScreen(); if (!vim) break;
        var vW = vim.getWidth(), vH = vim.getHeight();
        if (clickerPick(clickerFind(vim, vW, vH, clickerRectNear(vH)), vW, vH, true)) break;
        press(tx, ty, TAP_MS);
        log("Clicker: triangle not confirmed - tapping it again (try " + vt + "/3)");
        nap(300);
    }
}

function solveCaptchaOnScreen(screenImg) {
    var img = screenImg || grabScreen();
    if (!img) return;
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return;   // portrait capture = not the game
    if (!capPopupShown(img, W, H)) {                // no verification popup -> nothing to do
        try { clickerResume(img, W, H); } catch (cke) { if (String(cke).indexOf("STOPPED") >= 0) throw cke; logErr("clicker resume", cke); }
        return;
    }
    capSeenAt = Date.now();                         // auto loot keeps its taps off while this popup is up
    try { clickerStop(img, W, H); } catch (cke2) { if (String(cke2).indexOf("STOPPED") >= 0) throw cke2; logErr("clicker stop", cke2); }

    var rd = capReadCode(img, W, H);
    capDiag("popup detected -> read " + rd.text + (rd.info ? "  [" + rd.info + "]" : ""), "p");
    var capOk = !!rd.glyphs && rd.text.length === 5 && rd.text.indexOf("?") < 0;
    capPanelShow(img, W, H, rd.text, capOk ? "read ✔" : "cannot read all digits");
    if (!rd.glyphs || rd.text.length !== 5 || rd.text.indexOf("?") >= 0) {
        if (teachOn && rd.glyphs) capTeachSave(img, W, H, rd); else capSaveSample(img, W, H, rd.text || "none");
        capDiag("cannot read all 5 digits confidently (shapes still unknown: [" + capMissingDigits() + "]) - not typing, samples saved in " + CAP_SAMPLE_DIR + (teachOn ? "" : " (turn Teach crop ON to also save every unknown digit as its own picture)"), "u");
        return;
    }
    capSaveSample(img, W, H, rd.text);
    if (rd.text !== lastCapText) capTries = 0;
    if (rd.text === lastCapText && Date.now() - lastCapAt < 60000) {
        if (capTries >= 3 || Date.now() - lastCapAt < 8000) {
            capDiag("same code " + rd.text + " is still showing after submit - waiting before retry (try " + capTries + "/3)", "s");
            capPanelStatus(rd.text, "still showing - wrong?");
            return;
        }
        log("Captcha: retrying " + rd.text + " (try " + (capTries + 1) + "/3)");
    }
    capTries++;
    var keys = capReadKeypad(img, W, H, rd.text);
    if (!keys) { capSaveKeypad(img, W, H); capDiag("could not read the keypad labels (" + capKeyInfo + ") - not typing", "k"); return; }

    var kl = []; for (var ki = 0; ki < 5; ki++) { var kp0 = keys[rd.text.charAt(ki)]; kl.push(rd.text.charAt(ki) + "@" + kp0[0] + "," + kp0[1]); }
    log("Captcha typing " + rd.text + " -> " + kl.join(" ") + (capKp && capKp.confirm ? " | Confirm@" + capKp.confirm[0] + "," + capKp.confirm[1] : " | Confirm default"));
    if (capKp && capKp.clear) {                     // tap Clear first so no old digits stay in the box
        press(capKp.clear[0], capKp.clear[1], TAP_MS);
        log("Captcha: tapped Clear");
        nap(400);
    } else log("Captcha: Clear button not located - not tapped");
    capPanelStatus(rd.text, "typing...");
    for (var i = 0; i < 5; i++) {
        var pt = keys[rd.text.charAt(i)];
        press(pt[0], pt[1], TAP_MS);
        nap(350);
    }
    nap(200);
    if (capKp && capKp.confirm) press(capKp.confirm[0], capKp.confirm[1], TAP_MS);
    else press(mapX(capLayout(W, H), CONFIRM_PT[0], "c"), mapY(capLayout(W, H), CONFIRM_PT[1], "c"), TAP_MS);
    lastCapText = rd.text; lastCapAt = Date.now();
    log("Captcha submitted " + rd.text);
    capPanelStatus(rd.text, "submitted");
    var after = null, wi;
    for (wi = 0; wi < 5; wi++) { nap(700); after = grabScreen(); if (!after || !capPopupShown(after, after.getWidth(), after.getHeight())) break; }
    if (after && capPopupShown(after, after.getWidth(), after.getHeight())) { log("Captcha: popup still showing after Confirm (code probably wrong)"); capPanelStatus(rd.text, "still showing - wrong?"); }
    else { log("Captcha: popup closed - solved"); capPanelStatus(rd.text, "solved ✔"); capLearn(rd); capLearnKeys(); capTries = 0; try { if (after) clickerResume(after, after.getWidth(), after.getHeight()); } catch (cke3) { if (String(cke3).indexOf("STOPPED") >= 0) throw cke3; logErr("clicker resume", cke3); } }
}

// --- minimize: hides every control and the log screen ---
var minimized = false;
w.mini.click(function () {
    minimized = !minimized;
    w.mini.setText(T(minimized ? "▢" : "—"));
    inputFocus(false);
    if (minimized) { try { closeServerPopup(); closeChannelPopup(); } catch (e) {} }
    applyPanels();
    if (minimized) refreshLogView();
});

// --- language switch: saves the choice and restarts the script so every panel is rebuilt in that language ---
ui.run(function () { try { w.langBtn.setText(LANG === "zh" ? "EN" : "中文"); } catch (e) {} });
w.langBtn.click(function () {
    if (busy) { toast("Press Stop first, then change language"); return; }
    var next = LANG === "zh" ? "en" : "zh";
    try { LANG_STORE.put("lang", next); } catch (e) { toast("Cannot save language"); return; }
    var path = "";
    try { path = scriptPath(); } catch (e) {}
    if (!path) { LANG = next; toast("Language saved - restart the script to apply"); return; }
    toast(next === "zh" ? "切换到中文..." : "Switching to English...");
    threads.start(function () {
        try {
            try {                                    // a language switch must not count as a crash-loop restart
                var bs = storages.create("klassx_boot"), arr = JSON.parse(bs.get("starts", "[]"));
                arr.pop(); bs.put("starts", JSON.stringify(arr));
            } catch (e1) {}
            engines.execScriptFile(path);
            sleep(800);
            try { w.close(); } catch (e2) {}
            exit();
        } catch (e) { logErr("language switch", e); }
    });
});

// --- skill panel (auto attack) ---
function refreshSkillUI() {
    for (var i = 0; i < SKILLS.length; i++) {
        var b = w["k" + i];
        b.setText(T(SKILLS[i].name + (skillEnabled(i) ? " ✔" : " ✖")));
        b.setAlpha(skillEnabled(i) ? 1 : 0.45);
    }
    w.captcha.setText(T("Captcha: " + (captchaOn ? "ON" : "OFF")));
    w.captcha.setAlpha(captchaOn ? 1 : 0.5);
    w.teach.setText(T("Teach crop: " + (teachOn ? "ON" : "OFF")));
    w.teach.setAlpha(teachOn ? 1 : 0.5);
    var _apOn = store.get("autoPotsOn", true);
    w.apots.setText(T("Auto Pots: " + (_apOn ? "ON" : "OFF")));
    w.apots.setAlpha(_apOn ? 1 : 0.5);
    w.autoloot.setText(T("Auto loot: " + (alOn ? "ON" : "OFF")));
    w.autoloot.setAlpha(alOn ? 1 : 0.5);
    var _ctOn = store.get("centerTapOn", true);
    w.ctap.setText(T("Center tap: " + (_ctOn ? "ON" : "OFF")));
    w.ctap.setAlpha(_ctOn ? 1 : 0.5);
    var _haOn = store.get("handAutoOn", true);
    w.handtap.setText(T("Loot hand: " + (_haOn ? "ON" : "OFF")));
    w.handtap.setAlpha(_haOn ? 1 : 0.5);
    var _lmOn = store.get("lootMonOn", false);
    w.montap.setText(T("Loot monster: " + (_lmOn ? "ON" : "OFF")));
    w.montap.setAlpha(_lmOn ? 1 : 0.5);
    w.mapauto.setText(T("Map auto " + mapFmt(MAP_AUTO_MS) + ": " + (MAP_AUTO_ON ? "ON" : "OFF")));
    w.mapauto.setAlpha(MAP_AUTO_ON ? 1 : 0.5);
    w.mapwalk.setText(T("Walk pause: " + (MAP_WALK_MS / 1000) + "s (tap = change)"));
    for (var mi = 0; mi < MAP_LABELS.length; mi++) {
        var mb = w["mt" + mi];
        mb.setText(T(MAP_LABELS[mi] + (mapSelOn(mi) ? " ✔" : " ✖")));
        mb.setAlpha(mapSelOn(mi) ? 1 : 0.45);
    }
    w.selftap.setText(T("Self tap " + (SELF_TAP_MS / 1000) + "s: " + (SELF_TAP_ON ? "ON" : "OFF")));
    w.selftap.setAlpha(SELF_TAP_ON ? 1 : 0.5);
    w.detect.setText(T("Detect: " + (skillDetect ? "IMAGE" : "TAP")));
    w.detect.setAlpha(skillDetect ? 1 : 0.6);
    w.gap.setText(T(ATK_NONSTOP ? "Gap: NON-STOP" : "Gap " + (ATK_GAPS[gapIdx] / 1000) + "s (tap)"));
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
w.apots.click(function () {
    var on = !store.get("autoPotsOn", true);
    store.put("autoPotsOn", on);
    AUTOPOTS_ON = on;                // (declared further down; the click can only happen after the whole script has loaded)
    autoPotsKick = true;             // ON while in game -> run the Auto Pots step now; OFF -> cancel a pending run
    log("Auto Pots -> " + (on ? "ON" : "OFF"));
    refreshSkillUI();
});
w.selftap.click(function () {
    SELF_TAP_ON = !SELF_TAP_ON;
    store.put("selfTapOn", SELF_TAP_ON);
    selfTapAt = 0;
    refreshSkillUI();
});
w.ctap.click(function () {
    var on = !store.get("centerTapOn", true);
    store.put("centerTapOn", on);
    CENTER_TAP_ON = on;
    ctSeen = false; centerTapAt = 0;
    log("Center tap -> " + (on ? "ON" : "OFF"));
    refreshSkillUI();
});
w.handtap.click(function () {
    var on = !store.get("handAutoOn", true);
    store.put("handAutoOn", on);
    HAND_AUTO_ON = on;
    handAutoAt = 0;
    log("Loot hand -> " + (on ? "ON" : "OFF"));
    refreshSkillUI();
});
w.montap.click(function () {
    var on = !store.get("lootMonOn", false);
    store.put("lootMonOn", on);
    LOOT_MONSTER_ON = on;
    lootSt.monActive = false; lootSt.monCool = 0;
    log("[LootMon] Loot monster -> " + (on ? "ON" : "OFF"));
    refreshSkillUI();
});
w.mapauto.click(function () {
    MAP_AUTO_ON = !MAP_AUTO_ON;
    store.put("mapAutoOn", MAP_AUTO_ON);
    mapAutoAt = Date.now();
    log("Map auto -> " + (MAP_AUTO_ON ? "ON (every " + mapFmt(MAP_AUTO_MS) + ")" : "OFF"));
    refreshSkillUI();
});
bindAuthField(w.mapEvery);                  // tap the box to type, long-press = paste
ui.run(function () { w.mapEvery.setText(mapFmt(MAP_AUTO_MS)); });
w.mapEverySet.click(function () {
    inputFocus(false);
    var raw = String(w.mapEvery.getText()).trim().toLowerCase().replace(/\s+/g, "");
    var m = /^(?:(\d+(?:\.\d+)?)(?:m|min|mins|minute|minutes))?(?:(\d+(?:\.\d+)?)(?:s|sec|secs|second|seconds)?)?$/.exec(raw);
    var secs = m && (m[1] || m[2]) ? (m[1] ? parseFloat(m[1]) * 60 : 0) + (m[2] ? parseFloat(m[2]) : 0) : 0;
    if (!secs) { toast("Type seconds or minutes, e.g. 30s, 2m, 1m30s"); w.mapEvery.setText(mapFmt(MAP_AUTO_MS)); return; }
    secs = Math.max(5, Math.min(7200, Math.round(secs)));             // 5 s .. 120 min
    MAP_AUTO_MS = secs * 1000;
    store.put("mapAutoMs", MAP_AUTO_MS);
    mapAutoAt = Date.now();
    w.mapEvery.setText(mapFmt(MAP_AUTO_MS));
    log("Map auto interval -> " + mapFmt(MAP_AUTO_MS));
    refreshSkillUI();
});
w.mapwalk.click(function () {
    var cur = MAP_WALK_OPTS.indexOf(MAP_WALK_MS / 1000);
    MAP_WALK_MS = MAP_WALK_OPTS[(cur + 1) % MAP_WALK_OPTS.length] * 1000;
    store.put("mapWalkMs", MAP_WALK_MS);
    log("Map walk pause -> " + (MAP_WALK_MS / 1000) + "s");
    refreshSkillUI();
});
var mapPanelShown = false;
w.maptgt.click(function () {
    mapPanelShown = !mapPanelShown;
    w.mappanel.setVisibility(mapPanelShown ? android.view.View.VISIBLE : android.view.View.GONE);
    w.maptgt.setText(T(mapPanelShown ? "Map go-to ▴" : "Map go-to ▾"));
});
function bindMapSel(i) {
    w["mt" + i].click(function () {
        MAP_SEL = MAP_SEL.substr(0, i) + (mapSelOn(i) ? "0" : "1") + MAP_SEL.substr(i + 1);
        store.put("mapSel", MAP_SEL);
        log("Map go-to " + MAP_LABELS[i] + " -> " + (mapSelOn(i) ? "ON" : "OFF"));
        refreshSkillUI();
    });
}
for (var mti = 0; mti < 8; mti++) bindMapSel(mti);
w.mapgo.click(function () {
    if (monState === "Running") { mapKick = true; return; }      // the main loop runs it between attack passes
    if (mapBusy) return;
    threads.start(function () {                                    // not playing: run it on its own
        try { stopFlag = false; if (!captureOk) initCapture(); mapRun(); }
        catch (e) { if (String(e).indexOf("STOPPED") < 0) logErr("map now", e); }
    });
});
w.autoloot.click(function () {
    alOn = !alOn;
    store.put("autoLootOn", alOn);
    log("Auto loot -> " + (alOn ? "ON" : "OFF"));
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
w.detect.click(function () {
    skillDetect = !skillDetect;
    store.put("skillDetect", skillDetect);
    log("Skill detect -> " + (skillDetect ? "IMAGE (tap a skill only when its icon is found)" : "TAP (blind taps)"));
    if (skillDetect) {
        var have = 0;
        for (var di = 0; di < SKILLS.length; di++) if (skillIcon(di)) have++;
        if (!have) { log("No skill icons saved yet - press Save icons while the skills are READY"); toast("No icons saved - press Save icons first"); }
    }
    refreshSkillUI();
});
w.saveicons.click(function () {
    threads.start(function () { saveSkillIcons(); });
});
// Cycles NON-STOP -> each timed gap -> back to NON-STOP. (Before, this only changed gapIdx, which was ignored
// while ATK_NONSTOP was true, so the button could never leave the constant-tap mode.)
w.gap.click(function () {
    if (ATK_NONSTOP) { ATK_NONSTOP = false; gapIdx = 0; }
    else if (gapIdx >= ATK_GAPS.length - 1) { ATK_NONSTOP = true; }
    else { gapIdx++; }
    store.put("gapIdx", gapIdx);
    log(ATK_NONSTOP ? "Attack gap -> NON-STOP" : "Attack gap -> " + ATK_GAPS[gapIdx] + "ms");
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
    w.matchScr.setText(T(matchScrBusy ? "Matching screen..." : "Match screen: " + LAYOUT_MODE.toUpperCase()));
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
    w.toolsBtn.setText(T(toolPanelShown ? "Tools ▴" : "Tools ▾"));
});
var skillPanelShown = false;
w.skills.click(function () {
    skillPanelShown = !skillPanelShown;
    w.skillpanel.setVisibility(skillPanelShown ? android.view.View.VISIBLE : android.view.View.GONE);
    w.skills.setText(T(skillPanelShown ? "Skills ▴" : "Skills ▾"));
});

// --- quick slot panel (bottom bar items 1-6) ---
function refreshQuickUI() {
    for (var i = 0; i < QUICK.length; i++) {
        var b = w["q" + i];
        b.setText(T(QUICK[i].name + (quickEnabled(i) ? " ✔" : " ✖")));
        b.setAlpha(quickEnabled(i) ? 1 : 0.45);
    }
    w.quick.setText(T("Quick: " + (quickOn ? "ON" : "OFF")));
    w.quick.setAlpha(quickOn ? 1 : 0.5);
    w.qgap.setText(T("Every " + (QUICK_GAPS[quickGapIdx] / 1000) + "s (tap)"));
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
    w.qslots.setText(T(quickPanelShown ? "Quick ▴" : "Quick ▾"));
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
var FIREBASE_API_KEY = "AIzaSyBkbggN_CZcskhnvavP-p5Lj8UmD06iIRs";   // project captcha-66831
var FB_AUTH = "https://identitytoolkit.googleapis.com/v1/accounts:";
var FB_TOKEN = "https://securetoken.googleapis.com/v1/token";
// --- updates through GitHub (users download; admins publish from the Admin panel) ---
var GH_OWNER  = "juvymaisn-stack";     // GitHub user/org that owns the repo (PUBLIC repo: users download without a token)
var GH_REPO   = "KALASx";            // repo name
var GH_BRANCH = "main";
var GH_SCRIPT = "klassx_launcher.js";   // file name of the script inside the repo
var GH_VERSION = "version.json";        // small file users check for new versions
var ADMIN_USERS = ["admin"];            // usernames that see the Admin panel (lowercase)
var REGISTER_ADMIN_ONLY = false;        // false = anyone with a valid activation key can register (true = only ADMIN_USERS names)
var SCRIPT_PATH = "";                   // leave empty = auto-detect; or set e.g. "/sdcard/Scripts/klassx.js"
var UPDATE_CHECK_MS = 30 * 60 * 1000;   // how often to look for a new version while running
var AUTO_UPDATE = true;                 // true = download + restart into a new version by itself whenever the bot is idle
var lastRemoteVer = "", autoTried = false;
var updateInfo = null, admShown = false, admBusy = false, updBusy = false;
var FIRESTORE_PROJECT = "captcha-66831";   // Firestore project id (database must be created in the console)
var MIN_PASS = 6;                       // Firebase's own minimum
var USER_RE = /^[A-Za-z0-9_]{3,20}$/;   // allowed usernames
var AUTH_DOMAIN = "klassx.app";         // Firebase needs an email: username -> username@klassx.app (never emailed)
function userToEmail(name) { return name.toLowerCase() + "@" + AUTH_DOMAIN; }
function emailToUser(email) { return String(email).split("@")[0]; }
var AUTH_MAX_FAILS = 5;                 // wrong attempts before a short local lockout
var AUTH_LOCK_MS = 30000;

var authStore = storages.create("klassx_launcher_auth");
var GH_OWNER_DEF = GH_OWNER, GH_REPO_DEF = GH_REPO;      // the defaults written above (the Reset button goes back to these)
(function () {                              // one-time reset of the Admin publish settings: clears the saved repo + token so the defaults above (GH_OWNER / GH_REPO) apply again
    try {
        if (authStore.get("admPublishReset", "") === "v1") return;
        authStore.put("ghRepo", "");
        authStore.put("ghToken", "");
        authStore.put("admPublishReset", "v1");
    } catch (e) {}
})();
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
var MAX_KEY_USES = 1000, DEFAULT_KEY_USES = 10;                                      // users per key: 1 = one-time, 0 = unlimited
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
        w.authMsg.setText(T(text));
        w.authMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ff8a80"));
    });
}
function applyPanels() {                // show login panel OR controls, depending on state
    ui.run(function () {
        var V = android.view.View;
        w.minilogscroll.setVisibility(minimized && MINI_SHOW_LOG ? V.VISIBLE : V.GONE);   // minimized = title bar only (set MINI_SHOW_LOG = true to keep the compact log)
        w.mainscroll.setVisibility(minimized ? V.GONE : V.VISIBLE);   // minimized = only the title bar stays
        w.auth.setVisibility(!authed && !minimized ? V.VISIBLE : V.GONE);
        var subOkNow = authed && subOk();
        w.controls.setVisibility(subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.controls2.setVisibility(subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.subpanel.setVisibility(authed && !subOkNow && !minimized ? V.VISIBLE : V.GONE);
        w.logout.setText(T("Logout (" + currentUser + ")"));
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
        w.authGo.setText(T(regMode ? "Create account" : "Login"));
        w.authRemember.setText(T("Stay: " + (rememberOn ? "ON" : "OFF")));
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
    // new keys: maxUses (0 = unlimited) + usedCount; old keys (no maxUses) are one-time and use redeemedBy
    var maxUses = f.maxUses ? fsInt(f.maxUses) : 1;
    var used = f.maxUses ? fsInt(f.usedCount) : ((f.redeemedBy && f.redeemedBy.stringValue) ? 1 : 0);
    var usedBy = (f.usedBy && f.usedBy.stringValue) ? String(f.usedBy.stringValue) : "";
    var redeemedBy = (f.redeemedBy && f.redeemedBy.stringValue) ? String(f.redeemedBy.stringValue) : "";
    var mine = (!!usedBy && usedBy.split(",").indexOf(t.uid) >= 0) || (maxUses === 1 && redeemedBy === t.uid);   // this account used it before: it may use it again
    var taken = (maxUses === 1) ? !!redeemedBy : (maxUses > 0 && used >= maxUses);
    if (!mine && taken) return { ok: false, msg: maxUses === 1 ? "That key was already used." : "That key has no uses left." };
    var days = fsInt(f.days), hours = fsInt(f.hours);
    if (days <= 0 && hours <= 0) return { ok: false, msg: "Invalid key." };
    var ms = Math.max(0, hours) * 3600000 + Math.max(0, days) * 86400000;
    var label = hours > 0 ? (hours + (hours === 1 ? " hour" : " hours")) + (days > 0 ? " + " + days + " days" : "") : (days + " days");
    return { ok: true, days: days, hours: hours, ms: ms, label: label, updateTime: g.json.updateTime, used: used, maxUses: maxUses, usedBy: usedBy, mine: mine };
}
// Mark the key used and extend users/{uid}.subUntil in one atomic commit. chk = result of checkKey, cur = current subUntil.
function commitKey(t, key, chk, cur) {
    var now = Date.now();
    var until = Math.max(now, cur) + chk.ms;       // extends an active subscription
    var base = fsBase();
    var keyFields, keyMask;
    if (chk.maxUses === 1) {                       // single-use key
        keyFields = { redeemedBy: { stringValue: t.uid }, redeemedAt: { integerValue: String(now) } };
        keyMask = ["redeemedBy", "redeemedAt"];
    } else {                                       // many-user key (maxUses 0 = unlimited)
        var lastUse = chk.maxUses > 0 && chk.used + 1 === chk.maxUses;
        keyFields = { usedCount: { integerValue: String(chk.used + 1) },
                      usedBy:    { stringValue: chk.usedBy ? chk.usedBy + "," + t.uid : t.uid },
                      redeemedAt: { integerValue: String(now) } };
        keyMask = ["usedCount", "usedBy", "redeemedAt"];
        if (lastUse) { keyFields.redeemedBy = { stringValue: t.uid }; keyMask.push("redeemedBy"); }
    }
    var writes = [];
    if (!chk.mine) writes.push({ update: { name: base + "/keys/" + key, fields: keyFields },
                                 updateMask: { fieldPaths: keyMask },
                                 currentDocument: { updateTime: chk.updateTime } });
    writes.push({ update: { name: base + "/users/" + t.uid, fields: { subUntil: { integerValue: String(until) }, lastKey: { stringValue: key } } },
                  updateMask: { fieldPaths: ["subUntil", "lastKey"] } });
    var commit = { writes: writes };
    var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
    if (c.status !== 200) {
        log("redeem failed: HTTP " + c.status + " " + JSON.stringify(c.json).slice(0, 200));
        return { ok: false, msg: c.status === 403 ? "Server refused (Firestore rules not set up?)." :
                 (c.status === 400 || c.status === 409) ? "Key was just used by someone else - tap Activate again." : "Redeem failed (HTTP " + c.status + ")." };
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
// keys/{KEY}  : days, hours, maxUses (0 = many users), usedCount, createdAt, createdBy, redeemedAt (old keys: redeemedBy)
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
        w.subMsg.setText(T(text));
        w.subMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ffcc80"));
    });
}
function refreshSubUI() {
    ui.run(function () {
        var left = subUntil - Date.now();
        w.subInfo.setText(T(isAdmin() ? "Admin - no subscription needed" : (left > 0 ? "Subscription: " + fmtLeft(left) + " left" : "No active subscription")));
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
            var lastKey = (u.status === 200 && u.json && (u.json.fields || {}).lastKey) ? String((u.json.fields || {}).lastKey.stringValue || "") : "";
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
        w.keyMsg.setText(T(text));
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
    var rawUses = String(w.admUses.getText()).trim(), uses = /^\d+$/.test(rawUses) ? parseInt(rawUses, 10) : -1;
    if (uses < 0 || uses > MAX_KEY_USES) { setKeyMsg("Users per key must be 0 (many) to " + MAX_KEY_USES + ".", false); return; }
    var unitLabel = (isHours ? hours + " hours" : days + " days") + (uses === 0 ? ", many users" : ", " + uses + " user" + (uses === 1 ? "" : "s")),
        unitShort = (isHours ? hours + "h" : days + "d") + (uses === 0 ? " x many" : " x" + uses);
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
                maxUses:    { integerValue: String(uses) },
                usedCount:  { integerValue: "0" },
                usedBy:     { stringValue: "" },
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
w.subGo.on("long_click", function () {        // admin only: hold Activate with a key typed in the box = clear its usage so it can be used again
    if (!authed || !isAdmin()) return true;
    var key = String(w.subKey.getText()).trim().toUpperCase();
    if (!/^[A-Z0-9-]{8,40}$/.test(key)) { setSubMsg("Type the key in the box first, then hold Activate to reset it.", false); return true; }
    if (subBusy) return true;
    subBusy = true;
    setSubMsg("Resetting key...", true);
    threads.start(function () {
        try {
            var t = getIdToken();
            if (!t) { setSubMsg("Not signed in - log in again.", false); return; }
            var base = fsBase();
            var commit = { writes: [ { update: { name: base + "/keys/" + key, fields: {
                usedCount:  { integerValue: "0" },
                usedBy:     { stringValue: "" },
                redeemedBy: { stringValue: "" },
                redeemedAt: { integerValue: "0" }
            } }, updateMask: { fieldPaths: ["usedCount", "usedBy", "redeemedBy", "redeemedAt"] } } ] };
            var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
            if (c.status === 200) setSubMsg("Key reset - it can be used again.", true);
            else if (c.status === 404) setSubMsg("That key does not exist.", false);
            else setSubMsg(c.status === 403 ? "Refused - check firestore.rules (admin can update keys)." : "Reset failed (HTTP " + c.status + ").", false);
        } catch (e) {
            logErr("resetKey", e);
            setSubMsg("Error - see log", false);
        } finally {
            subBusy = false;
        }
    });
    return true;
});
w.subLogout.click(doLogout);
bindAuthField(w.admDays);
bindAuthField(w.admUses);               // users per key (0 = many)              // type the number of days (1 to MAX_KEY_DAYS)
ui.run(function () { w.admDays.setText(String(DEFAULT_KEY_DAYS)); w.admUses.setText(String(DEFAULT_KEY_USES)); });
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
        try { w.updBtnA.setText(T(t)); w.updBtnS.setText(T(t)); w.updBtnC.setText(T(t)); } catch (e) {}
    });
}
function setUpdUI() {
    ui.run(function () {
        if (updateInfo) {
            var n = updateInfo.notes ? ": " + updateInfo.notes : "";
            w.updText.setText(T("Update v" + updateInfo.version + " available" + n));
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
            else if (String(lastRemoteVer).indexOf("HTTP") === 0) {     // the server file could not be read: say so instead of "up to date"
                toast("Update server error (" + lastRemoteVer + ") - " + GH_OWNER + "/" + GH_REPO + ": version.json not found or repo is private");
                setUpdBtnText("⟳ Update");
            }
            else { toast("Up to date (this v" + APP_VERSION + ", server " + (lastRemoteVer || "unreachable") + ", " + GH_OWNER + "/" + GH_REPO + ")"); setUpdBtnText("⟳ Update"); }
        } catch (e) { logErr("onUpdateBtn", e); setUpdBtnText("⟳ Update"); }
    });
}
function checkUpdate() {
    if (!ghConfigured() || UPDATES_PAUSED) return;
    try {
        var r = http.get(rawUrl(GH_VERSION));
        if (r.statusCode !== 200) { lastRemoteVer = "HTTP " + r.statusCode; log("update check: " + (r.statusCode === 404 ? "no version.json in the repo (HTTP 404) - nothing published yet, or repo is private" : "HTTP " + r.statusCode)); return; }
        var info = JSON.parse(r.body.string());
        lastRemoteVer = info ? "v" + info.version : "?";
        if (info && Number(info.version) > APP_VERSION && info.sha256) {
            if (!updateInfo || updateInfo.version !== info.version) log("update available: v" + info.version + " (this device v" + APP_VERSION + ")");
            updateInfo = info;
        } else {
            updateInfo = null;
        }
        setUpdUI();
        if (updateInfo && AUTO_UPDATE && !autoTried && !busy && !updBusy) { autoTried = true; installUpdate(); }     // idle -> apply it now, no tap needed
    } catch (e) { logErr("checkUpdate", e); }
}
function installUpdate() {
    if (updBusy || !updateInfo) return;
    if (UPDATES_PAUSED) { toast("Updates paused: the script restarted too many times"); return; }
    updBusy = true;
    if (busy) stopFlag = true;                       // stop the bot loop first
    threads.start(function () {
        try {
            ui.run(function () { w.updText.setText(T("Downloading v" + updateInfo.version + "...")); });
            var r = http.get(rawUrl(GH_SCRIPT));
            if (r.statusCode !== 200) throw "download HTTP " + r.statusCode;
            var text = r.body.string();
            if (sha256Hex(text) !== String(updateInfo.sha256)) throw "download corrupted (checksum mismatch)";
            if (text.indexOf("var APP_VERSION") < 0) throw "downloaded file is not the launcher";
            var hv = /var APP_VERSION = (\d+);/.exec(text);
            if (!hv || Number(hv[1]) < Number(updateInfo.version)) throw "downloaded file is v" + (hv ? hv[1] : "?") + " but the server says v" + updateInfo.version + " - publish it again";
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
            ui.run(function () { w.updText.setText(T("Update failed: " + String(e).slice(0, 60) + " - tap to retry")); });
        } finally {
            updBusy = false;
        }
    });
}

// ---- admin side: publish this script to GitHub ----
function setAdmMsg(text, good) {
    ui.run(function () {
        w.admMsg.setText(T(text));
        w.admMsg.setTextColor(android.graphics.Color.parseColor(good ? "#a5d6a7" : "#ff8a80"));
    });
}
function refreshAdminUI() {
    ui.run(function () {
        w.admInfo.setText(T("Local v" + APP_VERSION + " | repo " + (ghConfigured() ? GH_OWNER + "/" + GH_REPO : "NOT SET") + (myUid ? "\nuid (hold to copy): " + myUid : "")));
        var t = authStore.get("ghToken", "");
        if (t && !String(w.admToken.getText())) w.admToken.setText(t);
        if (!String(w.admRepo.getText()) && ghConfigured()) w.admRepo.setText(GH_OWNER + "/" + GH_REPO);
    });
}
function ghApi(method, path, token, body) {
    var url = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + path;
    var headers = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "User-Agent": "klassx-launcher" };
    var res;
    try {
        if (method === "GET") res = http.get(url + "?ref=" + encodeURIComponent(GH_BRANCH), { headers: headers });
        else res = http.request(url, { method: "PUT", headers: headers, contentType: "application/json", body: JSON.stringify(body) });
    } catch (ne) {
        if (String(ne).indexOf("STOPPED") >= 0) throw ne;
        return { status: 0, json: null, net: String(ne) };          // no internet / GitHub unreachable
    }
    var j = null;
    try { j = res.body.json(); } catch (e) {}
    return { status: res.statusCode, json: j };
}
function ghRepoCheck(token) {          // "" = the repo is fine; otherwise the reason in plain words
    var r;
    try {
        r = http.get("https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO, { headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "User-Agent": "klassx-launcher" } });
    } catch (e) {
        if (String(e).indexOf("STOPPED") >= 0) throw e;
        return "No connection to GitHub.";
    }
    if (r.statusCode === 404) return "Repo " + GH_OWNER + "/" + GH_REPO + " not found, or this token cannot see it. Check the owner/name spelling and the token's access to that repo.";
    if (r.statusCode === 401) return "Bad GitHub token.";
    if (r.statusCode !== 200) return "GitHub error HTTP " + r.statusCode + ".";
    var j = null;
    try { j = r.body.json(); } catch (e2) {}
    if (j && j.permissions && j.permissions.push === false) return "This token is read-only for " + GH_OWNER + "/" + GH_REPO + ". Give it Contents: Read and write.";
    return "";
}
function ghErrText(r) {
    if (r.status === 0) return "No connection to GitHub" + (r.net ? " (" + r.net.slice(0, 80) + ")" : "") + ".";
    if (r.status === 401) return "Bad GitHub token.";
    if (r.status === 403) return "Token has no write access (or rate limited).";
    if (r.status === 404 && r.json && /empty/i.test(String(r.json.message))) return "The repo is empty. Add one file (like README.md) on GitHub first, then publish again.";
    if (r.status === 404) return "Repo or branch '" + GH_BRANCH + "' not found (check GH_OWNER, GH_REPO, token access).";
    if (r.status === 409 || r.status === 422) return "Conflict - try again.";
    return "GitHub error HTTP " + r.status + (r.json && r.json.message ? ": " + r.json.message : "");
}
function ghPutSafe(file, token, msg, text, sha) {     // PUT a file; if GitHub says the sha is stale, read it again and retry once
    var tries = 0, r, g, body;
    while (true) {
        body = { message: msg, content: b64OfText(text), branch: GH_BRANCH };
        if (sha) body.sha = sha;
        r = ghApi("PUT", file, token, body);
        if (r.status === 200 || r.status === 201) return r;
        if (tries >= 1 || (r.status !== 409 && r.status !== 422)) return r;
        tries++;
        g = ghApi("GET", file, token);
        sha = (g.status === 200 && g.json) ? g.json.sha : null;
    }
}
function resetAdminPanel() {           // after a successful publish: clear the form and fold the panel back up
    ui.run(function () {
        try {
            w.admFile.setText("");
            w.admNotes.setText("");
            w.admToken.setText("");             // the token stays saved; it is filled in again when the panel is opened
            w.drag.setText(T("⠿ KlassX v" + APP_VERSION + " (drag)"));
        } catch (e) {}
    });
    inputFocus(false);
    setTimeout(function () {                    // let the "Published vN" message be read first
        admShown = false;
        ui.run(function () { w.admin.setText(T("Admin ▾")); w.admMsg.setText(""); });
        applyPanels();
    }, 3000);
}
function admResolvePath(name) {      // "KALASxv103.js" typed alone -> look in the usual download / script folders
    if (!name || name.charAt(0) === "/") return name;
    var dirs = ["/sdcard/Download/", "/sdcard/", "/sdcard/KlassX/", "/sdcard/Scripts/", "/storage/emulated/0/Download/"];
    for (var i = 0; i < dirs.length; i++) if (files.exists(dirs[i] + name)) return dirs[i] + name;
    return name;
}
function publishUpdate() {
    if (admBusy) return;
    if (!authed || !isAdmin()) { setAdmMsg("Admins only.", false); return; }
    if (!ghConfigured()) { setAdmMsg("Set GH_OWNER and GH_REPO in the script.", false); return; }
    var token = String(w.admToken.getText()).trim();
    var notes = String(w.admNotes.getText()).trim();
    if (!token) { setAdmMsg("Paste your GitHub token.", false); return; }
    var picked = admResolvePath(String(w.admFile.getText()).trim());
    var path = picked || scriptPath() || (files.exists(UPDATED_PATH) ? UPDATED_PATH : "");
    if (!path) { setAdmMsg("Cannot find script file (set SCRIPT_PATH or choose a file).", false); return; }
    if (!files.exists(path)) { setAdmMsg("File not found: " + path, false); return; }
    if (picked) log("publishing uploaded file: " + picked);
    admBusy = true;
    setAdmMsg("Reading repo...", true);
    threads.start(function () {
        try {
            var ce = ghRepoCheck(token);                     // tell the real reason before any upload
            if (ce) { setAdmMsg(ce, false); return; }
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
            var ps = ghPutSafe(GH_SCRIPT, token, "Release v" + newVer, patched, scriptSha);
            if (ps.status !== 200 && ps.status !== 201) { setAdmMsg(ghErrText(ps), false); return; }

            var info = {
                version: newVer,
                notes: notes || ("Update v" + newVer),
                sha256: sha256Hex(patched),
                file: GH_SCRIPT,
                published: new Date().toISOString()
            };
            var pv = ghPutSafe(GH_VERSION, token, "Version v" + newVer, JSON.stringify(info, null, 2), verSha);
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
            setAdmMsg("Error: " + String(e).slice(0, 100), false);
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
            var k = dialogs.select(T("Choose file to publish"), labels);
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
    ui.run(function () { w.admin.setText(T(admShown ? "Admin ▴" : "Admin ▾")); });
    applyPanels();
    if (admShown) refreshAdminUI();
});
w.admPublish.click(function () { inputFocus(false); publishUpdate(); });
w.admReset.click(function () {              // clears the saved repo + token and every field, and goes back to the default repo
    inputFocus(false);
    authStore.put("ghRepo", "");
    authStore.put("ghToken", "");
    GH_OWNER = GH_OWNER_DEF; GH_REPO = GH_REPO_DEF;
    ui.run(function () {
        w.admRepo.setText(GH_OWNER + "/" + GH_REPO);
        w.admFile.setText("");
        w.admToken.setText("");
        w.admNotes.setText("");
    });
    refreshAdminUI();
    setAdmMsg("Reset to " + GH_OWNER + "/" + GH_REPO + " ✓", true);
});
w.updGo.click(function () { installUpdate(); });
w.updBtnA.click(function () { inputFocus(false); onUpdateBtn(); });
w.updBtnS.click(function () { inputFocus(false); onUpdateBtn(); });
w.updBtnC.click(function () { onUpdateBtn(); });
ui.run(function () { w.drag.setText(T("⠿ KlassX v" + APP_VERSION + " (drag)")); });
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
var reviveBody = 0, reviveText = 0, reviveLabel = 0, revivePanel = 0, reviveTwo = false;
var reviveSeenAt = 0;                  // time the revive dialog was first seen (for the USE_WAIT_MS delay)
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
    reviveText = 0; reviveLabel = 0; reviveTwo = false;
    if (!dialogBase(img, L)) return false;
    reviveText = whiteCount(img, L, 1080, 1500, 480, 522, 3, 200);
    reviveLabel = whiteCount(img, L, 1245, 1335, 660, 695, 3, 200);              // single centered button
    var lbRevive = whiteCount(img, L, 1080, 1170, 660, 695, 3, 200);             // two buttons: "Revive" (left)
    var lbUse = whiteCount(img, L, 1420, 1485, 660, 695, 3, 200);                // two buttons: "Use" (right)
    reviveTwo = lbRevive >= 15 && lbUse >= 10;
    return reviveText >= 60 && (reviveLabel >= 15 || reviveTwo);
}

// Back Point Pass item window: two gray buttons side by side near the bottom ([Close] left, [Use] right) with white labels.
var bppInfo = "";
function bppBtn(img, L, cx, cy) {            // returns [gray share, white label pixels] for one button box
    var gray = 0, tot = 0, white = 0, x, y, c, r, g, b, mx, mn;
    for (y = cy - 28; y <= cy + 28; y += 4) for (x = cx - 34; x <= cx + 34; x += 4) {
        c = img.pixel(mapX(L, x, "c"), mapY(L, y, "c")); r = colors.red(c); g = colors.green(c); b = colors.blue(c);
        mx = Math.max(r, g, b); mn = Math.min(r, g, b); tot++;
        if (mx - mn <= 26 && mx >= 55 && mx <= 220) gray++;
        if (mn >= 195) white++;
    }
    return [gray / tot, white];
}
var bppFound = null;
function matchBpp(img, W, H) {               // looks around the expected spot (the window can sit a little differently)
    var L = layoutOf(W, H), best = null, dy, dx, u, c, sc;
    bppFound = null; bppInfo = "";
    for (dy = -60; dy <= 60; dy += 20) for (dx = -60; dx <= 60; dx += 30) {
        u = bppBtn(img, L, BPP_USE_X + dx, BPP_USE_Y + dy); c = bppBtn(img, L, BPP_CLOSE_X + dx, BPP_USE_Y + dy);
        sc = Math.min(u[0], c[0]);
        if (!best || sc > best.sc) best = { sc: sc, x: BPP_USE_X + dx, y: BPP_USE_Y + dy, u: u, c: c };
    }
    if (!best) return false;
    bppInfo = "best at " + best.x + "," + best.y + ": use " + best.u[0].toFixed(2) + "/" + best.u[1] + " close " + best.c[0].toFixed(2) + "/" + best.c[1];
    if (best.u[0] >= 0.5 && best.c[0] >= 0.5 && best.u[1] >= 5 && best.c[1] >= 5) { bppFound = best; return true; }
    return false;
}
function bppUse() {                          // after the "go back" slot was tapped: press Use on the item window (retry while it stays)
    var k = 0, img, W, H, seen = false, t0 = Date.now(), taps = 0, lastImg = null;
    while (taps < BPP_TRIES) {
        img = grabScreen();
        if (img) {
            lastImg = img; W = img.getWidth(); H = img.getHeight();
            if (matchBpp(img, W, H)) {
                if (!seen) { seen = true; log("Back Point Pass: Use window DETECTED (" + bppInfo + ")"); }
                taps++;
                quickTap(bppFound.x, bppFound.y, taps % 3);
                log("Back Point Pass: tapped Use at " + bppFound.x + "," + bppFound.y + " (try " + taps + "/" + BPP_TRIES + ")");
                nap(BPP_GAP_MS);
                t0 = Date.now();
                continue;
            }
            if (seen) { log("Back Point Pass: window gone after " + taps + " Use taps"); return true; }
        }
        if (Date.now() - t0 > BPP_WAIT_MS) {
            log("Back Point Pass: no Use window seen within " + (BPP_WAIT_MS / 1000) + "s (" + bppInfo + ")");
            try { if (lastImg) { files.ensureDir(CAP_SAMPLE_DIR + "x"); images.save(lastImg, CAP_SAMPLE_DIR + "bpp_" + Date.now() + ".png"); log("Back Point Pass: screenshot saved in " + CAP_SAMPLE_DIR); } } catch (eS) { logErr("bpp screenshot", eS); }
            return false;
        }
        nap(500);
    }
    log("Back Point Pass: Use window still showing after " + BPP_TRIES + " taps");
    return false;
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
var capBusy = false;
function capPopupTap(ms) {     // taps "Start now" / "Allow" on the screen-capture popup (works in landscape too)
    threads.start(function () {
        var end = Date.now() + ms;
        while (Date.now() < end && !captureOk) {
            try { var b = textMatches(/^(Start now|Start|Allow|While using the app|ALLOW|立即开始|允许)$/).findOne(1000); if (b) { b.click(); sleep(500); } } catch (e) {}
        }
    });
}
// Play pressed (or any place that needs the capture) and it is not ready yet: ask again, tap the popup, wait until frames arrive.
function ensureCapture() {
    if (captureOk) return true;
    if (capBusy) { var t0 = Date.now(); while (capBusy && Date.now() - t0 < 20000) sleep(200); return captureOk; }
    log("screen capture not ready - requesting it again");
    toast("Allow screen capture...");
    initCapture();
    return captureOk;
}
function initCapture() {
    if (capBusy) return;
    capBusy = true;
    capPopupTap(15000);
    try { captureOk = requestScreenCapture(true); } catch (e) { captureOk = false; logErr("requestScreenCapture", e); }
    if (!captureOk) { try { captureOk = requestScreenCapture(); } catch (e2) { captureOk = false; } }   // second try without the orientation flag
    if (captureOk) {                                    // wait until the first frame really arrives (right after the grant it can be null)
        var t1 = Date.now(), fr = null;
        while (Date.now() - t1 < 4000) { try { fr = captureScreen(); } catch (e3) {} if (fr) break; sleep(200); }
    }
    capBusy = false;
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
var lastHit = 0, lastWhite = 0, lastDims = "", lastW = 0, lastH = 0, lastLoginSeen = false, lastCharSeen = false, lastStartSeen = false, lastHudSeen = false, lastReviveSeen = false, lastDiscSeen = false;
// Is the Select Server button showing? With alsoOthers, also sets lastLoginSeen / lastCharSeen.
function isMainScreen(alsoOthers) {
    lastLoginSeen = false;
    lastCharSeen = false;
    lastStartSeen = false;
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
    if (!running) { try { sgPatrolStop("bot stopped"); } catch (e) {} }
    ui.run(function () {
        w.play.setText(T(running ? "■ Stop" : "▶ Play"));
        if (UI_THEME_YELLOW) uiPlayStyle(w.play, running);
        else w.play.setBackgroundColor(android.graphics.Color.parseColor(running ? "#C62828" : "#2E7D32"));
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

// ---- IMAGE detect for skills (Detect button): each skill has a saved "ready" icon; the skill is tapped only if that icon is found ----
var SKILL_IMG_THRESHOLD = 0.8;     // 0..1 match score; raise if it taps on cooldown, lower if it never taps
var SKILL_ICON_HALF = 0.04;        // saved icon = square of 2 x this x screen height, centred on the skill button
var SKILL_SEARCH_HALF = 0.07;      // search area around the button = this x screen height
var skillIconCache = {};
function skillIconPath(idx) { return TEMPLATE_DIR + "skill_icon_" + idx + ".png"; }
function skillIcon(idx) {
    if (skillIconCache.hasOwnProperty(idx)) return skillIconCache[idx];
    var t = null;
    try { var ip = skillIconPath(idx); if (files.exists(ip)) t = images.read(ip); } catch (e) { logErr("skill icon " + idx, e); t = null; }
    if (t) skillIconCache[idx] = t;     // cached, never recycled (same SIGSEGV rule as getTemplate)
    return t || null;
}
function skillDetected(img, idx) {      // true = icon found (or nothing saved for this skill, so it is never blocked)
    var t = skillIcon(idx);
    if (!t) return true;
    try {
        var W = img.getWidth(), H = img.getHeight();
        var sk = SKILLS[idx], c = toPx(sk.x, sk.y, "r", "b"), r = Math.round(H * SKILL_SEARCH_HALF);
        var x0 = Math.max(0, c[0] - r), y0 = Math.max(0, c[1] - r), x1 = Math.min(W, c[0] + r), y1 = Math.min(H, c[1] + r);
        return !!images.findImage(img, t, { region: [x0, y0, x1 - x0, y1 - y0], threshold: SKILL_IMG_THRESHOLD });
    } catch (e) { logErr("skill findImage", e); return true; }
}
function saveSkillIcons() {             // crops every skill button from the current screen (do it while the skills are READY)
    try {
        var img = grabScreen();
        if (!img) { toast("Screen capture failed"); return; }
        var W = img.getWidth(), H = img.getHeight(), half = Math.round(H * SKILL_ICON_HALF), n = 0;
        files.ensureDir(TEMPLATE_DIR + "x");
        for (var i = 0; i < SKILLS.length; i++) {
            var sk = SKILLS[i], c = toPx(sk.x, sk.y, "r", "b");
            var x = Math.max(0, Math.min(W - 2 * half, c[0] - half)), y = Math.max(0, Math.min(H - 2 * half, c[1] - half));
            var clip = images.clip(img, x, y, 2 * half, 2 * half);
            images.save(clip, skillIconPath(i));
            clip.recycle();             // our own crop, safe to recycle
            delete skillIconCache[i];
            n++;
        }
        log("Saved " + n + " skill icons (" + (2 * half) + "px) to " + TEMPLATE_DIR);
        toast("Saved " + n + " skill icons");
    } catch (e) { logErr("saveSkillIcons", e); }
}

// ---- skill ready check: a skill on cooldown is dimmed, so its icon is darker than usual ----
var SKILL_READY_RATIO = 0.82;   // icon brightness must be at least this share of its brightest-ever value to count as ready
var SKILL_FORCE_MS = 4000;      // safety: tap a skill anyway if it has not been tapped for this long (in case detection is wrong)
var lastSkillTap = {}, skillBase = {};
// ---- cast timing monitor: how many ms pass between one skill's tap and the next, and how long each skill really takes ----
//   gap  = start of one tap -> start of the next (S1>S2 ...)         cyc = same skill tapped again after X ms
//   dim  = tap -> icon goes dark (the game accepted the cast)         cd  = tap -> icon lit again (real cooldown)
// dim / cd are read from screenshots, so they are accurate to about one screenshot (~100-300 ms).
var SKILL_MS_SHOW = true;                       // show the timing lines in the panel (and one log line every 6 s)
var skMs = { lastIdx: -1, lastAt: 0, gap: {}, cyc: {}, tapAt: {}, dim: {}, dimMs: {}, cd: {}, shownAt: 0, logAt: 0 };
function skillMsTap(idx, t0) {
    try {
        var nm = SKILLS[idx].name;
        if (skMs.lastIdx >= 0 && skMs.lastIdx !== idx) skMs.gap[SKILLS[skMs.lastIdx].name + ">" + nm] = t0 - skMs.lastAt;
        if (skMs.tapAt[idx]) skMs.cyc[idx] = t0 - skMs.tapAt[idx];
        skMs.tapAt[idx] = t0; skMs.lastIdx = idx; skMs.lastAt = t0; skMs.dim[idx] = false;
    } catch (e) {}
}
function skillMsReady(idx, ready, now) {
    try {
        var t = skMs.tapAt[idx];
        if (!t) return;
        if (!ready && !skMs.dim[idx]) { skMs.dim[idx] = true; skMs.dimMs[idx] = now - t; }
        else if (ready && skMs.dim[idx]) { skMs.dim[idx] = false; skMs.cd[idx] = now - t; }
    } catch (e) {}
}
function skillMsShow() {
    if (!SKILL_MS_SHOW) return;
    var now = Date.now();
    if (now - skMs.shownAt < 1000) return;
    skMs.shownAt = now;
    try {
        var lines = [], i, k, g = [];
        for (i = 0; i < SKILLS.length; i++) {
            if (skMs.tapAt[i] === undefined) continue;
            lines.push(SKILLS[i].name + (skMs.dimMs[i] !== undefined ? "  dim " + skMs.dimMs[i] : "") + (skMs.cd[i] !== undefined ? "  cd " + skMs.cd[i] : "") + (skMs.cyc[i] !== undefined ? "  cyc " + skMs.cyc[i] : ""));
        }
        for (k in skMs.gap) g.push(k + " " + skMs.gap[k]);
        if (g.length) lines.push("gap ms: " + g.slice(-5).join("  "));
        if (!lines.length) return;
        var txt = lines.join("\n");
        ui.run(function () { try { w.msTxt.setVisibility(android.view.View.VISIBLE); w.msTxt.setText(T(txt)); } catch (e1) {} });
        if (now - skMs.logAt >= 6000) { skMs.logAt = now; log("[ms] " + lines.join(" | ").replace(/\n/g, " ")); }
    } catch (e) {}
}
function skillBright(img, idx) {
    var sk = SKILLS[idx], c = toPx(sk.x, sk.y, "r", "b"), tot = 0, cnt = 0, dx, dy;
    var W = img.getWidth(), H = img.getHeight();
    for (dy = -2; dy <= 2; dy++) for (dx = -2; dx <= 2; dx++) {
        var x = c[0] + dx * 10, y = c[1] + dy * 10;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        var col = images.pixel(img, x, y);
        tot += colors.red(col) + colors.green(col) + colors.blue(col);
        cnt++;
    }
    return cnt ? tot / (cnt * 3) : -1;
}
function skillReady(img, idx) {
    try {
        var b = skillBright(img, idx);
        if (b < 0) return true;
        var base = skillBase[idx] || 0;
        base = b > base ? b : base * 0.999;          // remember the brightest look, forget very slowly
        skillBase[idx] = base;
        return b >= base * SKILL_READY_RATIO;
    } catch (e) { return true; }
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
// ---- Center tap: when the selected mob is gone (killed), tap the middle of the screen (picks up the drop under / next to the character) ----
// ---- Self tap: tap your own character every few seconds so it stops chasing / clicking mobs ----
function selfTapPaused(why, now) {              // log why the self tap is holding still (at most every 10 s)
    return false;
}
function selfTapStep() {
    if (!SELF_TAP_ON) return false;
    var now = Date.now();
    if (now - selfTapAt < SELF_TAP_MS) return false;
    // ---- pause while a captcha is up ----
    if (now - capSeenAt < 4000) return selfTapPaused("captcha", now);
    if (now - lootSt.lastAct < LOOT_SELF_HOLD_MS) return selfTapPaused("looting", now);
    if (captchaOn) {                                                            // live look: is a captcha popup on screen right now?
        var cimg = null;
        try { cimg = grabScreen(); } catch (ec) { cimg = null; }
        if (cimg && cimg.getWidth() >= cimg.getHeight() && capPopupShown(cimg, cimg.getWidth(), cimg.getHeight())) {
            capSeenAt = Date.now();
            selfTapAt = now - SELF_TAP_MS + 1000;                               // look again in 1 s
            return selfTapPaused("captcha", now);
        }
    }
    selfTapAt = now; selfTaps++;
    var q = toPx(SELF_TAP_POS[0], SELF_TAP_POS[1], "c", "c");
    for (var si = 0; si < SELF_TAP_COUNT; si++) { press(q[0], q[1], TAP_MS); if (si < SELF_TAP_COUNT - 1) nap(150); }
    return true;
}
// ---- Map functions ----
// Finds a map icon of the given border color: the 3x3-cell block holding the most orange-border pixels (bricks / text are spread out, the icon is not)
function mapFindIcon(color, th0) {
    var img = null;
    try { img = grabScreen(); } catch (e) { img = null; }
    if (!img) return null;
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return null;
    var L = layoutOf(W, H), k = W / REF_W;
    var x0 = mapX(L, MAP_BOX[0], "c"), y0 = mapY(L, MAP_BOX[1], "c");
    var x1 = mapX(L, MAP_BOX[2], "c"), y1 = mapY(L, MAP_BOX[3], "c");
    var C = Math.max(20, Math.round(W * 0.02));
    var minPts = Math.max(15, Math.round(40 * k * k)), minSum = Math.max(30, Math.round(80 * k * k));
    for (var t = 0; t < 3; t++) {
        var pts = images.findAllPointsForColor(img, MAP_M_COLOR, { region: [x0, y0, x1 - x0, y1 - y0], threshold: th0 + t * 15 });
        if (!pts || pts.length < minPts) continue;
        var cells = {}, i, key;
        for (i = 0; i < pts.length; i++) {
            key = Math.floor(pts[i].x / C) + "," + Math.floor(pts[i].y / C);
            cells[key] = (cells[key] || 0) + 1;
        }
        var best = null, bestSum = 0;
        for (key in cells) {
            var pp = key.split(","), cx = parseInt(pp[0], 10), cy = parseInt(pp[1], 10), sum = 0;
            for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) sum += cells[(cx + dx) + "," + (cy + dy)] || 0;
            if (sum > bestSum) { bestSum = sum; best = [cx, cy]; }
        }
        if (!best || bestSum < minSum) continue;
        var sx = 0, sy = 0, n = 0;
        for (i = 0; i < pts.length; i++) {
            if (Math.abs(Math.floor(pts[i].x / C) - best[0]) <= 1 && Math.abs(Math.floor(pts[i].y / C) - best[1]) <= 1) { sx += pts[i].x; sy += pts[i].y; n++; }
        }
        if (n) return [Math.round(sx / n), Math.round(sy / n)];
    }
    return null;
}
// All cyan party-member icons on the map: [{x, y, n, box:[x0,y0,x1,y1]}], biggest first
function mapMemberIcons(img) {
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return [];
    var L = layoutOf(W, H), k = W / REF_W;
    var x0 = mapX(L, MAP_BOX[0], "c"), y0 = mapY(L, MAP_BOX[1], "c");
    var x1 = mapX(L, MAP_BOX[2], "c"), y1 = mapY(L, MAP_BOX[3], "c");
    var pts = images.findAllPointsForColor(img, MAP_P_COLOR, { region: [x0, y0, x1 - x0, y1 - y0], threshold: MAP_P_TH });
    if (!pts || pts.length < Math.max(30, Math.round(100 * k * k))) return [];
    var C = Math.max(20, Math.round(W * 0.02)), cells = {}, i, key, c;
    for (i = 0; i < pts.length; i++) {
        key = Math.floor(pts[i].x / C) + "," + Math.floor(pts[i].y / C);
        c = cells[key];
        if (!c) c = cells[key] = { n: 0, sx: 0, sy: 0, a: 1e9, b: 1e9, c: -1, d: -1 };
        c.n++; c.sx += pts[i].x; c.sy += pts[i].y;
        if (pts[i].x < c.a) c.a = pts[i].x; if (pts[i].y < c.b) c.b = pts[i].y;
        if (pts[i].x > c.c) c.c = pts[i].x; if (pts[i].y > c.d) c.d = pts[i].y;
    }
    var seen = {}, out = [], minCell = Math.max(2, Math.round(3 * k * k)), minN = Math.max(30, Math.round(100 * k * k));
    for (key in cells) {
        if (seen[key] || cells[key].n < minCell) continue;
        var comp = { n: 0, sx: 0, sy: 0, a: 1e9, b: 1e9, c: -1, d: -1 }, stack = [key];
        seen[key] = true;
        while (stack.length) {
            var kk = stack.pop(), cc = cells[kk], pp = kk.split(",");
            comp.n += cc.n; comp.sx += cc.sx; comp.sy += cc.sy;
            comp.a = Math.min(comp.a, cc.a); comp.b = Math.min(comp.b, cc.b); comp.c = Math.max(comp.c, cc.c); comp.d = Math.max(comp.d, cc.d);
            for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
                var nk = (parseInt(pp[0], 10) + dx) + "," + (parseInt(pp[1], 10) + dy);
                if (cells[nk] && !seen[nk] && cells[nk].n >= minCell) { seen[nk] = true; stack.push(nk); }
            }
        }
        if (comp.n >= minN) out.push({ x: Math.round(comp.sx / comp.n), y: Math.round(comp.sy / comp.n), n: comp.n, box: [comp.a, comp.b, comp.c, comp.d] });
    }
    out.sort(function (p, q) { return q.n - p.n; });
    return out;
}
// Reads the number (2-8) printed in a member icon with OCR; 0 = could not read
function mapReadDigit(img, ic) {
    if (!alOcrEngine) return 0;
    var W = img.getWidth(), H = img.getHeight(), pad = 6;
    var x = Math.max(0, ic.box[0] - pad), y = Math.max(0, ic.box[1] - pad);
    var cw = Math.min(W - x, ic.box[2] - ic.box[0] + 2 * pad), ch = Math.min(H - y, ic.box[3] - ic.box[1] + 2 * pad);
    if (cw < 8 || ch < 8) return 0;
    var crop = null, big = null, d = 0;
    try {
        crop = images.clip(img, x, y, cw, ch);
        big = images.scale(crop, 4, 4);
        var res = alRunOcr(big), map = { "Z": 2, "z": 2, "S": 5, "s": 5, "G": 6, "b": 6, "T": 7, "B": 8 };
        for (var i = 0; i < res.length && !d; i++) {
            var t = String(res[i].text).replace(/\s/g, "");
            for (var j = 0; j < t.length && !d; j++) {
                var ch1 = t.charAt(j), v = /[2-8]/.test(ch1) ? parseInt(ch1, 10) : (map[ch1] || 0);
                if (v >= 2 && v <= 8) d = v;
            }
        }
    } catch (e) { logErr("map digit", e); }
    try { if (big) big.recycle(); } catch (e1) {}
    try { if (crop) crop.recycle(); } catch (e2) {}
    return d;
}
// Picks where to tap on the open map according to the go-to panel: M first (orange), then the ticked members.
function mapPick() {
    if (!captureOk) return null;
    var want = [], i;
    for (i = 1; i < 8; i++) if (mapSelOn(i)) want.push(i + 1);          // member numbers 2..8
    if (mapSelOn(0)) {
        var pm = mapFindIcon(MAP_M_COLOR, MAP_M_TH);
        if (pm) return { p: pm, who: "M (leader)" };
    }
    if (!want.length) return null;
    var img = null;
    try { img = grabScreen(); } catch (e) { img = null; }
    if (!img) return null;
    var icons = mapMemberIcons(img);
    if (!icons.length) return null;
    var digs = icons.map(function (ic) { return mapReadDigit(img, ic); });
    log("Map: " + icons.length + " member icon(s), numbers read: " + digs.join(","));
    for (i = 0; i < want.length; i++) {                                  // lowest ticked number that is on the map
        var at = digs.indexOf(want[i]);
        if (at >= 0) return { p: [icons[at].x, icons[at].y], who: "member " + want[i] };
    }
    for (i = 0; i < icons.length; i++) {                                 // number not readable -> use the icon anyway
        if (!digs[i]) return { p: [icons[i].x, icons[i].y], who: "member (number unread)" };
    }
    return null;                                                         // all visible members are unticked
}
function mapRun() {
    mapBusy = true;
    try {
        log("Map: open");
        tapAt(MAP_MINI[0], MAP_MINI[1], "minimap", 0, "r", "t");
        nap(1000);
        var pk = mapPick();
        if (pk) { log("Map: " + pk.who + " found at (" + pk.p[0] + "," + pk.p[1] + ")"); press(pk.p[0], pk.p[1], TAP_MS); }
        else { log("Map: no ticked M / member icon found -> fallback position"); tapAt(MAP_M_FALLBACK[0], MAP_M_FALLBACK[1], "fallback", 0, "c", "c"); }
        mapHoldUntil = Date.now() + MAP_WALK_MS;                          // the character is walking now: no attack / loot / self tap
        log("Map: walking - attack/loot paused for " + (MAP_WALK_MS / 1000) + "s");
        if (MAP_CLOSE_AFTER) { nap(600); tapAt(MAP_CLOSE[0], MAP_CLOSE[1], "map Close", 0, "c", "c"); nap(400); }
    } finally {
        mapBusy = false;
        mapAutoAt = Math.max(Date.now(), mapHoldUntil);                   // the auto interval counts from the end of the walk
    }
}
function mapStep() {                 // called from the main loop; true = it ran (the loop starts a fresh pass)
    if (mapBusy) return false;
    if (sgPatrol && sgPatrolStep()) return true;                    // MAP LOCATION patrol
    var now = Date.now();
    if (!mapKick && !(MAP_AUTO_ON && now - mapAutoAt >= MAP_AUTO_MS)) return false;
    mapKick = false;
    mapRun();
    return true;
}
var CENTER_TAP_ON = store.get("centerTapOn", true);   // toggled by the "Center tap" button in Tools (needs Auto target ON: it watches the target frame)
var CENTER_TAP_POS = [1288, 588];                  // where to tap (reference 2576x1177 screen, centred)
var CENTER_TAP_DELAY_MS = 800;                     // wait after the mob is gone before tapping (the drop needs a moment to appear)
var CENTER_TAP_COUNT = 2, CENTER_TAP_GAP_MS = 400; // taps per kill, pause between them
var ctSeen = false, ctFalseN = 0, centerTapAt = 0, centerTaps = 0;
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
    if (locked === true) { ctSeen = true; ctFalseN = 0; }      // center tap: a mob was selected ...
    else if (locked === false) {
        ctFalseN++;
        if (CENTER_TAP_ON && ctSeen && ctFalseN >= 2) { ctSeen = false; centerTapAt = now + CENTER_TAP_DELAY_MS; }   // ... and now it is gone (2 checks in a row) = killed
    }
    if (CENTER_TAP_ON && centerTapAt && now >= centerTapAt) {
        centerTapAt = 0; centerTaps++;
        var cx0 = mapX(L, CENTER_TAP_POS[0], "c"), cy0 = mapY(L, CENTER_TAP_POS[1], "c");
        log("Center tap: mob gone -> tapping the center (" + cx0 + "," + cy0 + ") x" + CENTER_TAP_COUNT + " #" + centerTaps);
        for (var ci = 0; ci < CENTER_TAP_COUNT; ci++) { press(cx0, cy0, TAP_MS); if (ci < CENTER_TAP_COUNT - 1) nap(CENTER_TAP_GAP_MS); }
        return true;
    }
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
        if (!TARGET_SWEEP_ON || retarget) return false;        // nothing on screen to target (no blind sweeping while a mob is already selected)
        if (now - tgtTapAt < (locked === false ? TARGET_SWEEP_MS : TARGET_RETRY_MS)) return false;
        var rp = TARGET_RING[tgtRing % TARGET_RING.length]; tgtRing++;
        tx = mapX(L, rp[0], "c"); ty = mapY(L, rp[1], "c"); how = "sweep";
    }
    press(tx, ty, TAP_MS);
    tgtTapAt = Date.now(); tgtTaps++; tgtLastPt = [tx, ty];
    if ((how !== "sweep" && how !== "retarget") || Date.now() - tgtLogAt > 15000) {
        tgtLogAt = Date.now();
        log("Auto target: tapped (" + tx + "," + ty + ") " + how + (locked === false ? " [no target selected]" : "") + " #" + tgtTaps);
    }
    nap(250);
    return true;
}

// ---- Auto Pots: once the character is in game, open the MENU and press "Auto Pots" (both found by image) ----
// Templates in TEMPLATE_DIR (cropped from a 2576x1177 screenshot): menu_btn.png (the MENU button, top-right) and
// autopots_btn.png (the "Auto Pots" button of the menu pop-up). If a template file is missing, that button is tapped
// at its fixed position instead. Runs once after every login / re-login (set AUTOPOTS_REPEAT_MS to repeat it).
var AUTOPOTS_ON = store.get("autoPotsOn", true);   // false = never open the menu / press Auto Pots (toggled by the "Auto Pots" button in Tools)
var autoPotsKick = false;                        // set by the button: the main loop starts / cancels the Auto Pots step on its next pass
var AUTOPOTS_REPEAT_MS = 0;                      // 0 = ONCE per login (default); otherwise re-check every this many ms
var AUTOPOTS_RETRY_MS = 15000;                   // when Auto Pots could not be confirmed: try again after this many ms
var AUTOPOTS_MAX_RETRIES = 1;                    // ... at most this many extra runs, and only when the window never opened
var MENU_BOX = [2200, 250, 2576, 450];           // where the MENU button is searched (reference px, top-right)
var AUTOPOTS_BOX = [1000, 300, 1580, 900];       // where the Auto Pots button is searched (reference px, centred pop-up)
var MENU_FALLBACK = [2464, 338];                 // fixed MENU position (only used when menu_btn.png is missing)
var AUTOPOTS_FALLBACK = [1288, 483];             // fixed Auto Pots position (only used when autopots_btn.png is missing)
var MENU_TPL_THRESHOLD = 0.8, AUTOPOTS_TPL_THRESHOLD = 0.7;
var AUTOPOTS_OPEN_WAIT_MS = 800;                 // wait after tapping MENU before looking for Auto Pots (ms)
var AUTOPOTS_AFTER_MS = 1000;                    // pause after tapping Auto Pots (ms)
var AUTOPOTS_TRIES = 2;                          // attempts per run (only used when the window does not open)
var lastAutoPots = 0, btnTplLogged = {}, apTicked = false;
function findBtn(img, L, name, box, thr, ax, ay) {     // -> { state: "found" | "none" | "missing", p: [x, y] pixel centre }
    var tpl = getTemplateFit(name, L);
    if (!tpl) {
        if (!btnTplLogged[name]) { btnTplLogged[name] = true; log("Auto Pots: " + name + ".png not found in " + TEMPLATE_DIR + " - using the fixed position"); }
        return { state: "missing", p: null };
    }
    var x0 = mapX(L, box[0], ax), y0 = mapY(L, box[1], ay), x1 = mapX(L, box[2], ax), y1 = mapY(L, box[3], ay);
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(img.getWidth(), x1); y1 = Math.min(img.getHeight(), y1);
    var pt = null;
    if (x1 - x0 >= tpl.getWidth() && y1 - y0 >= tpl.getHeight()) {
        try { pt = images.findImage(img, tpl, { region: [x0, y0, x1 - x0, y1 - y0], threshold: thr }); }
        catch (e) { logErr(name + " findImage", e); }
    }
    if (!pt) return { state: "none", p: null };
    return { state: "found", p: [pt.x + Math.round(tpl.getWidth() / 2), pt.y + Math.round(tpl.getHeight() / 2)] };
}
function tapPx(p, what, m) {
    log("tap " + what + " px(" + p[0] + "," + p[1] + ") via " + TAP_METHODS[m]);
    if (m === 1) click(p[0], p[1]);
    else if (m === 2) swipe(p[0], p[1], p[0] + 2, p[1] + 2, 150);
    else press(p[0], p[1], TAP_MS);
}
// ---- Auto Potion Window (opens after Auto Pots): tick "Enable Auto Potion", set the HP / MP / SP sliders, press OK ----
// The sliders are read back from the screen (length of the orange bar) and corrected until they show the wanted value.
// Template autopot_ok.png (the OK button) is used to see that the window is open and to tap OK; fixed position if missing.
var AUTOPOTS_SET = true;                         // false = stop after tapping Auto Pots (leave the window alone)
var AUTOPOTS_OK_TAP = true;                      // true = press OK at the end (false = leave the window open)
var AP_VALUES = { hp: 69, mp: 63, sp: 71 };      // wanted percentages
var AP_OK_BOX = [1400, 740, 1720, 880];          // where the OK button is searched (reference px)
var AP_OK_FALLBACK = [1573, 810];                // fixed OK position (only used when autopot_ok.png is missing)
var AP_OK_THRESHOLD = 0.7;
var AP_WIN_WAIT_MS = 3000;                       // how long to wait for the window to show up (ms)
var AP_CHECK_PT = [1633, 482];                   // centre of the "Enable Auto Potion" box
var AP_CHECK_BOX = [1614, 464, 1652, 500];       // inside of that box: white pixels here = ticked
var AP_BAR_Y = { hp: 566, mp: 651, sp: 736 };    // centre line of each slider
var AP_BAR_X0 = 1074, AP_BAR_PX = 4.16;          // x of 0% and reference px per 1% (bar spans ~1078 - 1494)
function apRefX(L, x) { return L.stretch ? x / L.kx : REF_W / 2 + (x - L.W / 2) / L.kx; }
function apOrange(c) {
    var r = capR(c), g = capG(c), b = capB(c);
    return r >= 190 && g >= 110 && g <= 215 && b <= 90 && r - b >= 110;
}
function apChecked(img, L) {             // true when the white tick is inside the box
    var x0 = mapX(L, AP_CHECK_BOX[0], "c"), y0 = mapY(L, AP_CHECK_BOX[1], "c");
    var x1 = mapX(L, AP_CHECK_BOX[2], "c"), y1 = mapY(L, AP_CHECK_BOX[3], "c"), n = 0, x, y, c;
    for (y = y0; y < y1; y += 2) for (x = x0; x < x1; x += 2) {
        c = img.pixel(x, y);
        if (Math.min(capR(c), capG(c), capB(c)) >= 200) n++;
    }
    return n >= 12;
}
function apFill(img, L, key) {           // -> { pct, refX } of the orange bar (refX = where it ends, reference px)
    var xa = mapX(L, 1060, "c"), xb = mapX(L, 1510, "c"), step = Math.max(1, Math.round(L.kx)), best = -1;
    for (var dy = -8; dy <= 8; dy += 4) {
        var py = mapY(L, AP_BAR_Y[key] + dy, "c"), last = -1, x;
        for (x = xa; x <= xb; x += step) {
            if (apOrange(img.pixel(x, py))) last = x;
            else if (last >= 0 && x - last > 6 * step) break;
        }
        if (last > best) best = last;
    }
    if (best < 0) return { pct: 0, refX: AP_BAR_X0 };
    var rx = apRefX(L, best), pct = Math.round((rx - AP_BAR_X0) / AP_BAR_PX);
    return { pct: Math.max(0, Math.min(100, pct)), refX: rx };
}
function setApBar(key, target) {         // drags the slider until the bar shows `target` %; returns true when it does
    var tx = AP_BAR_X0 + AP_BAR_PX * target, y = AP_BAR_Y[key], tries = 7, cur = null;
    for (var t = 1; t <= tries; t++) {
        var img = null;
        try { img = grabScreen(); } catch (e) {}
        if (!img) return false;
        var L = layoutOf(img.getWidth(), img.getHeight());
        cur = apFill(img, L, key);
        var diff = target - cur.pct;
        if (diff === 0 || (t >= 4 && Math.abs(diff) <= 1)) { log("Auto Potion: " + key.toUpperCase() + " = " + cur.pct + "%"); return diff === 0; }
        if (t > 1) tx += diff * AP_BAR_PX;                         // correct the aim by what is still missing
        var sx = Math.max(AP_BAR_X0 + 10, cur.refX), a = toPx(sx, y, "c", "c"), b = toPx(tx, y, "c", "c");
        log("Auto Potion: " + key.toUpperCase() + " shows " + cur.pct + "% -> drag to " + target + "% (try " + t + ")");
        try { swipe(a[0], a[1], b[0], b[1], 350); } catch (e2) { logErr("auto potion swipe", e2); return false; }
        nap(300);
    }
    log("Auto Potion: " + key.toUpperCase() + " could not be set to " + target + "% (shows " + (cur ? cur.pct : "?") + "%)");
    return false;
}
var apWinSeen = false;
function apWindowOpen(img, L) {          // the "Enable Auto Potion" box frame (grey border) - no template needed
    var n = 0, t = 0, x, y;
    function grey(px, py) {                  // a grey border pixel within +-2 px of the expected spot (tolerates 1-2 px shifts)
        var dx, dy, c, v, hit = false;
        t++;
        for (dy = -2; dy <= 2 && !hit; dy++) for (dx = -2; dx <= 2 && !hit; dx++) {
            c = img.pixel(px + dx, py + dy); v = (capR(c) + capG(c) + capB(c)) / 3;
            if (v >= 80 && v <= 125) hit = true;
        }
        if (hit) n++;
    }
    for (y = 455; y < 512; y += 4) { grey(mapX(L, 1602, "c"), mapY(L, y, "c")); grey(mapX(L, 1666, "c"), mapY(L, y, "c")); }
    for (x = 1606; x < 1664; x += 4) { grey(mapX(L, x, "c"), mapY(L, 451, "c")); grey(mapX(L, x, "c"), mapY(L, 513, "c")); }
    return t > 0 && n / t >= 0.8;
}
function apTickCount(img, L) {           // white pixels inside the box (the tick mark)
    var x0 = mapX(L, AP_CHECK_BOX[0], "c"), y0 = mapY(L, AP_CHECK_BOX[1], "c");
    var x1 = mapX(L, AP_CHECK_BOX[2], "c"), y1 = mapY(L, AP_CHECK_BOX[3], "c"), n = 0, x, y, c;
    for (y = y0; y < y1; y += 2) for (x = x0; x < x1; x += 2) {
        c = img.pixel(x, y);
        if (Math.min(capR(c), capG(c), capB(c)) >= 200) n++;
    }
    return n;
}
function setAutoPotion() {
    var t0 = Date.now(), ok = { state: "none", p: null }, i, img, L;
    apWinSeen = false;
    while (true) {                                                  // 1) wait for the window (box frame, or its OK button)
        img = null;
        try { img = grabScreen(); } catch (e) {}
        if (img) {
            L = layoutOf(img.getWidth(), img.getHeight());
            ok = findBtn(img, L, "autopot_ok", AP_OK_BOX, AP_OK_THRESHOLD, "c", "c");
            if (ok.state === "found" || apWindowOpen(img, L)) break;
        }
        if (Date.now() - t0 >= AP_WIN_WAIT_MS) { log("Auto Potion: window not detected - nothing changed"); return false; }
        nap(300);
    }
    apWinSeen = true;
    log("Auto Potion: window is open");
    try { img = grabScreen(); } catch (e1) { img = null; }       // 2) tick "Enable Auto Potion" - tapped AT MOST ONCE (a 2nd tap would un-tick it)
    if (!img) return false;
    L = layoutOf(img.getWidth(), img.getHeight());
    var n0 = apTickCount(img, L);
    if (n0 >= 12) { apTicked = true; log("Auto Potion: Enable box already ticked"); }
    else {
        var cp = toPx(AP_CHECK_PT[0], AP_CHECK_PT[1], "c", "c");
        log("Auto Potion: ticking the Enable box (tick pixels " + n0 + ")");
        press(cp[0], cp[1], TAP_MS);
        nap(700);
        try { img = grabScreen(); } catch (e2) { img = null; }
        var n1 = img ? apTickCount(img, layoutOf(img.getWidth(), img.getHeight())) : 0;
        apTicked = n1 >= 12 || n1 >= n0 + 6;
        log("Auto Potion: tick " + (apTicked ? "confirmed" : "NOT confirmed - not tapping again, so it can not be un-ticked") + " (tick pixels " + n1 + ")");
    }
    var allOk = setApBar("hp", AP_VALUES.hp);                       // 3) sliders
    allOk = setApBar("mp", AP_VALUES.mp) && allOk;
    allOk = setApBar("sp", AP_VALUES.sp) && allOk;
    if (AUTOPOTS_OK_TAP) {                                          // 4) OK
        var op = ok.state === "found" ? ok.p : toPx(AP_OK_FALLBACK[0], AP_OK_FALLBACK[1], "c", "c");
        tapPx(op, "OK", 0);
        nap(500);
    }
    log("Auto Potion: done" + (allOk ? "" : " (some value could not be confirmed)"));
    return allOk;
}
function runAutoPots() {                 // returns true when the Auto Potion window was opened and the Enable box is ticked
    var menuOpenGuess = false;
    for (var attempt = 1; attempt <= AUTOPOTS_TRIES; attempt++) {
        var m = (attempt - 1) % 3, img = null;
        try { img = grabScreen(); } catch (e) {}
        if (!img) return false;
        var L = layoutOf(img.getWidth(), img.getHeight());
        if (!apWindowOpen(img, L)) {                                  // window not open yet
            var ap = findBtn(img, L, "autopots_btn", AUTOPOTS_BOX, AUTOPOTS_TPL_THRESHOLD, "c", "c");
            if (ap.state !== "found" && !menuOpenGuess) {             // menu pop-up not open -> tap MENU
                var mn = findBtn(img, L, "menu_btn", MENU_BOX, MENU_TPL_THRESHOLD, "r", "t");
                var mp = mn.state === "found" ? mn.p : toPx(MENU_FALLBACK[0], MENU_FALLBACK[1], "r", "t");
                tapPx(mp, "MENU" + (mn.state === "found" ? "" : " (fixed position)") + " (attempt " + attempt + "/" + AUTOPOTS_TRIES + ")", m);
                nap(AUTOPOTS_OPEN_WAIT_MS);
                var t0 = Date.now();
                while (true) {                                        // wait up to ~2.5 s for the Auto Pots button
                    var img2 = null;
                    try { img2 = grabScreen(); } catch (e2) {}
                    if (img2) ap = findBtn(img2, layoutOf(img2.getWidth(), img2.getHeight()), "autopots_btn", AUTOPOTS_BOX, AUTOPOTS_TPL_THRESHOLD, "c", "c");
                    if (ap.state === "found" || Date.now() - t0 >= 2500) break;
                    nap(300);
                }
            }
            var ap_p = ap.state === "found" ? ap.p : toPx(AUTOPOTS_FALLBACK[0], AUTOPOTS_FALLBACK[1], "c", "c");
            tapPx(ap_p, "Auto Pots" + (ap.state === "found" ? "" : " (fixed position)"), m);
            nap(AUTOPOTS_AFTER_MS);
        }
        if (!AUTOPOTS_SET) return true;
        apTicked = false;
        try { setAutoPotion(); } catch (e3) { if (String(e3).indexOf("STOPPED") >= 0) throw e3; logErr("auto potion window", e3); }
        if (apWinSeen) return true;                                   // window opened and handled -> finished (once per login)
        log("Auto Pots: window did not open (attempt " + attempt + "/" + AUTOPOTS_TRIES + ")");
        menuOpenGuess = !menuOpenGuess;                               // maybe the menu is still open: next time skip MENU, then alternate
    }
    log("Auto Pots: gave up after " + AUTOPOTS_TRIES + " attempts");
    return false;
}

// ================= OCR reader (used by the Map member-number reader) =================
function alToArr(x) {
    var out = [];
    if (!x) return out;
    if (x.length !== undefined) { for (var i = 0; i < x.length; i++) out.push(x[i]); }
    else if (x.size) { for (var j = 0; j < x.size(); j++) out.push(x.get(j)); }
    return out;
}
// returns [{text, x, y, h}] in the coordinates of the image that was read
function alRunOcr(img) {
    var out = [];
    function push(text, b) {
        if (!text || !b) return;
        out.push({ text: String(text), x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, h: b.bottom - b.top, w: b.right - b.left });
    }
    try {
        if (alOcrEngine == "paddle") {
            alToArr(paddle.ocr(img)).forEach(function (o) { push(o.label, o.bounds); });
        } else if (alOcrEngine == "gmlkit") {
            var res = gmlkit.ocr(img, AL_OCR_LANG);
            var blocks = alToArr(res && res.children);
            if (blocks.length == 0 && res) push(res.text, res.bounds);
            blocks.forEach(function (bl) {
                var ls = alToArr(bl.children);
                if (ls.length == 0) push(bl.text, bl.bounds);
                else ls.forEach(function (ln) { push(ln.text, ln.bounds); });
            });
        }
    } catch (e) { logErr("OCR", e); }
    return out;
}

// ================= Simple auto loot =================
// Reads the item names on the screen (OCR), walks the character to the item with the joystick and taps it.
// The screen is read again after every walk step and every tap, so an item is only given up when it really cannot be
// picked up (LOOT_TAP_TRIES taps or LOOT_MAX_STEPS steps) - then it is skipped for LOOT_BLACK_MS and the attack goes on.
var LOOT_WORDS = ["potion", "burr", "box", "cloth", "pill"];   // a label is looted when it contains one of these words (lower case) - add more words here
var LOOT_PRIORITY_WORDS = ["burr", "fineburr", "protection", "luxury"];   // these are looted FIRST, even when another item is closer (Burr, Fineburr, Protection Potion, Luxury Protection Potion)
var LOOT_PRIORITY_MAX_DIST = 1300;       // priority items are walked to from farther away than LOOT_MAX_DIST (reference px)
var LOOT_IGNORE_WORDS = [];              // labels containing one of these words are never looted (set by the Loot items panel)
var LOOT_GOLD = true;                    // also pick up gold piles (a yellow number above a coin pile)
var LOOT_GOLD_MAX_H = 34;               // gold numbers are small; bigger numbers are damage numbers (text height in reference px - see "h=" in the [Loot] item seen log and tune)
var LOOT_GOLD_CONFIRM = true;            // gold must be read at the same place on 2 scans (damage numbers float away, gold stays)
var LOOT_GOLD_MIN_PX = 6;                // yellow pixels needed inside the number - lower it if real gold is missed
var LOOT_PAUSE_CLICKER = true;           // stop the auto clicker while looting, start it again when the loot is done
var LOOT_PRE_CONFIRM = true;             // a label must be read at the same place on 2 scans BEFORE loot starts (floating chat / reward text and fading labels are not on the floor, they move or vanish)
var LOOT_NOT_ITEM_WORDS = ["log", "drag", "klassx", "clicker", "confirming", "released", "copy", "close", "obtained", "acquired", "received", "you", "your", "got", "gained", "used", "sold", "bought", "exp", "chat", "party", "guild", "reward", "quest", "event", "mail", "welcome", "lv", "level", "hp", "mp", "sp", "cooldown", "buff", "effect", "require", "required", "target", "cast", "can", "cannot", "enough", "full", "inventory", "failed", "not", "already", "skill", "bonus", "gauge"];   // a label containing one of these WORDS is a message, not a floor item
var LOOT_LOOSE_MATCH = false;            // false = a word must be a WHOLE word of the label (potion / potions, not "inbox" or "pillar"). true = old behaviour (word anywhere inside the text)
var LOOT_FALSE_WORDS = ["portion", "projection", "pillar", "pillow", "motion", "lotion", "notion", "option", "position"];   // OCR look-alikes that are never loot
var LOOT_STILL_STEPS = 2;                // the label did not slide across the screen after this many walk steps in a row = HUD / buff / name text, not a floor item -> skipped
var LOOT_BLACK_STATIC_MS = [60000, 300000, 1800000];   // how long such a fake label is ignored: 1st / 2nd / 3rd+ time it is caught at the same place (ms)
var LOOT_MAX_LABEL = 32;                 // longer text = a sentence, not an item name
var LOOT_MEM_MS = 2500;                  // item vanished from the OCR (too small / blurry) while walking: keep going to where it should be for this long (ms)
var LOOT_FUZZY = true;                   // blurry text: digits inside a word are read as letters (p0tion), 4-letter words may have 1 wrong letter
var LOOT_ENHANCE = true;                 // nothing found -> sometimes read the screen again, enlarged, so small / blurry labels can be read
var LOOT_ENHANCE_EVERY = 3;              // ...on every Nth empty scan (1 = every scan, slower)
var LOOT_ENHANCE_SCALE = 1.6;            // enlarge factor for that second read
var LOOT_COLOR_LOOT = [];                // text colours that are looted even when the NAME is not in the list, e.g. ["green","blue","purple","orange"] (the colour of every seen item is in the "[Loot] item seen" log: col=...). Do NOT add "white" - every name / chat text is white.
var LOOT_LABEL_MAX_H = 21;               // floor item labels are tiny text; anything taller is a pop-up message / skill text / damage number (text height in reference px - see "too big (h=..)" in the log and tune)
var LOOT_LABEL_MIN_ASPECT = 1.8;         // a floor label is one wide line: width / height must be at least this (single letters, icons, numbers are not labels)
var LOOT_MSG_WORDS = ["cooldown", "require", "welcome", "adventure", "begins", "obtained", "acquired", "received", "inventory", "enough", "already", "failed"];   // pop-up message words - also matched with up to 2 OCR mistakes (coolpown, targct ...)
var LOOT_MOB_WORDS = ["werewolf", "halogen", "freezing", "flame", "crazy", "critical", "strike", "crook", "brawler", "slasher", "onslaught", "bandit", "ninja", "baldie", "violent"];   // monster names / floating combat texts - never loot (add the mobs of your map here, lower case)
var LOOT_MOB_PHRASES = ["sacred gate", "hooligan", "hooligar", "cordy", "husky", "barba", "bom bom", "bom-bom", "hell scissors", "wrestler", "hodel", "skating master", "sawadxka", "violent baldie", "violent girl", "gas technician"];   // monster names with several words (lower case, matched as text) - "Sacred Gate Defender" is a monster, not an item
// ---- Monster checklist (Loot panel, MONSTERS): if any monster is ticked, the auto clicker attacks ONLY while a ticked monster name is on the screen ----
var MON_LIST = [
    { id: "barba",  label: "Barba",              phrases: ["barba"] },
    { id: "bombom", label: "Fatty Bom-Bom",      phrases: ["bom bom"] },
    { id: "hellsc", label: "Hell Scissors",      phrases: ["hell scissors"] },
    { id: "wrest",  label: "Wrestler",           phrases: ["wrestler"] },
    { id: "hodel",  label: "Hodel",              phrases: ["hodel"] },
    { id: "skate",  label: "Skating Master",     phrases: ["skating master"] },
    { id: "cordy",  label: "Cordy",              phrases: ["cordy"] },
    { id: "husky",  label: "Siberlan Husky",     phrases: ["husky"] },
    { id: "hooli",  label: "Little Hooligan",    phrases: ["hooligan", "hooligar"] },
    { id: "sacred", label: "Sacred Gate Defender", phrases: ["sacred gate"] },
    { id: "mario",  label: "Marionette",         phrases: ["marionette"] },
    { id: "crook",  label: "Crook",              phrases: ["crook"] },
    { id: "brawl",  label: "Brawler",            phrases: ["brawler"] },
    { id: "slash",  label: "Slasher",            phrases: ["slasher"] },
    { id: "bandit", label: "Bandit",             phrases: ["bandit"] },
    { id: "ninja",  label: "Ninja (M / F)",      phrases: ["ninja"] },
    { id: "baldie", label: "Violent Baldie",     phrases: ["violent baldie", "baldie"] },
    { id: "vgirl",  label: "Violent Girl",       phrases: ["violent girl"] },
    { id: "gastec", label: "Gas Technician",     phrases: ["gas technician", "technician"] }
];
var monOn = MON_LIST.map(function (m) { return store.get("mon_" + m.id, true) !== false; });   // ticked = attack it
var MON_GATE_ON = false;                  // false = never pause the clicker for monsters: a stopped clicker (blue triangle) is tapped again at once. true = attack only while a ticked monster is on the screen
var MON_CHECK_MS = 1000;                  // how often the screen is read for the ticked monsters while attacking (ms)
var monSt = { at: 0 };
function monAnyTicked() { return monOn.some(function (v) { return v; }); }
function monLabelHit(labels) {            // true when one of the labels on screen is a ticked monster (OCR-tolerant)
    for (var i = 0; i < labels.length; i++) {
        var t = String(labels[i].name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
        var words = t.split(" ");
        for (var m = 0; m < MON_LIST.length; m++) {
            if (!monOn[m]) continue;
            for (var j = 0; j < MON_LIST[m].phrases.length; j++) {
                var p = MON_LIST[m].phrases[j];
                if (t.indexOf(p) >= 0) return true;
                if (p.indexOf(" ") < 0 && p.length >= 5) {                  // one-word name: allow 1 (short) or 2 (long) OCR mistakes per word
                    var allow = p.length >= 8 ? 2 : 1;
                    for (var k = 0; k < words.length; k++) if (words[k].length >= 4 && lootLev(words[k], p) <= allow) return true;
                }
            }
        }
    }
    return false;
}
// ---- Skill timers: each skill that is ON in the Skills panel is tapped on its own interval ----
var SKILL_INTERVAL_MS = [0, 3000, 3000, 3000, 3000, 30000];   // per SKILLS index: S1-S4 every 3 s, S5 every 30 s (Atk is not tapped here - the auto clicker attacks)
var S5_IDX = 5;
var skillNext = [0, 0, 0, 0, 0, 0];
function skillS5Burst() {               // pause the auto clicker, tap S5 three times, then start the clicker again
    var bim = grabScreen();
    if (bim) { try { clickerStop(bim, bim.getWidth(), bim.getHeight(), "s5"); } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("S5 clicker stop", e); } }
    var q = toPx(SKILLS[S5_IDX].x, SKILLS[S5_IDX].y, "r", "b");
    for (var n = 0; n < 3; n++) { press(q[0], q[1], SKILL_TAP_MS); if (n < 2) nap(350); }
    log("[Skill] S5 tapped 3 times (every " + (SKILL_INTERVAL_MS[S5_IDX] / 1000) + "s)");
    var rim = grabScreen();
    if (rim) { try { clickerResume(rim, rim.getWidth(), rim.getHeight(), "s5"); } catch (e2) { if (String(e2).indexOf("STOPPED") >= 0) throw e2; logErr("S5 clicker resume", e2); } }
    else clickerReasons.s5 = false;
}
function skillTimedStep(hud) {
    if (hud < STABLE_NEEDED || lootSt.active || Date.now() - capSeenAt < 4000) return;   // loot / captcha have priority
    var now = Date.now();
    for (var i = 1; i < SKILLS.length; i++) {
        if (!skillEnabled(i) || now < skillNext[i]) continue;
        skillNext[i] = now + SKILL_INTERVAL_MS[i];
        if (i === S5_IDX) { skillS5Burst(); continue; }
        var q = toPx(SKILLS[i].x, SKILLS[i].y, "r", "b");
        press(q[0], q[1], SKILL_TAP_MS);
    }
}
// ---- Loot hand: when a WANTED item lies next to the character, the auto clicker is stopped at once (unless a monster is on the screen) and the hand (pick-up) button is tapped over and over
// until nothing is left next to the character; then the clicker starts again. The hand takes whatever is nearest, so nothing is tapped while a ticked IGNORE item is as close or closer. ----
var HAND_AUTO_ON = store.get("handAutoOn", true);   // toggled by the "Loot hand" button in Tools (needs Auto loot ON)
var HAND_AUTO_PAUSE = true;              // true = stop the auto clicker while the hand picks up (not while a monster is on the screen), start it again when nothing is left
var HAND_AUTO_HOLD_MAX_MS = 10000;       // longest time the clicker is held for one pick-up; then it runs again and the hand rests (ms)
var HAND_AUTO_COOL_MS = 15000;           // rest after that (ms)
var HAND_AUTO_EVERY_MS = 130;            // gap between two hand taps (ms)
var HAND_AUTO_TAP_MS = 70;               // finger-down time of each hand tap (ms)
var HAND_AUTO_BURST_MS = 1500;           // taps run this long, then the loop looks at captcha / skills / loot again and comes back (ms)
var HAND_AUTO_CHECK_MS = 150;            // how often the screen is checked while there is nothing to pick up (ms)
var HAND_AUTO_REACH = 2.0;               // "next to the character" = closer than LOOT_PICKUP x this
var HAND_BTN_TRIGGER = true;             // true = the moment the loot-hand button shows up the clicker is stopped and the hand is tapped, without waiting for the OCR to read an item label (the OCR only vetoes it when an IGNORE item is the nearest)
var HAND_DEBUG = true;                   // true = log (at most every 4 s) what the hand step sees: button, labels, distances
var handBtnAlways = false, handDbgAt = 0, handBtnStuck = 0;   // set to true by itself when the button stays on the screen without anything to pick up (then only the OCR decides)
var handAutoAt = 0, handAutoLogAt = 0, handAutoTaps = 0, handAutoWarned = false, handAutoIgnLogAt = 0, handAutoFarLogAt = 0;
var handHoldSince = 0, handMiss = 0, handAutoCool = 0, handEnhN = 0;
function handAutoRelease(why) {          // give the clicker back
    if (!handHoldSince) return;
    handHoldSince = 0; handMiss = 0;
    log("[Hand] " + why + " - clicker released");
    lootEnd();
}
function handAutoStep(hud) {
    var now = Date.now();
    if (lootSt.active || lootSt.monActive) { handHoldSince = 0; return; }                    // the walking loot owns the clicker now
    if (!HAND_AUTO_ON || !alOn || now - capSeenAt < 4000) { handAutoRelease("hand loot off / captcha"); return; }   // loot / captcha have priority
    if (now < handAutoCool || now - handAutoAt < HAND_AUTO_CHECK_MS) return;
    handAutoAt = now;
    if (!alOcrEngine) {                                                  // without OCR the script cannot tell a wanted item from an ignored one
        if (!handAutoWarned) { handAutoWarned = true; log("[Hand] no OCR engine - cannot tell wanted items from ignored ones, so the loot hand is not tapped"); }
        return;
    }
    var img = grabScreen(); if (!img) return;
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return;
    var handVis = matchLoot(img, W, H);                                  // the hand button is on the screen
    if (!handVis) handBtnStuck = 0;
    if (hud < STABLE_NEEDED && !handVis) return;                         // in the game = HUD bars seen, or else the hand button itself
    if (handVis && HAND_BTN_TRIGGER && !handBtnAlways && HAND_AUTO_PAUSE && LOOT_PAUSE_CLICKER && !handHoldSince) {   // button seen = something lies next to the character: stop the clicker NOW
        handHoldSince = Date.now();
        log("[Hand] loot hand button on the screen - clicker stopped at once");
        try { clickerStop(img, W, H, "loot"); } catch (e1b) { if (String(e1b).indexOf("STOPPED") >= 0) throw e1b; logErr("clicker stop (hand button)", e1b); }
        handHoldSince = Date.now();
    }
    var k = layoutOf(W, H).kx, cx = W * LOOT_CHAR_POS[0], cy = H * LOOT_CHAR_POS[1], reach = LOOT_PICKUP * HAND_AUTO_REACH * k;
    var i, d, ignD = 1e9, ignName = "", wantD = 1e9, wantName = "";
    lootSt.ign = [];                                                     // filled by lootFindPass: labels of ticked IGNORE items
    var wanted = lootFindPass(img, W, H, k, cx, cy, lootOcrFast(img, W, H), false, true);   // wanted labels only; the walking loot's skip list does not apply here
    if (!wanted.length && LOOT_ENHANCE && (++handEnhN % Math.max(1, LOOT_ENHANCE_EVERY) === 0)) {   // the plain read often misses a label: try the enlarged read too
        try { wanted = lootFindPass(img, W, H, k, cx, cy, lootOcr(img, W, H, LOOT_ENHANCE_SCALE), true, true); }
        catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("loot hand enlarged read", e); }
    }
    if (!wanted.length && LOOT_MASK_PASS && (++handMskN % Math.max(1, LOOT_MASK_EVERY) === 0)) {      // label-only (black screen) read
        try { wanted = lootFindPass(img, W, H, k, cx, cy, lootOcrMask(img, W, H), true, true); }
        catch (me2) { if (String(me2).indexOf("STOPPED") >= 0) throw me2; logErr("loot hand mask read", me2); }
    }
    var ign = lootSt.ign || [];
    for (i = 0; i < ign.length; i++) { d = lootDist(ign[i].x, ign[i].y, cx, cy); if (d < ignD) { ignD = d; ignName = ign[i].name; } }
    for (i = 0; i < wanted.length; i++) if (wanted[i].d < wantD) { wantD = wanted[i].d; wantName = wanted[i].name; }
    var ignBlock = ignD <= reach && ignD <= wantD;                       // an ignored item is the nearest one: the hand would pick it up
    var btnGo = HAND_BTN_TRIGGER && !handBtnAlways && handVis && !ignBlock;
    var ready = (wantD <= reach && ignD > wantD) || btnGo;               // a wanted item next to the character (or the hand button showing) and no ignored one as close
    if (HAND_DEBUG && Date.now() - handDbgAt > 4000) { handDbgAt = Date.now(); log("[Hand] check: button=" + handVis + " (dark " + lootDark + " ring " + lootRing + " white " + lootWhite + ") wanted=" + wanted.length + (wantName ? " " + wantName + " d=" + Math.round(wantD / k) : "") + " ignored=" + (ignName ? ignName + " d=" + Math.round(ignD / k) : "-") + " reach=" + Math.round(reach / k) + " hold=" + (handHoldSince ? "yes" : "no") + (handBtnAlways ? " btn-always" : "")); }
    if (!ready && handHoldSince && ignBlock) { handAutoRelease("an ignored item is the nearest - hand not tapped"); handAutoCool = Date.now() + 4000; return; }
    if (!ready) {
        if (wantD <= reach) { if (Date.now() - handAutoIgnLogAt > 8000) { handAutoIgnLogAt = Date.now(); log("[Hand] ignored item next to the character (" + ignName + ") - loot hand not tapped"); } }
        else if (wanted.length && Date.now() - handAutoFarLogAt > 6000) { handAutoFarLogAt = Date.now(); log("[Hand] wanted item seen but not next to the character: " + wantName + " d=" + Math.round(wantD / k) + " (hand reach " + Math.round(reach / k) + ")"); }
        if (handHoldSince) { handMiss++; if (handMiss >= 2) handAutoRelease("nothing left next to the character"); }   // 2 empty reads in a row = picked up
        return;
    }
    handMiss = 0;
    if (HAND_AUTO_PAUSE && LOOT_PAUSE_CLICKER && !handHoldSince) {       // stop the clicker NOW (not while a monster is on the screen - the attack goes first)
        var mobH = false;
        try { mobH = !LOOT_OVER_MOB && !!findMob(img, layoutOf(W, H)); } catch (e0) { logErr("hand mob check", e0); }
        if (!mobH) {
            handHoldSince = Date.now();
            log("[Hand] " + wantName + " next to the character - clicker stopped, tapping the loot hand");
            try { clickerStop(img, W, H, "loot"); } catch (e1) { if (String(e1).indexOf("STOPPED") >= 0) throw e1; logErr("clicker stop (hand)", e1); }
            handHoldSince = Date.now();                                  // the stop itself takes time: the hold time counts from here
        }
    }
    if (handHoldSince && Date.now() - handHoldSince > HAND_AUTO_HOLD_MAX_MS) {
        if (handVis && !(wantD <= reach) && ++handBtnStuck >= 3) { handBtnAlways = true; log("[Hand] the hand button stayed on the screen 3 times with nothing to pick up - button trigger switched off, the OCR decides from now on"); }
        handAutoRelease("could not pick up " + (wantName || "anything") + " in " + Math.round(HAND_AUTO_HOLD_MAX_MS / 1000) + "s");
        handAutoCool = Date.now() + HAND_AUTO_COOL_MS;
        return;
    }
    var hx = mapX(layoutOf(W, H), LOOT_X, "c"), hy = mapY(layoutOf(W, H), LOOT_Y, "b"), n = 0, t0 = Date.now(), gone = 0;
    while (Date.now() - t0 < HAND_AUTO_BURST_MS) {
        press(hx, hy, HAND_AUTO_TAP_MS);
        n++;
        nap(HAND_AUTO_EVERY_MS);
        if (n % 4 === 0) {                                               // hand button gone twice in a row = the item is picked up: stop tapping
            var cim = grabScreen();
            if (cim && cim.getWidth() >= cim.getHeight() && !matchLoot(cim, cim.getWidth(), cim.getHeight())) { if (++gone >= 2) break; } else gone = 0;
        }
    }
    handAutoTaps += n;
    handAutoAt = Date.now() - HAND_AUTO_CHECK_MS + 100;                  // look again almost at once
    if (Date.now() - handAutoLogAt > 5000) { handAutoLogAt = Date.now(); log("[Hand] tapping the loot hand for " + wantName + " (" + handAutoTaps + " taps so far)" + (handHoldSince ? "" : ", clicker stays ON (monster on the screen)")); }
}
function monGateStep(hud) {             // hud = the in-game HUD streak from runLoop (hudStreak is local to runLoop)
    if (!MON_GATE_ON) {                  // gate off: if the monster hold is still set, tap the blue triangle now
        if (clickerReasons.mon) { clickerReasons.mon = false; var oim = grabScreen(); if (oim) clickerResume(oim, oim.getWidth(), oim.getHeight(), "mon"); }
        return;
    }
    if (lootSt.active) { if (clickerReasons.mon) clickerReasons.mon = false; return; }   // looting has its own rules; never keep a monster hold during loot
    if (hud < STABLE_NEEDED || !monAnyTicked()) {
        if (clickerReasons.mon) { clickerReasons.mon = false; var mim = grabScreen(); if (mim) clickerResume(mim, mim.getWidth(), mim.getHeight(), "mon"); }
        return;
    }
    var now = Date.now();
    if (now - monSt.at < MON_CHECK_MS) return;
    monSt.at = now;
    var img = grabScreen(); if (!img) return;
    var W = img.getWidth(), H = img.getHeight();
    var hit = monLabelHit(lootOcr(img, W, H, 1));
    if (!hit && !clickerReasons.mon) { clickerReasons.mon = true; clickerStop(img, W, H, "mon"); log("[Mon] no ticked monster on the screen - attack paused"); }
    else if (hit && clickerReasons.mon) { clickerReasons.mon = false; log("[Mon] ticked monster on the screen - attacking"); clickerResume(img, W, H, "mon"); }
}
var LOOT_DEBUG = false;                  // true = log (at most every 4 s) wanted-looking labels that were read but not looted, with the reason
var lootDbgAt = 0;
var LOOT_SCAN_MS = 150;                  // pause between scans while nothing is being looted (ms)
var LOOT_OVER_MOB = false;                // true = a wanted item has priority over monsters: the clicker is paused and the character goes to the item / taps the loot hand even if a monster is on the screen. false = attack the monster first (old behaviour)
var LOOT_EARLY_PAUSE = true;             // true = the auto clicker is stopped the moment a loot label is first read (no monster on the screen); the 2nd read only confirms it. false = stop only after the 2nd read
var LOOT_EARLY_MAX_MS = 3000;            // not confirmed within this time = the clicker is started again (ms)
var LOOT_RECHECK_MS = 80;                // 2nd read of a new label comes this soon after the 1st (ms)
var LOOT_OCR_AREA = [250, 150, 2350, 1000];   // screen area that is read for loot labels (reference px, same format as TARGET_PLAY). Smaller = faster OCR. null = read the whole screen
var LOOT_CONFIRM = false;                // true = item must be read at the same place on 2 scans before walking (slower). false = walk right after the first read (gold too).
var LOOT_CHAR_POS = [0.50, 0.57];        // where the character stands (screen fraction)
var LOOT_PICKUP = 100;                   // tap the item when it is closer than this (reference px)
var LOOT_MAX_DIST = 900;                 // ignore items farther than this (reference px)
var LOOT_JOY_REF = [295, 880];           // joystick centre on the 2576x1177 reference screen
var JOY_MODE = "arrow";                    // "tap" = press & hold on the ring edge (no slide) | "arrow" = same, but pressed on the outer arrows of the ring (LOOT_ARROW_PUSH) | "slide" = old way: press centre, slide to the edge
var LOOT_JOY_PUSH = 115;                 // px the stick is pushed from its centre (tap mode)
var LOOT_ARROW_PUSH = 134;               // px from the centre to the ring arrows (arrow mode) - the arrows sit outside the ring
function joyPush() { return JOY_MODE === "arrow" ? LOOT_ARROW_PUSH : LOOT_JOY_PUSH; }   // distance used for the press point in the current mode
var LOOT_WALK_SPEED = 330;               // px per second the character walks - TUNE (walks too far = lower it, stops short = raise it)
var LOOT_STEP_MS = 1200;                 // longest single walk step (ms); the screen is read again after each step
var LOOT_SETTLE_MS = 300;                // wait after a step so the character stops (ms)
var LOOT_TAP_WAIT = 1000;                // wait after a tap for the pick-up (ms)
var LOOT_TAP_TRIES = 4;                  // taps on the same item before it is skipped
var LOOT_MAX_STEPS = 4;                 // walk steps to one item before it is skipped
var LOOT_HAND_TAP = true;                // keep tapping the hand (pick-up) button while walking to an item, so it is looted the moment the character arrives
var LOOT_HAND_EVERY_MS = 220;            // gap between hand-button taps while walking (ms)
var LOOT_BLACK_MS = 20000;               // a skipped item is ignored this long (ms)
var LOOT_QUIET_MS = 1500;                // nothing left on the screen for this long = loot done (ms)
var LOOT_MAX_MS = 8000;                 // longest loot run; then the attack gets LOOT_REST_MS (ms)
var LOOT_REST_MS = 6000;
var LOOT_SELF_HOLD_MS = 2500;            // Self tap stays still this long after the last loot action (ms)
var LOOT_IGNORE_REF = [                  // screen areas that never hold loot (reference px)
    [0, 0, 2576, 110, "c"],              // whole top strip: buff / system texts, time, zone
    [0, 0, 900, 235, "l"],               // HUD bars, level, ping / FPS
    [1700, 0, 2576, 400, "r"],           // top right: date, zone, minimap, MENU buttons
    [0, 705, 515, 1177, "l"],            // joystick + version text
    [2010, 640, 2576, 1177, "r"],        // skill buttons
    [770, 1000, 1810, 1177, "c"]         // bottom bar (item counts, Show Chat)
];
function lootFresh() { return { active: false, since: 0, lastSeen: 0, lastScan: 0, lastAct: 0, pauseUntil: 0, cand: null, steps: 0, tapN: 0, lastTap: null, black: [], gold: [], total: 0, warned: false, mem: null, walkPrev: null, still: 0, strikes: [], k: 1 }; }
var lootSt = lootFresh();
function lootReset() { lootSt = lootFresh(); }
function lootDist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function lootLev(a, b) {
    var m = a.length, n = b.length, i, j, prev = [], cur;
    for (j = 0; j <= n; j++) prev.push(j);
    for (i = 1; i <= m; i++) {
        cur = [i];
        for (j = 1; j <= n; j++) cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)));
        prev = cur;
    }
    return prev[n];
}
function lootTokOk(t, kw) {              // does one word of the label equal the loot word (plural / 1 wrong letter allowed)
    if (LOOT_FALSE_WORDS.indexOf(t) >= 0) return false;
    if (t === kw) return true;
    if (t.length <= kw.length + 2 && t.length > kw.length && t.indexOf(kw) === 0 && /^(s|es|x\d*)$/.test(t.substring(kw.length))) return true;   // potions, boxes
    if (kw.length >= 4 && t.length > kw.length && t.length <= kw.length + 6 && t.lastIndexOf(kw) === t.length - kw.length) return true;   // Fineburr, Redpotion (word glued to a prefix)
    if (kw.length >= 5 && Math.abs(t.length - kw.length) <= 1 && t.charAt(0) === kw.charAt(0) && lootLev(t, kw) <= 1) return true;           // 1 OCR mistake in a long word
    if (LOOT_FUZZY && kw.length === 4 && t.length === 4 && t.charAt(0) === kw.charAt(0) && lootLev(t, kw) <= 1) return true;                  // 1 wrong letter in a 4-letter word (burr / bnrr)
    if (LOOT_FUZZY && kw.length >= 6 && Math.abs(t.length - kw.length) <= 2 && lootLev(t, kw) <= 2) return true;                              // 2 mistakes in a long word
    return false;
}
function lootMobPhrase(txt) {     // label contains a monster-name phrase (ignores case, spaces and punctuation)
    var t = String(txt).toLowerCase().replace(/[^a-z0-9]+/g, " ");
    for (var i = 0; i < LOOT_MOB_PHRASES.length; i++) if (t.indexOf(LOOT_MOB_PHRASES[i]) >= 0) return true;
    return false;
}
function lootMatch(txt, words) {         // does this label contain one of the words (default LOOT_WORDS)
    words = words || LOOT_WORDS;
    var raw = String(txt).replace(/([a-z])([A-Z])/g, "$1 $2");                // RedPotion -> Red Potion
    var toks = raw.toLowerCase().split(LOOT_FUZZY ? /[^a-z0-9]+/ : /[^a-z]+/), i, j, t, kw;
    for (i = 0; i < toks.length; i++) {
        t = toks[i];
        if (LOOT_FUZZY && /[a-z]/.test(t) && /[0-9]/.test(t)) t = t.replace(/0/g, "o").replace(/1/g, "l").replace(/5/g, "s").replace(/8/g, "b").replace(/3/g, "e").replace(/[0-9]/g, "");   // p0tion -> potion
        if (t.length < 3) continue;
        for (j = 0; j < words.length; j++) {
            kw = words[j];
            if (LOOT_LOOSE_MATCH) {
                if (t.indexOf(kw) >= 0) return true;
                if (kw.length >= 5 && t.length >= 4 && lootLev(t, kw) <= 1) return true;
            } else if (lootTokOk(t, kw)) return true;
        }
    }
    return false;
}
function lootNotItem(txt) {              // chat lines / reward messages / sentences are not floor labels
    var t = String(txt).toLowerCase();
    if (t.length > LOOT_MAX_LABEL || t.indexOf(":") >= 0 || t.indexOf("[") >= 0 || t.indexOf("]") >= 0 || t.indexOf("=") >= 0) return true;   // "=" : wrapped line of this script's own log (d=102 ...)
    if (/[.!?]\s*$/.test(t) || t.indexOf("...") >= 0) return true;                       // "Require target to cast." - a floor label never ends with punctuation
    var toks = t.split(/[^a-z]+/), i;
    var mw, mt;
    for (i = 0; i < toks.length; i++) {
        mt = toks[i]; if (mt.length < 6) continue;
        for (mw = 0; mw < LOOT_MSG_WORDS.length; mw++) if (Math.abs(mt.length - LOOT_MSG_WORDS[mw].length) <= 2 && lootLev(mt, LOOT_MSG_WORDS[mw]) <= 2) return true;
    }
    var nWords = 0, wi2;
    for (wi2 = 0; wi2 < toks.length; wi2++) if (toks[wi2].length >= 3 && toks[wi2] !== "hp" && toks[wi2] !== "mp" && toks[wi2] !== "sp") nWords++;
    var isPot = /potion|recovery/.test(t) || (nWords >= 2 && !/\d/.test(t));              // hp / mp / sp next to 2+ real words and no number = an item name even when OCR garbled it (Madum HP Rocvy Rotlon)                                                  // "Medium HP Recovery Potion": hp / mp / sp are part of the item name here
    for (i = 0; i < toks.length; i++) if (toks[i] && LOOT_NOT_ITEM_WORDS.indexOf(toks[i]) >= 0 && !(isPot && (toks[i] === "hp" || toks[i] === "mp" || toks[i] === "sp"))) return true;
    return false;
}
function lootWinRects(W, H) {            // the script's own floating windows (their log text must never be read as loot)
    var out = [], wins = [w, svPop, chPop, alWin, logPop, sgWin], i, o, x, y, ww, hh, sx = 1, sy = 1;
    try { var rs = realDisplaySize(); if (rs && rs.W > 0 && rs.H > 0) { sx = W / rs.W; sy = H / rs.H; } } catch (e) {}
    for (i = 0; i < wins.length; i++) {
        o = wins[i]; if (!o) continue;
        try {
            x = o.getX(); y = o.getY(); ww = o.getWidth(); hh = o.getHeight();
            if (ww > 0 && hh > 0) out.push([(x - 6) * sx, (y - 6) * sy, (x + ww + 6) * sx, (y + hh + 6) * sy]);
        } catch (e2) {}
    }
    return out;
}
function lootIgnored(x, y, W, H, wr) {
    var L = layoutOf(W, H), i, r, ax, ay, x1, x2, y1, y2;
    for (i = 0; i < wr.length; i++) if (x >= wr[i][0] && x <= wr[i][2] && y >= wr[i][1] && y <= wr[i][3]) return true;
    for (i = 0; i < LOOT_IGNORE_REF.length; i++) {
        r = LOOT_IGNORE_REF[i]; ax = r[4]; ay = r[1] < REF_H * 0.3 ? "t" : "b";
        x1 = mapX(L, r[0], ax); x2 = mapX(L, r[2], ax); y1 = mapY(L, r[1], ay); y2 = mapY(L, r[3], ay);
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) return true;
    }
    return false;
}
function lootYellow(img, W, H, o) {      // yellow / orange pixels inside the number (gold amounts are written in that colour)
    var hw = (o.w || o.h * 2) / 2, x1 = Math.max(0, Math.round(o.x - hw)), x2 = Math.min(W - 1, Math.round(o.x + hw));
    var y1 = Math.max(0, Math.round(o.y - o.h / 2)), y2 = Math.min(H - 1, Math.round(o.y + o.h / 2)), n = 0, x, y, c, r, g, b;
    for (y = y1; y <= y2; y += 2) for (x = x1; x <= x2; x += 2) {
        c = images.pixel(img, x, y); r = colors.red(c); g = colors.green(c); b = colors.blue(c);
        if (r > 200 && g > 140 && b < 110 && r - b > 110) n++;
    }
    return n;
}
function lootTextColor(img, W, H, o) {   // dominant colour of the letters inside a label: white yellow orange red green cyan blue purple pink (or "")
    var hw = (o.w || o.h * 2) / 2, x1 = Math.max(0, Math.round(o.x - hw)), x2 = Math.min(W - 1, Math.round(o.x + hw));
    var y1 = Math.max(0, Math.round(o.y - o.h / 2)), y2 = Math.min(H - 1, Math.round(o.y + o.h / 2)), x, y, c, r, g, b, mx, mn, hue, d, n = {}, best = "", bn = 0, nm;
    for (y = y1; y <= y2; y++) for (x = x1; x <= x2; x += 1) {
        c = images.pixel(img, x, y); r = colors.red(c); g = colors.green(c); b = colors.blue(c);
        mx = Math.max(r, g, b); mn = Math.min(r, g, b);
        if (mx < 140) continue;                                   // dark = label background
        if (mn > 165) nm = "white";
        else if (mx - mn < 70) continue;                          // grey / dull
        else {
            d = mx - mn;
            if (mx === r) hue = ((g - b) / d + 6) % 6; else if (mx === g) hue = (b - r) / d + 2; else hue = (r - g) / d + 4;
            hue *= 60;
            nm = hue < 15 || hue >= 345 ? "red" : hue < 38 ? "orange" : hue < 70 ? "yellow" : hue < 165 ? "green" : hue < 200 ? "cyan" : hue < 255 ? "blue" : hue < 300 ? "purple" : "pink";
        }
        n[nm] = (n[nm] || 0) + 1;
    }
    for (nm in n) if (n[nm] > bn) { bn = n[nm]; best = nm; }
    return bn >= 3 ? best : "";
}
// one OCR pass -> the loot labels on the screen, nearest first
function lootDbg(txt, why) {
    if (!LOOT_DEBUG || Date.now() - lootDbgAt < 4000 || !/[A-Za-z]{4}/.test(txt) || !lootMatch(txt)) return;     // only names that look like a wanted item - no mobs / messages / damage text
    lootDbgAt = Date.now();
    log("[Loot] not looted: \"" + txt + "\" -> " + why);
}
function lootFindPass(img, W, H, k, cx, cy, texts, noGold, noBlack) {
    var st = lootSt, now = Date.now(), items = [], seenGold = [], wr = lootWinRects(W, H), i, j, o, txt, gold, d, bad, steady, pri;
    st.black = st.black.filter(function (b) { return b.until > now; });
    for (i = 0; i < texts.length; i++) {
        o = texts[i]; txt = String(o.text).replace(/\s+/g, " ").trim();
        if (!txt || lootIgnored(o.x, o.y, W, H, wr)) continue;
        gold = false;
        if (LOOT_IGNORE_WORDS.length && lootMatch(txt, LOOT_IGNORE_WORDS)) { (st.ign || (st.ign = [])).push({ x: o.x, y: o.y, name: txt }); }   // an ignored item lies here: the hand button must not be tapped near it
        if (LOOT_GOLD && !noGold && /^\d{2,6}$/.test(txt.replace(/[,.\s]/g, ""))) {
            if (o.h > LOOT_GOLD_MAX_H * k) continue;                            // too big = a damage number
            if (lootYellow(img, W, H, o) < LOOT_GOLD_MIN_PX) continue;          // a plain number, not gold
            seenGold.push({ x: o.x, y: o.y });
            if (LOOT_GOLD_CONFIRM && !st.active) {                              // first sighting: a floating damage number moves, gold stays
                steady = false;
                for (j = 0; j < st.gold.length; j++) if (lootDist(st.gold[j].x, st.gold[j].y, o.x, o.y) <= 30 * k) { steady = true; break; }
                if (!steady) continue;
            }
            gold = true;
        } else if (o.h > LOOT_LABEL_MAX_H * k) {
            lootDbg(txt, "too big (h=" + Math.round(o.h / k) + ") - a message, not a floor label"); continue;
        } else if (o.w > 0 && o.w / Math.max(1, o.h) < LOOT_LABEL_MIN_ASPECT) {
            lootDbg(txt, "not a one-line label (w/h " + (o.w / Math.max(1, o.h)).toFixed(1) + ")"); continue;
        } else if (!lootMatch(txt)) {
            if (!LOOT_COLOR_LOOT.length || !/[A-Za-z]{3}/.test(txt)) { lootDbg(txt, "name not in the list"); continue; }      // not a name from the list: only a wanted text colour can still make it loot
            if (lootNotItem(txt)) { lootDbg(txt, "looks like a message"); continue; }
            var colX = lootTextColor(img, W, H, o);
            if (LOOT_COLOR_LOOT.indexOf(colX) < 0) { lootDbg(txt, "text colour '" + colX + "'"); continue; }
        }
        if (!gold && lootNotItem(txt)) { lootDbg(txt, "looks like a message"); continue; }
        if (!gold && LOOT_MOB_WORDS.length && lootMatch(txt, LOOT_MOB_WORDS)) continue;                      // monster name / combat text
        if (!gold && lootMobPhrase(txt)) { lootDbg(txt, "monster name (not an item)"); continue; }
        if (!gold && LOOT_IGNORE_WORDS.length && lootMatch(txt, LOOT_IGNORE_WORDS)) { lootDbg(txt, "on the ignore list"); continue; }   // on the ignore list
        pri = !gold && lootMatch(txt, LOOT_PRIORITY_WORDS);
        d = lootDist(o.x, o.y, cx, cy);
        if (d > (pri ? LOOT_PRIORITY_MAX_DIST : LOOT_MAX_DIST) * k) { lootDbg(txt, "too far"); continue; }
        bad = false;
        for (j = 0; j < st.black.length; j++) if (lootDist(st.black[j].x, st.black[j].y, o.x, o.y) <= 60 * k) { bad = true; break; }
        if (bad && !noBlack) continue;                                                                      // (the hand step passes noBlack: a spot skipped by the walking loot may still be next to the character)
        items.push({ x: o.x, y: o.y, d: d, h: o.h, name: gold ? "Gold " + txt : txt, gold: gold, pri: pri, col: gold ? "" : lootTextColor(img, W, H, o) });
    }
    if (!noGold) st.gold = seenGold;
    items.sort(function (a, b) { return (b.pri ? 1 : 0) - (a.pri ? 1 : 0) || a.d - b.d; });   // priority items first, then nearest
    var out = [];
    items.forEach(function (it) {
        for (var q = 0; q < out.length; q++) if (lootDist(out[q].x, out[q].y, it.x, it.y) < 40 * k) return;
        out.push(it);
    });
    return out;
}
function lootOcr(img, W, H, f) {       // OCR of the loot area only (LOOT_OCR_AREA), optionally enlarged by f; coords come back in full-screen pixels
    var L = layoutOf(W, H), x0 = 0, y0 = 0, x1 = W, y1 = H, part = null, res = [];
    if (LOOT_OCR_AREA) {
        x0 = Math.max(0, Math.round(mapX(L, LOOT_OCR_AREA[0], "c"))); y0 = Math.max(0, Math.round(mapY(L, LOOT_OCR_AREA[1], "c")));
        x1 = Math.min(W, Math.round(mapX(L, LOOT_OCR_AREA[2], "c"))); y1 = Math.min(H, Math.round(mapY(L, LOOT_OCR_AREA[3], "c")));
    }
    var whole = (x0 === 0 && y0 === 0 && x1 === W && y1 === H), sc = f && f !== 1 ? f : 1;
    try {
        part = whole ? img : images.clip(img, x0, y0, x1 - x0, y1 - y0);
        if (sc !== 1) { var big = images.scale(part, sc, sc); if (!whole) part.recycle(); part = big; }
        alRunOcr(part).forEach(function (o) {
            o.x = o.x / sc + x0; o.y = o.y / sc + y0; o.h /= sc; o.w /= sc; res.push(o);
        });
    } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("loot OCR", e); }
    try { if (part && part !== img) part.recycle(); } catch (e2) {}
    if (sc === 1 || sc === LOOT_OCR_SCALE) lootLastTexts = res;                                          // the monster step reuses this read (no second OCR)
    return res;
}
// ---- speed-up: the plain loot read runs on a smaller image, and the loot scan and the hand step share one read ----
var LOOT_OCR_SCALE = 1;               // size of the plain loot read (1 = full size, 0.75 = about 1.8x faster, 0.6 = faster still - lower it if labels are missed)
var LOOT_OCR_REUSE_MS = 120;             // the hand step reuses the loot scan's read when it is this fresh (ms) (0 = always read again)
var lootOcrCache = null, lootOcrCacheAt = 0, lootOcrCacheW = 0;
function lootOcrFast(img, W, H) {
    var now = Date.now(), res, out = [], i;
    if (!(LOOT_OCR_REUSE_MS && lootOcrCache && lootOcrCacheW === W && now - lootOcrCacheAt < LOOT_OCR_REUSE_MS)) {
        lootOcrCache = lootOcr(img, W, H, LOOT_OCR_SCALE);
        lootOcrCacheAt = Date.now(); lootOcrCacheW = W;
    }
    res = lootOcrCache;
    for (i = 0; i < res.length; i++) out.push({ text: res[i].text, x: res[i].x, y: res[i].y, h: res[i].h, w: res[i].w });   // copy: callers may change their list
    return out;
}
// ---- Label-only (black screen) read: everything that is not label-text colour is painted black, so monsters / floor / effects behind a label cannot confuse the OCR ----
var LOOT_MASK_PASS = true;               // true = when the plain read finds nothing, read again on a black image that keeps only the label-text colours
var LOOT_MASK_EVERY = 3;                 // run that extra read on every Nth empty scan (1 = every scan, slower)
var LOOT_MASK_COLORS = [[255, 255, 255, 70], [255, 200, 60, 90]];   // [r, g, b, tolerance] of label text to keep: white names, gold / yellow names - ADD the colours of your items
var handMskN = 0;
function lootOcrMask(img, W, H) {        // OCR on the black / white mask(s); coords come back in full-screen pixels
    var L = layoutOf(W, H), x0 = 0, y0 = 0, x1 = W, y1 = H, part = null, res = [], i, m;
    if (LOOT_OCR_AREA) {
        x0 = Math.max(0, Math.round(mapX(L, LOOT_OCR_AREA[0], "c"))); y0 = Math.max(0, Math.round(mapY(L, LOOT_OCR_AREA[1], "c")));
        x1 = Math.min(W, Math.round(mapX(L, LOOT_OCR_AREA[2], "c"))); y1 = Math.min(H, Math.round(mapY(L, LOOT_OCR_AREA[3], "c")));
    }
    try {
        part = images.clip(img, x0, y0, x1 - x0, y1 - y0);
        for (i = 0; i < LOOT_MASK_COLORS.length; i++) {
            var mc = LOOT_MASK_COLORS[i];
            m = images.interval(part, colors.rgb(mc[0], mc[1], mc[2]), mc[3]);
            try { alRunOcr(m).forEach(function (o) { o.x += x0; o.y += y0; res.push(o); }); }
            finally { try { m.recycle(); } catch (e0) {} }
        }
    } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("loot mask OCR", e); }
    try { if (part) part.recycle(); } catch (e2) {}
    return res;
}
function lootFind(img, W, H, k, cx, cy) {
    var items = lootFindPass(img, W, H, k, cx, cy, lootOcrFast(img, W, H), false);
    if (items.length) return items;
    var st = lootSt;
    if (LOOT_MASK_PASS) {
        st.mskN = (st.mskN || 0) + 1;
        if (st.mskN % Math.max(1, LOOT_MASK_EVERY) === 0) {
            try {
                var mres = lootFindPass(img, W, H, k, cx, cy, lootOcrMask(img, W, H), true);
                if (mres.length) { log("[Loot] found by the label-only (black screen) read: " + mres[0].name); return mres; }
            } catch (me) { if (String(me).indexOf("STOPPED") >= 0) throw me; logErr("loot mask read", me); }
        }
    }
    if (!LOOT_ENHANCE) return items;
    st.enhN = (st.enhN || 0) + 1;
    if (st.enhN % Math.max(1, LOOT_ENHANCE_EVERY) !== 0) return items;
    var res = [];
    try {
        res = lootFindPass(img, W, H, k, cx, cy, lootOcr(img, W, H, LOOT_ENHANCE_SCALE), true);
        if (res.length) log("[Loot] found by the enlarged read: " + res[0].name);
    } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("loot enhanced read", e); }
    return res;
}
function lootSegDist(px, py, ax, ay, bx, by) {        // distance from point P to the line segment A-B
    var vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy, t = l2 > 0 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return lootDist(px, py, ax + t * vx, ay + t * vy);
}
function lootIgnNear(ax, ay, bx, by, k) {             // name of a ticked-IGNORE item label within hand reach of the walk A -> B ("" = none)
    var list = lootSt.ign || [], reach = LOOT_PICKUP * 1.6 * k, i;
    for (i = 0; i < list.length; i++) if (lootSegDist(list[i].x, list[i].y, ax, ay, bx, by) <= reach) return list[i].name;
    return "";
}
function lootIgnCloser(cx, cy, d, k) {                // name of a ticked-IGNORE label that is as close to the character as the target (distance d) or closer ("" = the target is the nearest)
    var list = lootSt.ign || [], i;
    for (i = 0; i < list.length; i++) if (lootDist(list[i].x, list[i].y, cx, cy) <= d + 8 * k) return list[i].name;
    return "";
}
var lootHandLogAt = 0;
function lootWalk(W, H, k, dx, dy, dist, name, noHand) {
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var ms = Math.round(Math.max(150, Math.min(LOOT_STEP_MS, dist / (LOOT_WALK_SPEED * k) * 1000)));
    log((noHand ? "[LootMon]" : "[Loot]") + " walk to " + name + " d=" + Math.round(d / k) + " (" + ms + " ms)");
    var L = layoutOf(W, H), jx = mapX(L, LOOT_JOY_REF[0], "l"), jy = mapY(L, LOOT_JOY_REF[1], "b");
    var tx = jx + dx / d * joyPush() * k, ty = jy + dy / d * joyPush() * k, t0 = Date.now();
    var walked = false, handOn = LOOT_HAND_TAP && !noHand;
    if (handOn) {                                                              // the hand takes whatever is nearest: no hand taps while a ticked IGNORE item lies next to the walk
        var wpx = Math.min(d, ms / 1000 * LOOT_WALK_SPEED * k), ccx = W * LOOT_CHAR_POS[0], ccy = H * LOOT_CHAR_POS[1];
        var ignN = lootIgnNear(ccx, ccy, ccx + dx / d * wpx, ccy + dy / d * wpx, k);
        if (ignN) { handOn = false; if (Date.now() - lootHandLogAt > 5000) { lootHandLogAt = Date.now(); log("[Loot] ignored item next to the way (" + ignN + ") - no hand taps while walking"); } }
    }
    if (handOn) {                                                              // stick held with one finger, hand button tapped over and over with another
        try {
            var hx = mapX(L, LOOT_X, "c"), hy = mapY(L, LOOT_Y, "b"), strokes = [JOY_MODE !== "slide" ? [0, ms, [tx, ty], [tx, ty]] : [0, ms, [jx, jy], [tx, ty], [tx, ty], [tx, ty]]], tt = 150;
            while (tt < ms && strokes.length < 9) { strokes.push([tt, 70, [hx, hy]]); tt += LOOT_HAND_EVERY_MS; }
            gestures.apply(null, strokes);
            walked = true;
        } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("loot hand taps", e); }
    }
    if (!walked) { if (JOY_MODE !== "slide") gesture(ms, [tx, ty], [tx, ty]); else gesture(ms, [jx, jy], [tx, ty], [tx, ty], [tx, ty]); }          // hold the stick and slide it toward the item
    var left = ms - (Date.now() - t0);
    if (left > 0) nap(left);
    nap(LOOT_SETTLE_MS);
    lootSt.lastAct = Date.now(); lootSt.lastScan = 0;                          // look again straight away
}
function lootBlack(t, why, still) {
    var st = lootSt, ms = LOOT_BLACK_MS, i, s0 = null, n = 1;
    if (still) {                                                               // fake label caught at this place: ignore it longer every time
        for (i = 0; i < st.strikes.length; i++) if (lootDist(st.strikes[i].x, st.strikes[i].y, t.x, t.y) <= 60 * (st.k || 1)) { s0 = st.strikes[i]; break; }
        if (s0) s0.n++; else { s0 = { x: t.x, y: t.y, n: 1 }; st.strikes.push(s0); }
        n = s0.n; ms = LOOT_BLACK_STATIC_MS[Math.min(n, LOOT_BLACK_STATIC_MS.length) - 1];
    }
    st.black.push({ x: t.x, y: t.y, until: Date.now() + ms });
    log("[Loot] " + why + ": " + t.name + " at " + Math.round(t.x) + "," + Math.round(t.y) + " - skipped for " + Math.round(ms / 1000) + "s" + (still ? " (time " + n + ")" : ""));
    st.steps = 0; st.tapN = 0; st.lastTap = null; st.cand = null; st.lastScan = 0; st.mem = null; st.walkPrev = null; st.still = 0;
}
function lootEnd() {                     // loot run finished: the auto clicker may run again
    var st = lootSt;
    st.active = false; st.cand = null; st.steps = 0; st.tapN = 0; st.lastTap = null; st.mem = null; st.walkPrev = null; st.still = 0;
    clickerReasons.mon = false;           // the monster gate does not run while looting, so its hold must not outlive the loot run
    if (clickerStoppedByUs && clickerPos && !clickerReasons.captcha && !clickerReasons.map) {
        // fast path: the clicker was stopped by the loot tap, so tap that same button again right away (no screen scan first)
        clickerReasons.loot = false; clickerLootAt = 0; clickerStoppedByUs = false;
        press(clickerPos[0], clickerPos[1], TAP_MS);
        log("Clicker: loot done -> tapped the blue triangle at " + clickerPos[0] + "," + clickerPos[1] + " - clicker running again");
        for (var ft = 1; ft <= 2; ft++) {                                  // confirm: the blue square must come back
            nap(500);
            var fim = grabScreen(); if (!fim) break;
            var fW = fim.getWidth(), fH = fim.getHeight();
            if (clickerPick(clickerFind(fim, fW, fH, clickerRectNear(fH)), fW, fH, true)) break;
            press(clickerPos[0], clickerPos[1], TAP_MS);
            log("Clicker: triangle not confirmed - tapping it again (try " + ft + "/2)");
        }
        return;
    }
    if (clickerReasons.loot || clickerStoppedByUs) {
        try {
            var im = grabScreen();
            if (im) clickerResume(im, im.getWidth(), im.getHeight(), "loot"); else clickerReasons.loot = false;
        } catch (e) { clickerReasons.loot = false; if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("clicker resume (loot)", e); }
    }
}
// ---- Loot monster: when no item lies on the screen, the character walks up to a TICKED monster (Monsters panel), taps the loot hand ONCE, taps the monster to target it,
// and the clicker attacks it again. Walking too long / the monster gone = the clicker attacks again. Real loot ITEMS are never skipped (LOOT_NO_SKIP). ----
var LOOT_MONSTER_ON = store.get("lootMonOn", false);   // toggled by the "Loot monster" button in Tools
var LOOT_NO_SKIP = false;                 // true = a real loot item is never put on the skip list ("can't pick it up" / "can't reach it" start over instead); the 15 s loot limit still gives the attack its turn
var LOOT_MON_NEAR = 180;                 // closer than this to the monster (reference px) = tap the hand once + the monster, then attack
var LOOT_MON_LABEL_MAX_H = 40;           // monster name tags are bigger than floor item labels (reference px)
var LOOT_MON_MAX_STEPS = 8;              // walk steps to one monster before the attack starts again
var LOOT_MON_MAX_MS = 8000;              // longest walk to one monster (ms)
var LOOT_MON_COOL_MS = 4000;             // after one monster the step rests this long (ms)
var lootLastTexts = [];
function lootMonsterFind(W, H, k, cx, cy) {              // nearest TICKED monster name on the screen (from the last plain OCR read) or null
    var wr = lootWinRects(W, H), best = null, i, o, txt, d;
    for (i = 0; i < lootLastTexts.length; i++) {
        o = lootLastTexts[i]; txt = String(o.text || "").replace(/\s+/g, " ").trim();
        if (txt.length < 4 || lootIgnored(o.x, o.y, W, H, wr)) continue;
        if (o.h > LOOT_MON_LABEL_MAX_H * k) continue;
        if (!monLabelHit([{ name: txt }])) continue;
        d = lootDist(o.x, o.y, cx, cy);
        if (d > LOOT_MAX_DIST * k) continue;
        if (!best || d < best.d) best = { x: o.x, y: o.y, d: d, name: txt };
    }
    return best;
}
function lootMonsterEnd(why) {
    var st = lootSt;
    st.monActive = false; st.monCool = Date.now() + LOOT_MON_COOL_MS;
    log("[LootMon] " + why);
    lootEnd();
    st.lastScan = 0;
}
function lootMonsterStep(img, W, H, k, cx, cy) {         // true = used this pass
    var st = lootSt, now = Date.now();
    if (!st.monActive && now < (st.monCool || 0)) return false;
    var t = lootMonsterFind(W, H, k, cx, cy);
    if (!t) { if (st.monActive) { lootMonsterEnd("gone - attacking again"); return true; } return false; }
    var near = LOOT_MON_NEAR * k;
    if (!st.monActive && t.d <= near) {                                         // already close: no walking, no hand - target it and attack at once
        press(t.x, t.y + 45 * k, TAP_MS);
        st.monCool = Date.now() + LOOT_MON_COOL_MS;
        log("[LootMon] close: " + t.name + " d=" + Math.round(t.d / k) + " - attacking at once");
        return false;                                                           // the normal attack goes on this very pass
    }
    if (!st.monActive) { st.monActive = true; st.monSince = now; st.monSteps = 0; log("[LootMon] seen: " + t.name + " d=" + Math.round(t.d / k) + " - going to it"); }
    if (t.d <= near) {                                                          // reached after walking: hand once, target it, attack
        var L = layoutOf(W, H);
        press(mapX(L, LOOT_X, "c"), mapY(L, LOOT_Y, "b"), TAP_MS);
        nap(120);
        press(t.x, t.y + 45 * k, TAP_MS);
        lootMonsterEnd(t.name + " reached - loot hand tapped once, attacking it");
        return true;
    }
    if (st.monSteps >= LOOT_MON_MAX_STEPS || now - st.monSince > LOOT_MON_MAX_MS) { lootMonsterEnd("could not reach " + t.name + " - attacking again"); return true; }
    if (st.monSteps === 0 && LOOT_PAUSE_CLICKER) {
        try { clickerStop(img, W, H, "loot"); } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("clicker stop (monster)", e); }
    }
    st.monSteps++;
    lootWalk(W, H, k, t.x - cx, t.y - cy, Math.max(40 * k, t.d - near * 0.6), t.name, true);
    return true;
}
// Called every main-loop pass while in game. Returns true when it used the pass (the caller skips the attack).
function lootStep() {
    var st = lootSt, now = Date.now(), j;
    if (st.earlyHold && !st.active && now - st.earlyHold > LOOT_EARLY_MAX_MS) { st.earlyHold = 0; st.pre = null; log("[Loot] label not confirmed - clicker released"); lootEnd(); }
    if (now < st.pauseUntil) return false;
    if (now - capSeenAt < 4000) return false;                                  // a captcha popup is up: keep the taps for it
    if (!alOcrEngine) { if (!st.warned) { st.warned = true; log("[Loot] no OCR engine found - update AutoX.js (auto loot cannot run)"); } return false; }
    if (!st.active && now - st.lastScan < LOOT_SCAN_MS) return false;
    var img = grabScreen();
    if (!img) return false;
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return false;                                                   // portrait capture = not the game
    st.lastScan = now;
    var k = layoutOf(W, H).kx, cx = W * LOOT_CHAR_POS[0], cy = H * LOOT_CHAR_POS[1];
    st.k = k;
    st.ign = [];
    var items = lootFind(img, W, H, k, cx, cy);
    if (st.lastTap) {                                                          // we tapped an item: is it still there?
        var still = false;
        for (j = 0; j < items.length; j++) if (lootDist(items[j].x, items[j].y, st.lastTap.x, st.lastTap.y) <= 80 * k) { still = true; break; }
        if (!still) { st.total++; log("[Loot] picked up " + st.lastTap.name + " (#" + st.total + ")"); st.mem = null; st.lastTap = null; st.tapN = 0; st.steps = 0; }
    }
    if (!items.length && st.active && st.mem && !st.lastTap && now - st.mem.at < LOOT_MEM_MS && st.mem.n < 3) {   // OCR lost the item: go to where it should be
        var m = st.mem; m.n++;
        if (lootDist(m.x, m.y, cx, cy) <= LOOT_PICKUP * 1.6 * k) {             // it was next to the character when the label vanished = picked up (hand tap), nothing left to walk to
            st.total++; log("[Loot] picked up " + m.name + " (#" + st.total + ")"); st.mem = null; st.steps = 0; st.tapN = 0; st.lastTap = null;
            nap(150); st.lastScan = 0; return true;
        }
        items = [{ x: m.x, y: m.y, d: lootDist(m.x, m.y, cx, cy), name: m.name, gold: m.gold, pri: false, mem: true }];
        log("[Loot] lost sight of " + m.name + " - going to its last position (" + m.n + ")");
    }
    if (items.length && st.monActive) st.monActive = false;                    // a real item showed up: the item run takes over
    if (!items.length && LOOT_MONSTER_ON && !st.active && !st.earlyHold) {
        try { if (lootMonsterStep(img, W, H, k, cx, cy)) return true; }
        catch (lme) { if (String(lme).indexOf("STOPPED") >= 0) throw lme; logErr("loot monster", lme); st.monActive = false; }
    }
    if (!items.length) {
        if (!st.active) {
            if (st.earlyHold) {                                            // OCR misses a label now and then: 3 empty reads in a row = it is really gone
                st.earlyMiss = (st.earlyMiss || 0) + 1;
                if (st.earlyMiss >= 3) { st.earlyHold = 0; st.earlyMiss = 0; st.pre = null; log("[Loot] label gone - clicker released"); lootEnd(); }
            }
            return false;
        }
        if (now - st.lastSeen < LOOT_QUIET_MS) { nap(150); return true; }      // hold still a moment: the next drop may still be falling
        log("[Loot] nothing left - done");
        lootEnd();
        return false;
    }
    st.earlyMiss = 0;
    if (!st.active && LOOT_PRE_CONFIRM) {                                      // first sighting: wait for a 2nd scan at the same place before stopping the attack
        var pc = st.pre, hit = null;
        if (pc && now - pc.at < 2500) for (j = 0; j < items.length; j++) if (lootDist(items[j].x, items[j].y, pc.x, pc.y) <= 30 * k) { hit = items[j]; break; }
        if (!hit) {
            st.pre = { x: items[0].x, y: items[0].y, at: now };
            st.lastScan = now - LOOT_SCAN_MS + LOOT_RECHECK_MS;                // look again very soon
            var handTakes = HAND_AUTO_ON && HAND_AUTO_PAUSE && items[0].d <= LOOT_PICKUP * HAND_AUTO_REACH * k;      // next to the character: the loot-hand step stops the clicker and picks it up
            if (LOOT_EARLY_PAUSE && LOOT_PAUSE_CLICKER && !st.earlyHold && !handTakes) {     // stop the clicker NOW; if the label is not real it is started again
                var mobE = false;
                if (!LOOT_OVER_MOB && !items[0].pri && !/gold/i.test(String(items[0].name))) { try { mobE = !!findMob(img, layoutOf(W, H)); } catch (e0) { logErr("loot mob check", e0); } }
                if (!mobE) {
                    st.earlyHold = now;
                    log("[Loot] label read: " + items[0].name + " - clicker stopped now, confirming");
                    try { clickerStop(img, W, H, "loot"); } catch (e1) { if (String(e1).indexOf("STOPPED") >= 0) throw e1; logErr("clicker stop (loot early)", e1); }
                    st.earlyHold = Date.now();                                  // the stop itself takes time: time-outs count from here
                    if (st.pre) st.pre.at = Date.now();
                    st.lastScan = Date.now() - LOOT_SCAN_MS + LOOT_RECHECK_MS;
                    return true;
                }
            }
            return false;
        }
        st.pre = null;
        items = [hit].concat(items.filter(function (q) { return q !== hit; }));
    }
    st.lastSeen = now;
    var t = items[0], dx = t.x - cx, dy = t.y - cy, d = t.d;
    var wp = st.walkPrev; st.walkPrev = null;
    if (wp && st.active && !t.mem && now - wp.at < 4000) {                     // floor check: a real floor label slides across the screen while the character walks;
        var mv = lootDist(t.x, t.y, wp.x, wp.y);                               // a HUD / buff / name text stays where it is, a floating text jumps somewhere else
        var same = t.name === wp.name || mv <= 25 * k || lootLev(String(t.name).toLowerCase(), String(wp.name).toLowerCase()) <= 2;
        if (same && wp.exp > 60 * k && (mv < Math.max(12 * k, wp.exp * 0.2) || mv > wp.exp * 2.5 + 60 * k)) st.still++; else st.still = 0;
        if (st.still >= LOOT_STILL_STEPS) { lootBlack(t, "not on the floor (label does not move with the walk)", true); return true; }
    } else st.still = 0;
    // a monster is on the screen: attack it first, do not loot (white names can be monsters)
    if (!LOOT_OVER_MOB && !t.pri && !/gold/i.test(String(t.name))) {
        var mobHere = false;
        try { mobHere = !!findMob(img, layoutOf(W, H)); } catch (e) { logErr("loot mob check", e); }
        if (mobHere) {
            if (st.active || st.earlyHold) { st.earlyHold = 0; st.pre = null; lootEnd(); }
            if (now - (st.mobLog || 0) > 15000) { st.mobLog = now; log("[LootMon] monster on the screen - attacking it first, loot waits: " + t.name); }
            return false;
        }
    }
    if (!st.active) {
        st.active = true; st.since = now; st.steps = 0; st.tapN = 0; st.cand = null; st.lastTap = null; st.earlyHold = 0;
        log("[Loot] item seen: " + t.name + (t.pri ? " (PRIORITY)" : "") + " d=" + Math.round(d / k) + " at " + Math.round(t.x) + "," + Math.round(t.y) + " h=" + Math.round(t.h / k) + (t.col ? " col=" + t.col : ""));
        if (LOOT_PAUSE_CLICKER) {
            try { clickerStop(img, W, H, "loot"); } catch (e) { if (String(e).indexOf("STOPPED") >= 0) throw e; logErr("clicker stop (loot)", e); }
        }
    }
    if (now - st.since > LOOT_MAX_MS) {
        log("[Loot] running for " + (LOOT_MAX_MS / 1000) + "s - attack again, loot resumes in " + (LOOT_REST_MS / 1000) + "s");
        st.pauseUntil = now + LOOT_REST_MS;
        lootEnd();
        return false;
    }
    if (!t.mem) st.mem = { x: t.x, y: t.y, name: t.name, gold: t.gold, at: now, n: 0 };
    st.lastAct = now;
    var near = (st.tapN >= 2) ? 40 : LOOT_PICKUP;                              // tapped twice from afar and it is still there: get right next to it
    if (d <= near * k) {                                                       // close enough -> tap it
        st.tapN++;
        if (st.tapN > LOOT_TAP_TRIES) {
            if (LOOT_NO_SKIP) { log("[Loot] " + t.name + " not picked up yet - trying again (not skipped)"); st.tapN = 0; st.steps = 0; st.lastTap = null; st.lastScan = 0; return true; }
            lootBlack(t, "can't pick it up"); return true;
        }
        st.lastTap = { x: t.x, y: t.y, name: t.name };
        log("[Loot] tap " + t.name + " (try " + st.tapN + ")");
        press(t.x, t.y, TAP_MS);
        var ignH = LOOT_HAND_TAP ? lootIgnCloser(cx, cy, d, k) : "";            // the hand takes the NEAREST item: only tap it when the wanted item is nearer than every ignored one
        if (ignH && Date.now() - lootHandLogAt > 5000) { lootHandLogAt = Date.now(); log("[Loot] ignored item (" + ignH + ") is nearer than the target - no hand tap, getting closer to the wanted item"); }
        if (LOOT_HAND_TAP && !ignH) { var _L = layoutOf(W, H); nap(120); press(mapX(_L, LOOT_X, "c"), mapY(_L, LOOT_Y, "b"), TAP_MS); }
        nap(LOOT_TAP_WAIT);
        st.lastAct = Date.now(); st.lastSeen = st.lastAct; st.lastScan = 0;
        return true;
    }
    if (LOOT_CONFIRM && st.steps === 0 && st.tapN === 0) {                                     // the stick moves only toward an item read at the same place on 2 scans in a row
        var c = st.cand;
        if (c && lootDist(c.x, c.y, t.x, t.y) <= 30 * k) c.n++;
        else c = st.cand = { x: t.x, y: t.y, n: 1 };
        if (c.n < 2) { st.lastScan = 0; nap(100); return true; }               // hold still, look again
        st.cand = null;
    }
    st.steps++;
    if (st.steps > LOOT_MAX_STEPS) {
        if (LOOT_NO_SKIP) { log("[Loot] " + t.name + " not reached yet - walking again (not skipped)"); st.steps = 0; st.lastScan = 0; return true; }
        lootBlack(t, "can't reach it"); return true;
    }
    st.lastTap = null;
    var wDist = d - (st.tapN >= 2 ? 20 : LOOT_PICKUP * 0.5) * k;
    if (st.mem) {                                                              // where the item will be on screen after this step (the camera follows the character)
        var wms = Math.max(150, Math.min(LOOT_STEP_MS, wDist / (LOOT_WALK_SPEED * k) * 1000)), wpx = Math.min(d, wms / 1000 * LOOT_WALK_SPEED * k), rem = (d - wpx) / (d || 1);
        st.mem.x = cx + dx * rem; st.mem.y = cy + dy * rem; st.mem.at = now;
    }
    st.walkPrev = { x: t.x, y: t.y, name: t.name, exp: Math.min(wDist, Math.max(150, Math.min(LOOT_STEP_MS, wDist / (LOOT_WALK_SPEED * k) * 1000)) / 1000 * LOOT_WALK_SPEED * k), at: now };
    lootWalk(W, H, k, dx, dy, wDist, t.name);
    var tn = Date.now();                                                       // the clocks start AFTER the slow OCR + walk (they used the scan's start time, so the memory of a lost label expired before it could be used)
    st.walkPrev.at = tn; st.lastSeen = tn; if (st.mem) st.mem.at = tn;
    return true;
}



// ============================================================================================
// MAP LOCATION panel - its own small floating window (NOT inside Tools). Opened with the
// "Map location" button under Tools. PLAY starts a patrol: SPOT 1 -> kill all mobs + loot -> SPOT 2 -> kill all mobs + loot -> SPOT 1 ... (PLAY again = STOP).
// Spot positions are points on the 2576x1177 reference screen (the layout adapter converts them).
// ============================================================================================
var SG_SPOTS = [
    { name: "SPOT 1", p: [1324, 567] },    // SG HolePassage: x of the circled spot; y = middle of the road (used when the road is not found on screen)
    { name: "SPOT 2", p: [827, 572] }      // SG HolePassage: x of the red-circle spot, left of the character
];
// Leonine Basement 1 route (tick MAIN SPOT + the lures, then PLAY): MAIN SPOT -> LURE 1 (kill + loot until cleared) -> back to MAIN SPOT ->
// LURE 2 (kill + loot) -> back to MAIN SPOT -> ... (LURE 3 / LURE 4 if ticked); repeat. (pass: true on a spot = walk only, no clearing wait)
// (old note) Leonine Basement 1: one button each in the Map location panel (tap = open map, tap the spot, close map).
// p = [x, y] of the spot on the open big map (2576x1177 reference screen) - FILL IN each one; tapped exactly as given (no road search).
var LB1_SPOTS = [
    { name: "LB1 MAIN SPOT", label: "MAIN SPOT", p: [856, 574], road: false, leader: true },
    { name: "LB1 LURE 1", label: "LURE 1", p: [1374, 352], road: false, pass: false },
    { name: "LB1 LURE 2", label: "LURE 2", p: [1621, 749], road: false, pass: false },
    { name: "LB1 LURE 3", label: "LURE 3", p: [1072, 780], road: false, pass: false },
    { name: "LB1 LURE 4", label: "LURE 4", p: [1097, 511], road: false, pass: false }
];
LB1_SPOTS.forEach(function (sp) { SG_SPOTS.push(sp); });   // patrol spots 2..6 = MAIN SPOT, LURE 1..4 (tick the boxes in the panel, then PLAY): visited in this order
var sgWin = null, sgWinPos = null;
var sgChk = [store.get("sgChk0", false) === true, store.get("sgChk1", false) === true];
for (var sgI = 2; sgI < SG_SPOTS.length; sgI++) sgChk.push(store.get("sgChk" + sgI, false) === true);

// Finds the middle of the grey road strip on the open map at the spot's x -> [x, y] in capture pixels, or null.
// The map is centred on the character, so the road moves up / down on screen - a fixed y would often miss the road.
function sgRoadPoint(img, spot) {
    if (spot.road === false || !spot.p) return null;     // fixed-point spots (Leonine Basement): no road search
    var W = img.getWidth(), H = img.getHeight();
    if (W < H) return null;
    var L = layoutOf(W, H), k = W / REF_W;
    var x = mapX(L, spot.p[0], "c");
    var y0 = mapY(L, MAP_BOX[1], "c"), y1 = mapY(L, MAP_BOX[3], "c");
    var side = Math.max(4, Math.round(8 * k)), step = Math.max(1, Math.round(2 * k));
    if (x - side < 0 || x + side >= W) return null;
    var best = null, start = -1, y, v, d, c;
    for (y = y0; y <= y1; y += step) {
        v = 0;
        for (d = -1; d <= 1; d++) { c = img.pixel(x + d * side, y); if ((capR(c) + capG(c) + capB(c)) / 3 >= 70) v++; }   // light pixel = road
        if (v >= 2) { if (start < 0) start = y; }
        else if (start >= 0) { if (!best || y - step - start > best.b - best.a) best = { a: start, b: y - step }; start = -1; }
    }
    if (start >= 0 && (!best || y1 - start > best.b - best.a)) best = { a: start, b: y1 };
    if (!best || best.b - best.a < 24 * k || best.b - best.a > 300 * k) return null;   // no road / not a road-sized strip
    return [x, Math.round((best.a + best.b) / 2)];
}
function sgGoTo(spot) {                     // open the map, tap the spot, close the map; the walk pause starts
    if (!spot.p && !spot.leader) { log("SG patrol: " + spot.name + " has no position set (SG_SPOTS) - skipped"); return; }
    mapBusy = true;
    try {
        log("SG patrol: going to " + spot.name);
        tapAt(MAP_MINI[0], MAP_MINI[1], "minimap", 0, "r", "t");
        nap(1200);
        var rp = null, shot = null;
        try { shot = grabScreen(); if (shot) { syncTapSpace(shot.getWidth(), shot.getHeight()); rp = sgRoadPoint(shot, spot); } } catch (re) { rp = null; }
        if (spot.leader) {                  // MAIN SPOT = the party leader: tap the orange "M" on the open map (same as Map now); fixed point only when no M is on the map
            var lm = null;
            try { lm = mapFindIcon(MAP_M_COLOR, MAP_M_TH); } catch (le) { lm = null; }
            if (lm) { log("SG patrol: party leader M found -> tap (" + lm[0] + "," + lm[1] + ")"); press(lm[0], lm[1], TAP_MS); }
            else if (spot.p) tapAt(spot.p[0], spot.p[1], "SG " + spot.name + " (no M on the map, fixed point)", 0, "c", "c");
            else log("SG patrol: " + spot.name + " - no M on the map and no fixed point");
        }
        else if (rp) { log("SG patrol: road centre found -> tap (" + rp[0] + "," + rp[1] + ")"); press(rp[0], rp[1], TAP_MS); }
        else tapAt(spot.p[0], spot.p[1], "SG " + spot.name + " (road not found, fixed y)", 0, "c", "c");
        nap(900);
        mapHoldUntil = Date.now() + MAP_WALK_MS;                          // the character is walking: no attack / loot / self tap
        if (MAP_CLOSE_AFTER) { nap(300); tapAt(MAP_CLOSE[0], MAP_CLOSE[1], "map Close", 0, "c", "c"); nap(400); }
    } finally {
        mapBusy = false;
        mapAutoAt = Math.max(Date.now(), mapHoldUntil);
    }
}
function sgPatrolStep() {                   // called from the main loop; true = it walked to a spot (the loop starts a fresh pass)
    if (!sgPatrol || mapBusy || !sgSeq.length) return false;
    var now = Date.now();
    if (sgGo) {                             // time to walk to the next spot
        sgGo = false;
        var spot = SG_SPOTS[sgSeq[sgPos % sgSeq.length]];
        sgGoTo(spot);
        sgArriveAt = spot.pass ? Math.max(Date.now(), mapHoldUntil) : Date.now() + MAP_WALK_MS; sgStage = 0;     // the "cleared?" check starts after the walk (a lure only waits for the walk pause to end)
        return true;
    }
    if (now < sgArriveAt) return false;
    var curSpot = SG_SPOTS[sgSeq[sgPos % sgSeq.length]];
    if (curSpot.pass) {                     // lure: walk only - no killing / looting here, go straight on to the next spot of the route
        sgPos = (sgPos + 1) % sgSeq.length; sgStage = 0;
        var nxt = SG_SPOTS[sgSeq[sgPos]];
        log("SG patrol: " + curSpot.name + " reached -> " + nxt.name);
        sgGoTo(nxt);
        sgArriveAt = nxt.pass ? Math.max(Date.now(), mapHoldUntil) : Date.now() + MAP_WALK_MS;
        return true;
    }
    var stay = now - sgArriveAt;
    var timeout = SG_MAX_STAY_MS > 0 && stay >= SG_MAX_STAY_MS;
    var lootBusy = false;                   // the loot scanner was removed
    var mobNear = now - sgArriveAt < SG_CLEAR_MS;
    var name = SG_SPOTS[sgSeq[sgPos % sgSeq.length]].name;
    if (timeout) {
        log("SG patrol: " + name + " - time limit -> next spot");
        sgPos = (sgPos + 1) % sgSeq.length; sgGo = true; sgStage = 0;
        return false;
    }
    if (sgStage === 0) {                    // 1) wait until every monster is dead and every item is looted
        if (mobNear || lootBusy) return false;
        if (CENTER_TAP_ON) {                // 2) tap the centre of the screen (picks up a drop under the character)
            var cd = CENTER_TAP_COUNT;
            for (var ci = 0; ci < cd; ci++) { tapAt(CENTER_TAP_POS[0], CENTER_TAP_POS[1], "SG centre tap", 0, "c", "c"); if (ci < cd - 1) nap(CENTER_TAP_GAP_MS); }
        }
        sgVerifyAt = Date.now(); sgStage = 1;
        log("SG patrol: " + name + " looks clear - checking once more");
        return false;
    }
    if (now - sgVerifyAt >= SG_VERIFY_MS) {
        log("SG patrol: " + name + " cleared (mobs dead, loot done) -> next spot");
        sgPos = (sgPos + 1) % sgSeq.length; sgGo = true; sgStage = 0;
    }
    return false;
}
function sgPatrolStop(why) {
    if (!sgPatrol) return;
    sgPatrol = false; sgGo = false; sgPos = 0;
    log("SG patrol stopped" + (why ? " (" + why + ")" : ""));
    try { ui.run(function () { if (sgWin) { try { sgWin.sgPlay.setText(T("PLAY")); } catch (e) {} } }); } catch (e2) {}
}
function sgPlay() {                         // PLAY = start the patrol, again = stop it
    if (sgPatrol) { sgPatrolStop("PLAY pressed"); return; }
    var seq = [];
    var lbLure = false;
    for (var li = 3; li < SG_SPOTS.length; li++) if (sgChk[li]) lbLure = true;
    if (lbLure && !sgChk[2]) { toast("Tick MAIN SPOT too (the lures go back to it to kill + loot)"); return; }
    for (var i = 0; i < SG_SPOTS.length; i++) if (sgChk[i]) {
        if (!SG_SPOTS[i].p && !SG_SPOTS[i].leader) { toast(SG_SPOTS[i].name + ": position not set yet (LB1_SPOTS)"); return; }
        if (i >= 2) continue;                       // Leonine Basement 1 spots are added below
        seq.push(i);
    }
    if (sgChk[2]) {                                 // MAIN SPOT -> LURE 1 -> MAIN SPOT -> LURE 2 -> MAIN SPOT -> ... (each lure: kill + loot, then back to MAIN SPOT)
        var lbAny = false;
        for (var lj = 3; lj < SG_SPOTS.length; lj++) if (sgChk[lj]) { seq.push(2); seq.push(lj); lbAny = true; }
        if (!lbAny) seq.push(2);
    }
    if (!seq.length) { toast("Tick a spot first"); return; }
    toast("Map patrol cannot run: it needed the auto loot scanner, which was removed"); return;
    sgSeq = seq; sgPos = 0; sgGo = true; sgArriveAt = 0; sgPatrol = true;
    if (sgChk[2]) {                                 // Leonine Basement 1: the character stands at the MAIN SPOT when PLAY is pressed -> start straight with the first ticked lure
        for (var si = 0; si < seq.length; si++) if (seq[si] >= 3) { sgPos = si; break; }
    }
    log("SG patrol started: " + seq.map(function (i) { return SG_SPOTS[i].name; }).join(" -> ") + " -> repeat");
    try { sgWin.sgPlay.setText(T("STOP")); } catch (e) {}
    if (monState !== "Running") w.play.performClick();   // the patrol runs inside the main loop: start the bot too
}
function sgClosePanel() {
    if (sgWin) { try { sgWin.close(); } catch (e) {} sgWin = null; }
    try { ui.run(function () { w.sgbtn.setText(T("Map location ▾")); }); } catch (e2) {}
}
function sgOpenPanel() {
    if (sgWin) { sgClosePanel(); return; }
    var pop = floaty.window(uiScaleXml(
        <frame id="sgGlow" padding="3">
            <vertical id="sgCard" padding="6" w="140" h="auto">
                <text id="sgTitle" text="⠿ MAP LOCATION" textSize="10sp" textStyle="bold" gravity="center" w="*" h="22"/>
                <frame id="sgDiv1" w="*" h="1" margin="0 4"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="sgMap" text="MAP" w="*" h="30" margin="0 2" textSize="10sp"/>
                <frame id="sgDiv0" w="*" h="1" margin="0 4"/>
                <text id="sgSub" text="SG HOLE PASSAGE SPOT" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="sgPlay" text="PLAY" w="*" h="30" margin="3 2" textSize="10sp"/>
                <horizontal>
                    <checkbox id="sgC0" text="SPOT 1" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="sgC1" text="SPOT 2" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <frame id="sgDiv3" w="*" h="1" margin="0 4"/>
                <text id="sgSub2" text="LEONINE BASEMENT 1" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <horizontal w="*" gravity="center">
                    <checkbox id="lbC0" text="MAIN SPOT" textSize="9sp" w="auto"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="lbC1" text="LURE 1" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="lbC3" text="LURE 3" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="lbC2" text="LURE 2" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="lbC4" text="LURE 4" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <frame id="sgDiv2" w="*" h="1" margin="0 4"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="sgClose" text="CLOSE" w="*" h="28" textSize="10sp"/>
            </vertical>
        </frame>
    ));
    sgWin = pop;
    var C = android.graphics.Color, GREEN = C.parseColor("#00FF66");
    var neonText = function (v) { v.setTextColor(GREEN); v.setShadowLayer(uiPx(3), 0, 0, GREEN); };
    var neonBtn = function (b) {
        uiSetBg(b, uiShape(C.parseColor("#1A00FF66"), GREEN, uiPx(1), uiPx(8)));
        b.setAllCaps(false); neonText(b); b.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
    };
    try {
        pop.sgGlow.setBackground(uiShape(0, C.parseColor("#3300FF66"), uiPx(3), uiPx(14)));        // soft halo
        pop.sgCard.setBackground(uiShape(C.parseColor("#F00A140E"), GREEN, uiPx(1), uiPx(11)));    // dark card with green edge
        neonText(pop.sgTitle); neonText(pop.sgSub); neonText(pop.sgSub2);
        [pop.sgDiv0, pop.sgDiv1, pop.sgDiv2, pop.sgDiv3].forEach(function (d) { d.setBackgroundColor(GREEN); });
        neonBtn(pop.sgMap); neonBtn(pop.sgPlay); neonBtn(pop.sgClose);
        [pop.sgC0, pop.sgC1, pop.lbC0, pop.lbC1, pop.lbC2, pop.lbC3, pop.lbC4].forEach(function (c, i) {
            neonText(c);
            c.setButtonTintList(android.content.res.ColorStateList.valueOf(GREEN));
            c.setChecked(sgChk[i]);
            c.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
                onCheckedChanged: function (v, on) { sgChk[i] = on; store.put("sgChk" + i, on); }
            }));
        });
    } catch (e) { logErr("map location style", e); }
    pop.sgMap.click(function () { w.mapgo.performClick(); });        // same as "Map now" in Tools: tap the party leader's M
    pop.sgPlay.click(function () { sgPlay(); });
    pop.sgClose.click(function () { sgClosePanel(); });
    try {
        var dens = context.getResources().getDisplayMetrics().density;
        if (sgWinPos) pop.setPosition(sgWinPos[0], sgWinPos[1]);
        else pop.setPosition(Math.max(0, Math.round(60 * dens)), Math.max(10, Math.round(70 * dens)));
    } catch (e3) { logErr("map location position", e3); }
    // drag the panel by its title
    var dx = 0, dy = 0, dwx = 0, dwy = 0;
    pop.sgTitle.setOnTouchListener(function (view, e) {
        switch (e.getAction()) {
            case e.ACTION_DOWN:
                dx = e.getRawX(); dy = e.getRawY(); dwx = pop.getX(); dwy = pop.getY();
                return true;
            case e.ACTION_MOVE:
                var nx = Math.max(0, Math.min(device.width - 60, dwx + (e.getRawX() - dx)));
                var ny = Math.max(0, Math.min(device.height - 60, dwy + (e.getRawY() - dy)));
                pop.setPosition(nx, ny);
                sgWinPos = [nx, ny];
                return true;
        }
        return true;
    });
    ui.run(function () { w.sgbtn.setText(T("Map location ▴")); });
}
w.sgbtn.click(function () { sgOpenPanel(); });

// ============================================================================================
// LOOT ITEMS panel - its own small floating window (NOT inside Tools). Opened with the "Loot items" button
// under Tools. Tick what auto loot should pick up. The ★ FIRST boxes are walked to before anything else
// (and are looted even when their normal box is off). Choices are saved and used by the auto loot scanner.
// To add another item: add a row to AL_ITEMS (words = lower case text the item label contains) and one checkbox id (aC#) in the window below.
// ============================================================================================
var AL_ITEMS = [
    { id: "potion", label: "Potion", words: ["potion"] },
    { id: "box",    label: "Box",    words: ["box"] },
    { id: "cloth",  label: "Cloth",  words: ["cloth"] },
    { id: "pill",   label: "Pill",   words: ["pill"] },
    { id: "gaunt",  label: "Gauntlets", words: ["gauntlet"] },
    { id: "shoes",  label: "Shoes",  words: ["shoes"] },
    { id: "pants",  label: "Pants",  words: ["pants"] },
    { id: "gold",   label: "Gold",   gold: true },
    { id: "white",  label: "All white names", white: true }      // loots EVERY white item name (not only the words above); Scroll / Ring / Arrow / Talisman boxes under IGNORE still win. Default OFF.
];
var AL_FIRST = [
    { id: "burr", label: "★ Burr / Fineburr", words: ["burr", "fineburr"] },
    { id: "prot", label: "★ Protection",      words: ["protection"] },
    { id: "lux",  label: "★ Luxury",          words: ["luxury"] }
];
var AL_IGNORE = [                           // ticked = never picked up (wins over every other box)
    { id: "scroll", label: "Scroll", words: ["scroll"] },
    { id: "ring",   label: "Ring",   words: ["ring"] },
    { id: "arrow",  label: "Arrow",  words: ["arrow"] },
    { id: "talis",  label: "Talisman", words: ["talisman"] }
];
var alIgnOn = AL_IGNORE.map(function (it) { return store.get("lootIgn_" + it.id, true) !== false; });
var alWin = null, alWinPos = null;
var alItemOn = AL_ITEMS.map(function (it) { return it.white ? false : store.get("lootItem_" + it.id, true) !== false; });   // "All white names" is always OFF: white labels can be monsters
var alFirstOn = AL_FIRST.map(function (it) { return store.get("lootFirst_" + it.id, true) !== false; });
function alApplyItems() {                   // ticked boxes -> the word lists the scanner (lootMatch / lootFind) reads
    var words = [], pri = [];
    function add(list, x) { if (list.indexOf(x) < 0) list.push(x); }
    AL_ITEMS.forEach(function (it, i) { if (alItemOn[i] && it.words) it.words.forEach(function (x) { add(words, x); }); });
    AL_FIRST.forEach(function (it, i) { if (alFirstOn[i]) it.words.forEach(function (x) { add(pri, x); add(words, x); }); });
    var ign = [];
    AL_IGNORE.forEach(function (it, i) { if (alIgnOn[i]) it.words.forEach(function (x) { add(ign, x); }); });
    LOOT_IGNORE_WORDS = ign;
    LOOT_WORDS = words;
    LOOT_PRIORITY_WORDS = pri;
    var gi = -1; AL_ITEMS.forEach(function (it, i) { if (it.gold) gi = i; });
    LOOT_GOLD = gi >= 0 && alItemOn[gi] === true;
    var wi = -1; AL_ITEMS.forEach(function (it, i) { if (it.white) wi = i; });
    LOOT_COLOR_LOOT = wi >= 0 && alItemOn[wi] === true ? ["white"] : [];
}
alApplyItems();
function alClosePanel() {
    if (alWin) { try { alWin.close(); } catch (e) {} alWin = null; }
    try { ui.run(function () { w.lootbtn.setText(T("Loot items ▾")); }); } catch (e2) {}
}
function alOpenPanel() {
    if (alWin) { alClosePanel(); return; }
    var pop = floaty.window(uiScaleXml(
        <frame id="alGlow" padding="3">
            <vertical id="alCard" padding="6" w="140" h="auto">
                <text id="alTitle" text="⠿ LOOT ITEMS" textSize="10sp" textStyle="bold" gravity="center" w="*" h="22"/>
                <scroll id="alScroll" w="*" h="330">
                <vertical id="alList" w="*" h="auto">
                <frame id="alDiv0" w="*" h="1" margin="0 4"/>
                <text id="alSub0" text="PICK UP" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <horizontal w="*">
                    <checkbox id="aC0" text="Potion" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aC1" text="Box" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="aC2" text="Cloth" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aC3" text="Pill" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="aC4" text="Gauntlets" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aC5" text="Shoes" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="aC6" text="Pants" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aC7" text="Gold" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <checkbox id="aC8" text="All white names" textSize="9sp" w="*"/>
                <frame id="alDiv1" w="*" h="1" margin="0 4"/>
                <text id="alSub1" text="LOOT FIRST" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <checkbox id="aF0" text="★ Burr / Fineburr" textSize="9sp" w="*"/>
                <checkbox id="aF1" text="★ Protection" textSize="9sp" w="*"/>
                <checkbox id="aF2" text="★ Luxury" textSize="9sp" w="*"/>
                <frame id="alDiv3" w="*" h="1" margin="0 4"/>
                <text id="alSub2" text="IGNORE (never loot)" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <horizontal w="*">
                    <checkbox id="aI0" text="Scroll" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aI1" text="Ring" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <horizontal w="*">
                    <checkbox id="aI2" text="Arrow" textSize="9sp" w="0" layout_weight="1"/>
                    <checkbox id="aI3" text="Talisman" textSize="9sp" w="0" layout_weight="1"/>
                </horizontal>
                <frame id="alDiv2" w="*" h="1" margin="0 4"/>
                <horizontal w="*">
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="alAll" text="ALL ON" w="0" layout_weight="1" h="28" margin="0 2" textSize="9sp"/>
                    <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="alNone" text="ALL OFF" w="0" layout_weight="1" h="28" margin="0 2" textSize="9sp"/>
                </horizontal>
                </vertical>
                </scroll>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="alClose" text="CLOSE" w="*" h="28" margin="2 2 0 2" textSize="10sp"/>
            </vertical>
        </frame>
    ));
    alWin = pop;
    var C = android.graphics.Color, GREEN = C.parseColor("#00FF66");
    var neonText = function (v) { v.setTextColor(GREEN); v.setShadowLayer(uiPx(3), 0, 0, GREEN); };
    var neonBtn = function (b) {
        uiSetBg(b, uiShape(C.parseColor("#1A00FF66"), GREEN, uiPx(1), uiPx(8)));
        b.setAllCaps(false); neonText(b); b.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
    };
    var boxes = [];                          // [checkbox, kind, index]
    try {
        pop.alGlow.setBackground(uiShape(0, C.parseColor("#3300FF66"), uiPx(3), uiPx(14)));        // soft halo
        pop.alCard.setBackground(uiShape(C.parseColor("#F00A140E"), GREEN, uiPx(1), uiPx(11)));    // dark card with green edge
        neonText(pop.alTitle); neonText(pop.alSub0); neonText(pop.alSub1); neonText(pop.alSub2);
        [pop.alDiv0, pop.alDiv1, pop.alDiv2, pop.alDiv3].forEach(function (d) { d.setBackgroundColor(GREEN); });
        neonBtn(pop.alAll); neonBtn(pop.alNone); neonBtn(pop.alClose);
        AL_ITEMS.forEach(function (it, i) { boxes.push([pop["aC" + i], "item", i]); });
        AL_FIRST.forEach(function (it, i) { boxes.push([pop["aF" + i], "first", i]); });
        AL_IGNORE.forEach(function (it, i) { boxes.push([pop["aI" + i], "ign", i]); });
        boxes.forEach(function (b) {
            var c = b[0], kind = b[1], i = b[2];
            neonText(c);
            c.setButtonTintList(android.content.res.ColorStateList.valueOf(GREEN));
            c.setChecked(kind === "item" ? alItemOn[i] : (kind === "first" ? alFirstOn[i] : (kind === "mon" ? monOn[i] : alIgnOn[i])));
            c.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
                onCheckedChanged: function (v, on) {
                    if (kind === "item") { alItemOn[i] = on; store.put("lootItem_" + AL_ITEMS[i].id, on); }
                    else if (kind === "first") { alFirstOn[i] = on; store.put("lootFirst_" + AL_FIRST[i].id, on); }
                    else if (kind === "mon") { monOn[i] = on; store.put("mon_" + MON_LIST[i].id, on); log("[Mon] " + MON_LIST[i].label + " -> " + (on ? "ATTACK" : "not ticked")); }
                    else { alIgnOn[i] = on; store.put("lootIgn_" + AL_IGNORE[i].id, on); }
                    alApplyItems();
                    log("[Loot] items -> " + (LOOT_WORDS.join(", ") || "none") + (LOOT_GOLD ? " + gold" : "") + (LOOT_COLOR_LOOT.length ? " + ALL " + LOOT_COLOR_LOOT.join("/") + " names" : "") + " | first: " + (LOOT_PRIORITY_WORDS.join(", ") || "none") + " | ignore: " + (LOOT_IGNORE_WORDS.join(", ") || "none"));
                }
            }));
        });
    } catch (e) { logErr("loot items style", e); }
    function setAll(on) { boxes.forEach(function (b) { if (b[1] === "ign" || b[1] === "mon" || (b[1] === "item" && AL_ITEMS[b[2]].white)) return; try { b[0].setChecked(on); } catch (e) {} }); }   // each change saves itself through the listener
    pop.alAll.click(function () { setAll(true); });
    pop.alNone.click(function () { setAll(false); });
    pop.alClose.click(function () { alClosePanel(); });
    try {
        var dens = context.getResources().getDisplayMetrics().density;
        if (alWinPos) pop.setPosition(alWinPos[0], alWinPos[1]);
        else pop.setPosition(Math.max(0, Math.round(220 * dens)), Math.max(10, Math.round(70 * dens)));
    } catch (e3) { logErr("loot items position", e3); }
    // drag the panel by its title
    var dx = 0, dy = 0, dwx = 0, dwy = 0;
    pop.alTitle.setOnTouchListener(function (view, e) {
        switch (e.getAction()) {
            case e.ACTION_DOWN:
                dx = e.getRawX(); dy = e.getRawY(); dwx = pop.getX(); dwy = pop.getY();
                return true;
            case e.ACTION_MOVE:
                var nx = Math.max(0, Math.min(device.width - 60, dwx + (e.getRawX() - dx)));
                var ny = Math.max(0, Math.min(device.height - 60, dwy + (e.getRawY() - dy)));
                pop.setPosition(nx, ny);
                alWinPos = [nx, ny];
                return true;
        }
        return true;
    });
    ui.run(function () { w.lootbtn.setText(T("Loot items ▴")); });
}
var monWin = null;
var monWinPos = null;
function monClosePanel() {
    if (monWin) { try { monWin.close(); } catch (e) {} monWin = null; }
}
function monOpenPanel() {
    if (monWin) return;
    var pop = floaty.window(uiScaleXml(
        <frame id="mnGlow" padding="3">
            <vertical id="mnCard" padding="6" w="150" h="auto">
                <text id="mnTitle" text="⠿ MONSTERS" textSize="10sp" textStyle="bold" gravity="center" w="*" h="22"/>
                <text id="mnSub" text="attack only the ticked ones" textSize="8sp" textStyle="bold" gravity="center" w="*"/>
                <scroll id="mnScroll" w="*" h="200">
                <vertical id="mnList" w="*" h="auto">
                <checkbox id="mn0" text="Barba" textSize="9sp" w="*"/>
                <checkbox id="mn1" text="Fatty Bom-Bom" textSize="9sp" w="*"/>
                <checkbox id="mn2" text="Hell Scissors" textSize="9sp" w="*"/>
                <checkbox id="mn3" text="Wrestler" textSize="9sp" w="*"/>
                <checkbox id="mn4" text="Hodel" textSize="9sp" w="*"/>
                <checkbox id="mn5" text="Skating Master" textSize="9sp" w="*"/>
                <checkbox id="mn6" text="Cordy" textSize="9sp" w="*"/>
                <checkbox id="mn7" text="Siberlan Husky" textSize="9sp" w="*"/>
                <checkbox id="mn8" text="Little Hooligan" textSize="9sp" w="*"/>
                <checkbox id="mn9" text="Sacred Gate Defender" textSize="9sp" w="*"/>
                <checkbox id="mn10" text="Marionette" textSize="9sp" w="*"/>
                </vertical>
                </scroll>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="mnClose" text="CLOSE" w="*" h="28" margin="2 2 0 2" textSize="10sp"/>
            </vertical>
        </frame>
    ));
    monWin = pop;
    var C = android.graphics.Color, BLUE = C.parseColor("#00C8FF");     // the MONSTERS panel is glowing blue
    var blueText = function (v) { v.setTextColor(BLUE); v.setShadowLayer(uiPx(3), 0, 0, BLUE); };
    var blueBtn = function (b) { uiSetBg(b, uiShape(C.parseColor("#1A00C8FF"), BLUE, uiPx(1), uiPx(8))); b.setAllCaps(false); blueText(b); b.setTypeface(android.graphics.Typeface.DEFAULT_BOLD); };
    try {
        pop.mnGlow.setBackground(uiShape(0, C.parseColor("#3300C8FF"), uiPx(3), uiPx(14)));     // soft blue halo
        pop.mnCard.setBackground(uiShape(C.parseColor("#F00A1020"), BLUE, uiPx(1), uiPx(11)));  // dark card with blue edge
        blueText(pop.mnTitle); blueText(pop.mnSub); blueBtn(pop.mnClose);
        MON_LIST.forEach(function (m, i) {
            var c = pop["mn" + i];
            blueText(c);
            c.setButtonTintList(android.content.res.ColorStateList.valueOf(BLUE));
            c.setChecked(monOn[i]);
            c.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
                onCheckedChanged: function (v, on) { monOn[i] = on; store.put("mon_" + m.id, on); log("[Mon] " + m.label + " -> " + (on ? "ATTACK" : "not ticked")); }
            }));
        });
    } catch (e) { logErr("monsters style", e); }
    pop.mnClose.click(function () { monClosePanel(); try { ui.run(function () { w.monbtn.setText(T("Monsters ▾")); }); } catch (e) {} });
    try {
        var dens = context.getResources().getDisplayMetrics().density;
        var mp = monWinPos || [Math.round(220 * dens), Math.round(120 * dens)];
        mp = [Math.max(0, Math.min(device.width - Math.round(170 * dens), mp[0])), Math.max(0, Math.min(device.height - Math.round(300 * dens), mp[1]))];
        pop.setPosition(mp[0], mp[1]);
        var mx = mp[0], my = mp[1];
        log("[Mon] monsters panel opened at " + mx + "," + my);
    } catch (e3) { logErr("monsters position", e3); }
    var mdx = 0, mdy = 0, mdwx = 0, mdwy = 0;
    pop.mnTitle.setOnTouchListener(function (view, e) {
        switch (e.getAction()) {
            case e.ACTION_DOWN: mdx = e.getRawX(); mdy = e.getRawY(); mdwx = pop.getX(); mdwy = pop.getY(); return true;
            case e.ACTION_MOVE: var mnx = Math.max(0, mdwx + (e.getRawX() - mdx)), mny = Math.max(0, mdwy + (e.getRawY() - mdy)); pop.setPosition(mnx, mny); monWinPos = [mnx, mny]; return true;
        }
        return true;
    });
}
w.lootbtn.click(function () { alOpenPanel(); });
w.monbtn.click(function () {
    if (monWin) { monClosePanel(); try { ui.run(function () { w.monbtn.setText(T("Monsters ▾")); }); } catch (e) {} return; }
    try { monOpenPanel(); ui.run(function () { w.monbtn.setText(T("Monsters ▴")); }); } catch (e) { logErr("monsters panel", e); toast("Monsters panel error - see log"); }
});



function runLoop() {
    if (!authed) { toast("Log in first"); return; }
    if (!subOk()) { toast("No active subscription"); return; }
    if (busy) { log("Play ignored (already running)"); return; }
    busy = true;
    stopFlag = false;
    petDone = false;
    lootReset();
    tgtCheckAt = 0; tgtTapAt = 0; tgtRing = 0; tgtTaps = 0;
    setPlayState(true);
    try {
        log("=== Play ON === (tap Stop to end)");
        log("device " + device.width + "x" + device.height);
        ensureGame();

        ensureCapture();
        try {                                    // re-read the screen / tap space at every Play (the script may have been opened in another orientation)
            REAL_SIZE = null; metricsW = 0; metricsH = 0; lastW = 0; lastH = 0;
            var f0 = captureOk ? grabScreen() : null, rs0 = realDisplaySize(), rot0 = -1;
            try { rot0 = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRotation(); } catch (er) {}
            if (f0) { var fw0 = f0.getWidth(), fh0 = f0.getHeight(); if (fw0 >= fh0) { lastW = fw0; lastH = fh0; syncTapSpace(fw0, fh0); } log("tap check: capture " + fw0 + "x" + fh0 + " | real " + (rs0 ? rs0.W + "x" + rs0.H : "?") + " | device " + device.width + "x" + device.height + " | rotation " + rot0); }
        } catch (e0) { if (String(e0).indexOf("STOPPED") >= 0) throw e0; logErr("tap check", e0); }
        if (!captureOk) {            // no screen capture: can't watch, so do a single timed run
            log("no screen capture -> single run with fixed delay");
            nap(SELECT_DELAY_MS);
            runSequence();
            return;
        }

        var streak = 0, loginStreak = 0, charStreak = 0, startStreak = 0, loginFails = 0, lastStatus = 0, lastLaunch = Date.now(), lastNoSkillLog = 0, hudStreak = 0, inGame = false, skillPtr = -1, atkTaps = 0, reviveActive = false, reviveTaps = 0, discActive = false, discTaps = 0, lastQuick = 0, quickUses = 0, returnPending = false, returnAt = 0, returnExpire = 0, lastCaptcha = 0;
        // Login flow (Select Server -> channel -> Connect -> Login -> Character -> Start) runs ONCE per session.
        // It is armed at Play, then disarmed when the character is in game. It is re-armed only if the game is
        // force closed or "Disconnected from Server!" shows up.
        var flowArmed = true, lastPkgCheck = 0, pkgMiss = 0;
        var autoPotsPending = false, autoPotsFails = 0, lastApWaitLog = 0;
        var armFlow = function (why) {
            flowArmed = true; inGame = false; loginFails = 0;
            streak = 0; loginStreak = 0; charStreak = 0; startStreak = 0;
            lastLaunch = Date.now();
            monState = "Login flow (" + why + ")";
            log("Login flow ARMED (" + why + ")");
        };
        log("Build v" + APP_VERSION + ": Auto Pots step " + (AUTOPOTS_ON ? "ON (runs after the pet step; MENU -> Auto Pots -> tick + HP " + AP_VALUES.hp + " MP " + AP_VALUES.mp + " SP " + AP_VALUES.sp + ")" : "OFF"));
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
            // status line every 20s - kept at the top of the loop so the loot / return / other "continue" paths can't skip it
            if (Date.now() - lastStatus > 20000) {
                lastStatus = Date.now();
                log("watching... start " + SCREENS.start.hit + "/" + SCREENS.start.btn.length + " label " + SCREENS.start.white + " | hud " + hudBars + "/4 | (" + lastHit + "/" + CHECK_PTS.length + " button, label " + lastWhite + ", capture " + lastDims + ")");
            }

            // Character is in game -> login flow is finished, stop touching the login screens.
            if (flowArmed && hudStreak >= STABLE_NEEDED) {
                flowArmed = false;
                pkgMiss = 0;
                monState = "In game";
                log("In game -> login flow DONE (will run again only after force close / disconnect)");
                autoPotsPending = AUTOPOTS_ON; autoPotsFails = 0;
            }
            if (autoPotsKick) {              // Auto Pots button pressed
                autoPotsKick = false;
                autoPotsFails = 0;
                autoPotsPending = AUTOPOTS_ON && !flowArmed;     // ON in game -> run now; OFF -> cancel; during login it is armed again when the game is entered
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
                    if (/autoclick|automatictap/i.test(curPkg)) {              // the clicker app (or its ad) is only in front - the game is still running: no re-login
                        log("Auto-clicker app is in front (" + curPkg + ") - bringing the game back");
                        ensureGame();
                    } else {
                        log("Game closed (foreground: " + curPkg + ") -> relaunching");
                        ensureGame();
                        armFlow("game force closed");
                    }
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
                    reviveSeenAt = Date.now();
                    monState = "Dead - reviving"; log("Revive dialog DETECTED (body " + reviveBody + ", panel " + revivePanel + ", text " + reviveText + ", label " + reviveLabel + ", two buttons " + reviveTwo + ") -> tapping " + (reviveTwo ? "Use" : "Revive"));
                }
                if (reviveTwo && Date.now() - reviveSeenAt < USE_WAIT_MS) {   // Use (Back Point Pass): wait first
                    nap(300);
                    continue;
                }
                if (reviveTwo) quickTap(USE_X, USE_Y, reviveTaps % 3); else quickTap(REVIVE_X, REVIVE_Y, reviveTaps % 3);
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

            // In game, AFTER the pet step: Auto Pots is due (first time, a retry, or the periodic re-check) -> MENU -> Auto Pots -> tick + values
            var petStepDone = !PET_ON || petDone;
            var apNow = Date.now();
            if (AUTOPOTS_ON && autoPotsPending && apNow - lastApWaitLog >= 20000 &&
                (flowArmed || returnPending || hudStreak < STABLE_NEEDED || !petStepDone)) {
                lastApWaitLog = apNow;
                log("Auto Pots waiting: login flow " + (flowArmed ? "still running" : "done") + ", HUD " + hudStreak + "/" + STABLE_NEEDED + ", pet step " + (petStepDone ? "done" : "not done yet"));
            }
            if (AUTOPOTS_ON && !flowArmed && !returnPending && hudStreak >= STABLE_NEEDED && petStepDone &&
                ((autoPotsPending && apNow - lastAutoPots >= (autoPotsFails > 0 ? AUTOPOTS_RETRY_MS : 0)) ||
                 (AUTOPOTS_REPEAT_MS > 0 && lastAutoPots > 0 && apNow - lastAutoPots >= AUTOPOTS_REPEAT_MS))) {
                autoPotsPending = false;
                monState = "Auto Pots";
                log("Auto Pots: opening MENU");
                var apOk = false;
                try { apOk = runAutoPots(); } catch (ae) { if (String(ae).indexOf("STOPPED") >= 0) throw ae; logErr("auto pots", ae); }
                lastAutoPots = Date.now();
                if (apOk) { autoPotsFails = 0; log("Auto Pots: finished" + (apTicked ? " - Enable box ticked" : " - tick NOT confirmed (check the window once by hand)") + " - will not run again until the next login"); }
                else if (autoPotsFails < AUTOPOTS_MAX_RETRIES) {
                    autoPotsFails++; autoPotsPending = true;
                    log("Auto Pots: not confirmed -> trying again in " + (AUTOPOTS_RETRY_MS / 1000) + "s (" + autoPotsFails + "/" + AUTOPOTS_MAX_RETRIES + ")");
                } else { autoPotsFails = 0; log("Auto Pots: still not confirmed after " + AUTOPOTS_MAX_RETRIES + " retries - giving up for now"); }
                monState = "In game";
                continue;
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
                        try { bppUse(); } catch (eB) { if (String(eB).indexOf("STOPPED") >= 0) throw eB; logErr("bppUse", eB); }
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

            // Map: open the map, tap the leader's "M", close (manual "Map now" or every MAP_AUTO_MS). Pauses the attack for ~3 s.
            if ((MAP_AUTO_ON || mapKick || sgPatrol) && !flowArmed && !returnPending && !reviveActive && !discActive && hudStreak >= STABLE_NEEDED && Date.now() - capSeenAt > 4000) {
                var mapDone = false;
                try { mapDone = mapStep(); }
                catch (mpe) { if (String(mpe).indexOf("STOPPED") >= 0) throw mpe; logErr("map", mpe); nap(1000); }
                if (mapDone) continue;
            }
            // Walking to the party member: hold attack, loot and self tap until the walk time is over
            if (mapHoldUntil) {
                if (Date.now() < mapHoldUntil) { nap(250); continue; }
                mapHoldUntil = 0;
                log("Map: walk time over -> attack/loot resume");
            }
            // Auto loot: reads the item names on the screen, walks to them and taps them. When it did something this pass the attack is skipped.
            if (alOn && !flowArmed && !returnPending && !reviveActive && !discActive && hudStreak >= STABLE_NEEDED) {
                var lootDone = false;
                try { lootDone = lootStep(); }
                catch (lte) { if (String(lte).indexOf("STOPPED") >= 0) throw lte; logErr("auto loot", lte); nap(1000); }
                if (lootDone) continue;
            } else if (lootSt.active || clickerReasons.loot) {                // loot switched off / a dialog showed up: let the clicker run again
                try { lootEnd(); } catch (lte2) { if (String(lte2).indexOf("STOPPED") >= 0) throw lte2; logErr("auto loot end", lte2); }
            }
            try { skillTimedStep(hudStreak); } catch (s5e) { if (String(s5e).indexOf("STOPPED") >= 0) throw s5e; logErr("skill timer", s5e); }
            try { monGateStep(hudStreak); } catch (mge) { if (String(mge).indexOf("STOPPED") >= 0) throw mge; logErr("monster gate", mge); }
            try { handAutoStep(hudStreak); } catch (hae) { if (String(hae).indexOf("STOPPED") >= 0) throw hae; logErr("loot hand", hae); }
            if (hudStreak >= STABLE_NEEDED) {                    // in the game
                if (!inGame) {
                    inGame = true;
                    atkTaps = 0;
                    log("In game (HUD " + hudBars + "/4)");
                    if (PET_ON && !petDone) summonPet();
                }
                selfTapStep();
            } else if (inGame && hudStreak === 0) {
                inGame = false;
                log("HUD gone after " + atkTaps + " attack taps");
            }

            var now = Date.now();
            if (now - lastLaunch > 15000) {   // game left the foreground? bring it back
                lastLaunch = now;
                if (ensureGame()) armFlow("game relaunched");
            }
            nap(50);
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
    svPop = floaty.window(uiScaleXml(
        <vertical bg="#F0FFF59D" padding="7" w="172" h="auto">
            <text text="Select server" textColor="#222222" textSize="10sp" textStyle="bold" gravity="center" h="27"/>
            <scroll w="*" h="225">
                <vertical w="*" h="auto">
                    <checkbox id="sv0" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv1" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv2" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv3" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv4" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv5" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv6" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv7" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv8" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv9" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv10" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                    <checkbox id="sv11" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
                </vertical>
            </scroll>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="svclose" text="Close" w="*" h="34" textSize="9sp" margin="2"/>
        </vertical>
    ));
    var pop = svPop, rows = [], i;
    for (i = 0; i < SV_ROWS; i++) rows.push(pop["sv" + i]);
    function showChecks() {
        for (var j = 0; j < SV_ROWS; j++) if (j < SERVERS.length) rows[j].setChecked(j === serverIdx);
    }
    for (i = 0; i < SV_ROWS; i++) {
        if (i >= SERVERS.length) { rows[i].setVisibility(android.view.View.GONE); continue; }
        rows[i].setText(T(SERVERS[i].name));
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
        pop.setPosition(Math.max(0, Math.round((device.width - 210 * UI_SCALE * d) / 2)), Math.max(10, Math.round((device.height - 360 * UI_SCALE * d) / 2)));
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
    chPop = floaty.window(uiScaleXml(
        <vertical bg="#F0FFF59D" padding="7" w="172" h="auto">
            <text text="Select channel" textColor="#222222" textSize="10sp" textStyle="bold" gravity="center" h="27"/>
            <checkbox id="chk0" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
            <checkbox id="chk1" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
            <checkbox id="chk2" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
            <checkbox id="chk3" text="" textColor="#222222" textSize="10sp" w="*" h="36" padding="3"/>
            <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="chclose" text="Close" w="*" h="34" textSize="9sp" margin="2"/>
        </vertical>
    ));
    var pop = chPop, rows = [], i;
    for (i = 0; i < CH_ROWS; i++) rows.push(pop["chk" + i]);
    function showChecks() {
        for (var j = 0; j < CH_ROWS; j++) if (j < CHANNEL_YS.length) rows[j].setChecked(j === CHANNEL_IDX);
    }
    for (i = 0; i < CH_ROWS; i++) {
        if (i >= CHANNEL_YS.length) { rows[i].setVisibility(android.view.View.GONE); continue; }
        rows[i].setText(T(i + " Channel"));
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
        pop.setPosition(Math.max(0, Math.round((device.width - 210 * UI_SCALE * d) / 2)), Math.max(10, Math.round((device.height - 270 * UI_SCALE * d) / 2)));
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
    if (!authed || monBusy || Date.now() < bgPauseUntil) return;
    monBusy = true;
    try {
        var t = monToken();
        if (!t) return;
        var tail = LOG_LINES.slice(-MON_LOG_LINES).join("\n").replace(/KLX-[A-Za-z0-9-]+/g, "KLX-****");
        if (tail.length > 5600) tail = tail.slice(-5600);
        tail = "[device] " + DEV_INFO.short + " | " + DEV_INFO.full + "\n" + tail;   // device info rides in the first line of the existing logTail field
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
        if (c.status === 429) bgPauseUntil = Date.now() + 10 * 60 * 1000;
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
function monMsg(text) { ui.run(function () { w.monMsg.setText(T(text || "")); }); }
function monShowLog(u) {                 // fill the log view for one user (keeps it pinned to the newest line)
    ui.run(function () {
        w.monTitle.setText(T(u.name + (u.online ? "  (online)" : "  (offline " + monAgo(u.lastSeen) + ")")));
        w.monlogtext.setText(u.log ? u.log : T("(no log uploaded yet)"));
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
                none.setText(T("No users have reported yet."));
                none.setTextColor(android.graphics.Color.parseColor("#9e9e9e"));
                none.setTextSize(11 * UI_TEXT_SCALE);
                none.setPadding(dp(6), dp(8), dp(6), dp(8));
                w.monlist.addView(none);
            }
            list.forEach(function (u) {
                var tv = new android.widget.TextView(context);
                tv.setText(T((u.online ? "● " : "○ ") + u.name + "\n" + u.state + " · v" + u.version + " · " + monAgo(u.lastSeen) + (u.dev ? "\n" + u.dev : "")));
                tv.setTextColor(android.graphics.Color.parseColor(u.online ? "#a5d6a7" : "#9e9e9e"));
                tv.setTextSize(11 * UI_TEXT_SCALE);
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
        if (r.status === 429) { monBackoffUntil = Date.now() + 5 * 60 * 1000; monMsg("Firestore quota / rate limit (HTTP 429) - auto-refresh paused 5 min. Tap refresh to retry."); return; }
        if (r.status !== 200) {
            monMsg(r.status === 403 ? "Refused - add the monitor rules for admins to firestore.rules." : "Failed (HTTP " + r.status + ").");
            return;
        }
        monBackoffUntil = 0;
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
            if (u.log.indexOf("[device] ") === 0) {          // first line = device info -> show it in the list
                var nl = u.log.indexOf("\n"), dl = u.log.slice(9, nl < 0 ? u.log.length : nl);
                u.dev = dl.split(" | ")[0];
            }
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
        w.monKick.setText(T("Kick"));
        monKickArm = 0;
        w.monscroll.setVisibility(V.VISIBLE);
        w.monTitle.setText(T("Users"));
    });
    threads.start(monFetch);
}
var usersShown = false, usersTab = "mon";      // one admin button: tabs Monitor | Devices
function setUsersView() {
    monShown = usersShown && usersTab === "mon";
    devShown = usersShown && usersTab === "dev";
    ui.run(function () {
        w.monBtn.setText(T(usersShown ? "Users ▴" : "Users ▾"));
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
w.monRefresh.click(function () { monBackoffUntil = 0; monMsg("Refreshing..."); threads.start(monFetch); });
w.monlogtext.on("long_click", function () {
    var u = monDocs[monView];
    if (u) { setClip(u.name + "\n" + u.log); toast("Log copied"); }
    return true;
});
setInterval(function () { if (authed) threads.start(pushMonitor); }, MON_PUSH_MS);
setInterval(function () { if (monShown && authed && isAdmin() && !minimized && Date.now() >= monBackoffUntil) threads.start(monFetch); }, MON_REFRESH_MS);

// ---- Devices panel (admin): see which phone each user is locked to and let them use a new one ----
// Tap a user, then tap again within 4 s = "Reset": removes users/{uid}.deviceId, so the next login of that user binds
// whatever phone they log in on. Needs the admin read/update rule for users/{uid} in firestore.rules.
var devShown = false, devBusy = false, devDocs = {}, devArm = "", devArmAt = 0, devSelId = "";
function devMsg(text) { ui.run(function () { w.devMsg.setText(T(text || "")); }); }
function devRender(list) {
    ui.run(function () {
        try {
            var dens = context.getResources().getDisplayMetrics().density;
            function dp(n) { return Math.round(n * dens); }
            w.devlist.removeAllViews();
            if (!list.length) {
                var none = new android.widget.TextView(context);
                none.setText(T("No users found."));
                none.setTextColor(android.graphics.Color.parseColor("#9e9e9e"));
                none.setTextSize(11 * UI_TEXT_SCALE);
                none.setPadding(dp(6), dp(8), dp(6), dp(8));
                w.devlist.addView(none);
            }
            list.forEach(function (u) {
                var tv = new android.widget.TextView(context);
                var sel = (devSelId === u.id);
                tv.setText(T((sel ? "▶ " : (u.device ? "🔒 " : "○ ")) + u.name + "\n" +
                    (u.device ? ("device " + u.device.slice(0, 6) + "…" + u.device.slice(-4)) : "no device yet - next login binds") + "\n" + subLabel(u.subUntil)));
                tv.setTextColor(android.graphics.Color.parseColor(sel ? "#ffffff" : (u.device ? "#a5d6a7" : "#9e9e9e")));
                tv.setTextSize(11 * UI_TEXT_SCALE);
                tv.setPadding(dp(8), dp(7), dp(8), dp(7));
                tv.setBackgroundColor(android.graphics.Color.parseColor(sel ? "#66FFE600" : "#33FFFFFF"));
                var lp = new android.widget.LinearLayout.LayoutParams(-1, -2);
                lp.setMargins(0, 0, 0, dp(3));
                tv.setOnTouchListener(function (v, e) { try { w.devpanel.requestDisallowInterceptTouchEvent(true); } catch (e2) {} return false; });
                tv.setOnClickListener(new android.view.View.OnClickListener({
                    onClick: function () {
                        if (isAdminName(u.name)) { devMsg("Admins are never locked."); return; }
                        devSelId = u.id;
                        devArm = ""; ui.run(function () { w.devReset.setText(T("Reset")); });
                        w.devSel.setText(T("Selected: " + u.name + (u.device ? "  (" + u.device + ")" : "  (no device)")));
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
        if (r.status === 429) { devMsg("Firestore quota / rate limit (HTTP 429) - wait a few minutes and retry."); return; }
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
                device: (f.deviceId && f.deviceId.stringValue) ? String(f.deviceId.stringValue) : "",
                subUntil: fsInt(f.subUntil)
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
        if (c.status === 200) { log("device reset: " + u.name); devMsg("Reset " + u.name + " - next login binds a new phone."); u.device = ""; ui.run(function () { w.devSel.setText(T("Selected: " + u.name + "  (no device)")); }); devRender(devSorted()); }
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
            ui.run(function () { w.devSel.setText(T("Selected: " + u.name + "  (" + id + ")")); w.devInput.setText(""); });
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
        ui.run(function () { w.devReset.setText(T("Sure?")); });
        devMsg("Tap Reset again within 4s to clear " + u.name + "'s device.");
        setTimeout(function () { if (Date.now() - devArmAt >= 3900) { devArm = ""; ui.run(function () { w.devReset.setText(T("Reset")); }); devMsg(""); } }, 4100);
        return;
    }
    devArm = "";
    ui.run(function () { w.devReset.setText(T("Reset")); });
    threads.start(function () { devReset(u); });
});
w.devRefresh.click(function () { devMsg("Refreshing..."); threads.start(devFetch); });

// ---- Reset ALL: clears the saved device of every user that has one (admins are skipped). Tap once = arm ("Sure?"), tap again within 4 s = reset. ----
var devAllArmAt = 0;
function devResetAll(list) {
    try {
        var t = monToken();
        if (!t || !authed || !isAdmin()) { devMsg("Admins only."); return; }
        var base = fsBase(), ok = 0, i;
        for (i = 0; i < list.length; i += 100) {                     // one commit per 100 users
            var chunk = list.slice(i, i + 100);
            var commit = { writes: chunk.map(function (u) { return { update: { name: base + "/users/" + u.id, fields: {} }, updateMask: { fieldPaths: ["deviceId"] } }; }) };
            var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
            if (c.status === 401) monTok = null;
            if (c.status === 200) { chunk.forEach(function (u) { u.device = ""; }); ok += chunk.length; }
            else { devMsg(c.status === 403 ? "Refused - add the admin rule for users/{uid} to firestore.rules." : "Reset ALL failed (HTTP " + c.status + ") after " + ok + " users."); break; }
        }
        log("device reset ALL: " + ok + " users");
        if (ok === list.length) devMsg("Reset " + ok + " devices - next login binds new phones.");
        devRender(devSorted());
    } catch (e) { logErr("devResetAll", e); devMsg("Reset ALL error - see log"); }
}
w.devResetAll.click(function () {
    inputFocus(false);
    var list = devSorted().filter(function (u) { return u.device && !isAdminName(u.name); });
    if (!list.length) { devMsg("No user has a device saved."); return; }
    if (Date.now() - devAllArmAt > 4000) {                           // first tap arms, second tap (within 4 s) resets everyone
        devAllArmAt = Date.now();
        ui.run(function () { w.devResetAll.setText(T("Sure?")); });
        devMsg("Tap again within 4s to clear the device of ALL " + list.length + " users.");
        setTimeout(function () { if (Date.now() - devAllArmAt >= 3900) { devAllArmAt = 0; ui.run(function () { w.devResetAll.setText(T("Reset ALL")); }); devMsg(""); } }, 4100);
        return;
    }
    devAllArmAt = 0;
    ui.run(function () { w.devResetAll.setText(T("Reset ALL")); });
    threads.start(function () { devResetAll(list); });
});

// ---- Subscription days (admin): add to or set a user's remaining subscription time ----
// Writes users/{uid}.subUntil (ms epoch). Add = extend from the current end (or from now if already expired),
// a negative number takes days off. Set = subscription runs exactly N days from now (0 = expire now).
// The user's own copy re-reads subUntil every UPDATE_CHECK_MS, so a change or an expiry applies without a relog.
function subLabel(until) {
    var left = Number(until) - Date.now();
    return left > 0 ? "sub: " + fmtLeft(left) + " left" : "sub: none / expired";
}
function devSubWrite(u, until, verb) {
    try {
        var t = monToken();
        if (!t || !authed || !isAdmin()) { devMsg("Admins only."); return; }
        var base = fsBase();
        var commit = { writes: [ { update: { name: base + "/users/" + u.id, fields: { subUntil: { integerValue: String(until) } } }, updateMask: { fieldPaths: ["subUntil"] } } ] };
        var c = fsReq("POST", "https://firestore.googleapis.com/v1/" + base + ":commit", t.token, commit);
        if (c.status === 401) monTok = null;
        if (c.status === 200) {
            log("subscription " + verb + ": " + u.name + " -> " + subLabel(until).replace("sub: ", ""));
            u.subUntil = until;
            devMsg(u.name + ": " + subLabel(until).replace("sub: ", "") + ".");
            ui.run(function () { w.devDays.setText(""); w.devSel.setText(T("Selected: " + u.name + (u.device ? "  (" + u.device + ")" : "  (no device)"))); });
            inputFocus(false);
            devRender(devSorted());
        } else devMsg(c.status === 403 ? "Refused - add the admin rule for users/{uid} to firestore.rules (subUntil)." : "Subscription update failed (HTTP " + c.status + ").");
    } catch (e) { logErr("devSubWrite", e); devMsg("Subscription error - see log"); }
}
function devSubEdit(mode) {            // mode: "add" | "set"
    var u = devDocs[devSelId];
    if (!u) { devMsg("Tap a user first."); return; }
    var raw = String(w.devDays.getText()).trim();
    var days = /^-?\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
    if (isNaN(days) || Math.abs(days) > 3650) { devMsg("Enter a whole number of days (max 3650)."); return; }
    var now = Date.now(), until;
    if (mode === "add") {
        until = Math.max(now, Number(u.subUntil) || 0) + days * 86400000;
        if (until < now) until = now;                        // taking more days than left = expired
    } else {
        if (days < 0) { devMsg("Set needs 0 or more days (use 0 to expire)."); return; }
        until = now + days * 86400000;
    }
    devSubWrite(u, until, mode === "add" ? "added" : "set");
}
bindAuthField(w.devDays);
w.devAddDays.click(function () { inputFocus(false); threads.start(function () { devSubEdit("add"); }); });
w.devSetDays.click(function () { inputFocus(false); threads.start(function () { devSubEdit("set"); }); });

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
    if (!authed || kickBusy || Date.now() < bgPauseUntil) return;
    kickBusy = true;
    try {
        var t = monToken();
        if (!t) return;
        var r = fsReq("GET", fsUrl("kicks/" + t.uid), t.token), stamp;
        if (r.status === 401) { monTok = null; return; }
        if (r.status === 429) { bgPauseUntil = Date.now() + 10 * 60 * 1000; return; }
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
        ui.run(function () { w.monKick.setText(T("Sure?")); });
        monMsg("Tap again within 4s to log out " + u.name);
        setTimeout(function () {
            if (Date.now() - monKickArm >= 3900) { monKickArm = 0; ui.run(function () { w.monKick.setText(T("Kick")); }); monMsg(""); }
        }, 4100);
        return;
    }
    monKickArm = 0;
    ui.run(function () { w.monKick.setText(T("Kick")); });
    threads.start(function () { doKick(u); });
});
setInterval(function () { if (authed) threads.start(kickCheck); }, KICK_CHECK_MS);

// Log button -> opens the log as a pop-up window (tap Log again, or Close, to hide it). Copy = copy all lines.
function closeLogPopup() {
    logShown = false;
    if (logPop) { try { logPop.close(); } catch (e) {} logPop = null; }
    try { ui.run(function () { w.log.setText(T("Log")); }); } catch (e2) {}
}
function openLogPopup() {
    if (logPop) { closeLogPopup(); return; }         // tapping Log again closes it
    logPop = floaty.window(uiScaleXml(
        <vertical bg="#F0000000" padding="4" w="150" h="auto">
            <text id="logtitle" text="⠿ Log  (drag)" textColor="#ffffff" textSize="8sp" textStyle="bold" gravity="center" h="20"/>
            <scroll id="logscroll" w="*" h="110" bg="#CC000000">
                <text id="logview" w="*" text="" textColor="#FFEE58" textSize="8sp" padding="2"/>
            </scroll>
            <horizontal>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="logcopy" text="Copy" layout_weight="1" w="0" h="26" textSize="8sp" margin="1"/>
                <button padding="0" minHeight="0" minWidth="0" singleLine="true" id="logclose" text="Close" layout_weight="1" w="0" h="26" textSize="8sp" margin="1"/>
            </horizontal>
        </vertical>
    ));
    var pop = logPop;
    logShown = true;
    try { w.log.setText(T("Hide")); } catch (e3) {}
    pop.logclose.click(function () { closeLogPopup(); });
    pop.logcopy.click(function () {
        setClip(LOG_LINES.join("\n"));
        toast("Log copied");
    });
    pop.logscroll.setOnTouchListener(function (v, e) { try { v.getParent().requestDisallowInterceptTouchEvent(true); } catch (e4) {} return false; });
    var ldx = 0, ldy = 0, lwx = 0, lwy = 0;          // drag the pop-up by its title
    pop.logtitle.setOnTouchListener(function (view, e) {
        switch (e.getAction()) {
            case e.ACTION_DOWN:
                ldx = e.getRawX(); ldy = e.getRawY(); lwx = pop.getX(); lwy = pop.getY();
                return true;
            case e.ACTION_MOVE:
                pop.setPosition(Math.max(0, Math.min(device.width - 60, lwx + (e.getRawX() - ldx))),
                                Math.max(0, Math.min(device.height - 60, lwy + (e.getRawY() - ldy))));
                return true;
        }
        return true;
    });
    try {                                            // start in the screen centre
        var d = context.getResources().getDisplayMetrics().density;
        pop.setPosition(Math.max(0, Math.round((device.width - 150 * UI_SCALE * d) / 2)), Math.max(10, Math.round((device.height - 200 * UI_SCALE * d) / 2)));
    } catch (e) { logErr("log popup position", e); }
    refreshLogView();
}
w.log.click(function () { openLogPopup(); });

w.exit.click(function () {
    log("Exit pressed");
    try { closeLogPopup(); } catch (e) {}
    try { sgClosePanel(); } catch (e) {}
    try { alClosePanel(); } catch (e) {}
    w.close();
    exit();
});

// screen capture is requested by onAuthed() right after a successful login (or restored session)

setInterval(function () {}, 1000);   // keep the script (and the floating window) alive
setInterval(function () { if (authed && !updBusy) threads.start(checkUpdate); }, UPDATE_CHECK_MS);
setInterval(function () { if (authed && !subChecking && !subBusy) threads.start(loadSub); }, UPDATE_CHECK_MS);   // re-read the subscription from the server
