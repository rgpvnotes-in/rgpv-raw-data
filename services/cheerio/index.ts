import * as cheerio from "cheerio";
import { simpleGetData, simplePostData } from "../axios/index";

type Program = { name: string; id: number };
type RowItem = { btn: string; title: string; semester: string };

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

export const latestAlerts = async (): Promise<Array<{ content: string; url: string | null }>> => {
  try {
    const sourceURL = "https://www.rgpv.ac.in/";
    const html = await simpleGetData(sourceURL);
    const $ = cheerio.load(html);
    const recentNews: Array<{ content: string; url: string | null }> = [];

    for (let tabNumber = 1; tabNumber <= 50; tabNumber++) {
      const alertModal = $(
        `#alert-modal > div > div > div.modal-body > div > div > div:nth-child(${tabNumber})`,
      ).html();

      if (alertModal === null) {
        continue;
      }

      const modalDom = cheerio.load(alertModal);
      modalDom("*").each((_, elem) => {
        const text = modalDom(elem).text().replace("Click Here to View", "").trim();
        if (!text) {
          return;
        }

        let url = modalDom(elem).find("a").attr("href")
          ? modalDom(elem).find("a").attr("href")!
          : null;
        if (url) {
          url = url
            .replace(/\\/g, "/")
            .replace("/CDN/PubContent", "https://www.rgpv.ac.in/CDN/PubContent")
            .toLowerCase();
        }

        recentNews.push({
          content: text,
          url,
        });
      });
    }
    return recentNews;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'latestAlerts', error: ${error}`,
    );
    return [];
  }
};

export const ProgramAndSystemList = async (): Promise<{
  programList: Program[];
  systemTypeList: Program[];
}> => {
  try {
    const sourceURL = "https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx";
    const html = await simpleGetData(sourceURL);
    const $ = cheerio.load(html);
    const programList: Program[] = [];
    const systemList: Program[] = [];

    const drpProgramList = $("#ContentPlaceHolder1_drpProgram").html();
    const programDom = cheerio.load(drpProgramList || "");
    programDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = programDom(elem).attr("value");
        if (!value) {
          return;
        }
        programList.push({
          name: programDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    const drpSystemType = $("#ContentPlaceHolder1_drpSearchGrading").html();
    const systemDom = cheerio.load(drpSystemType || "");
    systemDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = systemDom(elem).attr("value");
        if (!value) {
          return;
        }
        systemList.push({
          name: systemDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    return {
      programList,
      systemTypeList: systemList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'ProgramAndSystemList', error: ${error}`,
    );
    return { programList: [], systemTypeList: [] };
  }
};

export const stateDataProgramListForTimeTable = async (): Promise<{
  stateData: string;
  programList: Program[];
}> => {
  try {
    const timeTableUrl = "https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=$%";
    const programList: Program[] = [];

    const html = await simpleGetData(timeTableUrl);
    const $ = cheerio.load(html);

    const stateData = ($("input#__VIEWSTATE").attr("value") || "") as string;
    const drpProgramList = $("#ContentPlaceHolder1_drpProgram").html();
    const programDom = cheerio.load(drpProgramList || "");
    programDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = programDom(elem).attr("value");
        if (!value) {
          return;
        }
        programList.push({
          name: programDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    return {
      stateData,
      programList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'stateDataProgramListForTimeTable', error: ${error}`,
    );
    return { stateData: "", programList: [] };
  }
};

export const prepareTimeTableData = async (stateAndProgramData: {
  state: string;
  program: number;
}): Promise<RowItem[]> => {
  try {
    const fetchDataFromUrl = "https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25";
    const __VIEWSTATE = encodeURIComponent(stateAndProgramData.state);
    const __EVENTTARGET = encodeURIComponent("ctl00$ContentPlaceHolder1$drpProgram");
    const drpProgram = stateAndProgramData.program;

    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

    const responseData = await simplePostData(fetchDataFromUrl, postData, rgpvHeaders);

    const $ = cheerio.load(responseData || "");
    const tableData = $("#ContentPlaceHolder1_gvViewAct > tbody").html();
    const tableDom = cheerio.load(tableData || "");
    const timetableList: RowItem[] = [];
    let semester = "";

    tableDom("tr").each((index, elem) => {
      if (index !== 0) {
        let programPostBack = tableDom(elem).html() || "";
        let title = tableDom(elem).find(".link2").text();
        if (tableDom(elem).find(".lblHeadingFontType").text().replace(" ", "") !== "") {
          semester = tableDom(elem).find(".lblHeadingFontType").text().replace(" ", "");
        }

        programPostBack = programPostBack.split("__doPostBack")[1] + "";
        programPostBack = programPostBack.split("'")[1] + "";

        if (programPostBack !== "undefined" && title !== "undefined") {
          timetableList.push({
            btn: programPostBack,
            title,
            semester,
          });
        }
      }
    });

    return timetableList;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareTimeTableData', error: ${error}`,
    );
    return [];
  }
};

export const prepareSchemeOrSyllabusData = async (bodyData: {
  state: string;
  program: number;
  schemeORsyllabus: number;
  pattern: number;
}): Promise<RowItem[]> => {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent("ctl00$ContentPlaceHolder1$drpSearchGrading");
    const drpProgram = bodyData.program;
    const drpUploadType = bodyData.schemeORsyllabus;
    const drpSearchGrading = bodyData.pattern;

    const schemeOrSyllabusDataUrl = "https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx";
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpUploadType=${drpUploadType}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&ctl00%24ContentPlaceHolder1%24drpSearchGrading=${drpSearchGrading}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=87DDE0DB&__ASYNCPOST=true`;

    const responseData = await simplePostData(schemeOrSyllabusDataUrl, postData, rgpvHeaders);
    const $ = cheerio.load(responseData || "");
    const schemeSyllabusData = $("#ContentPlaceHolder1_gvViewAct > tbody").html();
    const tableDom = cheerio.load(schemeSyllabusData || "");
    const schemeSyllabusList: RowItem[] = [];
    let semester = "";

    tableDom("tr").each((index, elem) => {
      if (index !== 0) {
        let programPostBack = tableDom(elem).html() || "";
        let title = tableDom(elem).find(".link2").text();
        if (tableDom(elem).find(".lblHeadingFontType").text().replace(" ", "") !== "") {
          semester = tableDom(elem).find(".lblHeadingFontType").text().replace(" ", "");
        }
        programPostBack = programPostBack.split("__doPostBack")[1] + "";
        programPostBack = programPostBack.split("'")[1] + "";
        if (programPostBack !== "undefined" && title !== "undefined") {
          schemeSyllabusList.push({
            btn: programPostBack,
            title,
            semester,
          });
        }
      }
    });
    return schemeSyllabusList;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareSchemeOrSyllabusData', error: ${error}`,
    );
    return [];
  }
};

export const prepareSchemeOrSyllabusList = async (): Promise<{
  stateData: string;
  programList: Program[];
  programTypeList: Program[];
  systemTypeList: Program[];
}> => {
  try {
    const sourceURL = "https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx";
    const html = await simpleGetData(sourceURL);
    const $ = cheerio.load(html);

    const stateData = ($("input#__VIEWSTATE").attr("value") || "") as string;
    const programList: Program[] = [];
    const typeList: Program[] = [];
    const systemList: Program[] = [];

    const drpProgramList = $("#ContentPlaceHolder1_drpProgram").html();
    const programDom = cheerio.load(drpProgramList || "");
    programDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = programDom(elem).attr("value");
        if (!value) {
          return;
        }
        programList.push({
          name: programDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    const drpProgramType = $("#ContentPlaceHolder1_drpUploadType").html();
    const typeDom = cheerio.load(drpProgramType || "");
    typeDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = typeDom(elem).attr("value");
        if (!value) {
          return;
        }
        typeList.push({
          name: typeDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    const drpSystemType = $("#ContentPlaceHolder1_drpSearchGrading").html();
    const systemDom = cheerio.load(drpSystemType || "");
    systemDom("option").each((index, elem) => {
      if (index !== 0) {
        const value = systemDom(elem).attr("value");
        if (!value) {
          return;
        }
        systemList.push({
          name: systemDom(elem).text().trim(),
          id: parseInt(value.trim(), 10),
        });
      }
    });

    return {
      stateData,
      programList,
      programTypeList: typeList,
      systemTypeList: systemList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareSchemeOrSyllabusList', error: ${error}`,
    );
    return {
      stateData: "",
      programList: [],
      programTypeList: [],
      systemTypeList: [],
    };
  }
};
