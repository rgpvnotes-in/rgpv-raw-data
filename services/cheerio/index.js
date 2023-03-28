const cheerio = require('cheerio');
const axiosFunctions = require('../axios/index');

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
 * This function fetches html page of RGPV university.
 * Search through all the tabs (max 50, realistically there may be 10 tabs at max).
 * Compile a list of all the found news by pushing each news it found on an array.
 * @returns {Array} recentNews
 */

exports.latestAlerts = async () => {
  try {
    const sourceURL = 'https://www.rgpv.ac.in/';
    const html = await axiosFunctions.simpleGetData(sourceURL);
    const $ = cheerio.load(html);
    const recentNews = [];

    for (let tabNumber = 1; tabNumber <= 50; tabNumber++) {
      const alertModal = $(
        `#alert-modal > div > div > div.modal-body > div > div > div:nth-child(${tabNumber})`,
      ).html();

      if (null === alertModal) {
        continue;
      }

      $(alertModal).each(function (i, elem) {
        const news = {};
        news.content = $(this).text().replace('Click Here to View', '').trim();
        let url = $(this).find('a').attr('href')
          ? $(this).find('a').attr('href')
          : null;
        if (url) {
          url = url
            .replace(/\\/g, '/')
            .replace('/CDN/PubContent', 'https://www.rgpv.ac.in/CDN/PubContent')
            .toLowerCase();
        }
        news.url = url;
        recentNews.push(news);
      });
    }
    return recentNews;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'latestAlerts', error: ${error}`,
    );
  }
};

/**
 * This function returns a list of all the programs & system with their respective id's.
 * We are using this for /info end point of the API
 * @returns {Object}
 */
exports.ProgramAndSystemList = async () => {
  try {
    const sourceURL = 'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const html = await axiosFunctions.simpleGetData(sourceURL);
    const $ = cheerio.load(html);
    const programList = [];
    const systemList = [];

    // Prepare program list
    const drpProgramList = $('#ContentPlaceHolder1_drpProgram').html();
    $(drpProgramList).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const program = {};
        program.name = $(this).text().trim();
        program.id = parseInt($(this).attr('value').trim(), 10);
        programList.push(program);
      }
    });

    // Prepare system list
    const drpSystemType = $('#ContentPlaceHolder1_drpSearchGrading').html();
    $(drpSystemType).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const systemType = {};
        systemType.name = $(this).text().trim();
        systemType.id = parseInt($(this).attr('value').trim(), 10);
        systemList.push(systemType);
      }
    });

    return {
      programList: programList,
      systemTypeList: systemList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'ProgramAndSystemList', error: ${error}`,
    );
  }
};

/**
 * This function will return a list of programs & state data
 * @returns {Object}
 */
exports.stateDataProgramListForTimeTable = async () => {
  try {
    const timeTableUrl = 'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=$%';
    const programList = [];

    const html = await axiosFunctions.simpleGetData(timeTableUrl);
    const $ = cheerio.load(html);

    const stateData = $('input#__VIEWSTATE').attr('value');
    const drpProgramList = $('#ContentPlaceHolder1_drpProgram').html();

    $(drpProgramList).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const program = {};
        program.name = $(this).text().trim();
        program.id = parseInt($(this).attr('value').trim(), 10);
        programList.push(program);
      }
    });

    return {
      stateData: stateData,
      programList: programList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'stateDataProgramListForTimeTable', error: ${error}`,
    );
  }
};

/**
 *
 * @param {Object} stateAndProgramData - This object will contain a list of programs & state data
 * @returns {Array} timetableList -This will return list with all table data
 */
exports.prepareTimeTableData = async (stateAndProgramData) => {
  try {
    const fetchDataFromUrl =
      'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25';
    const __VIEWSTATE = encodeURIComponent(stateAndProgramData.state);
    const __EVENTTARGET = encodeURIComponent(
      'ctl00$ContentPlaceHolder1$drpProgram',
    );
    const drpProgram = stateAndProgramData.program;

    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

    const responseData = await axiosFunctions.simplePostData(
      fetchDataFromUrl,
      postData,
      rgpvHeaders,
    );

    const $ = cheerio.load(responseData);
    const tableData = $('#ContentPlaceHolder1_gvViewAct > tbody').html();
    const timetableList = [];
    let semester = '';

    $(tableData).each(function (i, elem) {
      if (0 !== i) {
        let programPostBack = $(this) + '';
        // let title =
        //   $(this).find('.lblHeadingFontType').text().replace(' ', '') +
        //   ' - ' +
        //   $(this).find('.link2').text();

        let title = $(this).find('.link2').text();
        if (
          $(this).find('.lblHeadingFontType').text().replace(' ', '') !== ''
        ) {
          semester = $(this)
            .find('.lblHeadingFontType')
            .text()
            .replace(' ', '');
        }

        programPostBack = programPostBack.split('__doPostBack')[1] + '';
        programPostBack = programPostBack.split("'")[1] + '';

        if ('undefined' !== programPostBack && 'undefined' !== title) {
          const timetable = {
            btn: programPostBack,
            title: title,
            semester: semester,
          };
          timetableList.push(timetable);
        }
      }
    });

    return timetableList;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareTimeTableData', error: ${error}`,
    );
  }
};

/**
 *
 * @param {Object} bodyData - This object will contain state data, program id, drpUploadType (scheme or syllabus) and drpSearchGrading
 * @returns {Array} schemeSyllabusList - A list of all scheme or syllabus data
 */
exports.prepareSchemeOrSyllabusData = async (bodyData) => {
  try {
    const __VIEWSTATE = encodeURIComponent(bodyData.state);
    const __EVENTTARGET = encodeURIComponent(
      'ctl00$ContentPlaceHolder1$drpSearchGrading',
    );
    const drpProgram = bodyData.program;
    const drpUploadType = bodyData.schemeORsyllabus; // 1 for scheme, 2 for syllabus
    const drpSearchGrading = bodyData.pattern;

    const schemeOrSyllabusDataUrl =
      'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpUploadType=${drpUploadType}&ctl00%24ContentPlaceHolder1%24drpProgram=${drpProgram}&ctl00%24ContentPlaceHolder1%24drpSearchGrading=${drpSearchGrading}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=87DDE0DB&__ASYNCPOST=true`;

    const responseData = await axiosFunctions.simplePostData(
      schemeOrSyllabusDataUrl,
      postData,
      rgpvHeaders,
    );

    const $ = cheerio.load(responseData);
    const schemeSyllabusData = $(
      '#ContentPlaceHolder1_gvViewAct > tbody',
    ).html();
    const schemeSyllabusList = [];
    let semester = '';

    $(schemeSyllabusData).each(function (i, elem) {
      if (0 !== i) {
        let programPostBack = $(this) + '';
        // let title =
        //   $(this).find('.lblHeadingFontType').text().replace(' ', '') +
        //   ' - ' +
        //   $(this).find('.link2').text();
        let title = $(this).find('.link2').text();
        if (
          $(this).find('.lblHeadingFontType').text().replace(' ', '') !== ''
        ) {
          semester = $(this)
            .find('.lblHeadingFontType')
            .text()
            .replace(' ', '');
        }
        programPostBack = programPostBack.split('__doPostBack')[1] + '';
        programPostBack = programPostBack.split("'")[1] + '';
        if ('undefined' !== programPostBack && 'undefined' !== title) {
          const schemeSyllabus = {
            btn: programPostBack,
            title: title,
            semester: semester,
          };
          schemeSyllabusList.push(schemeSyllabus);
        }
      }
    });
    return schemeSyllabusList;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareSchemeOrSyllabusData', error: ${error}`,
    );
  }
};

/**
 * This function will prepare stateData, a list of programs, a list of type, a list of system
 * @returns  {Object} - This object will contain stateData, programList, typeList, systemList
 */
exports.prepareSchemeOrSyllabusList = async () => {
  try {
    const sourceURL = 'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const html = await axiosFunctions.simpleGetData(sourceURL);
    const $ = cheerio.load(html);

    const stateData = $('input#__VIEWSTATE').attr('value');
    const drpProgramList = $('#ContentPlaceHolder1_drpProgram').html();
    const programList = [];
    $(drpProgramList).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const program = {};
        program.name = $(this).text().trim();
        program.id = parseInt($(this).attr('value').trim(), 10);
        programList.push(program);
      }
    });

    const drpProgramType = $('#ContentPlaceHolder1_drpUploadType').html();
    const typeList = [];
    $(drpProgramType).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const programType = {};
        programType.name = $(this).text().trim();
        programType.id = parseInt($(this).attr('value').trim(), 10);
        typeList.push(programType);
      }
    });

    const drpSystemType = $('#ContentPlaceHolder1_drpSearchGrading').html();
    const systemList = [];
    $(drpSystemType).each(function (i, elem) {
      if (i !== 0 && i % 2 !== 0) {
        const systemType = {};
        systemType.name = $(this).text().trim();
        systemType.id = parseInt($(this).attr('value').trim(), 10);
        systemList.push(systemType);
      }
    });

    return {
      stateData: stateData,
      programList: programList,
      programTypeList: typeList,
      systemTypeList: systemList,
    };
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'prepareSchemeOrSyllabusList', error: ${error}`,
    );
  }
};
