// tutorial bookmark
// https://youtu.be/kN1Czs0m1SU?t=48m35s
const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const url = require('url');
const path = require('path'); 

let mainWin; // the main window
let addwin;  

function createWindow() { 

   mainWin = new BrowserWindow({width: 800, height: 600}) 
   mainWin.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'index.html'), 
      protocol: 'file:', 
      slashes: true 
   }));

   mainWin.on('closed', function(){app.quit();});
   let main_menu = Menu.buildFromTemplate(menu_template);
   Menu.setApplicationMenu(main_menu);
};

function createAddWin(){
   addwin = new BrowserWindow({width: 300, 
   								height: 200, 
   								title: 'add ingredient'}) 
   addwin.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'addwin.html'), 
      protocol: 'file:', 
      slashes: true 
   }));
   addwin.on('close', function(){addwin = null;});
};

ipcMain.on('item:add', function(ev, item){
	console.log(item);
	mainWin.webContents.send('item:add', item);
	addwin.close();
})

const menu_template = [
	{
		label: 'File',
		submenu: [
			{label: 'add stuff', 
			click(){createAddWin();}},
			{label: 'chuck stuff',
			click(){
				mainWin.webContents.send('clear:items');
				}
			},
			{label: 'quit',
			accelerator: process.platform == 'darwin' ? 'Command+Q' :
				'Ctrl+Q',
			click(){app.quit();}}
		]
	}
] 

if (process.env.NODE_ENV !== 'production'){
	menu_template.push(
		{
			label: 'Dev',
			submenu: [
				{ label: 'Dev toolz',
				accelerator: process.platform == 'darwin' ? 'Command+I' :
							'Ctrl+I',
				click(item, focusedWindow){focusedWindow.toggleDevTools();}
				},
				{
				role: 'reload'	
				}]
		}
	);
};


app.on('ready', createWindow)