import assert from "node:assert/strict";
import test from "node:test";
import {
  getConversationHistory,
  getLearningMemory,
  recordLearningSignal,
  saveConversationMessage,
  saveLearningEvidence,
} from "../public/js/storage/learningData.mjs";
import { STORES } from "../public/js/storage/database.mjs";

function createMemoryRepository() {
  const stores = new Map(Object.values(STORES).map((name) => [name, new Map()]));

  return {
    async add(storeName, record) {
      const store = stores.get(storeName);
      if (store.has(record.id)) {
        const error = new Error("Duplicate key.");
        error.name = "ConstraintError";
        throw error;
      }
      store.set(record.id, record);
    },
    async addMany(entries) {
      for (const entry of entries) {
        if (stores.get(entry.storeName).has(entry.record.id)) {
          const error = new Error("Duplicate key.");
          error.name = "ConstraintError";
          throw error;
        }
      }
      entries.forEach((entry) => stores.get(entry.storeName).set(entry.record.id, entry.record));
    },
    async getAllByIndex(storeName, indexName, value) {
      return [...stores.get(storeName).values()]
        .filter((record) => record[indexName] === value);
    },
    async get(storeName, key) {
      return stores.get(storeName).get(key);
    },
    async put(storeName, record) {
      stores.get(storeName).set(record.id, record);
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

  await saveLearningEvidence(repository, {
    studyId: "study-1",
    conceptId: signal.conceptId,
    type: "exercise_response",
    details: "Resposta prática registrada.",
  });

  const memoryAfter = await getLearningMemory(repository, "study-1");

  assert.deepEqual(memoryBefore.concepts[0].evidence, []);
  assert.deepEqual(memoryAfter.concepts[0].evidence, ["Resposta prática registrada."]);
  assert.equal(memoryAfter.concepts[0].status, "not_started");
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
