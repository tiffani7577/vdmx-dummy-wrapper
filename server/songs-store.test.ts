import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("songs-store", () => {
  let tempDir: string;
  let cwd: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "songs-store-"));
    cwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(cwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates, lists, and deletes songs without a database", async () => {
    const { createSong, listSongs, deleteSong } = await import("./services/songs-store.js");

    const created = await createSong({ name: "Am I OK", bpm: 124, mediaBinPage: 0 });
    expect(created.id).toBe(1);
    expect(created.name).toBe("Am I OK");

    const all = await listSongs();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Am I OK");

    const removed = await deleteSong(created.id);
    expect(removed).toBe(true);
    expect(await listSongs()).toHaveLength(0);
  });

  it("rejects empty song names", async () => {
    const { createSong } = await import("./services/songs-store.js");
    await expect(createSong({ name: "   " })).rejects.toThrow(/required/i);
  });
});
