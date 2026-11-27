import { randomUUID } from "node:crypto";
import { CronLock } from "@/models";

const LOCK_ID = "monitor-check";
const LOCK_DURATION = 3 * 60 * 1000;

export async function acquireCronLock() {
  const ownerToken = randomUUID();
  const now = new Date();

  try {
    const lock = await CronLock.findOneAndUpdate(
      {
        _id: LOCK_ID,
        expiresAt: { $lte: now },
      },
      {
        $set: {
          ownerToken,
          expiresAt: new Date(now.getTime() + LOCK_DURATION),
        },
      },
      {
        new: true,
      },
    );

    if (lock) return ownerToken;

    await CronLock.create({
      _id: LOCK_ID,
      ownerToken,
      expiresAt: new Date(now.getTime() + LOCK_DURATION),
    });

    return ownerToken;
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) return null;

    throw error;
  }
}
export async function renewCronLock(ownerToken: string) {
  const result = await CronLock.updateOne(
    {
      _id: LOCK_ID,
      ownerToken,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        expiresAt: new Date(Date.now() + LOCK_DURATION),
      },
    },
  );
  return result.modifiedCount === 1;
}
export async function releaseCronLock(ownerToker: string) {
  await CronLock.deleteOne({
    _id: LOCK_ID,
    ownerToker,
  });
}
