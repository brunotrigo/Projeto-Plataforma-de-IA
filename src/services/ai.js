class AIUnavailableError extends Error {
  constructor() {
    super("The AI provider has not been configured.");
    this.name = "AIUnavailableError";
    this.code = "AI_UNAVAILABLE";
  }
}

const aiService = {
  async generate() {
    throw new AIUnavailableError();
  },
};

module.exports = { AIUnavailableError, aiService };
