import assert from "node:assert/strict";
import test from "node:test";
import {
  createAttempt,
  createConcept,
  createLearningEvidence,
  createStage,
  createStudy,
  createStudyProgress,
  createSubject,
} from "../public/js/storage/models.mjs";
import { STORES } from "../public/js/storage/database.mjs";

test("creates separate subject, study, and stage records with stable timestamps", () => {
  const now = new Date("2026-11-20T12:00:00.000Z");
  const subject = createSubject({ name: "  Programação  ", now });
  const study = createStudy({ subjectId: subject.id, topic: " JavaScript ", now });
  const stage = createStage({
    studyId: study.id,
    title: "Introdução",
    content: " Conceitos iniciais ",
    position: 0,
    now,
  });

  assert.equal(subject.name, "Programação");
  assert.equal(study.topic, "JavaScript");
  assert.equal(study.status, "in_progress");
  assert.equal(study.currentStageId, null);
  assert.equal(stage.content, "Conceitos iniciais");
  assert.equal(stage.status, "not_started");
  assert.equal(subject.createdAt, now.toISOString());
  assert.notEqual(subject.id, study.id);
});

test("records attempts and evidence without granting concept mastery automatically", () => {
  const attempt = createAttempt({
    studyId: "study-1",
    stageId: "stage-1",
    exerciseId: "exercise-1",
    answer: "  const total = 2;  ",
  });
  const concept = createConcept({ studyId: "study-1", name: "Variáveis" });
  const evidence = createLearningEvidence({
    studyId: "study-1",
    conceptId: concept.id,
    attemptId: attempt.id,
    type: "exercise_response",
    details: "Resposta registrada para avaliação.",
  });
  const progress = createStudyProgress({ studyId: "study-1" });

  assert.equal(attempt.status, "submitted");
  assert.equal(concept.status, "not_started");
  assert.equal(evidence.attemptId, attempt.id);
  assert.equal(progress.currentStageId, null);
  assert.deepEqual(progress.completedStageIds, []);
});

test("keeps all conversation histories in distinct stores", () => {
  const conversationStores = [
    STORES.mainChatMessages,
    STORES.tutorChatMessages,
    STORES.technicalConsultationMessages,
    STORES.freeConsultationMessages,
    STORES.personalizationMessages,
  ];

  assert.equal(new Set(conversationStores).size, conversationStores.length);
});

test("rejects malformed learning data instead of silently normalizing it", () => {
  assert.throws(() => createSubject({ name: " " }), TypeError);
  assert.throws(() => createStage({
    studyId: "study-1",
    title: "Introdução",
    content: 3,
    position: 0,
  }), TypeError);
  assert.throws(() => createLearningEvidence({
    studyId: "study-1",
    conceptId: "concept-1",
    type: "conversation",
    details: "Apenas declarou ter entendido.",
  }), TypeError);
});
