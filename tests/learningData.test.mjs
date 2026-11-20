import assert from "node:assert/strict";
import test from "node:test";
import {
  getEffectiveConceptStatus,
  getConversationHistory,
  getLearningMemory,
  recordLearningSignal,
  saveAttemptAssessment,
  saveConversationMessage,
  saveLearningEvidence,
} from "../public/js/storage/learningData.mjs";
import { STORES } from "../public/js/storage/database.mjs";
import {
  createAttempt,
  createExercise,
  createStudyProgress,
} from "../public/js/storage/models.mjs";

function createMemoryRepository() {
  const stores = new Map(Object.values(STORES).map((name) => [name, new Map()]));
  const recordKey = (storeName, record) => (
    storeName === STORES.studyProgress ? record.studyId : record.id
  );

  return {
    async add(storeName, record) {
      const store = stores.get(storeName);
      const key = recordKey(storeName, record);
      if (store.has(key)) {
        const error = new Error("Duplicate key.");
        error.name = "ConstraintError";
        throw error;
      }
      store.set(key, record);
    },
    async addMany(entries) {
      for (const entry of entries) {
        if (stores.get(entry.storeName).has(recordKey(entry.storeName, entry.record))) {
          const error = new Error("Duplicate key.");
          error.name = "ConstraintError";
          throw error;
        }
      }
      entries.forEach((entry) => stores
        .get(entry.storeName)
        .set(recordKey(entry.storeName, entry.record), entry.record));
    },
    async putMany(entries) {
      entries.forEach((entry) => stores
        .get(entry.storeName)
        .set(recordKey(entry.storeName, entry.record), entry.record));
    },
    async getAllByIndex(storeName, indexName, value) {
      return [...stores.get(storeName).values()]
        .filter((record) => record[indexName] === value);
    },
    async get(storeName, key) {
      return stores.get(storeName).get(key);
    },
    async put(storeName, record) {
      stores.get(storeName).set(recordKey(storeName, record), record);
    },
    async update(storeName, key, updater) {
      const record = stores.get(storeName).get(key);
      if (!record) {
        throw new Error("Record not found.");
      }
      const updated = updater(record);
      stores.get(storeName).set(key, updated);
      return updated;
    },
  };
}

test("derives legacy concept status from assessed evidence, not declarations", () => {
  const concept = {
    id: "concept-1",
    status: "not_started",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const evidence = [{
    conceptId: concept.id,
    assessment: "unassessed",
    createdAt: "2024-02-01T00:00:00.000Z",
  }];
  const signals = [{
    conceptId: concept.id,
    kind: "understood",
    createdAt: "2024-03-01T00:00:00.000Z",
  }];

  assert.equal(getEffectiveConceptStatus(concept, [], signals), "not_started");
  assert.equal(getEffectiveConceptStatus(concept, evidence, signals), "learning");
  assert.equal(getEffectiveConceptStatus(concept, [
    ...evidence,
    {
      conceptId: concept.id,
      assessment: "demonstrated",
      createdAt: "2024-04-01T00:00:00.000Z",
    },
  ], signals), "mastered");
  assert.equal(getEffectiveConceptStatus({
    ...concept,
    status: "mastered",
    updatedAt: "2024-04-01T00:00:00.000Z",
  }, [
    {
      conceptId: concept.id,
      assessment: "needs_practice",
      createdAt: "2024-05-01T00:00:00.000Z",
    },
  ], signals), "review");
});

test("stores conversation channels independently", async () => {
  const repository = createMemoryRepository();
  const conversationId = "conversation-1";

  await saveConversationMessage(repository, "main", {
    studyId: "study-1",
    conversationId,
    role: "user",
    content: "Minha tentativa",
  });
  await saveConversationMessage(repository, "tutor", {
    studyId: "study-1",
    conversationId,
    role: "assistant",
    content: "Uma explicação adicional",
  });
  await saveConversationMessage(repository, "technical", {
    conversationId,
    role: "user",
    content: "O que significa let?",
  });

  assert.equal((await getConversationHistory(repository, "main", conversationId, "study-1")).length, 1);
  assert.equal((await getConversationHistory(repository, "tutor", conversationId, "study-1")).length, 1);
  assert.equal((await getConversationHistory(repository, "technical", conversationId)).length, 1);
  assert.equal((await getConversationHistory(repository, "free", conversationId)).length, 0);
});

test("shares structured learning signals without upgrading mastery", async () => {
  const repository = createMemoryRepository();

  await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "Variáveis",
    source: "main",
    kind: "understood",
    details: "O estudante afirmou que entendeu.",
  });
  await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "variáveis",
    source: "tutor",
    kind: "difficulty",
    details: "Ainda confunde escopo.",
  });
  const memory = await getLearningMemory(repository, "study-1");

  assert.equal(memory.concepts.length, 1);
  assert.equal(memory.concepts[0].status, "not_started");
  assert.deepEqual(memory.concepts[0].understoodSignals, ["O estudante afirmou que entendeu."]);
  assert.deepEqual(memory.concepts[0].difficulties, ["Ainda confunde escopo."]);
});

test("stores exercise evidence separately and rejects consultation writes to study chats", async () => {
  const repository = createMemoryRepository();
  const signal = await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "Funções",
    source: "main",
    kind: "needs_verification",
    details: "Precisa demonstrar o conceito.",
  });
  const memoryBefore = await getLearningMemory(repository, "study-1");
  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-1",
    exerciseId: "exercise-1",
    answer: "Resposta prática registrada.",
  });
  await repository.add(STORES.attempts, attempt);
  const progress = createStudyProgress({ studyId: "study-1", currentStageId: "stage-1" });
  await repository.add(STORES.studyProgress, progress);

  await saveLearningEvidence(repository, {
    studyId: "study-1",
    conceptId: signal.conceptId,
    attemptId: attempt.id,
    type: "exercise_response",
    details: "Resposta prática registrada.",
  });

  const memoryAfter = await getLearningMemory(repository, "study-1");

  assert.deepEqual(memoryBefore.concepts[0].evidence, []);
  assert.deepEqual(memoryAfter.concepts[0].evidence, ["Resposta prática registrada."]);
  assert.equal(memoryAfter.concepts[0].status, "learning");
  assert.equal((await repository.get(STORES.studyProgress, "study-1")).completedStageIds.length, 0);
  await assert.rejects(
    saveLearningEvidence(repository, {
      studyId: "study-1",
      conceptId: signal.conceptId,
      attemptId: "missing-attempt",
      type: "exercise_response",
      assessment: "demonstrated",
      details: "Tentativa inexistente.",
    }),
    TypeError,
  );
  await assert.rejects(
    saveConversationMessage(repository, "technical", {
      studyId: "study-1",
      conversationId: "consultation-1",
      role: "user",
      content: "Pergunta",
    }),
    TypeError,
  );
});

test("requires explicitly assessed evidence for mastery and revisits mastery after difficulty", async () => {
  const repository = createMemoryRepository();
  const signal = await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "Funções",
    source: "main",
    kind: "understood",
    details: "O estudante afirmou que entendeu.",
  });
  assert.equal((await getLearningMemory(repository, "study-1")).concepts[0].status, "not_started");

  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-1",
    exerciseId: "exercise-1",
    answer: "Uma resposta enviada, ainda sem avaliação.",
  });
  await repository.add(STORES.attempts, attempt);
  const progress = createStudyProgress({ studyId: "study-1", currentStageId: "stage-1" });
  await repository.add(STORES.studyProgress, progress);

  await saveLearningEvidence(repository, {
    studyId: "study-1",
    conceptId: signal.conceptId,
    attemptId: attempt.id,
    type: "exercise_response",
    assessment: "demonstrated",
    details: "A resposta aplicou corretamente o conceito.",
  });

  assert.equal((await getLearningMemory(repository, "study-1")).concepts[0].status, "mastered");
  const unchangedProgress = await repository.get(STORES.studyProgress, "study-1");
  assert.equal(unchangedProgress.currentStageId, "stage-1");
  assert.deepEqual(unchangedProgress.completedStageIds, []);

  await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "Funções",
    source: "tutor",
    kind: "difficulty",
    details: "A dificuldade voltou em uma aplicação posterior.",
  });

  assert.equal((await getLearningMemory(repository, "study-1")).concepts[0].status, "review");
});

test("records explicit attempt assessments as history without completing the stage", async () => {
  const repository = createMemoryRepository();
  const exercise = createExercise({
    studyId: "study-1",
    stageId: "stage-1",
    prompt: "Declare uma variável.",
  });
  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-1",
    exerciseId: exercise.id,
    answer: "const total = 1;",
  });
  const progress = createStudyProgress({
    studyId: "study-1",
    currentStageId: "stage-1",
  });
  await repository.add(STORES.exercises, exercise);
  await repository.add(STORES.attempts, attempt);
  await repository.add(STORES.studyProgress, progress);

  const unassessed = await saveAttemptAssessment(repository, {
    studyId: "study-1",
    attemptId: attempt.id,
    conceptName: "Variáveis",
    assessment: "unassessed",
    details: "Resposta registrada, ainda sem análise.",
  });
  assert.equal((await getLearningMemory(repository, "study-1")).concepts[0].status, "learning");

  const demonstrated = await saveAttemptAssessment(repository, {
    studyId: "study-1",
    attemptId: attempt.id,
    conceptName: "variáveis",
    assessment: "demonstrated",
    details: "A resposta aplicou corretamente o conceito.",
  });
  assert.equal((await getLearningMemory(repository, "study-1")).concepts[0].status, "mastered");

  const needsPractice = await saveAttemptAssessment(repository, {
    studyId: "study-1",
    attemptId: attempt.id,
    conceptName: "Variáveis",
    assessment: "needs_practice",
    details: "Ainda há confusão sobre o escopo.",
  });
  const memory = await getLearningMemory(repository, "study-1");
  const evidenceHistory = await repository.getAllByIndex(
    STORES.learningEvidence,
    "attemptId",
    attempt.id,
  );
  const unchangedProgress = await repository.get(STORES.studyProgress, "study-1");

  assert.equal(memory.concepts.length, 1);
  assert.equal(memory.concepts[0].status, "review");
  assert.deepEqual(
    [unassessed.assessment, demonstrated.assessment, needsPractice.assessment],
    ["unassessed", "demonstrated", "needs_practice"],
  );
  assert.equal(evidenceHistory.length, 3);
  assert.ok(evidenceHistory[0].createdAt < evidenceHistory[1].createdAt);
  assert.ok(evidenceHistory[1].createdAt < evidenceHistory[2].createdAt);
  assert.equal(unchangedProgress.currentStageId, "stage-1");
  assert.deepEqual(unchangedProgress.completedStageIds, []);
  assert.equal((await repository.get(STORES.attempts, attempt.id)).answer, "const total = 1;");
});

test("rejects assessments for attempts not linked to the study exercise", async () => {
  const repository = createMemoryRepository();
  const exercise = createExercise({
    studyId: "study-1",
    stageId: "stage-1",
    prompt: "Declare uma variável.",
  });
  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-2",
    exerciseId: exercise.id,
    answer: "const total = 1;",
  });
  await repository.add(STORES.exercises, exercise);
  await repository.add(STORES.attempts, attempt);

  await assert.rejects(
    saveAttemptAssessment(repository, {
      studyId: "study-1",
      attemptId: attempt.id,
      conceptName: "Variáveis",
      assessment: "demonstrated",
      details: "Tentativa não corresponde à etapa do exercício.",
    }),
    TypeError,
  );
  assert.equal((await repository.getAllByIndex(STORES.concepts, "studyId", "study-1")).length, 0);
  assert.equal((await repository.getAllByIndex(STORES.learningEvidence, "studyId", "study-1")).length, 0);
});

test("does not promote a concept from an unassessed response", async () => {
  const repository = createMemoryRepository();
  const signal = await recordLearningSignal(repository, {
    studyId: "study-1",
    conceptName: "Escopo",
    source: "main",
    kind: "needs_verification",
    details: "Ainda precisa demonstrar o conceito.",
  });
  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-1",
    exerciseId: "exercise-1",
    answer: "Resposta ainda não avaliada.",
  });
  await repository.add(STORES.attempts, attempt);

  await saveLearningEvidence(repository, {
    studyId: "study-1",
    conceptId: signal.conceptId,
    attemptId: attempt.id,
    type: "exercise_response",
    details: "Resposta registrada, sem resultado de avaliação.",
  });

  const memory = await getLearningMemory(repository, "study-1");
  assert.equal(memory.concepts[0].status, "learning");
});
