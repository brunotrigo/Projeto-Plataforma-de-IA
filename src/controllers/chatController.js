function createChatController({ aiService, validator, role }) {
  return async function handleChatRequest(req, res) {
    const result = validator(req.body);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const response = await aiService.generate({
      role,
      ...result.value,
    });

    if (!response || typeof response.reply !== "string" || !response.reply.trim()) {
      throw new Error("The AI service returned an invalid response.");
    }

    return res.status(200).json({ reply: response.reply.trim() });
  };
}

module.exports = { createChatController };
