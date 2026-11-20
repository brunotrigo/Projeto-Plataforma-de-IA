import { STORES } from "./database.mjs";

const PROGRESS_FIELDS = [
  "currentStageId",
  "completedStageIds",
  "lastExerciseId",
  "nextActivityId",
];

function readReference(value, field) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || !value.trim() || value.trim().length > 80) {
    throw new TypeError(`${field} must be null or a valid identifier.`);
  }

  return value.trim();
}

function readRequiredReference(value, field) {
  const reference = readReference(value, field);

  if (reference === null) {
    throw new TypeError(`${field} must contain an identifier.`);
  }

  return reference;
}

export async function updateStudyProgress(repository, studyId, changes, now = new Date()) {
  if (typeof studyId !== "string" || !studyId.trim() || studyId.trim().length > 80) {
    throw new TypeError("A valid study ID is required.");
  }

  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    throw new TypeError("Progress changes must be an object.");
  }

  const keys = Object.keys(changes);

  if (keys.length === 0 || keys.some((key) => !PROGRESS_FIELDS.includes(key))) {
    throw new TypeError("Only supported progress fields can be updated.");
  }

  return repository.update(STORES.studyProgress, studyId.trim(), (current) => {
    const updated = { ...current };

    if (Object.hasOwn(changes, "currentStageId")) {
      updated.currentStageId = readReference(changes.currentStageId, "currentStageId");
    }

    if (Object.hasOwn(changes, "lastExerciseId")) {
      updated.lastExerciseId = readReference(changes.lastExerciseId, "lastExerciseId");
    }

    if (Object.hasOwn(changes, "nextActivityId")) {
      updated.nextActivityId = readReference(changes.nextActivityId, "nextActivityId");
    }

    if (Object.hasOwn(changes, "completedStageIds")) {
      const stageIds = changes.completedStageIds;

      if (!Array.isArray(stageIds)) {
        throw new TypeError("completedStageIds must be a list.");
      }

      updated.completedStageIds = stageIds.map((stageId) =>
        readRequiredReference(stageId, "completedStageId"),
      );

      if (new Set(updated.completedStageIds).size !== updated.completedStageIds.length) {
        throw new TypeError("completedStageIds cannot contain duplicates.");
      }
    }

    const timestamp = now instanceof Date ? now : new Date(now);

    if (Number.isNaN(timestamp.getTime())) {
      throw new TypeError("A valid progress timestamp is required.");
    }

    updated.updatedAt = timestamp.toISOString();
    return updated;
  });
}
