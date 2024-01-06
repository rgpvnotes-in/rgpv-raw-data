const axios = require('axios');

const rgpvHeaders = {
  authority: 'www.rgpv.ac.in',
  'sec-ch-ua':
    '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'cache-control': 'no-cache',
  'x-requested-with': 'XMLHttpRequest',
  'x-microsoftajax': 'Delta=true',
  'sec-ch-ua-platform': '"Windows"',
  accept: '*/*',
  origin: 'https://www.rgpv.ac.in',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=$%',
  'accept-language': 'en-GB,en;q=0.9',
  cookie: 'ASP.NET_SessionId=hznbm3vovcoagebriewkhpw0',
  dnt: '1',
  'sec-gpc': '1',
};

/**
 * Reusable function to make GET requests.
 * @param {string} sourceURL - The URL from which to fetch data.
 * @param {string} responseType - The response type.
 * @returns {Promise<any>} - The data received from the source page response.
 */
async function simpleGetData(sourceURL, responseType = null) {
  try {
    const config = {
      method: 'get',
      responseType: responseType,
      headers: rgpvHeaders,
    };
    const response = await axios.get(sourceURL, config);
    return response.data;
  } catch (error) {
    console.error(`Error in simpleGetData for ${sourceURL}: ${error.message}`);
    throw error;
  }
}

/**
 * Reusable function to make POST requests.
 * @param {string} postDataToUrl - The URL where to send the data.
 * @param {Object} postData - Post body data.
 * @param {Object} customHeaders - Custom headers for the post request.
 * @param {Object} customBasicAuth - Basic Auth data for the post request.
 * @returns {Promise<any>} - The response data from the server.
 */
async function simplePostData(
  postDataToUrl,
  postData,
  customHeaders = null,
  customBasicAuth = null,
) {
  try {
    const options = {
      headers: customHeaders || null,
      auth: customBasicAuth || null,
    };
    const response = await axios.post(postDataToUrl, postData, options);
    return response.data;
  } catch (error) {
    console.error(
      `Error in simplePostData for ${postDataToUrl}: ${error.message}`,
    );
    throw error;
  }
}

/**
 *
 * @param {String} urlToUpdateNews - API server end point to update news Data
 * @param {String} password - Secure password to authenticate
 * @param {Array} newsData - news data to be uploaded on API server DB
 */
async function updateNewsOnApiServer(urlToUpdateNews, password, newsData) {
  try {
    await axios.put(urlToUpdateNews, {
      password: password,
      newsData: newsData,
    });
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'updateNewsOnApiServer', error: `,
    );
  }
};

/**
 * Function to fetch Timetable PDF URL.
 * @param {Object} bodyData - The data to send with the HTTP request.
 * @returns {Promise<string>} - The Timetable PDF URL.
 */
async function fetchTimeTableFileUrl(bodyData) {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(bodyData.triggerBy);
    const drpProgram = encodeURIComponent(bodyData.program);
    const fetchFileFromUrl =
      'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25';
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

    let data = await axios.post(fetchFileFromUrl, postData, {
      headers: rgpvHeaders,
    });
    data = await data.data;
    data = await data.split('ScriptContentWithTags')[1];
    data = await data.split('\\"')[1];
    data = await data.replace(
      '../UC/frm_download_file.aspx?Filepath=',
      'https://www.rgpv.ac.in/',
    );
    return data;
  } catch (error) {
    console.error(`Error in fetchTimeTableFileUrl: ${error.message}`);
    throw error;
  }
}

/**
 * Function to fetch Scheme or Syllabus PDF URL.
 * @param {Object} bodyData - The data to send with the HTTP request.
 * @returns {Promise<string>} - The Scheme or Syllabus PDF URL.
 */
async function fetchSchemeOrSyllabusFileUrl(bodyData) {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(bodyData.triggerBy);
    const drpProgram = bodyData.program;
    const drpUploadType = bodyData.schemeORsyllabus; // 1 for scheme, 2 for syllabus
    const drpSearchGrading = bodyData.pattern;
    const fetchFileFromUrl = 'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpUploadType=${drpUploadType}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&ctl00%24ContentPlaceHolder1%24drpSearchGrading=${drpSearchGrading}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=87DDE0DB&__ASYNCPOST=true&`;

    let data = (
      await axios.post(fetchFileFromUrl, postData, {
        headers: rgpvHeaders,
      })
    ).data;
    data = await data.split('ScriptContentWithTags')[1];
    data = await data.split('\\"')[1];
    data = await data.replace(
      '../UC/frm_download_file.aspx?Filepath=',
      'https://www.rgpv.ac.in/',
    );
    return data;
  } catch (error) {
    console.error(`Error in fetchSchemeOrSyllabusFileUrl: ${error.message}`);
    throw error;
  }
}

module.exports = {
  simpleGetData,
  simplePostData,
  fetchTimeTableFileUrl,
  fetchSchemeOrSyllabusFileUrl,
  updateNewsOnApiServer
};
