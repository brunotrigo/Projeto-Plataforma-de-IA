import assert from "node:assert/strict";
import test from "node:test";
import { STORES } from "../public/js/storage/database.mjs";
import {
  createAttempt,
  createConcept,
  createExercise,
  createStage,
  createStudy,
  createStudyProgress,
} from "../public/js/storage/models.mjs";
import { saveAttemptAssessment } from "../public/js/storage/learningData.mjs";
import { recommendNextActivity } from "../public/js/storage/recommendations.mjs";

function createRepository() {
  const stores = new Map(Object.values(STORES).map((name) => [name, new Map()]));

  return {
    async add(storeName, record) {
      stores.get(storeName).set(record.id || record.studyId, record);
    },
    async get(storeName, key) {
      return stores.get(storeName).get(key);
    },
    async getAllByIndex(storeName, indexName, value) {
      return [...stores.get(storeName).values()]
        .filter((record) => record[indexName] === value);
    },
    async putMany(entries) {
      entries.forEach((entry) => stores
        .get(entry.storeName)
        .set(entry.record.id || entry.record.studyId, entry.record));
    },
  };
}

async function createStudyFixture() {
  const repository = createRepository();
  const study = createStudy({ subjectId: "subject-1", topic: "JavaScript" });
  const firstStage = createStage({
    studyId: study.id,
    title: "Fundamentos",
    content: "Variáveis e expressões.",
    position: 0,
  });
  const secondStage = createStage({
    studyId: study.id,
    title: "Funções",
    content: "Declaração e chamada.",
    position: 1,
  });
  const progress = createStudyProgress({
    studyId: study.id,
    currentStageId: firstStage.id,
  });

  await repository.add(STORES.studies, study);
  await repository.add(STORES.stages, firstStage);
  await repository.add(STORES.stages, secondStage);
  await repository.add(STORES.studyProgress, progress);

  return { repository, study, firstStage, secondStage, progress };
}

test("recommends an unattempted exercise without advancing the stage", async () => {
  const fixture = await createStudyFixture();
  const exercise = createExercise({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    prompt: "Declare uma variável.",
  });
  await fixture.repository.add(STORES.exercises, exercise);

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "attempt_exercise");
  assert.equal(recommendation.exerciseId, exercise.id);
  assert.equal(fixture.progress.completedStageIds.length, 0);
});

test("does not assume an unassessed attempt is correct or mastered", async () => {
  const fixture = await createStudyFixture();
  const exercise = createExercise({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    prompt: "Declare uma variável.",
  });
  const attempt = createAttempt({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    exerciseId: exercise.id,
    answer: "const total = 1;",
  });
  await fixture.repository.add(STORES.exercises, exercise);
  await fixture.repository.add(STORES.attempts, attempt);

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "review_attempt");
  assert.equal(recommendation.attemptId, attempt.id);
  assert.match(recommendation.reason, /não é possível presumir acerto/);
});

test("refreshes recommendations after each explicit assessment without completing the stage", async () => {
  const fixture = await createStudyFixture();
  const exercise = createExercise({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    prompt: "Declare uma variável.",
  });
  const attempt = createAttempt({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    exerciseId: exercise.id,
    answer: "const total = 1;",
  });
  await fixture.repository.add(STORES.exercises, exercise);
  await fixture.repository.add(STORES.attempts, attempt);

  const pending = await recommendNextActivity(fixture.repository, fixture.study.id);
  assert.equal(pending.type, "review_attempt");

  await saveAttemptAssessment(fixture.repository, {
    studyId: fixture.study.id,
    attemptId: attempt.id,
    conceptName: "Variáveis",
    assessment: "unassessed",
    details: "Resposta ainda sem análise.",
  });
  const stillPending = await recommendNextActivity(fixture.repository, fixture.study.id);
  assert.equal(stillPending.type, "review_attempt");
  assert.match(stillPending.reason, /avaliação registrada mantém a tentativa sem resultado/);

  await saveAttemptAssessment(fixture.repository, {
    studyId: fixture.study.id,
    attemptId: attempt.id,
    conceptName: "Variáveis",
    assessment: "demonstrated",
    details: "Aplicou corretamente o conceito.",
  });
  assert.equal(
    (await recommendNextActivity(fixture.repository, fixture.study.id)).type,
    "continue_stage",
  );
  const concept = (await fixture.repository.getAllByIndex(
    STORES.concepts,
    "studyId",
    fixture.study.id,
  ))[0];
  assert.equal(concept.status, "mastered");

  await saveAttemptAssessment(fixture.repository, {
    studyId: fixture.study.id,
    attemptId: attempt.id,
    conceptName: "Variáveis",
    assessment: "needs_practice",
    details: "Ainda precisa praticar.",
  });
  const retry = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(retry.type, "retry_exercise");
  assert.equal(retry.title, "Tente novamente este exercício");
  assert.equal(retry.exerciseId, exercise.id);
  assert.deepEqual(fixture.progress.completedStageIds, []);
});

test("recommends retrying an exercise with an assessed need for practice", async () => {
  const fixture = await createStudyFixture();
  const exercise = createExercise({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    prompt: "Declare uma variável.",
  });
  const attempt = createAttempt({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    exerciseId: exercise.id,
    answer: "Resposta avaliada.",
  });
  await fixture.repository.add(STORES.exercises, exercise);
  await fixture.repository.add(STORES.attempts, attempt);
  await fixture.repository.add(STORES.learningEvidence, {
    id: "evidence-1",
    studyId: fixture.study.id,
    conceptId: "concept-1",
    attemptId: attempt.id,
    assessment: "needs_practice",
    createdAt: new Date().toISOString(),
  });

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "retry_exercise");
  assert.equal(recommendation.exerciseId, exercise.id);
});

test("prioritizes review concepts and registered difficulties", async () => {
  const fixture = await createStudyFixture();
  const exercise = createExercise({
    studyId: fixture.study.id,
    stageId: fixture.firstStage.id,
    prompt: "Declare uma variável.",
  });
  const concept = createConcept({ studyId: fixture.study.id, name: "Escopo" });
  concept.status = "review";
  await fixture.repository.add(STORES.exercises, exercise);
  await fixture.repository.add(STORES.concepts, concept);

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "review_concept");
  assert.equal(recommendation.conceptId, concept.id);

  const difficultyFixture = await createStudyFixture();
  const conceptInLearning = createConcept({
    studyId: difficultyFixture.study.id,
    name: "Escopo",
  });
  conceptInLearning.status = "learning";
  await difficultyFixture.repository.add(STORES.concepts, conceptInLearning);
  await difficultyFixture.repository.add(STORES.learningSignals, {
    id: "difficulty-1",
    studyId: difficultyFixture.study.id,
    conceptId: conceptInLearning.id,
    kind: "difficulty",
    details: "Confunde escopo local e global.",
    createdAt: new Date().toISOString(),
  });

  const difficultyRecommendation = await recommendNextActivity(
    difficultyFixture.repository,
    difficultyFixture.study.id,
  );
  assert.equal(difficultyRecommendation.type, "review_concept");
  assert.equal(difficultyRecommendation.conceptId, conceptInLearning.id);
});

test("recommends the next stage only after the current stage is recorded complete", async () => {
  const fixture = await createStudyFixture();
  fixture.progress.completedStageIds = [fixture.firstStage.id];

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "start_stage");
  assert.equal(recommendation.stageId, fixture.secondStage.id);
});

test("recommends unstarted concepts instead of claiming the study is mastered", async () => {
  const fixture = await createStudyFixture();
  fixture.progress.completedStageIds = [fixture.firstStage.id, fixture.secondStage.id];
  const concept = createConcept({ studyId: fixture.study.id, name: "Closures" });
  await fixture.repository.add(STORES.concepts, concept);

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "introduce_concept");
  assert.equal(recommendation.conceptId, concept.id);
  assert.match(recommendation.reason, /não presume conhecimento prévio/);
});

test("recommends practice for legacy concepts with unassessed evidence", async () => {
  const fixture = await createStudyFixture();
  fixture.progress.completedStageIds = [fixture.firstStage.id, fixture.secondStage.id];
  const concept = createConcept({ studyId: fixture.study.id, name: "Closures" });
  concept.updatedAt = "2024-01-01T00:00:00.000Z";
  await fixture.repository.add(STORES.concepts, concept);
  await fixture.repository.add(STORES.learningEvidence, {
    id: "legacy-evidence",
    studyId: fixture.study.id,
    conceptId: concept.id,
    attemptId: null,
    assessment: "unassessed",
    createdAt: "2024-02-01T00:00:00.000Z",
  });

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "practice_concept");
  assert.equal(recommendation.conceptId, concept.id);
  assert.match(recommendation.reason, /evidência suficiente para considerar domínio/);
});

test("does not recommend basic review for concepts with demonstrated mastery", async () => {
  const fixture = await createStudyFixture();
  fixture.progress.completedStageIds = [fixture.firstStage.id, fixture.secondStage.id];
  const concept = createConcept({ studyId: fixture.study.id, name: "Closures" });
  concept.status = "mastered";
  await fixture.repository.add(STORES.concepts, concept);

  const recommendation = await recommendNextActivity(fixture.repository, fixture.study.id);

  assert.equal(recommendation.type, "all_registered_work_done");
});
