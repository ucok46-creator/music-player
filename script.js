const DAFTAR_LAGU = [
  { name: "Shape Of My Heart", 
    artist: "Backstreet Boys", 
    url: "./music/Shape Of My Heart.mp3.mp3", 
    coverUrl: "./covers/1289871.jpg" 
},
  { name: "Risk It All", 
    artist: "Bruno Mars", 
    url: "./music/Risk It All.mp3.mp3", 
    coverUrl: "./covers/risk_it_all.jpg" },
];

// =============================================
// AMBIL ELEMEN DOM YANG DIPERLUKAN
// =============================================
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const progressFill = document.getElementById('progressFill');
const progressBg = document.getElementById('progressBg');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const songTitleEl = document.getElementById('songTitle');
const songArtistEl = document.getElementById('songArtist');
const trackListEl = document.getElementById('trackList');
const albumArt = document.getElementById('albumArt');
const albumEmoji = document.getElementById('albumEmoji');
const heartBtn = document.getElementById('heartBtn');
const bgBlur = document.getElementById('bgBlur');
const bgColor = document.getElementById('bgColor');

// =============================================
// VARIABEL GLOBAL
// =============================================
let tracks = [];          // menyimpan semua objek lagu (metadata, url, cover)
let currentIndex = 0;     // indeks lagu yang sedang aktif
let isPlaying = false;    // status pemutaran
let shuffle = false;      // mode acak
let repeat = false;       // mode ulang satu lagu
let liked = false;        // status like untuk lagu saat ini

// Kumpulan emoji & gradasi untuk fallback jika tidak ada cover
const emojis = ['🎸','🎹','🎺','🎻','🥁','🎷','🎵','🎶','🎤','🎙️'];
const gradients = [
  '#1a0e2c','#0e1a2c','#2c0e1a','#0e2c1a','#2c1a0e','#2c0e0e','#1a2c0e'
];

// =============================================
// FUNGSI BANTU
// =============================================
// Format detik menjadi MM:SS
function formatTime(s) {
  if (isNaN(s)) return '0:00';
  return Math.floor(s/60) + ':' + (Math.floor(s%60)<10?'0':'') + Math.floor(s%60);
}

// Update background dinamis (blur dari cover lagu)
function updateBackground(coverUrl) {
  if (coverUrl) {
    bgBlur.style.backgroundImage = `url('${coverUrl}')`;
    bgBlur.classList.add('active');
  } else {
    bgBlur.classList.remove('active');
  }
}

// Render daftar putar (playlist) ke dalam DOM
function renderPlaylist() {
  trackListEl.innerHTML = '';
  if (!tracks.length) {
    trackListEl.innerHTML = '<div class="empty-msg">Belum ada lagu!</div>';
    return;
  }
  tracks.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'track-item' + (i === currentIndex ? ' active' : '');
    const numClass = (i === currentIndex && isPlaying) ? 'track-num now-playing' : 'track-num';
    const numContent = (i === currentIndex && isPlaying) ? '♪' : (i+1);
    div.innerHTML = `
      <div class="${numClass}">${numContent}</div>
      <div class="track-info">
        <div class="track-name">${escapeHtml(t.name)}</div>
        <div class="track-artist">${escapeHtml(t.artist)}</div>
      </div>`;
    div.addEventListener('click', () => { loadTrack(i); play(); });
    trackListEl.appendChild(div);
  });
}

// Mencegah XSS pada nama/artis lagu
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// =============================================
// FUNGSI INTI PEMUTAR
// =============================================
// Memuat lagu berdasarkan indeks
function loadTrack(idx) {
  if (idx < 0 || idx >= tracks.length) return;
  currentIndex = idx;
  const t = tracks[idx];

  audio.src = t.url;
  songTitleEl.textContent = t.name;
  songArtistEl.textContent = t.artist;

  // Tampilkan cover jika ada, kalau tidak pakai gradasi + emoji
  if (t.coverUrl) {
    albumArt.style.background = `url('${t.coverUrl}') center/cover no-repeat`;
    albumArt.classList.add('has-cover');
  } else {
    albumArt.style.background = `linear-gradient(145deg, ${t.gradient}, #333)`;
    albumArt.classList.remove('has-cover');
    albumEmoji.textContent = t.emoji;
  }

  updateBackground(t.coverUrl);

  // Reset like dan progress bar
  liked = false;
  heartBtn.textContent = '♡';
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  totalTimeEl.textContent = '0:00';

  audio.load();
  renderPlaylist();
}

function play() {
  if (!tracks.length) return;
  audio.play();
  isPlaying = true;
  playBtn.textContent = '⏸';
  albumArt.classList.add('playing');
  renderPlaylist();
}

function pause() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = '▶';
  albumArt.classList.remove('playing');
  renderPlaylist();
}

function togglePlay() {
  if (!tracks.length) return;
  isPlaying ? pause() : play();
}

// Lagu berikutnya (memperhatikan mode shuffle)
function nextTrack() {
  if (!tracks.length) return;
  let next = shuffle
    ? (() => { let n; do { n = Math.floor(Math.random()*tracks.length); } while (tracks.length>1 && n===currentIndex); return n; })()
    : (currentIndex + 1) % tracks.length;
  loadTrack(next);
  if (isPlaying) play();
}

// Lagu sebelumnya (jika dalam 3 detik pertama, pindah lagu; jika lebih dari 3 detik, reset ke awal)
function prevTrack() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  loadTrack((currentIndex - 1 + tracks.length) % tracks.length);
  if (isPlaying) play();
}

function toggleShuffle() {
  shuffle = !shuffle;
  document.getElementById('shuffleBtn').style.opacity = shuffle ? '1' : '0.35';
}

function toggleRepeat() {
  repeat = !repeat;
  document.getElementById('repeatBtn').style.opacity = repeat ? '1' : '0.35';
}

function toggleHeart() {
  liked = !liked;
  heartBtn.textContent = liked ? '♥' : '♡';
}

function setVolume(v) {
  audio.volume = parseFloat(v);
}

// =============================================
// FUNGSI UPLOAD LAGU MANUAL (MP3/WAV)
// =============================================
function addTracksFromUpload(input) {
  const files = Array.from(input.files);
  const isFirst = tracks.length === 0;
  let loaded = 0;

  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const idx = tracks.length;
    tracks.push({
      name: file.name.replace(/\.[^/.]+$/, ''),  // hapus ekstensi
      artist: 'Lokal',
      url, coverUrl: null,
      emoji: emojis[idx % emojis.length],
      gradient: gradients[idx % gradients.length],
    });

    // Baca metadata (cover, judul, artis) dari file lokal
    jsmediatags.read(file, {
      onSuccess(tag) {
        const tags = tag.tags;
        if (tags.title) tracks[idx].name = tags.title;
        if (tags.artist) tracks[idx].artist = tags.artist;
        if (tags.picture) {
          const pic = tags.picture;
          const bytes = new Uint8Array(pic.data);
          let bin = '';
          bytes.forEach(b => bin += String.fromCharCode(b));
          tracks[idx].coverUrl = `data:${pic.format};base64,${btoa(bin)}`;
        }
        loaded++;
        renderPlaylist();
        if (isFirst && loaded === 1) loadTrack(0);
      },
      onError() {
        loaded++;
        renderPlaylist();
        if (isFirst && loaded === 1) loadTrack(0);
      }
    });
  });
  input.value = ''; // reset input
}

// =============================================
// INISIALISASI LAGU DARI DAFTAR_LAGU (BAWAAN)
// =============================================
function initHardcodedTracks() {
  if (DAFTAR_LAGU.length === 0) {
    trackListEl.innerHTML = '<div class="empty-msg">Belum ada lagu — isi DAFTAR_LAGU dulu!</div>';
    return;
  }

  // Masukkan semua lagu dari DAFTAR_LAGU ke array tracks
  DAFTAR_LAGU.forEach((item, i) => {
    tracks.push({
      name: item.name, artist: item.artist, url: item.url,
      coverUrl: item.coverUrl || null,  // Gunakan coverUrl dari DAFTAR_LAGU jika ada
      emoji: emojis[i % emojis.length],
      gradient: gradients[i % gradients.length],
    });
  });

  renderPlaylist();
  loadTrack(0);

  // Setelah itu, baca metadata (cover, judul, artis) dari setiap file MP3 secara asinkron
  DAFTAR_LAGU.forEach((item, i) => {
    fetch(item.url)
      .then(r => r.blob())
      .then(blob => {
        jsmediatags.read(blob, {
          onSuccess(tag) {
            const tags = tag.tags;
            if (tags.title) tracks[i].name = tags.title;
            if (tags.artist) tracks[i].artist = tags.artist;
            if (tags.picture) {
              const pic = tags.picture;
              const bytes = new Uint8Array(pic.data);
              let bin = '';
              bytes.forEach(b => bin += String.fromCharCode(b));
              tracks[i].coverUrl = `data:${pic.format};base64,${btoa(bin)}`;
            }
            renderPlaylist();
            if (i === currentIndex) loadTrack(i);
          },
          onError() {}
        });
      })
      .catch(() => {});
  });
}

// Klik pada progress bar untuk melompati waktu lagu
progressBg.addEventListener('click', e => {
  if (!audio.duration) return;
  const rect = progressBg.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

// Update progress bar dan label waktu setiap kali timeupdate
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
});

// Ketika lagu selesai, ulang jika mode repeat menyala, atau lanjut ke lagu berikutnya
audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    play();
  } else {
    nextTrack();
  }
});

// =============================================
// ATURAN AWAL
// =============================================
document.getElementById('shuffleBtn').style.opacity = '0.35';
document.getElementById('repeatBtn').style.opacity = '0.35';
audio.volume = 0.8;

// Event listeners untuk tombol kontrol
playBtn.addEventListener('click', togglePlay);
document.getElementById('prevBtn').addEventListener('click', prevTrack);
document.getElementById('nextBtn').addEventListener('click', nextTrack);
document.getElementById('shuffleBtn').addEventListener('click', toggleShuffle);
document.getElementById('repeatBtn').addEventListener('click', toggleRepeat);
heartBtn.addEventListener('click', toggleHeart);
document.getElementById('volSlider').addEventListener('input', (e) => setVolume(e.target.value));

// Mulai aplikasi
initHardcodedTracks();