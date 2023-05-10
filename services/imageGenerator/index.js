const { simplePostData } = require('../axios/index');
const { imageGeneratorAuth } = require('../auth/index');

const backgroundImage =
  'https://1.bp.blogspot.com/-nxB_j7rW58Y/XqbkngLEEnI/AAAAAAAAAjw/4u-oZufnVWwkl6wNo5ZOMH7y2VoIt4fmwCLcBGAsYHQ/s1600/rgpvnotes.in%2Btransparent%2Blogo.png';
const defaultSocialPostImage =
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEin0mtmxPENfB7Gb7Rmbp_X8tJUU2Reezm6VDjWHQfLxZI5zkFx0qvjy3qn9IoSTSGanasrZXfEJDwGddNzXNQJ2ipeKzIhMD7U0fPqF2KhPqXGKuenZ-BX8AF9SGBaDfB5nxoBx41C3MpeJY4hX26_y4nLQ5uyuNlgWXhMpKitI8P949hqrvbcVw/s1600/fc8a3b30-72c8-4b33-b951-1cd275ccfc3b.png';

const linearGradient = () => {
  const linearGradientArray = [
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
  const randomGradient = Math.floor(Math.random() * linearGradientArray.length);
  console.log('will be using ', randomGradient, ' gradient');
  return linearGradientArray[randomGradient];
};

const imageTextFontSize = (postCaption) => {
  const postCaptionLength = postCaption.length;
  let postCaptionFontSize = '75px';
  if (postCaptionLength < 65) {
    postCaptionFontSize = '130px';
  } else if (postCaptionLength < 170) {
    postCaptionFontSize = '100px';
  }
  return postCaptionFontSize;
};

const cssForImage = (postCaption) => `.box {
    border: 4px solid #000;
    padding: 20px;
    color: white;
    font-size: ${imageTextFontSize(postCaption)};
    width: 1080px;
    height: 1350px;
    font-family: 'Roboto';
    background-color: #8bc6ec;
    background-image: url('${backgroundImage}');
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('${backgroundImage}'),${linearGradient()};
  }
  .footer {
    font-size: 25px;
    position: absolute;
    left: 20px;
    top: 1330px;
    line-height: 2rem;
  }`;

const htmlForImage = (
  postCaption,
) => `<div class='box'>${postCaption}<br><br><br>
<span class='footer'>
    <strong>RGPV Alerts by rgpvnotes.in</strong><br>
    Check out https://www.rgpv.ac.in for more information.
</span>
</div>`;

exports.postImageUrl = async (postCaption) => {
  try {
    const generateCssForImage = cssForImage(postCaption).replace(
      /(\r\n|\r|\n)/g,
      '',
    );
    const generateHtmlForImage = htmlForImage(postCaption).replace(
      /(\r\n|\r|\n)/g,
      '',
    );

    const imageOptions = {};
    imageOptions.html = generateHtmlForImage;
    imageOptions.css = generateCssForImage;
    imageOptions.google_fonts = 'Roboto';

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
        console.log('failed to generate image, returning default image');
      }

      return generatedImageResponse.url || defaultSocialPostImage; // return generated image for post
    }

    console.log(
      ' something went wrong with image generation, returning default post image',
    );
    return defaultSocialPostImage; // return default image url
  } catch (error) {
    console.error('something went wrong in postImageUrl ', error);
    return defaultSocialPostImage; // return default image url
  }
};
