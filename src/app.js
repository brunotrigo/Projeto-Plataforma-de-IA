const express = require("express");
const { apiErrorHandler } = require("./middleware/apiErrorHandler");
const { createApiRouter } = require("./routes/api");
const pagesRouter = require("./routes/pages");
const { aiService: defaultAIService } = require("./services/ai");

function createApp({ aiService = defaultAIService } = {}) {
  const app = express();

  app.use("/api", express.json({ limit: "100kb" }));
  app.use("/api", createApiRouter(aiService));
  app.use("/api", (req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "A rota solicitada não existe.",
      },
    });
  });
  app.use("/", pagesRouter);
  app.use("/api", apiErrorHandler);

  return app;
}

module.exports = createApp;
