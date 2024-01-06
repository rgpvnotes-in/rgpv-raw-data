const { google } = require('googleapis');
const md5 = require('md5');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');
require('dotenv').config();
const axios = require('axios');

const { shareOnSocialMedia } = require('./services/socialMediaShare/index');

const spreadsheetId = process.env.SPREADSHEET_ID;

/**
 * Write data to API server.
 * It takes POST URL from ENV file & using PUT method sends the data from the google sheet to the API server.
 * Password is required to update data on the API server & this password is stored in ENV file.
 */
const writeFullDataToApi = async () => {
  try {
    const urlToUpdateAllNews = process.env.POST_ALL_NEWS_URL;
    const password = process.env.POST_NEWS_PASSWORD;

    let readNews = await readDataFromSheet();
    readNews = readNews.slice(Math.max(readNews.length - 100, 0));

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
    console.error('Error in writeFullDataToApi:', error);
  }
};

/**
 * Write recent news data to the API server.
 * @param {Array} newsData - recent news fetched from RGPV website
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
    console.error('Error in writeRecentDataToApi:', error);
  }
};

/**
 * Read all the available news entries in the google sheet and return them as a response.
 * Credentials.json file is required to read data from the sheet.
 * @returns {Array} - Array of news entries
 */
const readDataFromSheet = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!A2:F',
    });
    return getRows.data.values;
  } catch (error) {
    console.error('Error in readDataFromSheet:', error);
    return [];
  }
};

/**
 * Entry function to manage the entire data flow.
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
    let ApiServerShouldUpdate = false;

    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });

    for (const news of latestAlerts) {
      news.content = news.content.trim();
      news.url = news.url ? news.url.toLowerCase() : null;
      news.shortUrl = null;
      const newsMd5 = news.url
        ? md5(`${news.content}${news.url}`)
        : md5(`${news.content}`);

      const readNews = await readDataFromSheet();

      news.url = encodeURI(news.url);

      const isAvailable = readNews?.find((element) => element[2] === newsMd5);
      if (undefined === isAvailable) {
        if (news.url) {
          const isUrlAvailable = readNews?.find(
            (element) => element[4] === news.url,
          );
          if (undefined === isUrlAvailable) {
            const fetchDataFromUrl = process.env.SHORT_URL_GENERATOR_URL;
            const postData = {
              password: process.env.SHORT_URL_PASSWORD,
              url: news.url,
            };

            try {
              const responseData = await axios.post(fetchDataFromUrl, postData);
              if (responseData && responseData.isSuccess) {
                news.shortUrl = responseData.data.shortened;
              }
            } catch (error) {
              news.shortUrl = null;
              console.error(
                'Failed to generate short URL, returning null:',
                error,
              );
            }
          } else {
            news.shortUrl = isUrlAvailable[5];
          }
        }

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

        await googleSheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: 'Sheet1!A:F',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [alertValue],
          },
        });

        await shareOnSocialMedia(news.content, news.shortUrl || news.url);
      } else {
        console.log('Duplicate entry!');
      }
    }

    if (true === ApiServerShouldUpdate) {
      writeFullDataToApi();

      for (const news of latestAlerts) {
        news.url = news.shortUrl;
        delete news.shortUrl;
      }
      writeRecentDataToApi(latestAlerts);
    }
  } catch (error) {
    console.error('Error in writeDataToSheet:', error);
  }
};

writeDataToSheet();
