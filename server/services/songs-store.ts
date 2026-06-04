import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredSong {
  id: number;
  name: string;
  bpm: number;
  mediaBinPage: number;
  vdmxPreset: string | null;
  order: number;
}

export interface CreateSongInput {
  name: string;
  bpm?: number;
  mediaBinPage?: number;
  vdmxPreset?: string | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SONGS_FILE = path.join(DATA_DIR, "songs.json");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<StoredSong[]> {
  try {
    const raw = await readFile(SONGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(songs: StoredSong[]) {
  await ensureDataDir();
  await writeFile(SONGS_FILE, JSON.stringify(songs, null, 2), "utf8");
}

export async function listSongs(): Promise<StoredSong[]> {
  const songs = await readAll();
  return songs.sort((a, b) => a.order - b.order || a.id - b.id);
}

export async function createSong(input: CreateSongInput): Promise<StoredSong> {
  const name = input.name?.trim();
  if (!name) {
    throw new Error("Song name is required");
  }

  const songs = await readAll();
  const nextId = songs.reduce((max, song) => Math.max(max, song.id), 0) + 1;
  const nextOrder = songs.reduce((max, song) => Math.max(max, song.order), 0) + 1;

  const song: StoredSong = {
    id: nextId,
    name,
    bpm: input.bpm ?? 120,
    mediaBinPage: input.mediaBinPage ?? 0,
    vdmxPreset: input.vdmxPreset?.trim() || null,
    order: nextOrder,
  };

  songs.push(song);
  await writeAll(songs);
  return song;
}

export async function deleteSong(id: number): Promise<boolean> {
  const songs = await readAll();
  const next = songs.filter((song) => song.id !== id);
  if (next.length === songs.length) return false;
  await writeAll(next);
  return true;
}
