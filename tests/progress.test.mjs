import assert from "node:assert/strict";
import test from "node:test";
import { createStudyProgress } from "../public/js/storage/models.mjs";
import { updateStudyProgress } from "../public/js/storage/progress.mjs";

function createProgressRepository(record) {
  let current = record;

  return {
    async update(_storeName, _key, updater) {
      const next = updater(current);
      current = next;
      return next;
    },
    getCurrent() {
      return current;
    },
  };
}

test("updates current stage, completed stages, and activity pointers", async () => {
  const repository = createProgressRepository(createStudyProgress({ studyId: "study-1" }));
  const updated = await updateStudyProgress(repository, "study-1", {
    currentStageId: "stage-2",
    completedStageIds: ["stage-1"],
    lastExerciseId: "exercise-3",
    nextActivityId: "exercise-4",
  }, new Date("2026-11-20T12:00:00.000Z"));

  assert.equal(updated.currentStageId, "stage-2");
  assert.deepEqual(updated.completedStageIds, ["stage-1"]);
  assert.equal(updated.lastExerciseId, "exercise-3");
  assert.equal(updated.nextActivityId, "exercise-4");
  assert.equal(updated.updatedAt, "2026-11-20T12:00:00.000Z");
});

test("rejects duplicated or unsupported progress updates without changing state", async () => {
  const repository = createProgressRepository(createStudyProgress({ studyId: "study-1" }));
  const before = repository.getCurrent();

  await assert.rejects(
    updateStudyProgress(repository, "study-1", {
      completedStageIds: ["stage-1", "stage-1"],
    }),
    TypeError,
  );
  await assert.rejects(
    updateStudyProgress(repository, "study-1", { masteredConcepts: ["concept-1"] }),
    TypeError,
  );

  assert.deepEqual(repository.getCurrent(), before);
});
