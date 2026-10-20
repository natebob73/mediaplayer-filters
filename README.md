# MediaPlayer filter library

Content-filter maps for the MediaPlayer Apple TV app: VideoSkip `.skp` files (mute language, skip or blur scenes),
plus `.edl`, `.mcf` and `.json` maps. The app reads this repo directly:
`https://raw.githubusercontent.com/natebob73/mediaplayer-filters/main`.

**Most files are published automatically every night** from the `.skp` files that sit next to the videos in Nate's
Plex library (Hermes job `mediaplayer_filters_sync`). Each video is matched to its IMDb id (movies) or its show's id +
season/episode (TV) through Plex. The video's runtime is added as a `.d<seconds>` tag (e.g. `imdb/tt1745960.d7840.skp`),
so when a title exists in two cuts the app picks the map for the copy being played. An empty `.skp` means the title was
reviewed and nothing needed filtering.

Friends: in the app, Settings → Filter sources, this repo is already built in. Filter timings only line up with a copy
of the same runtime (the app corrects PAL speed-ups automatically, and has a "Filters earlier / later" nudge).


Every Apple TV, iPad and phone running MediaPlayer downloads filter maps from this folder once it's online.

```
index.json                          list of available files (generated: run `node build-index.js`)
imdb/<tt1234567>.<ext>              a movie (or any title) by IMDb id — easiest for movies
plex/<plexId>.<ext>                 a title by Plex's own global id (for titles with no IMDb/TMDb id)
movie/<tmdbId>.<ext>                a movie, by TMDb id
tv/imdb-<tt1234567>/S01E02.<ext>    a TV episode: show's IMDb id + season/episode — easiest for TV
tv/tvdb-<id>/S01E02.<ext>           …or the show's TVDB id,  tv/tmdb-<id>/S01E02.<ext> for its TMDb id, tv/plex-<id>/… for its Plex id
episode/<tmdbEpisodeId>.<ext>       a TV episode by its own TMDb *episode* id
```

A title can have several files; the app merges them. Add an optional tag before the extension to keep
them apart, e.g. `imdb/tt0133093.visual.skp` + `imdb/tt0133093.language.edl`.

Optional: add `"name": "Nate's filters"` to index.json; the app shows it as the filter source
(`build-index.js` keeps it).

**Keep subtitles out of a public repo.** Subtitle text is copyrighted; filter timings aren't a copy of the
film. If your tools find swearing from subtitles, publish the result as mute cues (`.edl` lines like
`754.2 755.9 1`, or `.skp`/`.json` cues) rather than the `.srt` itself. Everyone's app also scans their own
Plex subtitles for language automatically.

Accepted file types (`<ext>`):

| Type | Where it comes from |
|---|---|
| `.json` | MediaPlayer format (below), or a CleanStream `/api/filters/<imdbId>` download |
| `.mcf` | MovieContentFilter (moviecontentfilter.com) |
| `.skp` | VideoSkip Exchange (videoskip.org/exchange) |
| `.edl` | Kodi / MPlayer edit lists (`start end 0` = skip, `start end 1` = mute) |
| `.srt` `.vtt` `.ass` | Subtitles. Not a map: the app scans them for swearing/blasphemy and adds mute cues to whatever map is used (handy when Plex has no text subtitles for a movie) |

Your repo always wins: if a title is here, community maps are ignored. All files for the same title are merged. To use a downloaded file, rename it to the title's IMDb id
(e.g. `imdb/tt0133093.skp`) and run `node build-index.js`.

## Put it online (free, one time)

1. Create a free account at github.com, then **New repository** → name it `mediaplayer-filters` → **Public** → Create.
2. On the new repository page choose **uploading an existing file**, drag in `index.json` and the `movie` and `episode` folders, and **Commit changes**.
3. Your filter address is:
   `https://raw.githubusercontent.com/<your-github-name>/mediaplayer-filters/main`
4. In the app: **Settings → Filter library** → paste that address → **Save & reload filters**.

## Adding a map

1. Find the title's TMDb id: open it on themoviedb.org; the number in the address is the id
   (e.g. `themoviedb.org/movie/603-the-matrix` → `603`). In the app, the Details screen shows
   "Filtered for…" once a map exists.
2. Create `movie/603.json`:

```json
{
  "kind": "movie",
  "tmdbId": 603,
  "title": "The Matrix",
  "runtimeSec": 8160,
  "cues": [
    { "start": 125.4, "end": 126.1, "action": "mute", "category": "profanity" },
    { "start": 3720,  "end": 3765,  "action": "skip", "category": "violence", "note": "lobby shootout" }
  ]
}
```

   Times are seconds from the start of the movie (`"severity": "low" | "medium" | "high"` is optional). `action`: `mute`, `skip` or `blur`.
   `category`: `profanity`, `blasphemy`, `sexual`, `nudity`, `violence`, `gore`, `drugs`, `action`, `other`.
3. Run `node build-index.js` (it also checks the files for mistakes), then upload the changed files and `index.json` to GitHub.
   Apps pick up the new list within about 10 minutes (or right away after **Settings → Save & reload**).

