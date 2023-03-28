const axios = require('axios');

/**
 *
 * @param {String} sourceURL - The URL from which we have to fetch the data
 * @returns {String} - The data it received from source page response
 */
exports.simpleGetData = async (sourceURL, responseType = null) => {
  try {
    const config = {
      method: 'get',
    };

    responseType ? (config.responseType = responseType) : '';

    return (await axios.get(sourceURL, config)).data;
  } catch (error) {
    const domainExtractor = new URL(sourceURL).hostname;
    console.error(
      `Something went wrong with this request: Called by: 'simpleGetData' for url ${domainExtractor}, error: ${error}`,
    );
  }
};

/**
 *
 * @param {String} postDataToUrl  - The URL where we want to send the data
 * @param {Object} postData - Post body data
 * @param {Object} customHeaders - Custom header for the post request
 * @param {Object} customBasicAuth - Basic Auth data for the post request
 * @returns
 */
exports.simplePostData = async (
  postDataToUrl,
  postData,
  customHeaders = null,
  customBasicAuth = null,
) => {
  try {
    const options = {};

    customHeaders ? (options.headers = customHeaders) : '';
    customBasicAuth ? (options.auth = customBasicAuth) : '';

    return (await axios.post(postDataToUrl, postData, options)).data;
  } catch (error) {
    const domainExtractor = new URL(postDataToUrl).hostname;
    console.error(
      `Something went wrong with this request: Called by: 'simplePostData' for url ${domainExtractor}, error: ${error}`,
    );
  }
};

/**
 *
 * @param {String} urlToUpdateNews - API server end point to update news Data
 * @param {String} password - Secure password to authenticate
 * @param {Array} newsData - news data to be uploaded on API server DB
 */
exports.updateNewsOnApiServer = async (urlToUpdateNews, password, newsData) => {
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
 *
 * @param {Object} bodyData - This object will contain data that has to be sent with HTTP request
 * @returns {String} This function will return Timetable PDF url
 */
exports.fetchTimeTableFileUrl = async (bodyData) => {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(bodyData.triggerBy);
    const drpProgram = encodeURIComponent(bodyData.program);
    const fetchFileFromUrl =
      'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25';
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

    let data = await axios.post(fetchFileFromUrl, postData, {
      headers: headers,
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
    console.error(
      `Something went wrong with this request: Called by: 'fetchTimeTableFileUrl', error: ${error}`,
    );
  }
};

/**
 *
 * @param {Object} bodyData - This object will contain data that has to be sent with HTTP request
 * @returns {String} This function will return Scheme or Syllabus PDF url
 */
exports.fetchSchemeOrSyllabusFileUrl = async (bodyData) => {
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
        headers: headers,
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
    console.error(
      `Something went wrong with this request: Called by: 'fetchSchemeOrSyllabusFileUrl', error: ${error}`,
    );
  }
};
