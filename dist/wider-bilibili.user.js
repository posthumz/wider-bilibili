// ==UserScript==
// @name         Wider Bilibili
// @namespace    https://greasyfork.org/users/1125570
// @version      0.4.0.2
// @author       posthumz
// @description  哔哩哔哩宽屏体验
// @license      MIT
// @icon         https://www.bilibili.com/favicon.ico
// @match        http*://*.bilibili.com/*
// @exclude      http*://www.bilibili.com/correspond/*
// @exclude      http*://message.bilibili.com/pages/nav/*_sync
// @grant        GM_addStyle
// @grant        GM_addValueChangeListener
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(async function () {
  'use strict';

  const styles = {
    video: `/* 播放器 */
:root {
  --navbar-height: 64px;
  --video-height: 100vh;
}

/* 使用div提高样式优先级 */
div#playerWrap,
div#bilibili-player-wrap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: var(--video-height);
  /* 番剧页加载时会有右填充 */
  padding-right: 0;
}

div#bilibili-player {
  width: 100%;
  height: 100%;
  box-shadow: none !important;

  /* Bilibili Evolved 夜间模式样式的优先级很高，所以要嵌套在#bilibili-player里面 */
  .bpx-player-video-info {
    color: hsla(0, 0%, 100%, .9) !important;
    margin-right: 10px;
  }

  .bpx-player-video-btn-dm,
  .bpx-player-dm-setting,
  .bpx-player-dm-switch {
    fill: hsla(0, 0%, 100%, .9) !important;
  }

  .bpx-player-dm-hint>a {
    color: hsla(0, 0%, 100%, .6) !important;
    fill: hsla(0, 0%, 100%, .6) !important;
  }
}

/* 加载动画强制显示 */
.bpx-player-loading-panel-blur {
  display: flex !important;
}

/* 强制显示播放器控件 */
.bpx-player-top-left-title,
.bpx-player-top-left-music,
.bpx-player-top-mask {
  display: block !important;
}

/* 不然会鬼畜 */
.bpx-player-top-mask {
  transition: none;
}

/* 原宽屏/网页全屏按钮不显示 */
.bpx-player-ctrl-wide,
.bpx-player-ctrl-web {
  display: none;
}

/* 原弹幕发送区域不显示 */
.bpx-player-sending-area {
  display: none;
}

/* 导航栏 */
#biliMainHeader {
  margin-top: var(--video-height);
  margin-bottom: 0;
  position: sticky;
  top: 0;
  z-index: 3;
}

.custom-navbar {
  position: sticky !important;
  z-index: 3 !important;
}

.bili-header.fixed-header {
  min-height: initial !important;
}

.bili-header__bar {
  position: relative !important;
}

/* 使用 static 才能让播放器的 absolute 正确定位 */
/* 视频、番剧、收藏/稍后再看页 */
.video-container-v1,
.left-container,
.main-container,
.playlist-container--left {
  position: static !important;
}

/* 视频页、番剧页、收藏/稍后再看页的下方容器 */
.video-container-v1,
.main-container,
.playlist-container {
  z-index: 0;
  margin-top: var(--video-height);
  padding: 0 var(--layout-padding);
}

.left-container,
.plp-l,
.playlist-container--left {
  flex: 1;
}

.plp-r {
  position: sticky !important;
  /* 番剧页加载时不会先使用sticky */
}

/* 番剧/影视页下方容器 */
.main-container {
  width: 100%;
  margin: 0;
  padding-top: 15px;
  padding-left: var(--layout-padding);
  padding-right: var(--layout-padding);
  box-sizing: border-box;
  display: flex;
}

.player-left-components {
  padding-right: 30px !important;
}

.toolbar {
  padding-top: 0;
}

/* 视频标题换行显示 */
#viewbox_report {
  height: auto;
}

.video-title {
  white-space: normal !important;
}

/* bgm浮窗 */
#bgm-entry {
  z-index: 114514 !important;
  left: 0 !important;
}

/* 笔记浮窗 */
.note-pc {
  z-index: 114514 !important;
}

/* 番剧页右下方浮动按钮修正 */
div[class^=navTools_floatNav] {
  z-index: 2 !important;
}

/* Bilibili Evolved侧栏 */
.be-settings .sidebar {
  z-index: 114514 !important;
}`,
    t: `/* 动态页 */
#app .bg+.content {
  width: initial;
  margin: 10px 0;

  >.card {
    margin: 0 var(--layout-padding)
  }

  >.sidebar-wrap {
    right: 58px;
    margin-right: var(--layout-padding);
  }
}

.bili-dyn-home--member {
  margin: 0 var(--layout-padding) !important;

  main {
    flex: 1
  }

  .left {
    display: none;
  }
}`,
    space: `/* 空间页 */
.wrapper,
.search-page {
  width: initial !important;
  margin: 0 var(--layout-padding) !important;
}

/* 视频卡片 */
.small-item {
  padding-left: 10px !important;
  padding-right: 10px !important;
}

/* 主页, 动态 */
#page-index,
#page-dynamic {
  display: flex;
  justify-content: space-between;
  gap: 10px;

  &::before,
  &::after {
    content: none;
  }

  .col-1 {
    flex: 1;

    >.video>.content {
      display: flex;
      flex-wrap: wrap;
    }

    .section.coin>.content {
      display: flex;
      flex-wrap: wrap;
      margin: 0;
      width: initial !important;
    }
  }

  .channel>.content {
    width: initial !important;

    .channel-video {
      overflow-x: auto;
    }
  }

  .fav-item {
    margin-right: 20px !important;
  }
}

/* 投稿, 搜索 */
#page-video .col-full {
  display: flex;

  >.main-content {
    flex: 1;

    .cube-list {
      width: initial !important;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}

/* 合集 */
.channel-index {
  width: 100% !important;
}

.feed-dynamic {
  flex: 1;
}`,
    search: `/* 搜索页 */
.i_wrapper {
  padding: 0 var(--layout-padding);
}`,
    read: `/* 阅读页 */
#app {
  margin: 0 var(--layout-padding);

  >.article-detail {
    width: initial;

    .article-up-info {
      width: initial;
      margin: 0 80px 20px;
    }

    .right-side-bar {
      right: 0;
    }
  }
}`,
    home: `/* 首页 */
.feed-card,
.floor-single-card,
.bili-video-card {
  margin-top: 0px !important;
}

.feed-roll-btn {
  /* left: initial !important;
  right: calc(30px - var(--layout-padding)); */
  /* 右下角已有刷新按键，何必呢 */
  display: none;
}

.palette-button-wrap {
  left: initial !important;
  right: 30px;
}`,
    common: `/* This overrides :root style */
body {
  --layout-padding: 30px;
}

html,
body {
  width: initial !important;
  height: initial !important;
}

/* 搜索栏 */
.center-search-container {
  min-width: 0;
}

.nav-search-input {
  width: 0 !important;
  padding-right: 0 !important;
}`,
    upperNavigation: `/* 导航栏上置 (默认下置) */
:root {
  --video-height: calc(100vh - var(--navbar-height));
}

#biliMainHeader {
  margin-top: 0;
  margin-bottom: var(--video-height);
}

div#playerWrap,
div#bilibili-player-wrap {
  top: var(--navbar-height);
  height: var(--video-height) !important;
}`,
    pauseShow: `/* 暂停显示控件 */
.bpx-state-paused {

  .bpx-player-top-wrap,
  .bpx-player-control-top,
  .bpx-player-control-bottom,
  .bpx-player-control-mask {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .bpx-player-shadow-progress-area {
    visibility: hidden !important;
  }

  .bpx-player-pbp {
    bottom: 100% !important;
    margin-bottom: 5px;
    opacity: 1 !important;
    left: 0;
    right: 0;
    width: initial !important;

    .bpx-player-pbp-pin {
      opacity: 1 !important;
    }
  }
}`,
    options: `/* 脚本选项 */
#wider-bilibili {
  --wb-bg: var(--Wh0, #FFF);
  --wb-fg: var(--Ga10, #18191C);
  --wb-white: rgb(255, 255, 255);
  --wb-blue: 0, 174, 236;
  --wb-pink: 255, 102, 153;
  --wb-red: 248, 90, 84;

  position: fixed;
  top: 0;
  bottom: 0;
  height: fit-content;
  max-height: 80vh;
  left: 0;
  right: 0;
  width: fit-content;
  max-width: 80vw;
  z-index: 114514;
  padding: 10px;
  border-radius: 10px;
  margin: auto;
  box-sizing: border-box;
  overflow: auto;
  flex-direction: column;
  gap: 10px;

  outline: 2px solid rgba(var(--wb-blue), 0.8);
  outline-offset: 0;
  background-color: var(--wb-bg);
  color: var(--wb-fg);
  font-size: 20px;
  font-family: "HarmonyOS_Regular", "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif !important;

  opacity: 0.9;

  &:hover {
    opacity: 1
  }

  >header {
    position: sticky;
    z-index: 2;
    top: -10px;
    display: flex;
    justify-content: space-between;
    margin: -10px;
    text-overflow: clip;
    padding-left: 20px;
    font-weight: bold;
    background-color: var(--wb-bg);

    &::before {
      content: "Wider Bilibili 选项";
      align-self: center;
      flex: 1;
    }
  }


  .wb-button-group {
    display: flex;
    margin-bottom: 10px;

    >* {
      height: 100%;
    }
  }

  #wb-close {
    box-sizing: border-box;
    padding: 4px;
    width: fit-content;
    background-color: rgba(var(--wb-red), 0.5);
    fill: var(--wb-fg);

    &:hover {
      background-color: rgba(var(--wb-red), 0.75);
    }

    &:active {
      background-color: rgb(var(--wb-red));
    }
  }

  button {
    border: none;
    padding: 4px 8px;
    background: none;
    color: var(--wb-fg);
    transition: opacity .1s;
    background-color: rgba(var(--wb-blue), 0.5);
    font-size: 16px;
    text-wrap: nowrap;

    &:hover {
      background-color: rgba(var(--wb-blue), 0.75);
    }

    &:active {
      background-color: rgb(var(--wb-blue));
    }

    >a {
      color: inherit;
      text-decoration: none;
    }
  }

  >fieldset {
    border: none;
    border-radius: 10px;
    padding: 10px;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 15px;
    background-color: rgba(127, 127, 127, 0.1);

    &::before {
      content: attr(data-title);
      border-radius: 4px 4px 0 0;
      border-bottom: 2px solid rgba(127, 127, 127, 0.1);
      grid-column: 1 / -1;
    }
  }

  label {
    display: inline-flex;
    gap: 10px;
    place-items: center;
    position: relative;
    text-wrap: nowrap;

    &[data-hint]:hover::before {
      position: absolute;
      bottom: 110%;
      left: 0;
      right: 0;
      margin: 0 auto;
      width: fit-content;
      padding: 3px 5px;
      border-radius: 5px;
      content: attr(data-hint);
      font-size: 12px;
      background-color: rgb(var(--wb-blue));
      color: var(--wb-white);
      white-space: pre-line;
    }

    &::after {
      content: attr(data-key);
    }
  }

  input {
    box-sizing: content-box;
    margin: 0;
    padding: 4px;
    height: 20px;
    font-size: 16px;
    transition: .2s;

    &:hover {
      box-shadow: 0 0 8px rgb(var(--wb-blue));
    }

    &[type=checkbox] {
      box-sizing: content-box;
      border-radius: 20px;
      min-width: 40px;
      background-color: #ccc;
      appearance: none;
      cursor: pointer;

      &::before {
        content: "";
        position: relative;
        display: block;
        transition: 0.3s;

        height: 100%;
        aspect-ratio: 1/1;
        border-radius: 50%;
        background-color: #FFF;
      }

      &:checked {
        background-color: rgb(var(--wb-blue));
      }

      &:checked::before {
        transform: translateX(20px);
      }

      &:active {
        opacity: 0.5;
      }
    }

    &[type=number] {
      width: 40px;
      border: none;
      border-radius: 5px;
      outline: 2px solid rgb(var(--wb-blue));
      background: none;
      color: var(--wb-fg);
      appearance: textfield;

      &::-webkit-inner-spin-button {
        appearance: none;
      }
    }
  }
}`,
    mini: `/* 小窗 */
.bpx-player-container[data-screen="mini"] {
  /* 以视频长宽比为准，不显示黑边和阴影 */
  height: auto !important;
  box-shadow: none;
  /* 修正小窗位置 */
  translate: 32px 40px;
}

.bpx-player-container {
  &[data-screen="mini"] {
    width: var(--mini-width) !important;
  }

  /* 最小宽度，以防不可见 */
  min-width: 180px;
}

.bpx-player-mini-resizer {
  position: absolute;
  left: 0;
  width: 10px;
  height: 100%;
  cursor: ew-resize;
}`,
    controls: `/* 播放器控件 */
.bpx-player-control-bottom {
  padding: 0 24px;
}

.bpx-player-control-bottom-left,
.bpx-player-control-bottom-right,
.bpx-player-sending-bar,
.be-video-control-bar-extend {
  gap: 10px;
}

.bpx-player-ctrl-btn {
  width: auto !important;
  margin: 0 !important;
}

.bpx-player-ctrl-time-seek {
  width: 100% !important;
  padding: 0 !important;
  left: 0 !important;
}

.bpx-player-control-bottom-left {
  min-width: initial !important;
}

.bpx-player-control-bottom-center {
  padding: 0 20px !important;
}

.bpx-player-control-bottom-right {
  min-width: initial !important;

  >div {
    padding: 0 !important;
  }
}

.bpx-player-ctrl-time-label {
  text-align: center !important;
  text-indent: 0 !important;
}

.bpx-player-video-inputbar {
  min-width: initial !important;
}`
  };
  function waitFor(loaded, desc = "页面加载", retry = 100, interval = 100) {
    return new Promise((resolve, reject) => {
      const intervalID = setInterval((res = loaded()) => {
        if (res) {
          clearInterval(intervalID);
          console.info(`${desc}已加载`);
          return resolve(res);
        }
        if (--retry === 0) {
          console.error("页面加载超时");
          clearInterval(intervalID);
          return reject(new Error("timeout"));
        }
        if (retry % 10 === 0) {
          console.debug(`等待${desc}`);
        }
      }, interval);
    });
  }
  function observeFor(className, parent) {
    return new Promise((resolve) => {
      const elem = parent.getElementsByClassName(className)[0];
      if (elem) {
        return resolve(elem);
      }
      new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof Element && node.classList.contains(className)) {
              observer.disconnect();
              return resolve(node);
            }
          }
        }
      }).observe(parent, { childList: true });
    });
  }
  function waitReady() {
    return new Promise((resolve) => {
      document.readyState === "loading" ? window.addEventListener("DOMContentLoaded", () => resolve(), { once: true }) : resolve();
    });
  }
  const html = `<div id="wider-bilibili" style="display: none;">
  <header>
    <div class="wb-button-group">
      <button><a target="_blank" href="https://greasyfork.org/scripts/474507">发布</a></button>
      <button><a target="_blank" href="https://github.com/posthumz/wider-bilibili">主页</a></button>
      <button><a target="_blank" href="https://github.com/posthumz/wider-bilibili/issues">反馈</a></button>
      <svg id="wb-close" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
    </div>
  </header>
  <fieldset data-title="通用">
    <label data-key="左右边距" data-hint="可使用滚轮调节"><input type="number" min="0" value="30"></label>
  </fieldset>
  <fieldset data-title="播放器">
    <label data-key="导航栏下置"><input type="checkbox" checked></label>
    <label data-key="小窗样式" data-hint="试试拉一下小窗左侧？"><input type="checkbox" checked></label>
    <label data-key="调节控件间距"><input type="checkbox" checked></label>
    <label data-key="暂停显示控件" data-hint="默认检测到鼠标活动显示控件&#10;需要一直显示请打开此选项"><input type="checkbox"></label>
    <label data-key="显示观看信息" data-hint="在线人数/弹幕数"><input type="checkbox" checked></label>
  </fieldset>
</div>`;
  GM_addStyle(styles.options);
  function toggleStyle(s, init = true, flip = false) {
    if (flip) {
      init = !init;
    }
    const style = GM_addStyle(s);
    if (!init) {
      style.disabled = true;
    }
    return flip ? (enable) => {
      style.disabled = enable;
    } : (enable) => {
      style.disabled = !enable;
    };
  }
  function onStyleValueChange(toggle) {
    return (_k, _o, init) => toggle(init);
  }
  const options = {
    左右边距: {
      page: "common",
      d: 30,
      callback: (init) => {
        document.body.style.setProperty("--layout-padding", `${init}px`);
        return (_k, _o, newVal) => document.body.style.setProperty("--layout-padding", `${newVal}px`);
      }
    },
    导航栏下置: {
      page: "video",
      d: true,
      callback: (init) => onStyleValueChange(toggleStyle(styles.upperNavigation, init, true))
    },
    小窗样式: {
      page: "video",
      d: true,
      callback: (init) => {
        document.documentElement.style.setProperty("--mini-width", "320px");
        const toggle1 = toggleStyle(styles.mini, init);
        const toggle2 = toggleStyle(".bpx-player-container { --mini-width: initial }", init, true);
        return onStyleValueChange((enable) => {
          toggle1(enable);
          toggle2(enable);
        });
      }
    },
    调节控件间距: {
      page: "video",
      d: true,
      callback: (init) => onStyleValueChange(toggleStyle(styles.controls, init))
    },
    暂停显示控件: {
      page: "video",
      d: false,
      callback: (init) => onStyleValueChange(toggleStyle(styles.pauseShow, init))
    },
    显示观看信息: {
      page: "video",
      d: true,
      callback: (init) => onStyleValueChange(toggleStyle(".bpx-player-video-info{display:flex!important}", init))
    }
  };
  function activate(targetPage) {
    for (const [name, { page, d, callback }] of Object.entries(options)) {
      page === targetPage && GM_addValueChangeListener(name, callback(GM_getValue(name, d)));
    }
  }
  waitReady().then(() => {
    document.body.insertAdjacentHTML("beforeend", html);
    const app = document.getElementById("wider-bilibili");
    GM_registerMenuCommand("选项", () => {
      app.style.display = "flex";
    });
    document.getElementById("wb-close")?.addEventListener("click", () => {
      app.style.display = "none";
    });
    for (const input of app.getElementsByTagName("input")) {
      const key = input.parentElement?.dataset.key;
      if (!key) {
        continue;
      }
      const option = options[key];
      switch (input.type) {
        case "checkbox":
          input.checked = GM_getValue(key, option.d);
          input.onchange = () => GM_setValue(key, input.checked);
          break;
        case "number":
          input.value = GM_getValue(key, option.d);
          input.oninput = () => {
            const val = Number(input.value);
            Number.isInteger(val) && GM_setValue(key, val);
          };
          break;
      }
    }
    const modifiers = ["ctrlKey", "altKey", "shiftKey", "metaKey"];
    const comb = [["altKey", "shiftKey"], "W"];
    document.addEventListener("keyup", (ev) => {
      const { key } = ev;
      if (key === comb[1] && modifiers.every((mod) => comb[0].includes(mod) === ev[mod])) {
        ev.stopPropagation();
        app.style.display = app.style.display === "none" ? "flex" : "none";
      }
    });
    activate("common");
  });
  GM_addStyle(styles.common);
  const url = new URL(window.location.href);
  switch (url.host) {
    case "www.bilibili.com": {
      if (url.pathname === "/") {
        GM_addStyle(styles.home);
        console.info("使用首页宽屏样式");
        break;
      }
      if (url.pathname.startsWith("/read")) {
        GM_addStyle(styles.read);
        console.info("使用阅读页宽屏样式");
        break;
      }
      const style = GM_addStyle(styles.video);
      await( waitReady());
      const player = document.getElementById("bilibili-player");
      if (!player) {
        style.remove();
        break;
      }
      activate("video");
      observeFor("custom-navbar", document.body).then((nav) => document.getElementById("biliMainHeader").insertAdjacentElement("beforeend", nav));
      const container = await( waitFor(() => player.getElementsByClassName("bpx-player-container")[0], "播放器内容器"));
      if (container.getAttribute("data-screen") !== "mini") {
        container.setAttribute("data-screen", "web");
      }
      container.setAttribute = new Proxy(container.setAttribute, {
        apply: (target, thisArg, [name, val]) => target.apply(thisArg, [name, name === "data-screen" && val !== "mini" ? "web" : val])
      });
      const miniResizer = document.createElement("div");
      miniResizer.className = "bpx-player-mini-resizer";
      miniResizer.onmousedown = (ev) => {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        const resize = (ev2) => document.documentElement.style.setProperty(
          "--mini-width",
          `${container.offsetWidth + container.offsetLeft - ev2.x + 1}px`
        );
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", () => document.removeEventListener("mousemove", resize), { once: true });
      };
      const videoArea = container.getElementsByClassName("bpx-player-video-area")[0];
      if (!videoArea) {
        console.error("页面加载错误：视频区域不存在");
        break;
      }
      observeFor("bpx-player-mini-warp", videoArea).then((wrap) => wrap.appendChild(miniResizer));
      const sendingBar = player.getElementsByClassName("bpx-player-sending-bar")[0];
      if (!sendingBar) {
        console.error("页面加载错误：发送框不存在");
        break;
      }
      const danmaku = (await( observeFor("bpx-player-video-info", sendingBar))).parentElement;
      const bottomCenter = container.getElementsByClassName("bpx-player-control-bottom-center")[0];
      if (!bottomCenter || !danmaku) {
        console.error("页面加载错误：弹幕框不存在");
        break;
      }
      document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
          bottomCenter.replaceChildren(danmaku);
        }
      });
      bottomCenter.replaceChildren(danmaku);
      console.info("宽屏模式成功启用");
      break;
    }
    case "t.bilibili.com":
      GM_addStyle(styles.t);
      waitFor(() => document.getElementsByClassName("right")[0], "动态右栏").then((right) => {
        right.prepend(...document.getElementsByClassName("left")[0]?.childNodes ?? []);
      });
      console.info("使用动态样式");
      break;
    case "space.bilibili.com":
      GM_addStyle(styles.space);
      console.info("使用空间样式");
      break;
    case "search.bilibili.com":
      GM_addStyle(styles.search);
      console.info("使用搜索页样式");
      break;
    default:
      console.info(`未适配页面，仅启用通用样式: ${url.href}`);
      break;
  }

})();