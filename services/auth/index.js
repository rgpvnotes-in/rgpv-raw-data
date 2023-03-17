require('dotenv').config();

exports.imageGeneratorAuth = (() => {
  try {
    const randomGradient = Math.floor(Math.random() * 5) + 1;
    console.log('imageGeneratorAuth is using number: ', randomGradient);
    return JSON.parse(
      process.env.IMAGE_GENERATOR_AUTH[randomGradient] ||
        process.env.IMAGE_GENERATOR_AUTH_1,
    );
  } catch (error) {
    console.error('something went wrong in imageGeneratorAuth ', error);
  }
})();
