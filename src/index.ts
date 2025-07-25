import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import { createInvoice, BillingWorkflowFormInputs } from './commands/createInvoice';
import { getMileageCache } from './services/mileageCache';
import { updateElectronApp } from 'update-electron-app';
import { Logger } from './utils/logger';
import { getUserDataPath } from './utils/paths';
import path from 'path';
import fs from 'fs';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// log version, environment, and platform
Logger.info(`Lakeshore Invoicer v${app.getVersion()}`);
Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
Logger.info(`Platform: ${process.platform} (${process.arch})`);

// Menu functions object
const MenuFunctions = {
  async openLogFolder(): Promise<void> {
    try {
      // Get the log file path from the Logger
      const logFilePath = Logger.getLogFilePath();
      // Get the directory containing the log file
      const logDir = path.dirname(logFilePath);
      // Open the log folder
      await shell.openPath(logDir);
    } catch (error) {
      console.error('Failed to open log folder:', error);
    }
  },

  async openMileageCacheFolder(): Promise<void> {
    try {
      const userDataPath = getUserDataPath();
      const dataDir = path.join(userDataPath, 'data');
      // Open the data folder containing the mileage cache database
      await shell.openPath(dataDir);
    } catch (error) {
      console.error('Failed to open mileage cache folder:', error);
    }
  },

  async openChangeLog(): Promise<void> {
    try {
      // Get user data path
      const userDataPath = getUserDataPath();
      
      // Create ChangeLog directory in user data
      const changelogDir = path.join(userDataPath, 'ChangeLog');
      if (!fs.existsSync(changelogDir)) {
        fs.mkdirSync(changelogDir, { recursive: true });
      }
      
      const changelogUserPath = path.join(changelogDir, 'changelog.md');
      
      // Try to copy from app resources if it doesn't exist in user data or if source is newer
      try {
        const appPath = app.getAppPath();
        const sourceChangelogPath = path.join(appPath, 'docs', 'changelog.md');
        
        // Check if source exists and copy it
        if (fs.existsSync(sourceChangelogPath)) {
          const sourceStats = fs.statSync(sourceChangelogPath);
          let shouldCopy = true;
          
          if (fs.existsSync(changelogUserPath)) {
            const userStats = fs.statSync(changelogUserPath);
            shouldCopy = sourceStats.mtime > userStats.mtime;
          }
          
          if (shouldCopy) {
            fs.copyFileSync(sourceChangelogPath, changelogUserPath);
          }
        }
      } catch (copyError) {
        console.log('Could not copy changelog from app resources:', copyError);
      }
      
      // If we still don't have the file, create a basic one
      if (!fs.existsSync(changelogUserPath)) {
        const defaultContent = `# Change Log\n\nChangelog not found in application resources.\nPlease check the application documentation for updates.`;
        fs.writeFileSync(changelogUserPath, defaultContent);
      }
      
      // Open the changelog file
      await shell.openPath(changelogUserPath);
    } catch (error) {
      console.error('Failed to open changelog:', error);
    }
  },

  showAboutDialog(): void {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'About Lakeshore Invoicer',
      message: `Lakeshore Invoicer v${app.getVersion()}`,
      detail: 'Transportation invoicing application',
    });
  }
};

// Setup macOS update checker
const setupMacUpdateChecker = async (): Promise<void> => {
  const { dialog } = require('electron');
  const https = require('https');
  
  const checkForUpdates = async (): Promise<void> => {
    try {
      Logger.info('Checking for updates on GitHub releases...');
      
      // Fetch latest release from GitHub API
      const options = {
        hostname: 'api.github.com',
        path: '/repos/mplefort/lakeshoretranspo-routegenie-client/releases/latest',
        method: 'GET',
        headers: {
          'User-Agent': 'Lakeshore-Invoicer-App'
        }
      };
      
      const req = https.request(options, (res: any) => {
        let data = '';
        
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const latestVersion = release.tag_name;
            const currentVersion = `v${app.getVersion()}`;
            
            Logger.info(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);
            
            if (latestVersion !== currentVersion) {
              Logger.info('New version available, showing update notification');
              
              // Show update notification dialog
              dialog.showMessageBox({
                type: 'info',
                title: 'Update Available',
                message: `A new version (${latestVersion}) is available!`,
                detail: `You are currently running ${currentVersion}. Would you like to download the latest version?`,
                buttons: ['Download Now', 'Remind Me Later', 'Skip This Version'],
                defaultId: 0,
                cancelId: 1
              }).then((result: { response: number }) => {
                if (result.response === 0) {
                  // Open GitHub releases page
                  shell.openExternal('https://github.com/mplefort/lakeshoretranspo-routegenie-client/releases');
                }
              });
            } else {
              Logger.info('Already running the latest version');
            }
          } catch (parseError) {
            Logger.error('Failed to parse GitHub API response:', parseError);
          }
        });
      });
      
      req.on('error', (error: any) => {
        Logger.error('Failed to check for updates:', error);
      });
      
      req.end();
    } catch (error) {
      Logger.error('Update check failed:', error);
    }
  };
  
  // Check for updates immediately
  await checkForUpdates();
  
  // Set up periodic update checks (every 6 hours)
  setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
};

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  // log that updates are enabled
  Logger.info('Update checks enabled');
  
  if (process.platform === 'darwin') {
    // On macOS, check for updates but don't auto-update due to signing requirements
    Logger.info('macOS detected - using manual update notification');
    setupMacUpdateChecker();
  } else {
    // On Windows and other platforms, use automatic updates
    updateElectronApp({
      updateInterval: '1 hour', // Check for updates every hour
      logger: require('electron-log')
    });
  }
} else {
  // In development mode, we don't want to check for updates
  Logger.info('Update checks disabled in development mode');
}


// Create application menu
const createApplicationMenu = (): void => {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu for macOS
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Show Logs',
          click: MenuFunctions.openLogFolder
        },
        {
          label: 'Mileage Cache DB',
          click: MenuFunctions.openMileageCacheFolder
        }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'About Lakeshore Invoicer',
          click: MenuFunctions.showAboutDialog
        },
        ...(process.platform === 'darwin' ? [{
          label: 'Check for Updates',
          click: async () => {
            // Manual update check for macOS
            setupMacUpdateChecker();
          }
        }] : []),
        {
          label: 'Change Log',
          click: MenuFunctions.openChangeLog
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
};

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1000,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    icon: process.platform === 'win32' ? 'src/img/LST_icon_win.ico' : 
          process.platform === 'darwin' ? 'src/img/LST_icon_mac.icns' : 
          'src/img/LST_icon_win.ico', // fallback for Linux
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
  // Create and set application menu
  createApplicationMenu();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Initialize logger with default location
  Logger.initialize(undefined, false);
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Set up IPC handlers
const setupIpcHandlers = () => {
  


  // Existing QB sync handler
  ipcMain.handle('qb:sync', async (event, data: any) => {
    console.log('QB sync requested:', data);
    // TODO: Implement QB sync logic
    // This will call your qbSync service
  });

  // Billing workflow handler
  ipcMain.handle('billingWorkflow:execute', async (event, inputs: BillingWorkflowFormInputs) => {
    console.log('Billing workflow requested:', inputs);
    try {
      const workflow = new createInvoice();
      const result = await workflow.runFromFormInputs(inputs);
      return result;
    } catch (error: any) {
      console.error('Billing workflow error:', error);
      return {
        success: false,
        message: `Workflow failed: ${error.message || error}`,
        outputDir: inputs.outputFolder
      };
    }
  });

  // Shell operations handler
  ipcMain.handle('shell:openFolder', async (event, folderPath: string) => {
    console.log('Opening folder:', folderPath);
    try {
      await shell.openPath(folderPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      throw error;
    }
  });

  // Open log folder handler
  ipcMain.handle('shell:openLogFolder', async () => {
    console.log('Opening log folder');
    await MenuFunctions.openLogFolder();
  });

  // Open mileage cache folder handler
  ipcMain.handle('shell:openMileageCacheFolder', async () => {
    console.log('Opening mileage cache folder');
    await MenuFunctions.openMileageCacheFolder();
  });

  // Mileage cache operations
  ipcMain.handle('mileageCache:getAllEntries', async () => {
    console.log('Getting all mileage cache entries');
    try {
      const mileageCache = getMileageCache();
      const rows = await mileageCache.getAllEntries();
      
      return { success: true, data: rows };
    } catch (error: any) {
      console.error('Error getting mileage cache entries:', error);
      return { success: false, message: error.message || String(error) };
    }
  });

  ipcMain.handle('mileageCache:updateEntries', async (event, entries: any[]) => {
    console.log('Updating mileage cache entries:', entries.length);
    try {
      const mileageCache = getMileageCache();
      await mileageCache.initialize();
      
      // Update each entry
      for (const entry of entries) {
        if (entry.id) {
          await mileageCache.updateCacheEntry(entry.id, {
            overwrite_miles: entry.overwrite_miles,
            overwrite_dead_miles: entry.overwrite_dead_miles
          });
        }
      }
      
      // Close the cache to trigger cloud sync
      await mileageCache.close();
      
      return { success: true, message: 'Entries updated successfully and synced to cloud' };
    } catch (error: any) {
      console.error('Error updating mileage cache entries:', error);
      return { success: false, message: error.message || String(error) };
    }
  });
};

// Set up IPC handlers before creating windows
setupIpcHandlers();