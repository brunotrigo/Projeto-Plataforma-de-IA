const { AIUnavailableError } = require("../services/ai");

function apiErrorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AIUnavailableError) {
    return res.status(503).json({
      error: {
        code: error.code,
        message: "O serviço de IA ainda não está configurado.",
      },
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "O corpo da solicitação deve conter JSON válido.",
      },
    });
  }

  if (error.status === 413) {
    return res.status(413).json({
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "A solicitação excede o tamanho permitido.",
      },
    });
  }

  console.error("Falha inesperada na API.", error.name);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Não foi possível processar a solicitação.",
    },
  });
}

module.exports = { apiErrorHandler };
