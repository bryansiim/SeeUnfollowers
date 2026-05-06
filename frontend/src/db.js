import Dexie from "dexie";

export const db = new Dexie("seeunfollowers");
db.version(1).stores({
  snapshots: "++id, takenAt",
});

export async function createSnapshot(parsed) {
  const record = {
    takenAt: parsed.takenAt ?? new Date().toISOString(),
    sourceZipName: parsed.sourceZipName,
    followersCount: parsed.followers.length,
    followingCount: parsed.following.length,
    followers: parsed.followers,
    following: parsed.following,
    recentlyUnfollowed: parsed.recentlyUnfollowed ?? [],
  };
  const id = await db.snapshots.add(record);
  return { ...record, id };
}

export async function listSnapshots() {
  const rows = await db.snapshots.orderBy("takenAt").reverse().toArray();
  return rows.map(({ followers, following, recentlyUnfollowed, ...meta }) => meta);
}

export function getSnapshot(id) {
  return db.snapshots.get(Number(id));
}

export function deleteSnapshot(id) {
  return db.snapshots.delete(Number(id));
}

export async function computeUnfollowers(fromId, toId) {
  const [from, to] = await Promise.all([
    db.snapshots.get(Number(fromId)),
    db.snapshots.get(Number(toId)),
  ]);
  if (!from || !to) throw new Error("Snapshot not found");

  const toFollowerSet = new Set(to.followers.map((f) => f.username));
  const toFollowingSet = new Set(to.following.map((f) => f.username));

  const items = from.followers
    .filter((f) => !toFollowerSet.has(f.username))
    .map((f) => ({
      username: f.username,
      still_following: toFollowingSet.has(f.username),
    }));

  items.sort((a, b) =>
    a.still_following === b.still_following
      ? a.username.localeCompare(b.username)
      : a.still_following
        ? -1
        : 1,
  );
  return items;
}

export async function computeNotFollowingBack(snapshotId) {
  const snap = await db.snapshots.get(Number(snapshotId));
  if (!snap) throw new Error("Snapshot not found");

  const followerSet = new Set(snap.followers.map((f) => f.username));
  const items = snap.following
    .filter((f) => !followerSet.has(f.username))
    .map((f) => ({ username: f.username, following_since: f.timestamp }));

  items.sort((a, b) => a.username.localeCompare(b.username));
  return items;
}

