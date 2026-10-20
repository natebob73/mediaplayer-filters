// Regenerates index.json from the files in movie/, episode/, imdb/ and tv/. Run after adding or removing maps:
//   node build-index.js
// Accepted files (an optional tag before the extension is allowed, e.g. tt0133093.language.edl):
//   movie/<tmdbId>.<ext>     episode/<tmdbEpisodeId>.<ext>     imdb/<tt1234567>.<ext>
//   tv/<imdb|tmdb|tvdb>-<showId>/S01E02.<ext>     (a TV episode by its show's id + season/episode)
//   <ext> = json (MediaPlayer or CleanStream format), mcf (MovieContentFilter), skp (VideoSkip), edl (Kodi/MPlayer),
//           srt / vtt / ass (subtitles: scanned for language and added to whatever map is used)
// All files a repo has for the same title are merged. Repos always win over community sources.
// Optional: put a display name in index.json's "name" (kept when regenerating).
const fs = require('fs');
const path = require('path');

const maps = [];
const problems = [];
const EXT = /^(.+?)(\.[^.]+)?\.(json|mcf|skp|edl|srt|vtt|ass|ssa)$/i;

function check(rel, ext) {
  const body = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  if (ext === 'json') {
    const data = JSON.parse(body);
    const list = data.cues || data.segments;
    if (!Array.isArray(list) || !list.length) throw new Error('no "cues" (or "segments") list');
    for (const c of data.cues || []) {
      if (!(c.end > c.start)) throw new Error(`cue end must be after start: ${JSON.stringify(c)}`);
      if (!['mute', 'skip', 'blur'].includes(c.action)) throw new Error(`bad action "${c.action}"`);
    }
  } else if (ext === 'mcf') {
    if (!/^WEBVTT MovieContentFilter/.test(body)) throw new Error('missing "WEBVTT MovieContentFilter" header');
  } else if (ext === 'skp') {
    if (!body.includes('-->')) throw new Error('no "start --> end" cues');
  } else if (['srt', 'vtt', 'ass', 'ssa'].includes(ext)) {
    if (!body.includes('-->') && !body.includes('Dialogue:')) throw new Error('not a subtitle file');
  } else if (ext === 'edl') {
    if (!/^\s*[\d.:]+\s+[\d.:]+\s+[0-3]\s*$/m.test(body)) throw new Error('no "start end 0|1" lines');
  }
}

// TV episodes by show: tv/<imdb|tmdb|tvdb>-<id>/S01E02[.tag].<ext>
const tvRoot = path.join(__dirname, 'tv');
if (fs.existsSync(tvRoot)) {
  for (const show of fs.readdirSync(tvRoot)) {
    const showDir = path.join(tvRoot, show);
    if (!fs.statSync(showDir).isDirectory()) continue;
    if (!/^(imdb-tt\d+|tmdb-\d+|tvdb-\d+)$/i.test(show)) {
      problems.push(`tv/${show}/: folder must be named imdb-tt1234567, tmdb-1234 or tvdb-1234`);
      continue;
    }
    for (const f of fs.readdirSync(showDir)) {
      const m = f.match(EXT);
      if (!m) continue;
      if (!/^S\d+E\d+$/i.test(m[1])) {
        problems.push(`tv/${show}/${f}: name must start with S01E02`);
        continue;
      }
      try {
        check(`tv/${show}/${f}`, m[3].toLowerCase());
        maps.push(`tv/${show}/${f}`);
      } catch (e) {
        problems.push(`tv/${show}/${f}: ${e.message}`);
      }
    }
  }
}

for (const dir of ['movie', 'episode', 'imdb']) {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    const m = f.match(EXT);
    if (!m) continue;
    const id = m[1];
    const ext = m[3].toLowerCase();
    if (dir === 'imdb' ? !/^tt\d+$/.test(id) : !/^\d+$/.test(id)) {
      problems.push(`${dir}/${f}: name must be ${dir === 'imdb' ? 'an IMDb id like tt0133093' : 'a TMDb number'}`);
      continue;
    }
    try {
      check(`${dir}/${f}`, ext);
      maps.push(`${dir}/${f}`);
    } catch (e) {
      problems.push(`${dir}/${f}: ${e.message}`);
    }
  }
}
maps.sort();
let name;
try {
  name = JSON.parse(fs.readFileSync(path.join(__dirname, 'index.json'), 'utf8')).name;
} catch {
  /* new index */
}
fs.writeFileSync(
  path.join(__dirname, 'index.json'),
  JSON.stringify({ version: 3, ...(name ? { name } : {}), updated: new Date().toISOString(), maps }, null, 2) + '\n',
);
console.log(`index.json: ${maps.length} filter files`);
if (problems.length) {
  console.log(`\nSkipped ${problems.length} file(s):`);
  for (const p of problems) console.log('  - ' + p);
  process.exitCode = 1;
}
