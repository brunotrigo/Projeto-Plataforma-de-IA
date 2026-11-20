export const DATABASE_NAME = "plataforma-estudos";
export const DATABASE_VERSION = 2;

export const STORES = Object.freeze({
  subjects: "subjects",
  studies: "studies",
  stages: "stages",
  exercises: "exercises",
  attempts: "attempts",
  studyProgress: "studyProgress",
  concepts: "concepts",
  learningEvidence: "learningEvidence",
  learningSignals: "learningSignals",
  learningProfile: "learningProfile",
  mainChatMessages: "mainChatMessages",
  tutorChatMessages: "tutorChatMessages",
  technicalConsultationMessages: "technicalConsultationMessages",
  freeConsultationMessages: "freeConsultationMessages",
  personalizationMessages: "personalizationMessages",
});

const storeDefinitions = [
  { name: STORES.subjects, keyPath: "id", indexes: [] },
  { name: STORES.studies, keyPath: "id", indexes: ["subjectId", "updatedAt"] },
  { name: STORES.stages, keyPath: "id", indexes: ["studyId", ["studyId", "position"]] },
  { name: STORES.exercises, keyPath: "id", indexes: ["studyId", "stageId"] },
  { name: STORES.attempts, keyPath: "id", indexes: ["studyId", "exerciseId", "createdAt"] },
  { name: STORES.studyProgress, keyPath: "studyId", indexes: ["currentStageId"] },
  { name: STORES.concepts, keyPath: "id", indexes: ["studyId", "status", ["studyId", "nameKey"]] },
  {
    name: STORES.learningEvidence,
    keyPath: "id",
    indexes: ["studyId", "conceptId", "attemptId", "createdAt"],
  },
  {
    name: STORES.learningSignals,
    keyPath: "id",
    indexes: ["studyId", "conceptId", "source", "createdAt"],
  },
  { name: STORES.learningProfile, keyPath: "id", indexes: [] },
  { name: STORES.mainChatMessages, keyPath: "id", indexes: ["studyId", "conversationId", "createdAt"] },
  { name: STORES.tutorChatMessages, keyPath: "id", indexes: ["studyId", "conversationId", "createdAt"] },
  {
    name: STORES.technicalConsultationMessages,
    keyPath: "id",
    indexes: ["conversationId", "createdAt"],
  },
  {
    name: STORES.freeConsultationMessages,
    keyPath: "id",
    indexes: ["conversationId", "createdAt"],
  },
  {
    name: STORES.personalizationMessages,
    keyPath: "id",
    indexes: ["studyId", "conversationId", "createdAt"],
  },
];

export function openLearningDatabase(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;

      for (const definition of storeDefinitions) {
        const store = database.objectStoreNames.contains(definition.name)
          ? request.transaction.objectStore(definition.name)
          : database.createObjectStore(definition.name, { keyPath: definition.keyPath });

        for (const indexDefinition of definition.indexes) {
          const indexName = Array.isArray(indexDefinition)
            ? indexDefinition.join("_")
            : indexDefinition;
          const keyPath = Array.isArray(indexDefinition) ? indexDefinition : indexName;

          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, keyPath, { unique: false });
          }
        }
      }

      if (event.oldVersion < 2 && database.objectStoreNames.contains(STORES.concepts)) {
        const conceptStore = request.transaction.objectStore(STORES.concepts);
        const cursorRequest = conceptStore.openCursor();

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;

          if (!cursor) {
            return;
          }

          const concept = cursor.value;

          if (typeof concept.name === "string" && !concept.nameKey) {
            concept.nameKey = concept.name.trim().toLocaleLowerCase("pt-BR");
            cursor.update(concept);
          }

          cursor.continue();
        };
      }
    };

    request.onerror = () => {
      reject(request.error || new Error("The learning database could not be opened."));
    };
    request.onblocked = () => {
      reject(new Error("The learning database upgrade is blocked by another open tab."));
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runRequest(database, storeName, mode, createRequest) {
  if (!Object.values(STORES).includes(storeName)) {
    return Promise.reject(new TypeError(`Unknown data store: ${storeName}.`));
  }

  return new Promise((resolve, reject) => {
    let result;
    const transaction = database.transaction(storeName, mode);
    const request = createRequest(transaction.objectStore(storeName));

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => {
      reject(request.error || new Error(`The ${storeName} request failed.`));
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => {
      reject(transaction.error || new Error(`The ${storeName} transaction failed.`));
    };
    transaction.onabort = () => {
      reject(transaction.error || new Error(`The ${storeName} transaction was aborted.`));
    };
  });
}

function runWrites(database, entries, operation) {
  const storeNames = [...new Set(entries.map((entry) => entry.storeName))];

  if (
    entries.length === 0
    || storeNames.some((storeName) => !Object.values(STORES).includes(storeName))
  ) {
    return Promise.reject(new TypeError("At least one valid data store is required."));
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeNames, "readwrite");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error || new Error("The data transaction failed."));
    };
    transaction.onabort = () => {
      reject(transaction.error || new Error("The data transaction was aborted."));
    };

    for (const entry of entries) {
      const request = transaction.objectStore(entry.storeName)[operation](entry.record);
      request.onerror = () => {
        reject(request.error || new Error(`The ${entry.storeName} request failed.`));
      };
    }
  });
}

export function createDataRepository(database) {
  return {
    add(storeName, record) {
      return runRequest(database, storeName, "readwrite", (store) => store.add(record));
    },
    addMany(entries) {
      return runWrites(database, entries, "add");
    },
    get(storeName, key) {
      return runRequest(database, storeName, "readonly", (store) => store.get(key));
    },
    getAll(storeName) {
      return runRequest(database, storeName, "readonly", (store) => store.getAll());
    },
    getAllByIndex(storeName, indexName, value) {
      return runRequest(database, storeName, "readonly", (store) =>
        store.index(indexName).getAll(value),
      );
    },
    update(storeName, key, updater) {
      if (!Object.values(STORES).includes(storeName) || typeof updater !== "function") {
        return Promise.reject(new TypeError("A valid data store and update function are required."));
      }

      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        let updatedRecord;
        let failure;

        transaction.oncomplete = () => resolve(updatedRecord);
        transaction.onerror = () => {
          reject(failure || transaction.error || new Error(`The ${storeName} update failed.`));
        };
        transaction.onabort = () => {
          reject(failure || transaction.error || new Error(`The ${storeName} update was aborted.`));
        };

        const request = store.get(key);
        request.onerror = () => {
          failure = request.error || new Error(`The ${storeName} record could not be read.`);
        };
        request.onsuccess = () => {
          if (request.result === undefined) {
            failure = new Error(`The ${storeName} record does not exist.`);
            transaction.abort();
            return;
          }

          try {
            updatedRecord = updater(request.result);
            const updateRequest = store.put(updatedRecord);
            updateRequest.onerror = () => {
              failure = updateRequest.error || new Error(`The ${storeName} record could not be updated.`);
            };
          } catch (error) {
            failure = error;
            transaction.abort();
          }
        };
      });
    },
    put(storeName, record) {
      return runRequest(database, storeName, "readwrite", (store) => store.put(record));
    },
    putMany(entries) {
      return runWrites(database, entries, "put");
    },
    delete(storeName, key) {
      return runRequest(database, storeName, "readwrite", (store) => store.delete(key));
    },
  };
}
