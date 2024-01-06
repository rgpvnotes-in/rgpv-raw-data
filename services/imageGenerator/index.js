const { simplePostData } = require('../axios/index');
const { imageGeneratorAuth } = require('../auth/index');

const backgroundImageURL = 'https://1.bp.blogspot.com/-nxB_j7rW58Y/XqbkngLEEnI/AAAAAAAAAjw/4u-oZufnVWwkl6wNo5ZOMH7y2VoIt4fmwCLcBGAsYHQ/s1600/rgpvnotes.in%2Btransparent%2Blogo.png'; 
const defaultSocialPostImageURL = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEin0mtmxPENfB7Gb7Rmbp_X8tJUU2Reezm6VDjWHQfLxZI5zkFx0qvjy3qn9IoSTSGanasrZXfEJDwGddNzXNQJ2ipeKzIhMD7U0fPqF2KhPqXGKuenZ-BX8AF9SGBaDfB5nxoBx41C3MpeJY4hX26_y4nLQ5uyuNlgWXhMpKitI8P949hqrvbcVw/s1600/fc8a3b30-72c8-4b33-b951-1cd275ccfc3b.png';

const linearGradients = [
  'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)',
  'linear-gradient(135deg, #7474BF 0%, #348AC7 100%)',
  'linear-gradient(135deg, #DC2424 0%, #4A569D 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
  'linear-gradient(135deg, #614385 0%, #516395 100%)',
  'linear-gradient(135deg, #16222A 0%, #3A6073 100%)',
  'linear-gradient(135deg, #EB3349 0%, #F45C43 100%)',
  'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
  'linear-gradient(135deg, #e52d27 0%, #b31217 100%)',
  'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
  'linear-gradient(135deg, #1488CC 0%, #2B32B2 100%)',
  'linear-gradient(135deg, #b92b27 0%, #1565C0 100%)',
  'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
  'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
  'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)',
  'linear-gradient(135deg, #c31432 0%, #240b36 100%)',
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
  'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
  'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
  'linear-gradient(140deg, rgb(165, 142, 251), rgb(233, 191, 248))',
  'linear-gradient(140deg, rgb(207, 47, 152), rgb(106, 61, 236))',
  'linear-gradient(140deg, rgb(255, 99, 99), rgb(115, 52, 52))',
  'linear-gradient(140deg, rgb(189, 227, 236), rgb(54, 54, 84))',
  'linear-gradient(140deg, rgb(89, 212, 153), rgb(160, 135, 45))',
  'linear-gradient(140deg, rgb(76, 200, 200), rgb(32, 32, 51))',
  'linear-gradient(140deg, rgb(142, 199, 251), rgb(28, 85, 170))',
  'linear-gradient(140deg, rgb(255, 207, 115), rgb(255, 122, 47))',
];

/**
 * Generate a random linear gradient from the available options.
 * @returns {string} A random linear gradient.
 */
const getRandomLinearGradient = () => {
  const randomIndex = Math.floor(Math.random() * linearGradients.length);
  return linearGradients[randomIndex];
};

/**
 * Determine the font size for the image text based on the length of the post caption.
 * @param {string} postCaption - The post caption.
 * @returns {string} The font size for the image text.
 */
const getImageTextFontSize = (postCaption) => {
  const postCaptionLength = postCaption.length;
  if (postCaptionLength < 65) {
    return '130px';
  } else if (postCaptionLength < 170) {
    return '100px';
  }
  return '75px';
};

/**
 * Generate the CSS for the social media post image.
 * @param {string} postCaption - The post caption.
 * @returns {string} CSS styles for the image.
 */
const generateCssForImage = (postCaption) => `
  .box {
    border: 4px solid #000;
    padding: 20px;
    color: white;
    font-size: ${getImageTextFontSize(postCaption)};
    width: 1080px;
    height: 1350px;
    font-family: 'Roboto';
    background-color: #8bc6ec;
    background-image: url('${backgroundImageURL}'), ${getRandomLinearGradient()};
    background-position: center;
    background-repeat: no-repeat;
  }
  .footer {
    font-size: 25px;
    position: absolute;
    left: 20px;
    top: 1330px;
    line-height: 2rem;
  }
`;

/**
 * Generate the HTML content for the social media post image.
 * @param {string} postCaption - The post caption.
 * @returns {string} HTML content for the image.
 */
const generateHtmlForImage = (postCaption) => `
  <div class='box'>
    ${postCaption}<br><br><br>
    <span class='footer'>
      <strong>RGPV Alerts by rgpvnotes.in</strong><br>
      Check out https://www.rgpv.ac.in for more information.
    </span>
  </div>
`;

/**
 * Generate and return the URL of the social media post image.
 * @param {string} postCaption - The post caption.
 * @returns {Promise<string>} URL of the generated image.
 */
exports.postImageUrl = async (postCaption) => {
  try {
    const cssForImage = generateCssForImage(postCaption).replace(
      /(\r\n|\r|\n)/g,
      '',
    );
    const htmlForImage = generateHtmlForImage(postCaption).replace(
      /(\r\n|\r|\n)/g,
      '',
    );

    const imageOptions = {
      html: htmlForImage,
      css: cssForImage,
      google_fonts: 'Roboto',
    };

    const imageGeneratorCredentials = JSON.parse(imageGeneratorAuth);

    if (
      imageGeneratorCredentials.username &&
      imageGeneratorCredentials.password
    ) {
      const { username, password } = imageGeneratorCredentials;
      const imageBasicAuth = {
        username,
        password,
      };

      const imageHeaders = {
        'Content-Type': 'application/json',
      };

      const generatedImageResponse = await simplePostData(
        'https://hcti.io/v1/image',
        JSON.stringify(imageOptions),
        imageHeaders,
        imageBasicAuth,
      );

      if (!generatedImageResponse.url) {
        console.log(
          'Failed to generate the image; returning default image URL.',
        );
      }

      return generatedImageResponse.url || defaultSocialPostImageURL;
    }

    console.log(
      'Something went wrong with image generation; returning default image URL.',
    );
    return defaultSocialPostImageURL;
  } catch (error) {
    console.error('Something went wrong in postImageUrl:', error);
    return defaultSocialPostImageURL;
  }
};
