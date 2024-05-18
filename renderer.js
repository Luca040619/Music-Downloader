const { ipcRenderer } = require('electron');

let playlistProgressShown = false;

document.getElementById('dataForm').addEventListener('submit', function (event) {
    event.preventDefault();

    resetUI();
    const videoUrl = document.getElementById('inputField').value;
    ipcRenderer.send('download-video', videoUrl);
});

ipcRenderer.on('download-progress', (event, data) => {
    updateUI(data);
});

ipcRenderer.on('download-error', (event, error) => {
    showError(error);
});

ipcRenderer.on('download-complete', (event, message) => {
    completeUI(message);
});

function resetUI() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    progressBar.textContent = '';
    document.getElementById('songTitle').textContent = 'Caricamento...';
    document.getElementById('spinner').style.display = "block";
    document.getElementById('error').style.display = "none";
    document.getElementById('status-container').style.display = "none";
    document.getElementById('stopDownload').disabled = false;
    document.getElementById('scarica').disabled = true;
    document.getElementById('playlistProgress').style.display = "none";
    playlistProgressShown = false;
}

function updateUI(data) {
    document.getElementById('spinner').style.display = "none";
    document.getElementById('status-container').style.display = "block";

    const message = data.toString();
    const progressBar = document.getElementById('progressBar');
    const songTitle = document.getElementById('songTitle');
    const playlistProgress = document.getElementById('playlistProgress');
    const errorElement = document.getElementById('error');

    if (message.includes('ERROR:')) {
        handleError(message);
        return;
    }

    const percentMatch = message.match(/(\d+(\.\d+)?%) di download completato/);
    if (percentMatch) {
        const percent = percentMatch[1];
        progressBar.style.width = percent;
        progressBar.textContent = percent;
    }

    const titleMatch = message.match(/Titolo: (.*)/);
    if (titleMatch) {
        songTitle.textContent = `Scaricando: ${titleMatch[1]}`;
    }

    const playlistMatch = message.match(/Playlist: (\d+) \/ (\d+)/);
    if (playlistMatch) {
        playlistProgress.textContent = `Progresso Playlist: ${playlistMatch[1]} di ${playlistMatch[2]}`;
        if (!playlistProgressShown) {
            playlistProgress.style.display = 'block';
            playlistProgressShown = true;
        }
    }

    if (message.includes('Errore')) {
        progressBar.style.width = '0%';
        progressBar.textContent = 'Errore';
    }

    if (message.includes('Download completato')) {
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
    }
}

function handleError(message) {
    const errorMatch = message.match(/ERROR: \[generic\] (.*)/);
    if (errorMatch) {
        const errorElement = document.getElementById('error');
        errorElement.style.display = 'block';
        errorElement.textContent = `Errore: ${errorMatch[1].trim()}`;
    }
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    progressBar.textContent = 'Errore';
    document.getElementById('status-container').style.display = "none";
}

function showError(error) {
    alert(`Errore di download: ${error}`);
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    progressBar.textContent = 'Errore: ' + error;
    document.getElementById('scarica').disabled = false;
    document.getElementById('stopDownload').disabled = true;
}

function completeUI(message) {
    const progressBar = document.getElementById('progressBar');
    progressBar.textContent = 'Download completato!';
    document.getElementById('playlistProgress').style.display = 'none';
    playlistProgressShown = false;
    document.getElementById('inputField').value = '';
    document.getElementById('scarica').disabled = false;
    document.getElementById('stopDownload').disabled = true;
}