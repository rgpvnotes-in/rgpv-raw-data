const { google } = require('googleapis');
const md5 = require('md5');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');
require('dotenv').config();

const { shareOnSocialMedia } = require('./services/socialMediaShare/index');

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
    const latestAlerts = await cheerioFunctions.latestAlerts();
    let ApiServerShouldUpdate = false; // if new entries are found then only update KV for news

    /**
     * Write new news alert to google sheet
     */

    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    for (const news of latestAlerts) {
      news.content = news.content.trim();
      news.url = news.url ? news.url.toLowerCase() : null;
      news.shortUrl = null;
      const newsMd5 = news.url
        ? md5(`${news.content}${news.url}`)
        : md5(`${news.content}`);

      // const newsMd5 = md5(`${news.content}${news.url}`);
      const readNews = await readDataFromSheet();

      if (news.url) {
        const isUrlAvailable = readNews?.find(
          (element) => element[4] === news.url,
        );
        if (undefined == isUrlAvailable) {
          // if not available generate short url
          const fetchDataFromUrl = process.env.SHORT_URL_GENERATOR_URL;
          const postData = {
            password: process.env.SHORT_URL_PASSWORD,
            url: news.url,
          };
          const responseData = await axiosFunctions.simplePostData(
            fetchDataFromUrl,
            postData,
          );
          news.shortUrl = responseData.shortened;
        } else {
          news.shortUrl = isUrlAvailable[5];
        }
      }

      // check if this is a new news alert or already available on sheet
      const isAvailable = readNews?.find((element) => element[2] === newsMd5);
      if (undefined == isAvailable) {
        const accessId = `news_${(readNews?.length ?? 0) + 1}`;
        ApiServerShouldUpdate = true; // new entries are found so API server should be updated

        let today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();

        today = `${dd}/${mm}/${yyyy}`;

        const alertValue = [
          accessId,
          today,
          newsMd5,
          news.content,
          news.url,
          news.shortUrl,
        ];

        // Write row(s) to spreadsheet
        await googleSheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: 'Sheet1!A:F',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [alertValue],
          },
        });

        // after writing news to google sheet share it on social media
        await shareOnSocialMedia(news.content, news.shortUrl);

        // TODO
        // code to make post on social media
      } else {
        console.log('Duplicate entry!');
      }
    }

    if (true === ApiServerShouldUpdate) {
      /**
       * Update all news alert to API server
       */
      writeFullDataToApi();

      /**
       * Update latest news alert to API server
       */
      for (const news of latestAlerts) {
        news.url = news.shortUrl;
        delete news.shortUrl;
      }
      writeRecentDataToApi(latestAlerts);
    }
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeDataToSheet', error: ${error}`,
    );
  }
};

writeDataToSheet();
