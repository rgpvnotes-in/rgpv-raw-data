import axios from "axios";

const rgpvHeaders = {
  authority: "www.rgpv.ac.in",
  "sec-ch-ua": '"Chromium";v="94", "Google Chrome";v="94", ";Not A Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "cache-control": "no-cache",
  "x-requested-with": "XMLHttpRequest",
  "x-microsoftajax": "Delta=true",
  "sec-ch-ua-platform": '"Windows"',
  accept: "*/*",
  origin: "https://www.rgpv.ac.in",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  referer: "https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=$%",
  "accept-language": "en-GB,en;q=0.9",
  cookie: "ASP.NET_SessionId=hznbm3vovcoagebriewkhpw0",
  dnt: "1",
  "sec-gpc": "1",
};

export const simpleGetData = async (
  sourceURL: string,
  responseType: "stream" | null = null,
): Promise<any> => {
  try {
    const config: Record<string, any> = {
      method: "get",
    };

    if (responseType) {
      config.responseType = responseType;
    }

    return (await axios.get(sourceURL, config)).data;
  } catch (error) {
    const domainExtractor = new URL(sourceURL).hostname;
    console.error(
      `Something went wrong with this request: Called by: 'simpleGetData' for url ${domainExtractor}, error: ${error}`,
    );
  }
};

export const simplePostData = async (
  postDataToUrl: string,
  postData: any,
  customHeaders: Record<string, string> | null = null,
  customBasicAuth: { username: string; password: string } | null = null,
): Promise<any> => {
  try {
    const options: Record<string, any> = {};

    if (customHeaders) {
      options.headers = customHeaders;
    }
    if (customBasicAuth) {
      options.auth = customBasicAuth;
    }

    let responseFromServer;
    if (customHeaders || customBasicAuth) {
      console.log("customHeaders value ", !!customHeaders);
      console.log("customBasicAuth value ", !!customBasicAuth);
      responseFromServer = await axios.post(postDataToUrl, postData, options);
    } else {
      console.log("else condition inside simplePostData function");
      responseFromServer = await axios.post(postDataToUrl, postData);
      console.log(`${JSON.stringify(responseFromServer.data)}`);
    }

    return responseFromServer.data;
  } catch (error) {
    const domainExtractor = new URL(postDataToUrl).hostname;
    console.error(
      `Something went wrong with this request: Called by: 'simplePostData' for url ${domainExtractor}, error: ${error}`,
    );
  }
};

export const simplePostData2 = async (fetchDataFromUrl: string, postData: any): Promise<any> => {
  try {
    return (await axios.post(fetchDataFromUrl, postData)).data;
  } catch (error) {
    const domainExtractor = new URL(fetchDataFromUrl).hostname;
    console.error(
      `Something went wrong with this request: Called by: 'simplePostData' for url ${domainExtractor}, error: ${error}`,
    );
  }
};

export const updateNewsOnApiServer = async (
  urlToUpdateNews: string,
  password: string | undefined,
  newsData: any[],
): Promise<void> => {
  try {
    await axios.put(urlToUpdateNews, {
      password,
      newsData,
    });
  } catch (error) {
    console.error(
      "Something went wrong with this request: Called by: 'updateNewsOnApiServer', error: ",
      error,
    );
  }
};

export const fetchTimeTableFileUrl = async (bodyData: {
  state: string;
  triggerBy: string;
  program: number;
}): Promise<string | undefined> => {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(bodyData.triggerBy);
    const drpProgram = encodeURIComponent(bodyData.program);
    const fetchFileFromUrl = "https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25";
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

    let data = await axios.post(fetchFileFromUrl, postData, {
      headers: rgpvHeaders,
    });
    let responseData = data.data as string;
    responseData = responseData.split("ScriptContentWithTags")[1] as string;
    responseData = responseData.split('\\"')[1] as string;
    responseData = responseData.replace(
      "../UC/frm_download_file.aspx?Filepath=",
      "https://www.rgpv.ac.in/",
    );
    return responseData;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'fetchTimeTableFileUrl', error: ${error}`,
    );
  }
};

export const fetchSchemeOrSyllabusFileUrl = async (bodyData: {
  state: string;
  triggerBy: string;
  program: number;
  schemeORsyllabus: number;
  pattern: number;
}): Promise<string | undefined> => {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(bodyData.triggerBy);
    const drpProgram = bodyData.program;
    const drpUploadType = bodyData.schemeORsyllabus; // 1 for scheme, 2 for syllabus
    const drpSearchGrading = bodyData.pattern;
    const fetchFileFromUrl = "https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx";
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpUploadType=${drpUploadType}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&ctl00%24ContentPlaceHolder1%24drpSearchGrading=${drpSearchGrading}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=87DDE0DB&__ASYNCPOST=true&`;

    let data = (
      await axios.post(fetchFileFromUrl, postData, {
        headers: rgpvHeaders,
      })
    ).data as string;
    data = data.split("ScriptContentWithTags")[1] as string;
    data = data.split('\\"')[1] as string;
    data = data.replace("../UC/frm_download_file.aspx?Filepath=", "https://www.rgpv.ac.in/");
    return data;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'fetchSchemeOrSyllabusFileUrl', error: ${error}`,
    );
  }
};
