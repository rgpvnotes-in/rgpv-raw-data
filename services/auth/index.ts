import "dotenv/config";
import { getEnv } from "../env/index";

const env = getEnv();

export const imageGeneratorAuth = (() => {
  try {
    const randomGradient = Math.floor(Math.random() * 5) + 1;
    console.log("imageGeneratorAuth is using number: ", randomGradient);
    return (
      env[`IMAGE_GENERATOR_AUTH_${randomGradient}` as keyof typeof env] ||
      env.IMAGE_GENERATOR_AUTH_1
    );
  } catch (error) {
    console.error("something went wrong in imageGeneratorAuth ", error);
    return env.IMAGE_GENERATOR_AUTH_1;
  }
})();
