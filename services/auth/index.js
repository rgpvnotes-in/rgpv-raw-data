require('dotenv').config();

/**
 * Generates an authentication key for the image generator.
 * It selects an authentication key randomly from environment variables.
 * If no random key is available, it defaults to IMAGE_GENERATOR_AUTH_1.
 * @returns {string} The authentication key.
 */
exports.imageGeneratorAuth = () => {
  try {
    const randomGradient = Math.floor(Math.random() * 5) + 1;
    console.log('imageGeneratorAuth is using number:', randomGradient);

    const authKey =
      process.env[`IMAGE_GENERATOR_AUTH_${randomGradient}`] ||
      process.env.IMAGE_GENERATOR_AUTH_1;

    if (!authKey) {
      throw new Error('No authentication key found.');
    }

    return authKey;
  } catch (error) {
    console.error('Something went wrong in imageGeneratorAuth', error);
    throw error;
  }
};
