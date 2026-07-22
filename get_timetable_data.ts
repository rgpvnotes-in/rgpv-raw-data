import { writeFile } from "fs/promises";
import { fetchTimeTableFileUrl } from "./services/axios/index";
import { prepareTimeTableData, stateDataProgramListForTimeTable } from "./services/cheerio/index";
import { withRetry } from "./services/retry/index";

type TimeTableProgramData = {
  title: string;
  semester: string;
  url: string | undefined;
};

type TimeTableProgram = {
  programName: string;
  programId: number;
  programDataList: TimeTableProgramData[];
};

const writeTimeTableData = async (): Promise<void> => {
  const ttProgramListResponse = await stateDataProgramListForTimeTable();

  const ttProgramList = ttProgramListResponse.programList;
  const stateData = ttProgramListResponse.stateData;
  const timeTableDataList: TimeTableProgram[] = [];

  if (ttProgramList.length === 0) {
    console.error("program list array is empty");
  }

  for (const program of ttProgramList) {
    const timeTableData: TimeTableProgram = {
      programName: program.name,
      programId: program.id,
      programDataList: [],
    };

    const postData = {
      state: stateData,
      program: program.id,
    };

    const ttListData = await prepareTimeTableData(postData);

    if (ttListData.length === 0) {
      console.error("TT list with data is empty");
    }

    for (const timeTable of ttListData) {
      const programData: TimeTableProgramData = {
        title: timeTable.title.trim(),
        semester: timeTable.semester.trim(),
        url: undefined,
      };

      const fileUrl = await fetchTimeTableFileUrl({
        state: stateData,
        program: program.id,
        triggerBy: timeTable.btn,
      });

      if (!fileUrl) {
        console.error("error while extracting PDF url");
      }
      programData.url = fileUrl;
      timeTableData.programDataList.push(programData);
    }
    timeTableDataList.push(timeTableData);
  }

  await writeFile("dist/timetable.json", JSON.stringify(timeTableDataList));
};

void withRetry("writeTimeTableData", writeTimeTableData, { retries: 3, delayMs: 1500 });
