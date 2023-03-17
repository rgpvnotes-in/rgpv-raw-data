require('dotenv').config();

exports.imageGeneratorAuth = (() => {
  try {
    const randomGradient = Math.floor(Math.random() * 5) + 1;
    console.log('imageGeneratorAuth is using number: ', randomGradient);
    return JSON.parse(IMAGE_GENERATOR_AUTH[randomGradient]);
  } catch (error) {
    console.error('something went wrong in imageGeneratorAuth ', error);
  }
})();
