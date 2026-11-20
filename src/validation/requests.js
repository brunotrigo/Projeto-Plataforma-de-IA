const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LENGTH = 20;
const MAX_CONTEXT_TEXT_LENGTH = 120;
const MAX_CONCEPTS = 100;
const MAX_EVIDENCE_ITEMS = 10;
const MAX_EVIDENCE_LENGTH = 500;
const CONCEPT_STATUSES = new Set(["not_started", "learning", "mastered", "review"]);

function invalid() {
  return {
    valid: false,
    error: {
      code: "INVALID_REQUEST",
      message: "A solicitação está inválida. Revise os campos enviados.",
    },
  };
}

function valid(value) {
  return { valid: true, value };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function readText(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

function readTextList(value, maxItems, maxLength) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  const items = value.map((item) => readText(item, maxLength));
  return items.every(Boolean) ? items : null;
}

function validateHistory(history) {
  if (history === undefined) {
    return valid([]);
  }

  if (!Array.isArray(history) || history.length > MAX_HISTORY_LENGTH) {
    return invalid();
  }

  const messages = [];

  for (const item of history) {
    if (!isRecord(item) || !hasOnlyKeys(item, ["role", "content"])) {
      return invalid();
    }

    if (item.role !== "user" && item.role !== "assistant") {
      return invalid();
    }

    const content = readText(item.content, MAX_MESSAGE_LENGTH);

    if (!content) {
      return invalid();
    }

    messages.push({ role: item.role, content });
  }

  return valid(messages);
}

function validateLearningMemory(memory) {
  if (!isRecord(memory) || !hasOnlyKeys(memory, ["concepts"])) {
    return null;
  }

  if (!Array.isArray(memory.concepts) || memory.concepts.length > MAX_CONCEPTS) {
    return null;
  }

  const concepts = [];

  for (const concept of memory.concepts) {
    if (
      !isRecord(concept)
      || !hasOnlyKeys(concept, [
        "name",
        "status",
        "difficulties",
        "evidence",
        "understoodSignals",
        "needsVerification",
      ])
    ) {
      return null;
    }

    const name = readText(concept.name, MAX_CONTEXT_TEXT_LENGTH);
    const difficulties = readTextList(concept.difficulties, MAX_EVIDENCE_ITEMS, MAX_EVIDENCE_LENGTH);
    const evidence = readTextList(concept.evidence, MAX_EVIDENCE_ITEMS, MAX_EVIDENCE_LENGTH);
    const understoodSignals = readTextList(
      concept.understoodSignals,
      MAX_EVIDENCE_ITEMS,
      MAX_EVIDENCE_LENGTH,
    );
    const needsVerification = readTextList(
      concept.needsVerification,
      MAX_EVIDENCE_ITEMS,
      MAX_EVIDENCE_LENGTH,
    );

    if (
      !name
      || !CONCEPT_STATUSES.has(concept.status)
      || !difficulties
      || !evidence
      || !understoodSignals
      || !needsVerification
    ) {
      return null;
    }

    concepts.push({
      name,
      status: concept.status,
      difficulties,
      evidence,
      understoodSignals,
      needsVerification,
    });
  }

  return { concepts };
}

function validateStudyContext(context) {
  if (
    !isRecord(context)
    || !hasOnlyKeys(context, ["subject", "currentStage", "learningMemory"])
  ) {
    return null;
  }

  const subject = readText(context.subject, MAX_CONTEXT_TEXT_LENGTH);
  const currentStage = context.currentStage === undefined
    ? undefined
    : readText(context.currentStage, MAX_CONTEXT_TEXT_LENGTH);
  const learningMemory = context.learningMemory === undefined
    ? undefined
    : validateLearningMemory(context.learningMemory);

  if (
    !subject
    || (context.currentStage !== undefined && !currentStage)
    || (context.learningMemory !== undefined && !learningMemory)
  ) {
    return null;
  }

  return {
    subject,
    ...(currentStage ? { currentStage } : {}),
    ...(learningMemory ? { learningMemory } : {}),
  };
}

function validateStudyChatRequest(body) {
  if (
    !isRecord(body)
    || !hasOnlyKeys(body, ["message", "history", "studyId", "context"])
  ) {
    return invalid();
  }

  const message = readText(body.message, MAX_MESSAGE_LENGTH);
  const studyId = readText(body.studyId, 80);
  const context = validateStudyContext(body.context);
  const history = validateHistory(body.history);

  if (!message || !studyId || !context || !history.valid) {
    return invalid();
  }

  return valid({ message, studyId, context, history: history.value });
}

function validateConsultationRequest(body) {
  if (
    !isRecord(body)
    || !hasOnlyKeys(body, ["message", "history", "subject"])
  ) {
    return invalid();
  }

  const message = readText(body.message, MAX_MESSAGE_LENGTH);
  const subject = body.subject === undefined
    ? undefined
    : readText(body.subject, MAX_CONTEXT_TEXT_LENGTH);
  const history = validateHistory(body.history);

  if (!message || (body.subject !== undefined && !subject) || !history.valid) {
    return invalid();
  }

  return valid({
    message,
    history: history.value,
    ...(subject ? { subject } : {}),
  });
}

module.exports = {
  validateConsultationRequest,
  validateStudyChatRequest,
};
