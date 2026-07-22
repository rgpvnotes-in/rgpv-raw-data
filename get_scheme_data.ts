import { writeFile } from "fs/promises";
import { fetchSchemeOrSyllabusFileUrl } from "./services/axios/index";
import { prepareSchemeOrSyllabusData, prepareSchemeOrSyllabusList } from "./services/cheerio/index";

type PostData = {
  state: string;
  program: number;
  schemeORsyllabus: number;
  pattern: number;
};

type SchemeSyllabusRow = {
  semester: string;
  title: string;
  url: string | undefined;
};

type ProgramRow = { name: string; id: number };

const prepareFileData = async (
  schemeSyllabusData: { semester: string; title: string; btn: string },
  previousPostData: PostData,
): Promise<SchemeSyllabusRow | undefined> => {
  try {
    const postData = {
      state: previousPostData.state,
      program: previousPostData.program,
      schemeORsyllabus: previousPostData.schemeORsyllabus,
      pattern: previousPostData.pattern,
      triggerBy: schemeSyllabusData.btn,
    };

    return {
      semester: schemeSyllabusData.semester.trim(),
      title: schemeSyllabusData.title.trim(),
      url: await fetchSchemeOrSyllabusFileUrl(postData),
    };
  } catch (error) {
    console.error("error while preparing Filedata", error);
    return await prepareFileData(schemeSyllabusData, previousPostData);
  }
};

const prepareSchemeSyllabusData = async (postData: PostData): Promise<SchemeSyllabusRow[]> => {
  try {
    const schemeSyllabusDataList = await prepareSchemeOrSyllabusData(postData);

    if (schemeSyllabusDataList.length === 0) {
      console.log("scheme data list is empty");
    }
    const preparedFileData: SchemeSyllabusRow[] = [];

    for (const schemeSyllabusData of schemeSyllabusDataList) {
      const row = await prepareFileData(schemeSyllabusData, postData);
      if (row) {
        preparedFileData.push(row);
      }
    }

    return preparedFileData;
  } catch (error) {
    console.error("error while preparing schemeSyllabusData", error);
    return await prepareSchemeSyllabusData(postData);
  }
};

const prepareProgramData = async (
  program: ProgramRow,
  schemeSyllabusSchemeList: ProgramRow[],
  stateData: string,
  type: ProgramRow,
): Promise<
  | {
      name: string;
      id: number;
      schemes: Array<{ name: string; id: number; pdfs: SchemeSyllabusRow[] }>;
    }
  | undefined
> => {
  try {
    const programData = {
      name: program.name,
      id: program.id,
      schemes: [] as Array<{ name: string; id: number; pdfs: SchemeSyllabusRow[] }>,
    };

    for (const scheme of schemeSyllabusSchemeList) {
      const schemeData = {
        name: scheme.name,
        id: scheme.id,
        pdfs: [] as SchemeSyllabusRow[],
      };

      const postData: PostData = {
        state: stateData,
        program: program.id,
        schemeORsyllabus: type.id,
        pattern: scheme.id,
      };
      schemeData.pdfs = await prepareSchemeSyllabusData(postData);
      programData.schemes.push(schemeData);
    }

    return programData;
  } catch (error) {
    console.error("error while preparing ProgramData", error);
    return await prepareProgramData(program, schemeSyllabusSchemeList, stateData, type);
  }
};

const schemeSyllabusDataList = async (): Promise<Array<{ programs: any[] }> | undefined> => {
  try {
    const schemeSyllabusListResponse = await prepareSchemeOrSyllabusList();
    const schemeSyllabusProgramList = schemeSyllabusListResponse.programList;
    const schemeSyllabusTypeList = schemeSyllabusListResponse.programTypeList;
    const schemeSyllabusSchemeList = schemeSyllabusListResponse.systemTypeList;
    const stateData = schemeSyllabusListResponse.stateData;

    if (schemeSyllabusProgramList.length === 0) {
      console.log("program list array is empty");
      return;
    }
    if (schemeSyllabusTypeList.length === 0) {
      console.log("type list array is empty");
      return;
    }
    if (schemeSyllabusSchemeList.length === 0) {
      console.log("scheme list array is empty");
      return;
    }
    if (!stateData) {
      console.log("stateData is null or empty");
      return;
    }

    const schemeSyllabusFinalList: Array<{ type: string; id: number; programs: any[] }> = [];
    const type = { name: "Scheme", id: 1 };
    const schemeSyllabusTypeData = { type: type.name, id: type.id, programs: [] as any[] };

    for (const program of schemeSyllabusProgramList) {
      const preparedProgramData = await prepareProgramData(
        program,
        schemeSyllabusSchemeList,
        stateData,
        type,
      );
      if (preparedProgramData) {
        schemeSyllabusTypeData.programs.push(preparedProgramData);
      }
    }

    schemeSyllabusFinalList.push(schemeSyllabusTypeData);
    return schemeSyllabusFinalList;
  } catch (error) {
    console.error("some error occurred while getting schemeSyllabusDataList", error);
    return await schemeSyllabusDataList();
  }
};

const writeData = async (schemeSyllabusFinalData: any[]): Promise<void> => {
  try {
    await writeFile("dist/scheme.json", JSON.stringify(schemeSyllabusFinalData));
  } catch (error) {
    console.error("some error occurred with schemeSyllabusFinalData", error);
    await writeData(schemeSyllabusFinalData);
  }
};

const mainData = async (): Promise<void> => {
  try {
    const schemeSyllabusFinalData = await schemeSyllabusDataList();
    if (schemeSyllabusFinalData) {
      await writeData(schemeSyllabusFinalData[0].programs);
    }
  } catch (error) {
    console.error("some error occurred with schemeSyllabusFinalData", error);
    await mainData();
  }
};

void mainData();
