import { STORES } from "./database.mjs";
import {
  createChatMessage,
  createConcept,
  createLearningEvidence,
  createLearningSignal,
} from "./models.mjs";

const HISTORY_STORES = Object.freeze({
  main: STORES.mainChatMessages,
  tutor: STORES.tutorChatMessages,
  technical: STORES.technicalConsultationMessages,
  free: STORES.freeConsultationMessages,
  personalization: STORES.personalizationMessages,
});

function getHistoryStore(channel) {
  const storeName = HISTORY_STORES[channel];

  if (!storeName) {
    throw new TypeError("The conversation channel is not supported.");
  }

  return storeName;
}

export async function saveConversationMessage(repository, channel, message) {
  const storeName = getHistoryStore(channel);

  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new TypeError("A conversation message is required.");
  }

  if (
    (channel === "main" || channel === "tutor")
    && (typeof message.studyId !== "string" || !message.studyId.trim())
  ) {
    throw new TypeError("Study chat messages must include a study ID.");
  }

  if (
    channel !== "main"
    && channel !== "tutor"
    && message.studyId !== undefined
  ) {
    throw new TypeError("Independent consultation messages cannot include a study ID.");
  }

  const record = createChatMessage(message);

  await repository.add(storeName, record);
  return record;
}

export async function getConversationHistory(repository, channel, conversationId, studyId) {
  const storeName = getHistoryStore(channel);

  if (typeof conversationId !== "string" || !conversationId.trim()) {
    throw new TypeError("A conversation ID is required.");
  }

  if (studyId !== undefined && (typeof studyId !== "string" || !studyId.trim())) {
    throw new TypeError("A valid study ID is required.");
  }

  if (
    (channel === "main" || channel === "tutor")
    ? studyId === undefined
    : studyId !== undefined
  ) {
    throw new TypeError("The study ID does not match the conversation channel.");
  }

  const normalizedConversationId = conversationId.trim();
  const normalizedStudyId = studyId === undefined ? undefined : studyId.trim();
  const messages = await repository.getAllByIndex(
    storeName,
    "conversationId",
    normalizedConversationId,
  );

  return messages
    .filter((message) => normalizedStudyId === undefined || message.studyId === normalizedStudyId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function saveLearningEvidence(repository, evidence) {
  const record = createLearningEvidence(evidence);

  await repository.add(STORES.learningEvidence, record);
  return record;
}

export async function recordLearningSignal(repository, signalInput) {
  if (!signalInput || typeof signalInput !== "object" || Array.isArray(signalInput)) {
    throw new TypeError("A learning signal is required.");
  }

  if (
    typeof signalInput.conceptName !== "string"
    || !signalInput.conceptName.trim()
    || typeof signalInput.studyId !== "string"
    || !signalInput.studyId.trim()
  ) {
    throw new TypeError("A study ID and concept name are required.");
  }

  const normalizedName = signalInput.conceptName.trim().toLocaleLowerCase("pt-BR");
  const concepts = await repository.getAllByIndex(STORES.concepts, "studyId", signalInput.studyId);
  let concept = concepts.find((item) => item.nameKey === normalizedName);
  const isNewConcept = !concept;

  if (isNewConcept) {
    concept = createConcept({
      studyId: signalInput.studyId,
      name: signalInput.conceptName,
    });
  }

  const signal = createLearningSignal({
    studyId: signalInput.studyId,
    conceptId: concept.id,
    source: signalInput.source,
    kind: signalInput.kind,
    details: signalInput.details,
  });

  if (isNewConcept) {
    await repository.addMany([
      { storeName: STORES.concepts, record: concept },
      { storeName: STORES.learningSignals, record: signal },
    ]);
  } else {
    await repository.add(STORES.learningSignals, signal);
  }

  return signal;
}

export async function getLearningMemory(repository, studyId) {
  if (typeof studyId !== "string" || !studyId.trim()) {
    throw new TypeError("A valid study ID is required.");
  }

  const [concepts, evidence, signals] = await Promise.all([
    repository.getAllByIndex(STORES.concepts, "studyId", studyId),
    repository.getAllByIndex(STORES.learningEvidence, "studyId", studyId),
    repository.getAllByIndex(STORES.learningSignals, "studyId", studyId),
  ]);

  return {
    concepts: concepts.map((concept) => {
      const conceptEvidence = evidence
        .filter((item) => item.conceptId === concept.id)
        .map((item) => item.details);
      const conceptSignals = signals.filter((item) => item.conceptId === concept.id);

      return {
        name: concept.name,
        status: concept.status,
        difficulties: [
          ...concept.difficulties,
          ...conceptSignals.filter((item) => item.kind === "difficulty").map((item) => item.details),
        ],
        evidence: conceptEvidence,
        understoodSignals: conceptSignals
          .filter((item) => item.kind === "understood")
          .map((item) => item.details),
        needsVerification: conceptSignals
          .filter((item) => item.kind === "needs_verification")
          .map((item) => item.details),
      };
    }),
  };
}
