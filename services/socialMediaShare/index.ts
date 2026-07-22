import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";

import { postImageUrl } from "../imageGenerator/index";
import { constantHashTag } from "../hashtagGenerator/index";
import { simpleGetData } from "../axios/index";
import { getEnv } from "../env/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = getEnv();

const zohoLoginUrl = "https://accounts.zoho.in/signin?servicename=ZohoSocial";
const zohoHomePage = "https://social.zoho.in/Home.do";
const zohoUsername = env.ZOHO_USERNAME;
const zohoPassword = env.ZOHO_PASSWORD;
const socialMediaPostFileName = "_social_post_image.png";
const separatorBasedOnOs = process.platform === "win32" ? "\\" : "/";
const uploadFilePath = path.relative(
  process.cwd(),
  __dirname + separatorBasedOnOs + socialMediaPostFileName,
);

const waitForTimeout = (milliseconds = 1000): Promise<void> =>
  new Promise((resolveInner) => setTimeout(resolveInner, milliseconds));

export const shareOnSocialMedia = async (
  socialMediaPostCaption = "",
  socialMediaPostUrl = "",
): Promise<boolean | void> => {
  try {
    if (!socialMediaPostCaption) {
      console.log("received empty socialMediaPostCaption");
      return false;
    }

    const keepThisMuchCharacter = socialMediaPostUrl ? 150 : 170;
    const textToPublishWithPost = `${socialMediaPostCaption.substring(
      0,
      keepThisMuchCharacter,
    )} \n\n ${socialMediaPostUrl} \n\n ${constantHashTag}`;
    const socialMediaPostImageUrl = await postImageUrl(socialMediaPostCaption);
    const downloadFilePath = path.resolve(__dirname, socialMediaPostFileName);
    const downloadFileWriter = fs.createWriteStream(downloadFilePath);

    const downloadSocialMediaPostImageUrl = await simpleGetData(socialMediaPostImageUrl, "stream");

    downloadSocialMediaPostImageUrl.pipe(downloadFileWriter);

    await new Promise<void>((resolve, reject) => {
      downloadFileWriter.on("finish", () => resolve());
      downloadFileWriter.on("error", reject);
    });

    const browser = await puppeteer.launch({
      slowMo: 100,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(zohoLoginUrl, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForSelector("#nextbtn");
    await page.type("input#login_id", zohoUsername || "", { delay: 50 });
    await page.click("button#nextbtn");

    await page.waitForSelector("input#password");
    await page.type("input#password", zohoPassword || "", { delay: 50 });
    await page.click("button#nextbtn");

    await page.waitForNavigation();
    await waitForTimeout(5000);

    await page.goto(zohoHomePage, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    await page.waitForSelector("#pconnect");
    await page.click("#top_header_container div.newPostBtn > a.newPostBtn-primary");
    await page.waitForSelector("div#status-dialog-textarea");
    await waitForTimeout(500);
    await page.type("#status-dialog-textarea", textToPublishWithPost, {
      delay: 50,
    });
    await waitForTimeout(500);

    const inputFileUpload = await page.$("#publish_image_attach > div > input");
    if (inputFileUpload) {
      await inputFileUpload.uploadFile(uploadFilePath);
      await inputFileUpload.evaluate((upload) =>
        upload.dispatchEvent(new Event("change", { bubbles: true })),
      );
    }
    await waitForTimeout(10000);

    await page.evaluate(() => {
      const postButton = document.querySelector("#publish_postnow") as HTMLElement | null;
      postButton?.click();
    });

    await waitForTimeout(10000);
    await browser.close();
  } catch (error) {
    console.error("something went wrong", error);
  }
};
