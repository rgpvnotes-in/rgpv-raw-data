import { createHash } from "crypto";
import { google } from "googleapis";
import axios from "axios";
import "dotenv/config";

import { latestAlerts } from "./services/cheerio/index";
import { updateNewsOnApiServer } from "./services/axios/index";
import { shareOnSocialMedia } from "./services/socialMediaShare/index";
import { getEnv } from "./services/env/index";

const env = getEnv();
const spreadsheetId = env.SPREADSHEET_ID;

const md5Hash = (value: string): string => createHash("md5").update(value).digest("hex");

const writeFullDataToApi = async (): Promise<void> => {
  try {
    const urlToUpdateAllNews = env.POST_ALL_NEWS_URL;
    const password = env.POST_NEWS_PASSWORD;

    let readNews = await readDataFromSheet();
    readNews = readNews.slice(Math.max(readNews.length - 100, 0));

    const accessData: Array<{ accessId: string; content: string; url: string | null }> = [];
    for (const news of readNews) {
      accessData.push({
        accessId: news[0],
        content: news[3],
        url: news[5] ?? null,
      });
    }
    await updateNewsOnApiServer(urlToUpdateAllNews, password, accessData);
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeFullDataToApi', error: ${error}`,
    );
  }
};

const writeRecentDataToApi = async (
  newsData: Array<{ content: string; url: string | null }>,
): Promise<void> => {
  try {
    const urlToUpdateRecentNews = env.POST_RECENT_NEWS_URL;
    const password = env.POST_NEWS_PASSWORD;
    await updateNewsOnApiServer(urlToUpdateRecentNews, password, newsData);
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeRecentDataToApi', error: ${error}`,
    );
  }
};

const readDataFromSheet = async (): Promise<string[][]> => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const googleSheets = google.sheets("v4");

    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:F",
    });
    return (getRows.data.values || []) as string[][];
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'readDataFromSheet', error: ${error}`,
    );
    return [];
  }
};

const writeDataToSheet = async (): Promise<void> => {
  try {
    const latestNewsAlerts = await latestAlerts();
    let apiServerShouldUpdate = false;

    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const googleSheets = google.sheets("v4");

    for (const news of latestNewsAlerts as Array<{
      content: string;
      url: string | null;
      shortUrl?: string | null;
    }>) {
      news.content = news.content.trim();
      news.url = news.url ? news.url.toLowerCase() : null;
      news.shortUrl = null;
      const newsMd5 = news.url ? md5Hash(`${news.content}${news.url}`) : md5Hash(`${news.content}`);

      const readNews = await readDataFromSheet();
      news.url = news.url ? encodeURI(news.url) : null;

      const isAvailable = readNews.find((element) => element[2] === newsMd5);
      if (isAvailable === undefined) {
        if (news.url) {
          const isUrlAvailable = readNews.find((element) => element[4] === news.url);
          if (isUrlAvailable === undefined) {
            const fetchDataFromUrl = env.SHORT_URL_GENERATOR_URL;
            try {
              const responseData = await axios.post<
                { shortened?: string } & { isSuccess?: boolean }
              >(fetchDataFromUrl, {
                password: env.SHORT_URL_PASSWORD,
                url: news.url,
              });
              if (responseData?.data?.isSuccess) {
                news.shortUrl = responseData.data.shortened || null;
              }
            } catch (error) {
              news.shortUrl = null;
              console.log("failed to generate short URL, returning null");
              console.log("short URL generation error details:", error);
            }
          } else {
            news.shortUrl = isUrlAvailable[5];
          }
        }

        const accessId = `news_${(readNews.length ?? 0) + 1}`;
        apiServerShouldUpdate = true;

        const todayDate = new Date();
        const dd = String(todayDate.getDate()).padStart(2, "0");
        const mm = String(todayDate.getMonth() + 1).padStart(2, "0");
        const yyyy = todayDate.getFullYear();
        const today = `${dd}/${mm}/${yyyy}`;

        const alertValue = [accessId, today, newsMd5, news.content, news.url, news.shortUrl];

        await googleSheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: "Sheet1!A:F",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [alertValue],
          },
        });

        await shareOnSocialMedia(news.content, news.shortUrl || news.url || "");
      } else {
        console.log("Duplicate entry!");
      }
    }

    if (apiServerShouldUpdate === true) {
      void writeFullDataToApi();

      for (const news of latestNewsAlerts as Array<{
        content: string;
        url: string | null;
        shortUrl?: string | null;
      }>) {
        news.url = news.shortUrl || null;
        delete news.shortUrl;
      }
      void writeRecentDataToApi(latestNewsAlerts as Array<{ content: string; url: string | null }>);
    }
  } catch (error) {
    console.error(
      `Something went wrong with this request: Called by: 'writeDataToSheet', error: ${error}`,
    );
  }
};

void writeDataToSheet();
