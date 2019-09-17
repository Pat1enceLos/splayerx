/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-console
console.log('preloaded~~~~~~~');
const { ipcRenderer, remote } = require('electron');

let mousedown = false;
let isDragging = false;
let offset = null;
let windowSize = null;
let pipTimer = 0;
function sendToHost(channel, message) {
  ipcRenderer.send(channel, message);
}
function getRatio() {
  return window.devicePixelRatio || 1;
}

document.addEventListener('DOMContentLoaded', () => {
  const danmu = document.querySelector('.danmu');
  const pip = document.querySelector('.pip');
  const pipBtns = document.querySelector('.pip-buttons');
  if (pipBtns) {
    pipBtns.style.display = 'flex';
    pipBtns.addEventListener('mousemove', () => {
      if (pipTimer) clearTimeout(pipTimer);
      sendToHost('pip-btn-mousemove');
      pipBtns.style.display = 'flex';
    });
    pipTimer = setTimeout(() => {
      pipBtns.style.display = 'none';
    }, 3000);
  }
  if (danmu) {
    danmu.addEventListener('mouseup', () => {
      sendToHost('danmu', 'danmu');
    });
  }
  if (pip) {
    pip.addEventListener('mouseup', () => {
      sendToHost('pip', 'pip');
    });
  }
  window.addEventListener('mouseout', (evt) => {
    if (pipBtns) {
      sendToHost('pip-btn-mouseout');
    } else if (remote.getCurrentWindow()
      && remote.getCurrentWindow().getBrowserViews().length > 1) {
      const winSize = remote.getCurrentWindow().getSize();
      if (evt.clientX <= 0 || evt.clientX >= winSize[0] || evt.clientY >= winSize[1]) {
        sendToHost('mouseout', 'out');
      }
    }
  }, true);

  // eslint-disable-next-line complexity
  window.addEventListener('mousedown', (evt) => {
    if (!pipBtns && remote.getCurrentWindow()
      && remote.getCurrentWindow().getBrowserViews().length > 1) {
      const url = window.location.href;
      switch (true) {
        case url.includes('bilibili'):
          if (evt.target.tagName === 'VIDEO' || ['bilibili-player-video-top-title', 'bilibili-player-video-toast-top', 'bilibili-player-ending-panel', 'bilibili-player-electric-panel', 'bilibili-player-electric-panel-wrap'].includes(evt.target.classList[0])) {
            offset = [evt.clientX, evt.clientY];
            if (getRatio() !== 1) {
              windowSize = remote.getCurrentWindow().getSize();
            }
          }
          break;
        case url.includes('youtube'):
          if (evt.target.tagName === 'VIDEO' || ['ytp-ad-overlay-container', 'ytp-cued-thumbnail-overlay-image', 'ytp-upnext-paused', 'ytp-ad-text'].includes(evt.target.classList[0])) {
            offset = [evt.clientX, evt.clientY];
            if (getRatio() !== 1) {
              windowSize = remote.getCurrentWindow().getSize();
            }
          }
          break;
        case url.includes('iqiyi'):
          if (['VIDEO', 'CANVAS'].includes(evt.target.tagName)) {
            offset = [evt.clientX, evt.clientY];
            if (getRatio() !== 1) {
              windowSize = remote.getCurrentWindow().getSize();
            }
          }
          break;
        default:
          offset = [evt.clientX, evt.clientY];
          if (getRatio() !== 1) {
            windowSize = remote.getCurrentWindow().getSize();
          }
          break;
      }
      if (offset) {
        mousedown = true;
        sendToHost('update-mouse-info', { offset, windowSize });
      }
    }
  }, true);
  window.addEventListener('mousemove', (evt) => {
    if (!pipBtns && remote.getCurrentWindow()
      && remote.getCurrentWindow().getBrowserViews().length > 1) {
      if (pipTimer) clearTimeout(pipTimer);
      sendToHost('mousemove', 'isMoving');
    }
    if (mousedown) isDragging = true;
  }, true);
  window.addEventListener('click', (evt) => {
    if (isDragging && !pipBtns && offset) evt.stopImmediatePropagation();
    mousedown = false;
    isDragging = false;
    offset = null;
    windowSize = null;
    if (!pipBtns) sendToHost('update-mouse-info', { offset, windowSize });
  }, true);
  window.addEventListener('drop', (evt) => {
    evt.preventDefault();
    const files = Array.prototype.map.call(evt.dataTransfer.files, f => f.path);
    sendToHost('drop', { files });
  });
  window.addEventListener('dragover', (evt) => {
    evt.preventDefault();
    // evt.dataTransfer.dropEffect = process.platform === 'darwin' ? 'copy' : '';
    sendToHost('dragover', { dragover: true });
  });
  window.addEventListener('dragleave', (evt) => {
    evt.preventDefault();
    sendToHost('dragleave', { dragover: false });
  });
  window.addEventListener('keydown', (evt) => {
    if (pipBtns) {
      sendToHost('key-events', evt.keyCode);
    }
    if (document.webkitIsFullScreen && evt.keyCode === 27) {
      document.webkitCancelFullScreen();
    } else if (evt.keyCode === 80) {
      sendToHost('keydown', { targetName: evt.target.tagName });
    }
  });
  document.addEventListener('fullscreenchange', () => {
    sendToHost('fullscreenchange', { isFullScreen: document.webkitIsFullScreen });
  });
});

const oauthRegex = [
  /^https:\/\/passport.iqiyi.com\/apis\/thirdparty/i,
  /^https:\/\/api.weibo.com\/oauth2/i,
  /^https:\/\/graph.qq.com\//i,
  /^https:\/\/open.weixin.qq.com\//i,
  /^https:\/\/openapi.baidu.com\//i,
  /^https:\/\/auth.alipay.com\/login\//i,
  /^https:\/\/account.xiaomi.com\/pass\//i,
];

// Some websites intercept links to open a blank window, then set its location, e.g. iqiyi.com
const originWindowOpen = window.open.bind(window);
window.open = function customWindowOpen(url, strWindowName, strWindowFeatures) {
  if (url === 'about:blank') {
    return {
      set location(url) {
        if (url && url !== 'about:blank') customWindowOpen(url, strWindowName, strWindowFeatures);
      },
    };
  }

  if (oauthRegex.some(re => re.test(url))) {
    return originWindowOpen(url, strWindowName, strWindowFeatures);
  }

  sendToHost('open-url', { url });
  return {};
};
