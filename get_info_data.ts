import { writeFile } from "fs/promises";
import { ProgramAndSystemList } from "./services/cheerio/index";
import { withRetry } from "./services/retry/index";

const writeInfoParameterData = async (): Promise<void> => {
  const informationData = await ProgramAndSystemList();
  await writeFile("dist/info.json", JSON.stringify(informationData));
};

void withRetry("writeInfoParameterData", writeInfoParameterData, { retries: 3, delayMs: 1500 });
