const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const createApp = require("../src/app");

test("serves the platform pages and static assets", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await once(server, "listening");

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const { port } = server.address();
  const cases = [
    ["/", "Plataforma de Estudos com IA"],
    ["/estudo.html", "Chat Principal"],
    ["/consultas.html", "Consultas independentes"],
    ["/css/style.css", "--ink"],
  ];

  for (const [pathname, expectedContent] of cases) {
    const response = await fetch(`http://localhost:${port}${pathname}`);
    const content = await response.text();

    assert.equal(response.status, 200, pathname);
    assert.ok(content.includes(expectedContent), pathname);
  }
});
