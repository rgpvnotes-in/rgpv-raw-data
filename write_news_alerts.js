const { google } = require('googleapis');
const md5 = require('md5');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');
const { postImageUrl } = require('./services/imageGenerator/index')
require('dotenv').config();

const spreadsheetId = process.env.SPREADSHEET_ID;

/**
 * Write data to API server.
 * It takes POST url from ENV file & using PUT method send the data from google sheet to API server.
 * Password is required to update data on API server & this password is stored in ENV file.
 */

const writeFullDataToApi = async () => {
  try {
    const urlToUpdateAllNews = process.env.POST_ALL_NEWS_URL;
    const password = process.env.POST_NEWS_PASSWORD;

    let readNews = await readDataFromSheet(); // read all data from google sheet
    readNews = readNews.slice(Math.max(readNews.length - 100, 0)); // slice to only show last 100 entry

    const accessData = [];
    for (const news of readNews) {
      const data = {
        accessId: news[0],
        content: news[3],
        url: news[5] ?? null,
      };
      accessData.push(data);
    }
    await axiosFunctions.updateNewsOnApiServer(
      urlToUpdateAllNews,
      password,
      accessData,
    );
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeFullDataToApi', error: ${error}`,
    );
  }
};

/**
 * @params Array - recent news fetched from RGPV website
 * Write data to Recent API server.
 * It takes POST url from ENV file & using PUT method send the data from RGPV website to API server.
 * Password is required to update data on API server & this password is stored in ENV file.
 */

const writeRecentDataToApi = async (newsData) => {
  try {
    const urlToUpdateRecentNews = process.env.POST_RECENT_NEWS_URL;
    const password = process.env.POST_NEWS_PASSWORD;
    await axiosFunctions.updateNewsOnApiServer(
      urlToUpdateRecentNews,
      password,
      newsData,
    );
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeRecentDataToApi', error: ${error}`,
    );
  }
};

/**
 * It reads all the available news entry in google sheet & return them as response.
 * Credentials.json file is required to read data from sheet.
 *
 * @returns Array
 */

const readDataFromSheet = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    // Read rows from spreadsheet
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!A2:F',
    });
    return getRows.data.values;
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'readDataFromSheet', error: ${error}`,
    );
  }
};

/**
 * This is entry function
 * 1. Gets list of recent news from rgpv website.
 * 2. Write recent news data to API server
 * 3. Check if there is any new news alerts available on that file.
 * 4. If any new alert is present it will add it in the google sheet.
 * 5. If news alert is already available in the list it will just console log the message.
 * 6. Trigger writeFullDataToApi function to write data on API server.
 */

const writeDataToSheet = async () => {
  try {

    postImageUrl('just a test post, please ignore this');


  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeDataToSheet', error: ${error}`,
    );
  }
};

writeDataToSheet();
