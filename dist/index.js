"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const hello_1 = require("./services/hello");
const billingWorkflowInteractive_1 = require("./commands/billingWorkflowInteractive");
const update_electron_app_1 = require("update-electron-app");
const logger_1 = require("./utils/logger");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
// log version, environment, and platform
logger_1.Logger.info(`Lakeshore Invoicer v${electron_1.app.getVersion()}`);
logger_1.Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger_1.Logger.info(`Platform: ${process.platform} (${process.arch})`);
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    // log that updates are enabled
    logger_1.Logger.info('Update checks enabled');
    (0, update_electron_app_1.updateElectronApp)({
        updateInterval: '1 hour',
        logger: require('electron-log')
    });
}
else {
    // In development mode, we don't want to check for updates
    logger_1.Logger.info('Update checks disabled in development mode');
}
// Create application menu
const createApplicationMenu = () => {
    const isMac = process.platform === 'darwin';
    const template = [
        // App menu for macOS
        ...(isMac ? [{
                label: electron_1.app.getName(),
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
                    click: () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            // Get the log file path from the Logger
                            const logFilePath = logger_1.Logger.getLogFilePath();
                            // Get the directory containing the log file
                            const logDir = require('path').dirname(logFilePath);
                            // Open the log folder
                            yield electron_1.shell.openPath(logDir);
                        }
                        catch (error) {
                            console.error('Failed to open log folder:', error);
                        }
                    })
                },
                {
                    label: 'Mileage Cache DB',
                    click: () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            // Get the mileage cache database path
                            const path = require('path');
                            const os = require('os');
                            // Get user data path (same logic as in mileageCache.ts)
                            let userDataPath;
                            try {
                                userDataPath = electron_1.app.getPath('userData');
                            }
                            catch (error) {
                                // Fallback to OS-specific user data directories
                                const appName = 'lakeshore-invoicer';
                                switch (process.platform) {
                                    case 'win32':
                                        userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName);
                                        break;
                                    case 'darwin':
                                        userDataPath = path.join(os.homedir(), 'Library', 'Application Support', appName);
                                        break;
                                    case 'linux':
                                        userDataPath = path.join(os.homedir(), '.config', appName);
                                        break;
                                    default:
                                        userDataPath = path.join(os.homedir(), `.${appName}`);
                                }
                            }
                            const dataDir = path.join(userDataPath, 'data');
                            // Open the data folder containing the mileage cache database
                            yield electron_1.shell.openPath(dataDir);
                        }
                        catch (error) {
                            console.error('Failed to open mileage cache folder:', error);
                        }
                    })
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
                    click: () => __awaiter(void 0, void 0, void 0, function* () {
                        // You can add an about dialog here if needed
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'About Lakeshore Invoicer',
                            message: `Lakeshore Invoicer v${electron_1.app.getVersion()}`,
                            detail: 'Transportation invoicing application',
                        });
                    })
                }
            ]
        }
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        height: 600,
        width: 800,
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
electron_1.app.on('ready', () => {
    // Initialize logger with default location
    logger_1.Logger.initialize(undefined, false);
    createWindow();
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
// Set up IPC handlers
const setupIpcHandlers = () => {
    // Hello service IPC handlers
    electron_1.ipcMain.handle('hello:getMessage', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Hello message requested');
        return hello_1.HelloService.getHelloMessage();
    }));
    electron_1.ipcMain.handle('hello:getCustomMessage', (event, name) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Custom hello message requested for:', name);
        return hello_1.HelloService.getCustomMessage(name);
    }));
    // Existing QB sync handler
    electron_1.ipcMain.handle('qb:sync', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('QB sync requested:', data);
        // TODO: Implement QB sync logic
        // This will call your qbSync service
    }));
    // Billing workflow handler
    electron_1.ipcMain.handle('billingWorkflow:execute', (event, inputs) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Billing workflow requested:', inputs);
        try {
            const workflow = new billingWorkflowInteractive_1.BillingWorkflowInteractive();
            const result = yield workflow.runFromFormInputs(inputs);
            return result;
        }
        catch (error) {
            console.error('Billing workflow error:', error);
            return {
                success: false,
                message: `Workflow failed: ${error.message || error}`,
                outputDir: inputs.outputFolder
            };
        }
    }));
    // Shell operations handler
    electron_1.ipcMain.handle('shell:openFolder', (event, folderPath) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Opening folder:', folderPath);
        try {
            yield electron_1.shell.openPath(folderPath);
        }
        catch (error) {
            console.error('Failed to open folder:', error);
            throw error;
        }
    }));
    // Open log folder handler
    electron_1.ipcMain.handle('shell:openLogFolder', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Opening log folder');
        try {
            // Get the log file path from the Logger
            const logFilePath = logger_1.Logger.getLogFilePath();
            // Get the directory containing the log file
            const logDir = require('path').dirname(logFilePath);
            // Open the log folder
            yield electron_1.shell.openPath(logDir);
        }
        catch (error) {
            console.error('Failed to open log folder:', error);
            throw error;
        }
    }));
    // Open mileage cache folder handler
    electron_1.ipcMain.handle('shell:openMileageCacheFolder', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Opening mileage cache folder');
        try {
            const path = require('path');
            const os = require('os');
            // Get user data path (same logic as in mileageCache.ts)
            let userDataPath;
            try {
                userDataPath = electron_1.app.getPath('userData');
            }
            catch (error) {
                // Fallback to OS-specific user data directories
                const appName = 'lakeshore-invoicer';
                switch (process.platform) {
                    case 'win32':
                        userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName);
                        break;
                    case 'darwin':
                        userDataPath = path.join(os.homedir(), 'Library', 'Application Support', appName);
                        break;
                    case 'linux':
                        userDataPath = path.join(os.homedir(), '.config', appName);
                        break;
                    default:
                        userDataPath = path.join(os.homedir(), `.${appName}`);
                }
            }
            const dataDir = path.join(userDataPath, 'data');
            // Open the data folder containing the mileage cache database
            yield electron_1.shell.openPath(dataDir);
        }
        catch (error) {
            console.error('Failed to open mileage cache folder:', error);
            throw error;
        }
    }));
};
// Set up IPC handlers before creating windows
setupIpcHandlers();
//# sourceMappingURL=index.js.map