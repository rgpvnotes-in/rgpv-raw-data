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
 * Fetches the latest alerts from the RGPV university website.
 * @returns {Promise<Array>} An array of recent news objects.
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

      if (!alertModal) {
        continue;
      }

      $(alertModal).each(function (i, elem) {
        const news = {};
        news.content = $(this).text().replace('Click Here to View', '').trim();
        let url = $(this).find('a').attr('href') || null;
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
    console.error(`Error in latestAlerts: ${error}`);
  }
};

/**
 * Retrieves a list of programs and system types from the RGPV website.
 * @returns {Promise<Object>} An object containing programList and systemTypeList.
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
      programList,
      systemTypeList: systemList,
    };
  } catch (error) {
    console.error(`Error in ProgramAndSystemList: ${error}`);
  }
};

/**
 * Fetches state data and program list for the timetable.
 * @returns {Object} - An object containing state data and program list.
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
        const program = {
          name: $(this).text().trim(),
          id: parseInt($(this).attr('value').trim(), 10),
        };
        programList.push(program);
      }
    });

    return {
      stateData,
      programList,
    };
  } catch (error) {
    console.error(`Error in 'stateDataProgramListForTimeTable': ${error}`);
  }
};

/**
 * Fetches timetable data based on state and program information.
 * @param {Object} stateAndProgramData - An object containing state data and program id.
 * @returns {Array} - An array containing timetable data.
 */
exports.prepareTimeTableData = async (stateAndProgramData) => {
  try {
    const fetchDataFromUrl = 'https://www.rgpv.ac.in/Uni/frm_ViewTT.aspx?id=%24%25';
    const { state, program } = stateAndProgramData;

    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7Cctl00%24ContentPlaceHolder1%24drpProgram&ctl00%24ContentPlaceHolder1%24drpProgram=${program}&__EVENTTARGET=ctl00$ContentPlaceHolder1$drpProgram&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${encodeURIComponent(state)}&__VIEWSTATEGENERATOR=E4409011&__ASYNCPOST=true&`;

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
      if (i !== 0) {
        const programPostBack = $(this).toString().split('__doPostBack')[1]?.split("'")[1]?.trim();
        const title = $(this).find('.link2').text().trim();

        if ($(this).find('.lblHeadingFontType').text().trim() !== '') {
          semester = $(this).find('.lblHeadingFontType').text().trim();
        }

        if (programPostBack && title) {
          const timetable = {
            btn: programPostBack,
            title,
            semester,
          };
          timetableList.push(timetable);
        }
      }
    });

    return timetableList;
  } catch (error) {
    console.error(`Error in 'prepareTimeTableData': ${error}`);
  }
};

/**
 * Fetches scheme or syllabus data based on provided parameters.
 * @param {Object} bodyData - An object containing state data, program id, schemeORsyllabus, and pattern.
 * @returns {Array} - An array containing scheme or syllabus data.
 */
exports.prepareSchemeOrSyllabusData = async (bodyData) => {
  try {
    const { state, program, schemeORsyllabus, pattern } = bodyData;
    const __VIEWSTATE = encodeURIComponent(state);
    const __EVENTTARGET = encodeURIComponent('ctl00$ContentPlaceHolder1$drpSearchGrading');

    const schemeOrSyllabusDataUrl = 'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const postData = `ctl00%24ScriptManager1=ctl00%24ContentPlaceHolder1%24UpdatePanel1%7C${__EVENTTARGET}&ctl00%24ContentPlaceHolder1%24drpUploadType=${schemeORsyllabus}&ctl00%24ContentPlaceHolder1%24drpProgram=${program}&ctl00%24ContentPlaceHolder1%24drpSearchGrading=${pattern}&__EVENTTARGET=${__EVENTTARGET}&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=${__VIEWSTATE}&__VIEWSTATEGENERATOR=87DDE0DB&__ASYNCPOST=true`;

    const responseData = await axiosFunctions.simplePostData(
      schemeOrSyllabusDataUrl,
      postData,
      rgpvHeaders,
    );
    const $ = cheerio.load(responseData.data);
    const schemeSyllabusData = $('#ContentPlaceHolder1_gvViewAct > tbody').html();
    const schemeSyllabusList = [];
    let semester = '';

    $(schemeSyllabusData).each(function (i, elem) {
      if (i !== 0) {
        const programPostBack = $(this).toString().split('__doPostBack')[1]?.split("'")[1]?.trim();
        const title = $(this).find('.link2').text().trim();

        if ($(this).find('.lblHeadingFontType').text().trim() !== '') {
          semester = $(this).find('.lblHeadingFontType').text().trim();
        }

        if (programPostBack && title) {
          const schemeSyllabus = {
            btn: programPostBack,
            title,
            semester,
          };
          schemeSyllabusList.push(schemeSyllabus);
        }
      }
    });

    return schemeSyllabusList;
  } catch (error) {
    console.error(`Error in 'prepareSchemeOrSyllabusData': ${error}`);
  }
};

/**
 * Fetches state data, program list, program type list, and system type list.
 * @returns {Object} - An object containing state data, program list, program type list, and system type list.
 */
exports.prepareSchemeOrSyllabusList = async () => {
  try {
    const sourceURL = 'https://www.rgpv.ac.in/Uni/frm_ViewScheme.aspx';
    const html = await axiosFunctions.simpleGetData(sourceURL);
    const $ = cheerio.load(html.data);

    const stateData = $('input#__VIEWSTATE').attr('value');
    const drpProgramList = $('#ContentPlaceHolder1_drpProgram').html();
    const drpProgramType = $('#ContentPlaceHolder1_drpUploadType').html();
    const drpSystemType = $('#ContentPlaceHolder1_drpSearchGrading').html();

    const programList = parseDropdownOptions(drpProgramList);
    const programTypeList = parseDropdownOptions(drpProgramType);
    const systemTypeList = parseDropdownOptions(drpSystemType);

    return {
      stateData,
      programList,
      programTypeList,
      systemTypeList,
    };
  } catch (error) {
    console.error(`Error in 'prepareSchemeOrSyllabusList': ${error}`);
  }
};

/**
 * Parses dropdown options and returns an array of objects with name and id.
 * @param {string} dropdownHtml - HTML content of a dropdown element.
 * @returns {Array} - An array containing objects with name and id properties.
 */
function parseDropdownOptions(dropdownHtml) {
  const options = [];

  $(dropdownHtml).each(function (i, elem) {
    if (i !== 0 && i % 2 !== 0) {
      const option = {
        name: $(this).text().trim(),
        id: parseInt($(this).attr('value').trim(), 10),
      };
      options.push(option);
    }
  });

  return options;
}

