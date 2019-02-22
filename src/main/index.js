import {
  app,
  BrowserWindow,
  nativeImage
} from 'electron'


const electron = require('electron');

const path = require('path');

const {version} =require('../../package.json')

import { autoUpdater } from 'electron-updater'


// 在主进程中通信组件.
const {
  ipcMain
} = require('electron')

const {
  setOnCurrentSpace
} = require('../wallpaper/outwallpaper.js')

const {
  downloadPic
} = require('../file/file2.js'); //这里面不能引入promise的相关对象

import {
  open_autoStart,
  open_disStart,
  open_type
} from '../file/open-start.js'



const get_urls = require('../get-image/search.js').get_urls


const {hideChildrenWindow,showChildrenWinndow}=require('./info-win.js')


import {newEmail} from './mail.js'






// var menubar = require('menubar')


// var mb = menubar()

// mb.on('ready', function ready() {
//   console.log('app is ready')
//   // your app code here
// })


//用一个 Tray 来表示一个图标,这个图标处于正在运行的系统的通知区 ，通常被添加到一个 context menu 上.
const Menu = electron.Menu;
const Tray = electron.Tray;

//托盘对象
var appTray = null;



/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow = null;
const winURL = process.env.NODE_ENV === 'development' ?
  `http://localhost:9080` :
  `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    // width: 280,
    width: 800,
    frame: false,
    transparent: true,
    resizable:false,     //禁止变化尺寸
    hasShadow: false, //是否阴影
    thickFrame: false,
    scrollBounce: true,
    backgroundColor: '#222',
    alwaysOnTop:true,
    focusable:true,
    fullscreenable:false,
    skipTaskbar:true,
    hasShadow:true,
    vibrancy:'medium-light',
  })


  mainWindow.openDevTools();



  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  mainWindow.on('blur', () => {
      mainWindow.hide();
  }); 
}

function createAppTray() {


  createWindow();

  mainWindow.hide();

  appTray = new Tray(path.resolve(__static, './img/tray.png'));

  //系统托盘图标目录
  appTray.on('click', () => {
    // mainWindow === null ? createWindow() : mainWindow.close();
    // return;
    // 点击时显示窗口，并修改窗口的显示位置
    const {
      screen
    } = electron;
    const {
      width,
      height
    } = screen.getPrimaryDisplay().workAreaSize;

    console.log(width, height)

    const WINDOW_WIDTH = mainWindow.getSize()[0];
    const WINDOW_HEIGHT = mainWindow.getSize()[1];
    const HORIZ_PADDING = 15;
    const VERT_PADDING = 15;

    const cursorPosition = screen.getCursorScreenPoint();

    // console.log(cursorPosition,mainWindow.getSize())

    const primarySize = screen.getPrimaryDisplay().workAreaSize;
    const trayPositionVert = cursorPosition.y >= primarySize.height / 2 ? 'bottom' : 'top';
    const trayPositionHoriz = cursorPosition.x >= primarySize.width / 2 ? 'right' : 'left';

    mainWindow.setPosition(getTrayPosX(), getTrayPosY());

    if (mainWindow.isVisible()) {
      mainWindow.webContents.send('datainfo', {
        type: 'windowShow',
        data: false
      })
      mainWindow.hide();
    } else {
      mainWindow.webContents.send('datainfo', {
        type: 'windowShow',
        data: true
      })
      mainWindow.show();
    }
    // 计算位置
    function getTrayPosX() {
      const horizBounds = {
        left: cursorPosition.x - (WINDOW_WIDTH / 2),
        right: cursorPosition.x + (WINDOW_WIDTH / 2)
      };
      if (trayPositionHoriz === 'left') {
        return horizBounds.left <= HORIZ_PADDING ? HORIZ_PADDING : horizBounds.left;
      }
      return horizBounds.right >= primarySize.width ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH : horizBounds.right - WINDOW_WIDTH;
    }

    function getTrayPosY() {
      return trayPositionVert === 'bottom' ? cursorPosition.y - WINDOW_HEIGHT - VERT_PADDING : cursorPosition.y + VERT_PADDING;
    }
    return;

  })

  mainWindow.on('show', () => {
    appTray.setHighlightMode('never')
  })
  mainWindow.on('hide', () => {
    appTray.setHighlightMode('selection')    
  })

  //图标的上下文菜单
  // const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  //设置此托盘图标的悬停提示内容
  // appTray.setToolTip('This is my application.');

  // appTray.popUpContextMenu(mainWindow)


  //设置此图标的上下文菜单
  // appTray.setContextMenu(contextMenu);

}

app.dock.hide(); //隐藏dock


app.on('ready', function () {
  createAppTray();
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createAppTray();
  }
})


ipcMain.on('dataWallpaper', (event, arg) => {
  downloadPic(arg.downloadUrl, function (result) {
    setOnCurrentSpace(result);
    event.sender.send('dataWallpaper', 'success');
  });
})

ipcMain.on('getImageUrls', (event, data) => {
  get_urls(data).then(result => {
    mainWindow.webContents.send('datainfo', {
      type: 'urls',
      data: result
    })
  })
  console.log(data);
})

ipcMain.on('btn', (event, data) => {
  console.log(data);
  if (data.type == 'quit') {
    app.quit();
  } else if (data.type == 'searchKey') {

  } 
  else if (data.type == 'openStart') {
    if (data.data) {
      open_autoStart();
    } else {
      open_disStart();
    }
  }
  else if(data.type=='openChildren'){
    if(data.data){
      showChildrenWinndow()
    }
    else{
      hideChildrenWindow()
    }
  }
  else if(data.type=='newEmail'){
    newEmail(data.data.html,data.data.telUser,{
      version:version,
    }).then(result=>{
      event.sender.send('sendnewEmail', 'success');
    }).catch(error=>{
      event.sender.send('sendnewEmail', 'error',error);
    })
  }
  else if(data.type=='check_newVersion'){
    autoUpdater.checkForUpdates()
  }
})




/*** 下载完成 */
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

/***检查更新 */

const uploadUrl = "http://172.16.10.106:18989/static/version/"; // 下载地址，不加后面的.exe

autoUpdater.setFeedURL(uploadUrl);

autoUpdater.on('error', function (info) {
  mainWindow.webContents.send('check_newVersion', {'type':'error',data:info});
  console.log('-------------');
  // console.log(info)
});
autoUpdater.on('update-available', function (info) {
  console.log('检测到新版本',info);
  mainWindow.webContents.send('check_newVersion', {'type':'avai',data:info});

});


autoUpdater.on('update-not-available', function (info) {
  console.log('没有检测到新版本',info);
  mainWindow.webContents.send('check_newVersion', {'type':'noavai',data:info});

});


//更新下载进度
autoUpdater.on('download-progress', function (progressObj) {
  mainWindow.webContents.send('downloadProgress', progressObj)
})

// app.on('ready', () => {
//   if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
// })
