
# Music Downloader

## Overview

**Music Downloader** is an Electron-based application that interfaces with yt-dlp through Python, allowing you to download playlists and individual tracks from YouTube and SoundCloud. Future updates will include support for additional platforms. The app provides customizable settings to tailor the download experience to your preferences.

## Features

- Download playlists and individual tracks from YouTube and SoundCloud
- Future support for additional platforms
- Customizable download settings

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Luca040619/music-downloader.git
    ```
2. Navigate to the project directory:
    ```bash
    cd music-downloader
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

To start the application, run:
```bash
npm start
```

## Download Script

The main script responsible for downloading songs is located at `python/download_songs.py`. This script handles the interaction with yt-dlp to fetch and download the requested media.

## Configuration

Even though it is not the primary intention of the app, you can further customize your download experience by modifying the `config.json` file. This file allows you to adjust various settings according to your preferences.

## Note on python

An embedded version of python is included in the executable. For development purposes, you need to remove the python path and eventually the ffmpeg path in `main.js` to use your local environment.

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.
