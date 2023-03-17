import { simplePostData } from '../axios/index';
import { imageGeneratorAuth } from '../auth/index';

const backgroundImage =
  'https://1.bp.blogspot.com/-nxB_j7rW58Y/XqbkngLEEnI/AAAAAAAAAjw/4u-oZufnVWwkl6wNo5ZOMH7y2VoIt4fmwCLcBGAsYHQ/s1600/rgpvnotes.in%2Btransparent%2Blogo.png';

const linearGradient = (() => {
  const linearGradientArray = [
    'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%);',
    'linear-gradient(135deg, #7474BF 0%, #348AC7 100%);',
    'linear-gradient(135deg, #DC2424 0%, #4A569D 100%);',
    'linear-gradient(135deg, #232526 0%, #414345 100%);',
    'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%);',
    'linear-gradient(135deg, #614385 0%, #516395 100%);',
    'linear-gradient(135deg, #16222A 0%, #3A6073 100%);',
    'linear-gradient(135deg, #EB3349 0%, #F45C43 100%);',
    'linear-gradient(135deg, #FF512F 0%, #F09819 100%);',
    'linear-gradient(135deg, #e52d27 0%, #b31217 100%);',
    'linear-gradient(135deg, #2b5876 0%, #4e4376 100%);',
    'linear-gradient(135deg, #1488CC 0%, #2B32B2 100%);',
    'linear-gradient(135deg, #b92b27 0%, #1565C0 100%);',
    'linear-gradient(135deg, #373B44 0%, #4286f4 100%);',
    'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%);',
    'linear-gradient(135deg, #f953c6 0%, #b91d73 100%);',
    'linear-gradient(135deg, #c31432 0%, #240b36 100%);',
    'linear-gradient(135deg, #f12711 0%, #f5af19 100%);',
    'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%);',
    'linear-gradient(135deg, #FF512F 0%, #DD2476 100%);',
    'linear-gradient(135deg, #FF512F 0%, #DD2476 100%);',
  ];
  const randomGradient = Math.floor(Math.random() * linearGradientArray.length);
  return linearGradientArray[randomGradient];
})();

const imageTextFontSize = (postCaption) => {
  const postCaptionLength = postCaption.length;
  let postCaptionFontSize = '75px';
  if (postCaptionLength < 65) {
    postCaptionFontSize = '130px;';
  } else if (postCaptionLength < 170) {
    postCaptionFontSize = '100px;';
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
    background-image: url('${backgroundImage}'),${linearGradient};
  }
  .footer {
    font-size: 25px;
    position: absolute;
    left: 20px;
    top: 1270px;
    line-height: 2rem;
  }`;

const htmlForImage = (
  postCaption,
) => `<div class='box'>${postCaption}<br><br><br>
<span class="footer">
    <strong>RGPV Alerts by rgpvnotes.in</strong><br>
    Check out https://www.rgpv.ac.in for more information.
</span>
</div>`;

export const postImageUrl = async (postCaption) => {
  try {
    const generateCssForImage = cssForImage(postCaption);
    const generateHtmlForImage = htmlForImage(postCaption);

    const imageOptions = {
      html: generateCssForImage,
      css: generateHtmlForImage,
      google_fonts: 'Roboto',
    };

    const imageGeneratorCredentials = imageGeneratorAuth;

    const generatedImageResponse = await simplePostData(
      'https://hcti.io/v1/image',
      imageOptions,
      {
        auth: {
          username: imageGeneratorCredentials.username,
          password: imageGeneratorCredentials.password,
        },
      },
    );

    return generatedImageResponse.url;
  } catch (error) {
    console.error('something went wrong in postImageUrl ', error);
  }
};
