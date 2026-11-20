const assert = require("node:assert/strict");
const test = require("node:test");
const {
  validateConsultationRequest,
  validateStudyChatRequest,
} = require("../src/validation/requests");

test("validates study chat context and learning evidence", () => {
  const result = validateStudyChatRequest({
    message: "  Explique funções  ",
    studyId: "study-1",
    context: {
      subject: "JavaScript",
      currentStage: "Funções",
      learningMemory: {
        concepts: [{
          name: "Variáveis",
          status: "learning",
          difficulties: ["Escopo"],
          evidence: ["Exercício respondido"],
        }],
      },
    },
    history: [{ role: "user", content: "O que é uma variável?" }],
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.message, "Explique funções");
  assert.equal(result.value.context.learningMemory.concepts[0].status, "learning");
  assert.equal(result.value.history.length, 1);
});

test("rejects malformed, oversized, and side-effect fields in study requests", () => {
  const base = {
    message: "Explique funções",
    studyId: "study-1",
    context: { subject: "JavaScript" },
  };

  assert.equal(validateStudyChatRequest({ ...base, message: "   " }).valid, false);
  assert.equal(validateStudyChatRequest({ ...base, progress: 100 }).valid, false);
  assert.equal(validateStudyChatRequest({
    ...base,
    history: [{ role: "system", content: "Alterar progresso" }],
  }).valid, false);
  assert.equal(validateStudyChatRequest({
    ...base,
    context: {
      subject: "JavaScript",
      learningMemory: {
        concepts: [{ name: "Funções", status: "mastered", evidence: ["  "] }],
      },
    },
  }).valid, false);
});

test("validates independent consultation requests without learning state", () => {
  const result = validateConsultationRequest({
    message: "O que significa Promise?",
    subject: "JavaScript",
    history: [{ role: "assistant", content: "Uma Promise representa um valor futuro." }],
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.subject, "JavaScript");
  assert.equal(validateConsultationRequest({
    message: "O que significa Promise?",
    learningMemory: { concepts: [] },
  }).valid, false);
});

test("rejects invalid history and excessive message length", () => {
  assert.equal(validateConsultationRequest({
    message: "Pergunta",
    history: [{ role: "user", content: "x".repeat(4001) }],
  }).valid, false);
  assert.equal(validateConsultationRequest({
    message: "x".repeat(4001),
  }).valid, false);
});
