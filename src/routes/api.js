const express = require("express");
const { createChatController } = require("../controllers/chatController");
const {
  validateConsultationRequest,
  validateStudyChatRequest,
} = require("../validation/requests");

function createApiRouter(aiService) {
  const router = express.Router();

  router.post(
    "/study/chat",
    createChatController({ aiService, validator: validateStudyChatRequest, role: "study" }),
  );
  router.post(
    "/tutor/chat",
    createChatController({ aiService, validator: validateStudyChatRequest, role: "tutor" }),
  );
  router.post(
    "/consultations/technical",
    createChatController({
      aiService,
      validator: validateConsultationRequest,
      role: "technical_consultation",
    }),
  );
  router.post(
    "/consultations/free",
    createChatController({
      aiService,
      validator: validateConsultationRequest,
      role: "free_consultation",
    }),
  );

  return router;
}

module.exports = { createApiRouter };
