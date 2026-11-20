import { createDataRepository, openLearningDatabase, STORES } from "./storage/database.mjs";
import {
  createAttempt,
  createExercise,
  createStage,
  createStudy,
  createStudyProgress,
  createSubject,
} from "./storage/models.mjs";
import { getLearningMemory, saveAttemptAssessment } from "./storage/learningData.mjs";
import { updateStudyProgress } from "./storage/progress.mjs";
import { recommendNextActivity } from "./storage/recommendations.mjs";

const studyForm = document.querySelector("#study-form");

if (studyForm) {
  const subjectSelect = document.querySelector("#study-subject");
  const topicInput = document.querySelector("#study-topic");
  const studyFeedback = document.querySelector("#study-feedback");
  const startButton = document.querySelector("#start-study-button");
  const subjectCount = document.querySelector("#subject-count");
  const subjectList = document.querySelector("#subject-list");
  const emptyState = document.querySelector("#empty-subject-state");
  const subjectDialog = document.querySelector("#subject-dialog");
  const subjectForm = document.querySelector("#subject-form");
  const subjectNameInput = document.querySelector("#subject-name");
  const subjectFeedback = document.querySelector("#subject-feedback");
  const addSubjectButton = document.querySelector("#add-subject-button");
  const storageFeedback = document.querySelector("#storage-feedback");
  const state = { database: null, repository: null, subjects: [], studies: [] };

  function reportStorageError(target, error, message) {
    console.error("Falha ao acessar os dados locais.", error.name);
    target.textContent = message;
    target.hidden = false;
  }

  function studyUrl(study) {
    return `/estudo.html?${new URLSearchParams({ studyId: study.id })}`;
  }

  async function renderSubjects(selectedSubjectId) {
    [state.subjects, state.studies] = await Promise.all([
      state.repository.getAll(STORES.subjects),
      state.repository.getAll(STORES.studies),
    ]);

    state.subjects.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
    state.studies.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    subjectList.querySelectorAll(".subject-card").forEach((card) => card.remove());
    emptyState.hidden = state.subjects.length > 0;
    subjectCount.textContent = `${state.subjects.length} ${state.subjects.length === 1 ? "matéria" : "matérias"}`;
    subjectSelect.replaceChildren(new Option("Selecione uma matéria", ""));

    state.subjects.forEach((subject) => {
      subjectSelect.add(new Option(subject.name, subject.id));

      const card = document.createElement("article");
      card.className = "subject-card";

      const heading = document.createElement("div");
      heading.className = "subject-card-heading";

      const title = document.createElement("h3");
      title.textContent = subject.name;

      const addStudyButton = document.createElement("button");
      addStudyButton.className = "secondary-button";
      addStudyButton.type = "button";
      addStudyButton.textContent = "Novo estudo";
      addStudyButton.addEventListener("click", () => {
        subjectSelect.value = subject.id;
        topicInput.focus();
        document.querySelector("#inicio").scrollIntoView({ behavior: "smooth" });
      });

      heading.append(title, addStudyButton);
      card.append(heading);

      const subjectStudies = state.studies.filter((study) => study.subjectId === subject.id);
      const studyList = document.createElement("ul");
      studyList.className = "subject-studies";

      if (subjectStudies.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "Nenhum estudo iniciado nesta matéria.";
        studyList.append(emptyItem);
      }

      subjectStudies.forEach((study) => {
        const item = document.createElement("li");
        const topic = document.createElement("span");
        topic.textContent = study.topic;
        const resumeLink = document.createElement("a");
        resumeLink.href = studyUrl(study);
        resumeLink.textContent = "Retomar";
        item.append(topic, resumeLink);
        studyList.append(item);
      });

      card.append(studyList);
      subjectList.append(card);
    });

    subjectSelect.disabled = state.subjects.length === 0;
    startButton.disabled = state.subjects.length === 0;
    addSubjectButton.disabled = false;

    if (selectedSubjectId && state.subjects.some((subject) => subject.id === selectedSubjectId)) {
      subjectSelect.value = selectedSubjectId;
    }
  }

  addSubjectButton.disabled = true;

  addSubjectButton.addEventListener("click", () => {
    subjectFeedback.textContent = "";
    subjectNameInput.value = "";
    subjectDialog.showModal();
    subjectNameInput.focus();
  });

  document.querySelector("#cancel-subject-button").addEventListener("click", () => {
    subjectDialog.close();
  });

  subjectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = subjectNameInput.value.trim();

    if (!name) {
      subjectFeedback.textContent = "Informe o nome da matéria.";
      subjectNameInput.focus();
      return;
    }

    const duplicate = state.subjects.some((subject) =>
      subject.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );

    if (duplicate) {
      subjectFeedback.textContent = "Esta matéria já foi adicionada.";
      subjectNameInput.focus();
      return;
    }

    const submitButton = subjectForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    subjectFeedback.textContent = "Salvando matéria...";

    try {
      const subject = createSubject({ name });
      await state.repository.add(STORES.subjects, subject);
      await renderSubjects(subject.id);
      subjectDialog.close();
      topicInput.focus();
    } catch (error) {
      reportStorageError(
        subjectFeedback,
        error,
        "Não foi possível salvar a matéria. Verifique o armazenamento do navegador e tente novamente.",
      );
    } finally {
      submitButton.disabled = false;
    }
  });

  topicInput.addEventListener("input", () => {
    studyFeedback.textContent = "";
  });

  studyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const subject = state.subjects.find((item) => item.id === subjectSelect.value);
    const topic = topicInput.value.trim();

    if (!subject || !topic) {
      studyFeedback.textContent = "Selecione uma matéria e informe o assunto do estudo.";
      return;
    }

    startButton.disabled = true;
    studyFeedback.textContent = "Salvando estudo...";

    try {
      const existingStudy = state.studies.find((study) =>
        study.subjectId === subject.id
        && study.topic.toLocaleLowerCase("pt-BR") === topic.toLocaleLowerCase("pt-BR"),
      );

      if (existingStudy) {
        window.location.assign(studyUrl(existingStudy));
        return;
      }

      const study = createStudy({ subjectId: subject.id, topic });
      const progress = createStudyProgress({ studyId: study.id });
      await state.repository.addMany([
        { storeName: STORES.studies, record: study },
        { storeName: STORES.studyProgress, record: progress },
      ]);
      window.location.assign(studyUrl(study));
    } catch (error) {
      reportStorageError(
        studyFeedback,
        error,
        "Não foi possível salvar o estudo. Verifique o armazenamento do navegador e tente novamente.",
      );
    } finally {
      startButton.disabled = state.subjects.length === 0;
    }
  });

  async function initializeHome() {
    try {
      state.database = await openLearningDatabase();
      state.repository = createDataRepository(state.database);
      state.database.onversionchange = () => state.database.close();

      const requestedStudyId = new URLSearchParams(window.location.search).get("studyId");
      const requestedStudy = requestedStudyId
        ? await state.repository.get(STORES.studies, requestedStudyId)
        : undefined;

      await renderSubjects(requestedStudy ? requestedStudy.subjectId : undefined);
    } catch (error) {
      reportStorageError(
        storageFeedback,
        error,
        "Não foi possível abrir o armazenamento local. Os estudos não podem ser carregados ou salvos.",
      );
      addSubjectButton.disabled = true;
      startButton.disabled = true;
    }
  }

  initializeHome();
}

const activeStudyPage = document.querySelector(".study-page");

if (activeStudyPage) {
  const studyId = new URLSearchParams(window.location.search).get("studyId");

  if (studyId) {
    const storageFeedback = document.querySelector("#study-storage-feedback");
    let database;

    window.addEventListener("pagehide", () => {
      if (database) {
        database.close();
        database = null;
      }
    }, { once: true });

    async function initializeStudy() {
      try {
        database = await openLearningDatabase();
        database.onversionchange = () => {
          database.close();
          database = null;
        };
        const repository = createDataRepository(database);
        const study = await repository.get(STORES.studies, studyId);

        if (!study) {
          throw new Error("The requested study was not found.");
        }

        const subject = await repository.get(STORES.subjects, study.subjectId);

        if (!subject) {
          throw new Error("The subject for this study was not found.");
        }

        const stageList = document.querySelector("#lesson-stage-list");
        const lessonContent = document.querySelector("#lesson-content");
        const stageForm = document.querySelector("#stage-form");
        const stageTitleInput = document.querySelector("#stage-title-input");
        const stageContentInput = document.querySelector("#stage-content-input");
        const stageFeedback = document.querySelector("#stage-feedback");
        const saveStageButton = document.querySelector("#save-stage-button");
        const exerciseList = document.querySelector("#exercise-list");
        const exerciseForm = document.querySelector("#exercise-form");
        const exercisePromptInput = document.querySelector("#exercise-prompt-input");
        const exerciseFormFeedback = document.querySelector("#exercise-form-feedback");
        const exerciseFeedback = document.querySelector("#exercise-feedback");
        const saveExerciseButton = document.querySelector("#save-exercise-button");
        const recommendationSection = document.querySelector("#next-activity");
        const recommendationTitle = document.querySelector("#next-activity-title");
        const recommendationReason = document.querySelector("#next-activity-reason");
        const recommendationAction = document.querySelector("#next-activity-action");
        const conceptsSection = document.querySelector("#learning-concepts");
        const conceptList = document.querySelector("#learning-concept-list");
        let currentRecommendation = null;
        let editingStageId = null;

        function closeStageForm() {
          stageForm.reset();
          stageForm.hidden = true;
          stageFeedback.textContent = "";
          editingStageId = null;
          saveStageButton.textContent = "Salvar etapa";
        }

        async function renderExercises(stage) {
          exerciseList.replaceChildren();

          if (!stage) {
            return;
          }

          const [exercises, concepts, evidence] = await Promise.all([
            repository.getAllByIndex(STORES.exercises, "stageId", stage.id),
            repository.getAllByIndex(STORES.concepts, "studyId", studyId),
            repository.getAllByIndex(STORES.learningEvidence, "studyId", studyId),
          ]);
          exercises.sort((left, right) => left.createdAt.localeCompare(right.createdAt));

          if (exercises.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "no-attempts";
            emptyMessage.textContent = "Nenhum exercício cadastrado nesta etapa.";
            exerciseList.append(emptyMessage);
          }

          for (const [index, exercise] of exercises.entries()) {
            const card = document.createElement("article");
            card.className = "exercise-card";
            card.dataset.exerciseId = exercise.id;

            const heading = document.createElement("h6");
            heading.textContent = `Exercício ${index + 1}`;

            const prompt = document.createElement("p");
            prompt.className = "exercise-card-prompt";
            prompt.textContent = exercise.prompt;

            const attempts = await repository.getAllByIndex(STORES.attempts, "exerciseId", exercise.id);
            attempts.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
            const attemptHistory = document.createElement("ol");
            attemptHistory.className = "attempt-history";

            if (attempts.length === 0) {
              const emptyAttempt = document.createElement("li");
              emptyAttempt.className = "no-attempts";
              emptyAttempt.textContent = "Nenhuma tentativa registrada.";
              attemptHistory.append(emptyAttempt);
            }

            attempts.forEach((attempt, attemptIndex) => {
              const item = document.createElement("li");
              item.dataset.attemptId = attempt.id;
              const label = document.createElement("strong");
              label.textContent = `Tentativa ${attemptIndex + 1} · ${new Date(attempt.createdAt).toLocaleString("pt-BR")}`;
              const answer = document.createElement("p");
              answer.className = "attempt-answer";
              answer.textContent = attempt.answer;

              const attemptEvidence = evidence
                .filter((record) => record.attemptId === attempt.id)
                .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
              const latestAssessment = attemptEvidence[attemptEvidence.length - 1];
              const assessmentLabels = {
                unassessed: "Ainda não avaliada",
                demonstrated: "Domínio demonstrado",
                needs_practice: "Precisa praticar",
              };
              const assessmentStatus = document.createElement("span");
              assessmentStatus.className = "attempt-assessment-status";
              assessmentStatus.textContent = latestAssessment
                ? `Avaliação mais recente: ${assessmentLabels[latestAssessment.assessment] || "Resultado não reconhecido"}`
                : "Ainda não avaliada";
              item.append(label, answer, assessmentStatus);

              if (attemptEvidence.length > 0) {
                const assessmentHistory = document.createElement("ol");
                assessmentHistory.className = "assessment-history";
                attemptEvidence.forEach((record, evidenceIndex) => {
                  const historyItem = document.createElement("li");
                  const historyTitle = document.createElement("strong");
                  const concept = concepts.find((entry) => entry.id === record.conceptId);
                  historyTitle.textContent =
                    `Avaliação ${evidenceIndex + 1} · ${assessmentLabels[record.assessment] || "Resultado não reconhecido"}`
                    + ` · ${concept ? concept.name : "Conceito indisponível"}`
                    + ` · ${new Date(record.createdAt).toLocaleString("pt-BR")}`;
                  const historyDetails = document.createElement("p");
                  historyDetails.textContent = record.details;
                  historyItem.append(historyTitle, historyDetails);
                  assessmentHistory.append(historyItem);
                });
                item.append(assessmentHistory);
              }

              const assessmentDisclosure = document.createElement("details");
              assessmentDisclosure.className = "attempt-assessment";
              const assessmentSummary = document.createElement("summary");
              assessmentSummary.textContent = attemptEvidence.length > 0
                ? "Registrar nova avaliação"
                : "Avaliar tentativa";

              const assessmentForm = document.createElement("form");
              assessmentForm.className = "assessment-form";
              const conceptLabel = document.createElement("label");
              const conceptInputId = `assessment-concept-${attempt.id}`;
              const conceptListId = `assessment-concepts-${attempt.id}`;
              conceptLabel.htmlFor = conceptInputId;
              conceptLabel.textContent = "Conceito relacionado";
              const conceptInput = document.createElement("input");
              conceptInput.id = conceptInputId;
              conceptInput.name = "concept-name";
              conceptInput.type = "text";
              conceptInput.maxLength = 120;
              conceptInput.required = true;
              conceptInput.setAttribute("list", conceptListId);
              const priorConcept = latestAssessment
                ? concepts.find((entry) => entry.id === latestAssessment.conceptId)
                : undefined;
              conceptInput.value = priorConcept ? priorConcept.name : "";
              const conceptList = document.createElement("datalist");
              conceptList.id = conceptListId;
              concepts.forEach((concept) => {
                const option = document.createElement("option");
                option.value = concept.name;
                conceptList.append(option);
              });

              const assessmentLabel = document.createElement("label");
              const assessmentSelectId = `assessment-result-${attempt.id}`;
              assessmentLabel.htmlFor = assessmentSelectId;
              assessmentLabel.textContent = "Resultado da avaliação";
              const assessmentSelect = document.createElement("select");
              assessmentSelect.id = assessmentSelectId;
              assessmentSelect.name = "assessment";
              assessmentSelect.required = true;
              const assessmentOptions = [
                ["", "Selecione um resultado"],
                ["demonstrated", "Demonstrou domínio"],
                ["needs_practice", "Precisa praticar"],
                ["unassessed", "Ainda não avaliada"],
              ];
              assessmentOptions.forEach(([value, text]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = text;
                assessmentSelect.append(option);
              });

              const detailsLabel = document.createElement("label");
              const detailsId = `assessment-details-${attempt.id}`;
              detailsLabel.htmlFor = detailsId;
              detailsLabel.textContent = "Feedback ou justificativa";
              const detailsInput = document.createElement("textarea");
              detailsInput.id = detailsId;
              detailsInput.name = "assessment-details";
              detailsInput.maxLength = 2000;
              detailsInput.rows = 3;
              detailsInput.required = true;

              const assessmentGuidance = document.createElement("p");
              assessmentGuidance.className = "assessment-guidance";
              assessmentGuidance.textContent =
                "A avaliação é registrada explicitamente; uma tentativa sem avaliação não é considerada correta.";
              const assessmentFeedback = document.createElement("p");
              assessmentFeedback.className = "form-feedback";
              assessmentFeedback.setAttribute("role", "status");
              assessmentFeedback.setAttribute("aria-live", "polite");
              const saveAssessmentButton = document.createElement("button");
              saveAssessmentButton.className = "secondary-button";
              saveAssessmentButton.type = "submit";
              saveAssessmentButton.textContent = "Salvar avaliação";

              assessmentForm.append(
                conceptLabel,
                conceptInput,
                conceptList,
                assessmentLabel,
                assessmentSelect,
                detailsLabel,
                detailsInput,
                assessmentGuidance,
                assessmentFeedback,
                saveAssessmentButton,
              );
              assessmentForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                saveAssessmentButton.disabled = true;
                assessmentFeedback.textContent = "Salvando avaliação...";
                let evidenceSaved = false;

                try {
                  await saveAttemptAssessment(repository, {
                    studyId,
                    attemptId: attempt.id,
                    conceptName: conceptInput.value,
                    assessment: assessmentSelect.value,
                    details: detailsInput.value,
                  });
                  evidenceSaved = true;
                  await renderStudy();
                  exerciseFeedback.textContent =
                    "Avaliação registrada no histórico. A recomendação foi atualizada; a etapa não foi concluída.";
                } catch (error) {
                  console.error("Falha ao registrar avaliação da tentativa.", error.name);
                  assessmentFeedback.textContent = evidenceSaved
                    ? "A avaliação foi salva, mas a tela não pôde ser atualizada. Recarregue o estudo para confirmar."
                    : "Não foi possível salvar a avaliação. Verifique os dados e o armazenamento e tente novamente.";
                } finally {
                  saveAssessmentButton.disabled = false;
                }
              });
              assessmentDisclosure.append(assessmentSummary, assessmentForm);
              item.append(assessmentDisclosure);
              attemptHistory.append(item);
            });

            const answerForm = document.createElement("form");
            answerForm.className = "attempt-form";
            const answerLabel = document.createElement("label");
            const answerId = `answer-${exercise.id}`;
            answerLabel.htmlFor = answerId;
            answerLabel.textContent = "Sua resposta";
            const answerInput = document.createElement("textarea");
            answerInput.id = answerId;
            answerInput.required = true;
            answerInput.maxLength = 4000;
            answerInput.rows = 3;
            const submitAnswer = document.createElement("button");
            submitAnswer.className = "secondary-button";
            submitAnswer.type = "submit";
            submitAnswer.textContent = "Registrar tentativa";
            answerForm.append(answerLabel, answerInput, submitAnswer);
            answerForm.addEventListener("submit", async (event) => {
              event.preventDefault();
              const answer = answerInput.value.trim();

              if (!answer) {
                answerInput.focus();
                return;
              }

              submitAnswer.disabled = true;
              exerciseFeedback.textContent = "Registrando tentativa...";
              let attemptSaved = false;
              let progressUpdated = false;

              try {
                const attempt = createAttempt({
                  studyId,
                  stageId: stage.id,
                  exerciseId: exercise.id,
                  answer,
                });
                await repository.add(STORES.attempts, attempt);
                attemptSaved = true;

                try {
                  await updateStudyProgress(repository, studyId, { lastExerciseId: exercise.id });
                  progressUpdated = true;
                } catch (error) {
                  console.error("Tentativa salva, mas o ponteiro de progresso não foi atualizado.", error.name);
                }

                await renderStudy();
                exerciseFeedback.textContent = progressUpdated
                  ? "Resposta registrada. Ela permanece como tentativa e não conclui a etapa nem altera o domínio."
                  : "Resposta salva como tentativa, mas o progresso não pôde ser atualizado.";
              } catch (error) {
                console.error("Falha ao registrar tentativa.", error.name);
                exerciseFeedback.textContent = attemptSaved
                  ? "A resposta foi salva, mas não foi possível atualizar a lista. Recarregue o estudo para confirmar."
                  : "Não foi possível registrar a resposta. Verifique o armazenamento e tente novamente.";
              } finally {
                submitAnswer.disabled = false;
              }
            });

            card.append(heading, prompt, attemptHistory, answerForm);
            exerciseList.append(card);
          }
        }

        async function renderStudy() {
          const [stages, progress] = await Promise.all([
            repository.getAllByIndex(STORES.stages, "studyId", studyId),
            repository.get(STORES.studyProgress, studyId),
          ]);
          stages.sort((left, right) => left.position - right.position);
          const currentStageId = progress ? progress.currentStageId : study.currentStageId;
          const currentStage = stages.find((stage) => stage.id === currentStageId)
            || (currentStageId === null ? stages[0] : undefined);

          if (currentStageId && !currentStage) {
            throw new Error("The current study stage was not found.");
          }

          const completedStageIds = progress ? progress.completedStageIds : [];
          const completedCount = stages.filter((stage) => completedStageIds.includes(stage.id)).length;
          const progressPercent = stages.length > 0
            ? Math.round((completedCount / stages.length) * 100)
            : 0;
          const [recommendation, memory] = await Promise.all([
            recommendNextActivity(repository, studyId),
            getLearningMemory(repository, studyId),
          ]);
          const emptyState = document.querySelector("#study-empty-state");

          document.querySelector("#active-study-subject").textContent = `${subject.name} · ${study.topic}`;
          document.querySelector("#active-study-status").textContent = currentStage
            ? currentStage.title
            : "Aguardando conteúdo da aula";
          document.querySelector("#active-study-progress").textContent = stages.length > 0
            ? `${progressPercent}% concluído`
            : "Progresso ainda não iniciado";
          document.querySelector(".step-indicator").textContent = currentStage
            ? String(stages.indexOf(currentStage) + 1)
            : "—";
          document.querySelector(".progress-track span").style.width = `${progressPercent}%`;
          document.querySelector("#main-chat-intro").textContent = stages.length > 0
            ? `Seu estudo de ${study.topic} foi retomado. Consulte o conteúdo e selecione uma etapa para continuar.`
            : `O estudo de ${study.topic} está salvo. Adicione a primeira etapa para organizar o conteúdo da aula.`;
          emptyState.hidden = stages.length > 0;
          document.querySelector("#study-empty-title").textContent = "Estudo salvo";
          document.querySelector("#study-empty-message").textContent =
            "Adicione etapas e conteúdos para organizar este estudo. Seu progresso será salvo no navegador.";
          currentRecommendation = recommendation;
          recommendationSection.hidden = false;
          recommendationTitle.textContent = recommendation.title;
          recommendationReason.textContent = recommendation.reason;
          const actionLabels = {
            attempt_exercise: "Fazer exercício",
            retry_exercise: "Tentar novamente",
            review_attempt: "Ver tentativa",
            start_stage: "Abrir etapa",
            continue_stage: "Retomar etapa",
            introduce_concept: "Ver conceito",
            practice_concept: "Ver conceito",
            review_concept: "Ver conceito",
          };
          recommendationAction.textContent = actionLabels[recommendation.type] || "";
          recommendationAction.hidden = !actionLabels[recommendation.type];
          conceptList.replaceChildren();
          const conceptStatusLabels = {
            not_started: "Não iniciado",
            learning: "Em aprendizado",
            mastered: "Dominado — evidência avaliada",
            review: "Precisa revisar",
          };
          conceptsSection.hidden = memory.concepts.length === 0;

          memory.concepts.forEach((concept) => {
            const item = document.createElement("li");
            item.dataset.conceptId = concept.id;
            const name = document.createElement("strong");
            name.textContent = concept.name;
            const status = document.createElement("span");
            status.textContent = conceptStatusLabels[concept.status] || "Estado não reconhecido";
            const details = document.createElement("p");
            details.textContent =
              `${concept.evidence.length} evidência(s) registrada(s); ${concept.difficulties.length} dificuldade(s) registrada(s).`;
            item.append(name, status, details);
            conceptList.append(item);
          });
          lessonContent.hidden = false;
          stageList.replaceChildren();

          stages.forEach((stage, index) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `${index + 1}. ${stage.title}`;

            if (stage.id === (currentStage ? currentStage.id : null)) {
              button.setAttribute("aria-current", "step");
            }

            button.addEventListener("click", async () => {
              try {
                await updateStudyProgress(repository, studyId, { currentStageId: stage.id });
                await renderStudy();
              } catch (error) {
                console.error("Falha ao retomar a etapa.", error.name);
                stageFeedback.textContent = "Não foi possível retomar esta etapa. Verifique o armazenamento e tente novamente.";
              }
            });

            item.append(button);
            stageList.append(item);
          });

          const currentContent = document.querySelector("#current-stage-content");
          currentContent.hidden = !currentStage;

          if (currentStage) {
            document.querySelector("#current-stage-title").textContent = currentStage.title;
            document.querySelector("#current-stage-text").textContent = currentStage.content
              || "Esta etapa ainda não possui conteúdo.";
          }
          await renderExercises(currentStage);
        }

        recommendationAction.addEventListener("click", async () => {
          if (!currentRecommendation) {
            return;
          }

          if (currentRecommendation.type === "start_stage" && currentRecommendation.stageId) {
            try {
              await updateStudyProgress(repository, studyId, {
                currentStageId: currentRecommendation.stageId,
              });
              await renderStudy();
            } catch (error) {
              console.error("Falha ao abrir a etapa recomendada.", error.name);
              exerciseFeedback.textContent = "Não foi possível abrir a etapa recomendada. Verifique o armazenamento e tente novamente.";
            }
            return;
          }

          if (currentRecommendation.exerciseId) {
            const exerciseCard = [...exerciseList.querySelectorAll(".exercise-card")]
              .find((item) => item.dataset.exerciseId === currentRecommendation.exerciseId);

            if (exerciseCard) {
              exerciseCard.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
          }

          if (currentRecommendation.conceptId) {
            const conceptItem = [...conceptList.querySelectorAll("[data-concept-id]")]
              .find((item) => item.dataset.conceptId === currentRecommendation.conceptId);

            if (conceptItem) {
              conceptItem.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
          }

          document.querySelector("#current-stage-content").scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });

        document.querySelector("#add-stage-button").addEventListener("click", () => {
          closeStageForm();
          stageForm.hidden = false;
          stageTitleInput.focus();
        });

        document.querySelector("#cancel-stage-button").addEventListener("click", () => {
          closeStageForm();
        });

        document.querySelector("#add-exercise-button").addEventListener("click", () => {
          exerciseForm.reset();
          exerciseFormFeedback.textContent = "";
          exerciseForm.hidden = false;
          exercisePromptInput.focus();
        });

        document.querySelector("#cancel-exercise-button").addEventListener("click", () => {
          exerciseForm.reset();
          exerciseFormFeedback.textContent = "";
          exerciseForm.hidden = true;
        });

        exerciseForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const prompt = exercisePromptInput.value.trim();

          if (!prompt) {
            exerciseFormFeedback.textContent = "Informe o enunciado do exercício.";
            exercisePromptInput.focus();
            return;
          }

          saveExerciseButton.disabled = true;
          exerciseFormFeedback.textContent = "Salvando exercício...";

          try {
            const progress = await repository.get(STORES.studyProgress, studyId);
            const stageId = progress ? progress.currentStageId : study.currentStageId;

            if (!stageId) {
              exerciseFormFeedback.textContent = "Selecione uma etapa para cadastrar o exercício.";
              return;
            }

            const exercise = createExercise({ studyId, stageId, prompt });
            await repository.add(STORES.exercises, exercise);
            exerciseForm.reset();
            exerciseForm.hidden = true;
            exerciseFormFeedback.textContent = "";
            exerciseFeedback.textContent = "Exercício cadastrado nesta etapa.";
            await renderStudy();
          } catch (error) {
            console.error("Falha ao salvar exercício.", error.name);
            exerciseFormFeedback.textContent = "Não foi possível salvar o exercício. Verifique o armazenamento do navegador e tente novamente.";
          } finally {
            saveExerciseButton.disabled = false;
          }
        });

        document.querySelector("#edit-stage-button").addEventListener("click", async () => {
          try {
            const stages = await repository.getAllByIndex(STORES.stages, "studyId", studyId);
            const progress = await repository.get(STORES.studyProgress, studyId);
            const stageId = progress ? progress.currentStageId : study.currentStageId;
            const stage = stages.find((item) => item.id === stageId);

            if (!stage) {
              stageFeedback.textContent = "Não foi possível localizar a etapa atual para edição.";
              return;
            }

            editingStageId = stage.id;
            stageTitleInput.value = stage.title;
            stageContentInput.value = stage.content;
            saveStageButton.textContent = "Atualizar etapa";
            stageFeedback.textContent = "";
            stageForm.hidden = false;
            stageTitleInput.focus();
          } catch (error) {
            console.error("Falha ao carregar etapa para edição.", error.name);
            stageFeedback.textContent = "Não foi possível carregar a etapa para edição. Verifique o armazenamento e tente novamente.";
          }
        });

        stageForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const title = stageTitleInput.value.trim();
          const content = stageContentInput.value.trim();

          if (!title) {
            stageFeedback.textContent = "Informe o nome da etapa.";
            stageTitleInput.focus();
            return;
          }

          saveStageButton.disabled = true;
          stageFeedback.textContent = "Salvando etapa...";

          try {
            const stages = await repository.getAllByIndex(STORES.stages, "studyId", studyId);
            if (editingStageId) {
              const existingStage = stages.find((item) => item.id === editingStageId);

              if (!existingStage) {
                throw new Error("The stage to update was not found.");
              }

              const updatedStage = createStage({
                studyId,
                title,
                content,
                position: existingStage.position,
              });
              await repository.update(STORES.stages, editingStageId, (current) => ({
                ...current,
                title: updatedStage.title,
                content: updatedStage.content,
                updatedAt: updatedStage.updatedAt,
              }));
            } else {
              const progress = await repository.get(STORES.studyProgress, studyId);

              if (!progress) {
                throw new Error("Study progress was not found.");
              }

              const stage = createStage({ studyId, title, content, position: stages.length });
              await repository.add(STORES.stages, stage);

              if (!progress.currentStageId) {
                await updateStudyProgress(repository, studyId, { currentStageId: stage.id });
              }
            }

            closeStageForm();
            await renderStudy();
          } catch (error) {
            console.error("Falha ao salvar a etapa.", error.name);
            stageFeedback.textContent = "Não foi possível salvar a etapa. Verifique o armazenamento do navegador e tente novamente.";
          } finally {
            saveStageButton.disabled = false;
          }
        });

        await renderStudy();
        document.querySelector("#study-back-link").href = `/index.html?studyId=${encodeURIComponent(study.id)}`;
      } catch (error) {
        if (database) {
          database.close();
          database = null;
        }
        console.error("Falha ao carregar o estudo local.", error.name);
        storageFeedback.textContent = "Não foi possível carregar este estudo. Volte à Home e escolha um estudo existente.";
        storageFeedback.hidden = false;
      }
    }

    initializeStudy();
  }
}
