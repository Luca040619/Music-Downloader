import sys
import os
import io
import json
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError, ExtractorError
import logging

logging.basicConfig(filename='app.log', level=logging.DEBUG, encoding='utf-8')

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

if len(sys.argv) < 3:
    print("ERROR: [generic] URL o percorso ffmpeg non fornito.")
    sys.exit(1)

url = sys.argv[1] # L'URL viene passato come primo argomento
ffmpeg_path = sys.argv[2]

if url == '':
    print("ERROR: [generic] URL non fornito.")
    sys.exit(1)

# Carica il file di configurazione
with open('config.json', 'r') as config_file:
    config = json.load(config_file)

def progress_hook(d):
    if d['status'] == 'downloading':
        print(f"{d['_percent_str']} di download completato", flush=True)
    elif d['status'] == 'finished':
        print('100% di download completato', flush=True)
    if 'filename' in d:
        filename = os.path.basename(d['filename'])
        title = os.path.splitext(filename)[0]
        print(f"Titolo: {title}", flush=True)
    if 'info_dict' in d:
        info = d['info_dict']
        if 'playlist_index' in info and 'n_entries' in info:
            print(f"Playlist: {info['playlist_index']} / {info['n_entries']}", flush=True)

# Costruisce le opzioni di base per yt-dlp
ydl_opts = {
    'format': config['quality'],
    'postprocessors': [],
    'progress_hooks': [progress_hook],
    'concurrent_fragment_downloads': 4,
    'ffmpeg_location': ffmpeg_path,
    'extractor_args': {
        'youtube': {
            'player_client': ['ios', 'web']
        }
    }
}

# Aggiunge i postprocessor in base al tipo di download
if config['downloadType'] == 'audio':
    ydl_opts['postprocessors'].append({
        'key': 'FFmpegExtractAudio',
        'preferredcodec': config['audioFormat'],
        'preferredquality': '192'
    })
elif config['downloadType'] == 'video':
    ydl_opts['postprocessors'].append({
        'key': 'FFmpegVideoConvertor',
        'preferedformat': config['videoFormat']
    })

if config['embedSubtitles']:
    ydl_opts['writesubtitles'] = True
    ydl_opts['subtitleslangs'] = ['en']

# Controlla se l'URL è una playlist e ottieni il titolo della playlist se disponibile
def get_playlist_title(url):
    ydl_opts_temp = {
        'quiet': True,
        'extract_flat': True,
        'skip_download': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'web']
            }
        }
    }

    try:
        with YoutubeDL(ydl_opts_temp) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'entries' in info:
                return info.get("title", "Playlist")
            else:
                return None
    except DownloadError as e:
        print(f"Errore di download: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Errore imprevisto: {str(e)}")
        sys.exit(1)

try:
    playlist_title = get_playlist_title(url)
    if playlist_title:
        ydl_opts['outtmpl'] = os.path.join(config['savePath'], playlist_title, '%(title)s.%(ext)s')
    else:
        ydl_opts['outtmpl'] = os.path.join(config['savePath'], '%(title)s.%(ext)s')
    
    logging.debug('Download iniziato')
    
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
except DownloadError as e:
    print(f"ERROR: [generic] L'URL inserito e' invalido o non disponibile.")
    logging.error(f'Errore download: {e}')
except ExtractorError as e:
    print(f"Errore nell'estrazione dei dati dal video: {e}")
    logging.error(f'Errore estrazione: {e}')
except Exception as e:
    print(f"Errore imprevisto: {e}")
    logging.error(f'Errore generico: {e}')