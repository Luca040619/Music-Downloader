const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let downloader = null; // Variabile per tenere traccia del processo di download
let isDownloading = false;
let playlistTitle = ''; // Variabile per tenere traccia del titolo della playlist

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 460,
        minWidth: 700,
        minHeight: 460,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    Menu.setApplicationMenu(null);
    win.loadFile('index.html');

    if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools();
    }

    ipcMain.on('download-video', (event, videoUrl) => {
        // Assicurati che non ci siano altri download in corso
        if (isDownloading) {
            event.reply('download-status', 'Un download è già in corso');
            return;
        }

        playlistTitle = ''; // Svuota il titolo di vecchie playlist se rimasto in memoria

        const pythonPath = path.join(process.resourcesPath, 'python', 'python.exe');
        const scriptPath = path.join(process.resourcesPath, 'python', 'download_songs.py');
        const ffmpegPath = path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe');

        const command = `"${pythonPath}" "${scriptPath}" "${videoUrl}" "${ffmpegPath}"`;
        downloader = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                win.webContents.send('error-message', `Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                win.webContents.send('error-message', `Stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
        });

        isDownloading = true;

        downloader.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            win.webContents.send('download-progress', data.toString());

            // Estrarre il nome della playlist dai log di output in tempo reale
            const playlistRegex = /\[download\] Downloading playlist: (.*)/;
            const match = data.toString().match(playlistRegex);
            if (match) {
                playlistTitle = match[1].trim();
                win.webContents.send('playlist-name', `${playlistTitle}`);
            }
        });

        downloader.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        downloader.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            isDownloading = false;
            win.webContents.send('download-complete', 'Download completato');
        });
    });

    const treeKill = require('tree-kill');

    ipcMain.handle('stop-download', () => {
        if (downloader) {
            treeKill(downloader.pid, 'SIGTERM', (err) => {
                if (err) {
                    console.error(`Error when trying to stop the downloader: ${err}`);
                } else {
                    win.webContents.send('download-stopped', 'Download interrotto dall\'utente.');

                    // Eliminare la cartella della playlist
                    if (playlistTitle) {
                        const configPath = path.join(__dirname, 'config.json');
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        const playlistPath = path.join(config.savePath, playlistTitle);

                        fs.rm(playlistPath, { recursive: true, force: true }, (err) => {
                            if (err) {
                                console.error(`Error when trying to delete playlist folder: ${err}`);
                            } else {
                                console.log(`Playlist folder ${playlistPath} deleted successfully.`);
                                playlistTitle = ''; // Svuotare la variabile col nome della playlist
                            }
                        });
                    }
                }
            });
        }
    });

    ipcMain.handle('select-directory', async (event) => {
        const { filePaths } = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        });
        if (filePaths.length > 0) {
            const configPath = path.join('config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config.savePath = filePaths[0];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            return filePaths[0];
        }
    });

    ipcMain.handle('open-directory', async (event) => {
        const configPath = path.join('config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        require('child_process').exec(`start "" "${config.savePath}"`);
    });
}

function checkAndCreateConfig() {
    const configPath = 'config.json';
    const defaultConfig = {
        savePath: path.join(app.getPath('downloads'), 'music_downloader'),
        quality: 'bestaudio',
        downloadType: 'audio',
        audioFormat: 'mp3',
        videoFormat: 'mp4',
        embedSubtitles: false,
        downloadPlaylist: true,
    };

    // Controlla se il file config.json esiste
    if (!fs.existsSync(configPath)) {
        // Se non esiste, crea il file con le impostazioni di default
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }

    const config = require('./config.json');
    ensureDirectoryExistence(config.savePath);
}

function ensureDirectoryExistence(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
    }
}

app.whenReady().then(() => {
    createWindow();
    checkAndCreateConfig(); // Verifica e crea il config.json se necessario
});
