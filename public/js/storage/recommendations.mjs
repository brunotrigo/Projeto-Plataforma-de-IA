import { STORES } from "./database.mjs";
import { getEffectiveConceptStatus } from "./learningData.mjs";

function byOldest(left, right) {
  return left.updatedAt.localeCompare(right.updatedAt)
    || left.name.localeCompare(right.name, "pt-BR");
}

function byNewest(left, right) {
  return right.createdAt.localeCompare(left.createdAt);
}

function createRecommendation(type, title, reason, target = {}) {
  return { type, title, reason, ...target };
}

function relatedAttempt(conceptId, evidence, attempts) {
  const attemptIds = new Set(
    evidence
      .filter((item) =>
        item.conceptId === conceptId
        && item.attemptId
        && item.assessment !== "demonstrated",
      )
      .sort(byNewest)
      .map((item) => item.attemptId),
  );

  return attempts.find((attempt) => attemptIds.has(attempt.id));
}

function recommendConcept(concept, evidence, attempts, signals) {
  const attempt = relatedAttempt(concept.id, evidence, attempts);
  const difficulty = signals.some((signal) =>
    signal.conceptId === concept.id && signal.kind === "difficulty",
  ) || concept.difficulties.length > 0 || concept.status === "review";

  if (attempt) {
    const exerciseEvidence = evidence
      .filter((item) => item.attemptId === attempt.id)
      .sort(byNewest)[0];

    if (exerciseEvidence && exerciseEvidence.assessment === "needs_practice") {
      return createRecommendation(
        "retry_exercise",
        "Tente novamente este exercício",
        `A resposta vinculada a “${concept.name}” foi avaliada como necessitando de prática.`,
        { conceptId: concept.id, exerciseId: attempt.exerciseId, stageId: attempt.stageId },
      );
    }

    return createRecommendation(
      "review_attempt",
      `Revise sua tentativa sobre ${concept.name}`,
      `Há uma tentativa relacionada a este conceito. Use-a para continuar a prática sem presumir domínio.`,
      { conceptId: concept.id, exerciseId: attempt.exerciseId, stageId: attempt.stageId, attemptId: attempt.id },
    );
  }

  if (concept.status === "not_started") {
    return createRecommendation(
      "introduce_concept",
      `Estude ${concept.name}`,
      `“${concept.name}” ainda não foi iniciado; a recomendação não presume conhecimento prévio.`,
      { conceptId: concept.id },
    );
  }

  return createRecommendation(
    difficulty ? "review_concept" : "practice_concept",
    difficulty ? `Revise ${concept.name}` : `Pratique ${concept.name}`,
    difficulty
      ? `Há uma dificuldade registrada para “${concept.name}”.`
      : `“${concept.name}” está em aprendizado e ainda não há evidência suficiente para considerar domínio.`,
    { conceptId: concept.id },
  );
}

export async function recommendNextActivity(repository, studyId) {
  if (typeof studyId !== "string" || !studyId.trim() || studyId.trim().length > 80) {
    throw new TypeError("A valid study ID is required.");
  }

  const normalizedStudyId = studyId.trim();
  const study = await repository.get(STORES.studies, normalizedStudyId);

  if (!study) {
    throw new Error("The requested study was not found.");
  }

  const [stages, progress, exercises, attempts, concepts, evidence, signals] = await Promise.all([
    repository.getAllByIndex(STORES.stages, "studyId", normalizedStudyId),
    repository.get(STORES.studyProgress, normalizedStudyId),
    repository.getAllByIndex(STORES.exercises, "studyId", normalizedStudyId),
    repository.getAllByIndex(STORES.attempts, "studyId", normalizedStudyId),
    repository.getAllByIndex(STORES.concepts, "studyId", normalizedStudyId),
    repository.getAllByIndex(STORES.learningEvidence, "studyId", normalizedStudyId),
    repository.getAllByIndex(STORES.learningSignals, "studyId", normalizedStudyId),
  ]);

  stages.sort((left, right) => left.position - right.position || left.title.localeCompare(right.title, "pt-BR"));
  exercises.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  attempts.sort(byNewest);
  const effectiveConcepts = concepts.map((concept) => ({
    ...concept,
    status: getEffectiveConceptStatus(concept, evidence, signals),
  }));
  effectiveConcepts.sort(byOldest);
  const completedStageIds = new Set(progress ? progress.completedStageIds : []);
  const currentStageId = progress ? progress.currentStageId : study.currentStageId;
  const currentStage = stages.find((stage) => stage.id === currentStageId);

  if (currentStageId && !currentStage) {
    throw new Error("The current study stage was not found.");
  }

  const conceptsToReview = effectiveConcepts.filter((concept) => concept.status === "review");

  if (conceptsToReview.length > 0) {
    return recommendConcept(conceptsToReview[0], evidence, attempts, signals);
  }

  const conceptsInLearning = effectiveConcepts.filter((concept) => concept.status === "learning");
  const conceptWithDifficulty = conceptsInLearning.find((concept) =>
    concept.difficulties.length > 0
    || signals.some((signal) => signal.conceptId === concept.id && signal.kind === "difficulty"),
  );

  if (conceptWithDifficulty) {
    return recommendConcept(conceptWithDifficulty, evidence, attempts, signals);
  }

  if (currentStage && !completedStageIds.has(currentStage.id)) {
    const stageExercises = exercises.filter((exercise) => exercise.stageId === currentStage.id);

    for (const exercise of stageExercises) {
      const exerciseAttempts = attempts
        .filter((attempt) => attempt.exerciseId === exercise.id)
        .sort(byNewest);
      const latestAttempt = exerciseAttempts[0];

      if (!latestAttempt) {
        return createRecommendation(
          "attempt_exercise",
          "Tente o próximo exercício",
          "Este exercício ainda não tem tentativas registradas.",
          { exerciseId: exercise.id, stageId: currentStage.id },
        );
      }

      const latestAssessment = evidence
        .filter((item) => item.attemptId === latestAttempt.id)
        .sort(byNewest)[0];

      if (!latestAssessment) {
        return createRecommendation(
          "review_attempt",
          "Revise a resposta registrada",
          "A tentativa ainda não tem uma avaliação registrada; não é possível presumir acerto, conclusão ou domínio.",
          { attemptId: latestAttempt.id, exerciseId: exercise.id, stageId: currentStage.id },
        );
      }

      if (latestAssessment.assessment === "unassessed") {
        return createRecommendation(
          "review_attempt",
          "Revise a resposta registrada",
          "A avaliação registrada mantém a tentativa sem resultado; não é possível presumir acerto, conclusão ou domínio.",
          { attemptId: latestAttempt.id, exerciseId: exercise.id, stageId: currentStage.id },
        );
      }

      if (latestAssessment.assessment === "needs_practice") {
        return createRecommendation(
          "retry_exercise",
          "Tente novamente este exercício",
          "A avaliação registrada indica que ainda é necessário praticar.",
          { exerciseId: exercise.id, stageId: currentStage.id },
        );
      }
    }

    return createRecommendation(
      "continue_stage",
      `Continue a etapa: ${currentStage.title}`,
      "A etapa permanece em andamento. Esta recomendação não a marca como concluída.",
      { stageId: currentStage.id },
    );
  }

  const nextStage = stages.find((stage) => !completedStageIds.has(stage.id));

  if (nextStage) {
    return createRecommendation(
      "start_stage",
      `Inicie a etapa: ${nextStage.title}`,
      "A etapa anterior está registrada como concluída; esta é a próxima etapa ainda não concluída.",
      { stageId: nextStage.id },
    );
  }

  const remainingConcept = effectiveConcepts.find((concept) =>
    concept.status === "learning" || concept.status === "not_started",
  );

  if (remainingConcept) {
    return recommendConcept(remainingConcept, evidence, attempts, signals);
  }

  if (
    effectiveConcepts.length > 0
    && effectiveConcepts.every((concept) => concept.status === "mastered")
  ) {
    return createRecommendation(
      "all_registered_work_done",
      "Revise ou escolha um novo assunto",
      "As etapas registradas estão concluídas e todos os conceitos cadastrados têm evidência avaliada como demonstrada.",
    );
  }

  return createRecommendation(
    "continue_study",
    "Continue organizando este estudo",
    "Ainda não há informações suficientes para recomendar uma atividade mais específica.",
  );
}
