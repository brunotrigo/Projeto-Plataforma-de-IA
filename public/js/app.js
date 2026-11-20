import { createDataRepository, openLearningDatabase, STORES } from "./storage/database.mjs";
import {
  createAttempt,
  createExercise,
  createStage,
  createStudy,
  createStudyProgress,
  createSubject,
} from "./storage/models.mjs";
import { updateStudyProgress } from "./storage/progress.mjs";

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

          const exercises = await repository.getAllByIndex(STORES.exercises, "stageId", stage.id);
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
              const label = document.createElement("strong");
              label.textContent = `Tentativa ${attemptIndex + 1} · ${new Date(attempt.createdAt).toLocaleString("pt-BR")}`;
              item.append(label, document.createTextNode(attempt.answer));
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

                await renderExercises(stage);
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
