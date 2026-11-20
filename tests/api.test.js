const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const createApp = require("../src/app");

async function listen(app, t) {
  const server = app.listen(0);
  await once(server, "listening");

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  return `http://localhost:${server.address().port}`;
}

async function postJSON(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("dispatches each chat to its isolated AI role and returns the reply contract", async (t) => {
  const requests = [];
  const app = createApp({
    aiService: {
      async generate(request) {
        requests.push(request);
        return { reply: `Resposta ${request.role}` };
      },
    },
  });
  const baseUrl = await listen(app, t);
  const studyRequest = {
    message: "Explique funções",
    studyId: "study-1",
    context: { subject: "JavaScript", currentStage: "Funções" },
    history: [{ role: "user", content: "O que já vimos?" }],
  };
  const consultationRequest = {
    message: "O que significa Promise?",
    subject: "JavaScript",
    history: [{ role: "assistant", content: "Uma Promise representa um valor futuro." }],
  };
  const routes = [
    ["/api/study/chat", studyRequest, "study"],
    ["/api/tutor/chat", studyRequest, "tutor"],
    ["/api/consultations/technical", consultationRequest, "technical_consultation"],
    ["/api/consultations/free", { message: "Como praticar?" }, "free_consultation"],
  ];

  for (const [path, body, role] of routes) {
    const response = await postJSON(baseUrl, path, body);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: `Resposta ${role}` });
  }

  assert.deepEqual(requests.map((request) => request.role), routes.map((route) => route[2]));
  assert.equal(requests[0].context.currentStage, "Funções");
  assert.equal(requests[1].history.length, 1);
  assert.equal(requests[2].subject, "JavaScript");
  assert.equal(Object.hasOwn(requests[3], "context"), false);
});

test("rejects invalid requests before calling the AI service", async (t) => {
  let calls = 0;
  const app = createApp({
    aiService: {
      async generate() {
        calls += 1;
        return { reply: "Não deve ser chamado." };
      },
    },
  });
  const baseUrl = await listen(app, t);
  const response = await postJSON(baseUrl, "/api/tutor/chat", {
    message: "Dúvida",
    studyId: "study-1",
    context: { subject: "JavaScript" },
    progress: 100,
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: "INVALID_REQUEST",
      message: "A solicitação está inválida. Revise os campos enviados.",
    },
  });
  assert.equal(calls, 0);
});

test("returns a safe unavailable response when no AI provider is configured", async (t) => {
  const baseUrl = await listen(createApp(), t);
  const response = await postJSON(baseUrl, "/api/consultations/free", {
    message: "O que é uma variável?",
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: {
      code: "AI_UNAVAILABLE",
      message: "O serviço de IA ainda não está configurado.",
    },
  });
});

test("returns consistent errors for malformed JSON and unknown API routes", async (t) => {
  const baseUrl = await listen(createApp(), t);
  const malformedResponse = await fetch(`${baseUrl}/api/study/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const missingRouteResponse = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(malformedResponse.status, 400);
  assert.equal((await malformedResponse.json()).error.code, "INVALID_JSON");
  assert.equal(missingRouteResponse.status, 404);
  assert.equal((await missingRouteResponse.json()).error.code, "NOT_FOUND");
});

test("does not expose unexpected AI service errors in API responses or logs", async (t) => {
  const loggedErrors = t.mock.method(console, "error", () => {});
  const baseUrl = await listen(createApp({
    aiService: {
      async generate() {
        throw new Error("private provider response");
      },
    },
  }), t);
  const response = await postJSON(baseUrl, "/api/study/chat", {
    message: "Comece a aula",
    studyId: "study-1",
    context: { subject: "JavaScript" },
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    error: {
      code: "INTERNAL_ERROR",
      message: "Não foi possível processar a solicitação.",
    },
  });
  assert.deepEqual(loggedErrors.mock.calls[0].arguments, ["Falha inesperada na API.", "Error"]);
});
