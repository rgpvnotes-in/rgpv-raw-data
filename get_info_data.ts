import { writeFile } from "fs/promises";
import { ProgramAndSystemList } from "./services/cheerio/index";

const writeInfoParameterData = async (): Promise<void> => {
  try {
    const informationData = await ProgramAndSystemList();
    await writeFile("dist/info.json", JSON.stringify(informationData));
  } catch (error) {
    console.error("some error occurred", error);
    await writeInfoParameterData();
  }
};

void writeInfoParameterData();
