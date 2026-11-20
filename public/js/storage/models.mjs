export const LEARNING_STATUSES = Object.freeze([
  "not_started",
  "learning",
  "mastered",
  "review",
]);

const EVIDENCE_TYPES = new Set(["exercise_response", "practical_demonstration"]);
const EVIDENCE_ASSESSMENTS = new Set(["unassessed", "demonstrated", "needs_practice"]);

function readText(value, field, maxLength) {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string.`);
  }

  const text = value.trim();

  if (!text || text.length > maxLength) {
    throw new TypeError(`${field} must contain between 1 and ${maxLength} characters.`);
  }

  return text;
}

function createId() {
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
    throw new Error("A secure UUID generator is not available.");
  }

  return globalThis.crypto.randomUUID();
}

function timestamp(now) {
  const value = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(value.getTime())) {
    throw new TypeError("A valid timestamp is required.");
  }

  return value.toISOString();
}

export function createSubject({ name, now = new Date() }) {
  const createdAt = timestamp(now);

  return {
    id: createId(),
    name: readText(name, "name", 80),
    createdAt,
    updatedAt: createdAt,
  };
}

export function createStudy({ subjectId, topic, now = new Date() }) {
  const createdAt = timestamp(now);

  return {
    id: createId(),
    subjectId: readText(subjectId, "subjectId", 80),
    topic: readText(topic, "topic", 120),
    status: "in_progress",
    currentStageId: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createStage({ studyId, title, content = "", position, now = new Date() }) {
  const createdAt = timestamp(now);

  if (!Number.isInteger(position) || position < 0) {
    throw new TypeError("position must be a non-negative integer.");
  }
  if (typeof content !== "string") {
    throw new TypeError("content must be a string.");
  }

  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    title: readText(title, "title", 120),
    content: content.trim(),
    position,
    status: "not_started",
    createdAt,
    updatedAt: createdAt,
  };
}

export function createExercise({ studyId, stageId, prompt, hints = [], now = new Date() }) {
  const createdAt = timestamp(now);

  if (!Array.isArray(hints) || hints.some((hint) => typeof hint !== "string")) {
    throw new TypeError("hints must be a list of strings.");
  }

  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    stageId: readText(stageId, "stageId", 80),
    prompt: readText(prompt, "prompt", 4000),
    hints: hints.map((hint) => readText(hint, "hint", 1000)),
    createdAt,
    updatedAt: createdAt,
  };
}

export function createAttempt({ studyId, stageId, exerciseId, answer, now = new Date() }) {
  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    stageId: readText(stageId, "stageId", 80),
    exerciseId: readText(exerciseId, "exerciseId", 80),
    answer: readText(answer, "answer", 4000),
    status: "submitted",
    createdAt: timestamp(now),
  };
}

export function createStudyProgress({ studyId, currentStageId = null, now = new Date() }) {
  const stageId = currentStageId === null
    ? null
    : readText(currentStageId, "currentStageId", 80);

  return {
    studyId: readText(studyId, "studyId", 80),
    currentStageId: stageId,
    completedStageIds: [],
    lastExerciseId: null,
    nextActivityId: null,
    updatedAt: timestamp(now),
  };
}

export function createConcept({ studyId, name, now = new Date() }) {
  const normalizedName = readText(name, "name", 120);

  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    name: normalizedName,
    nameKey: normalizedName.toLocaleLowerCase("pt-BR"),
    status: "not_started",
    difficulties: [],
    updatedAt: timestamp(now),
  };
}

export function createLearningEvidence({
  studyId,
  conceptId,
  attemptId,
  type,
  assessment = "unassessed",
  details,
  now = new Date(),
}) {
  if (!EVIDENCE_TYPES.has(type)) {
    throw new TypeError("type must identify an exercise response or practical demonstration.");
  }
  if (!EVIDENCE_ASSESSMENTS.has(assessment)) {
    throw new TypeError("assessment must identify an unassessed, demonstrated, or practice-needed result.");
  }

  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    conceptId: readText(conceptId, "conceptId", 80),
    attemptId: attemptId === undefined ? null : readText(attemptId, "attemptId", 80),
    type,
    assessment,
    details: readText(details, "details", 2000),
    createdAt: timestamp(now),
  };
}

export function createLearningSignal({
  studyId,
  conceptId,
  source,
  kind,
  details,
  now = new Date(),
}) {
  if (source !== "main" && source !== "tutor") {
    throw new TypeError("source must identify the main chat or tutor.");
  }

  if (!["difficulty", "understood", "needs_verification"].includes(kind)) {
    throw new TypeError("kind must identify a learning signal.");
  }

  return {
    id: createId(),
    studyId: readText(studyId, "studyId", 80),
    conceptId: readText(conceptId, "conceptId", 80),
    source,
    kind,
    details: readText(details, "details", 500),
    createdAt: timestamp(now),
  };
}

export function createChatMessage({ studyId, conversationId, role, content, now = new Date() }) {
  if (role !== "user" && role !== "assistant") {
    throw new TypeError("role must be user or assistant.");
  }

  return {
    id: createId(),
    studyId: studyId === undefined ? null : readText(studyId, "studyId", 80),
    conversationId: readText(conversationId, "conversationId", 80),
    role,
    content: readText(content, "content", 4000),
    createdAt: timestamp(now),
  };
}
