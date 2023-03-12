const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');

const prepareFiledata = async (schemeSyllabusData, previousPostData) => {
  try {
    const postData = {
      state: previousPostData.state,
      program: previousPostData.program,
      schemeORsyllabus: previousPostData.schemeORsyllabus,
      pattern: previousPostData.pattern,
      triggerBy: schemeSyllabusData.btn,
    };

    const data = {};
    data.semester = schemeSyllabusData.semester.trim();
    data.title = schemeSyllabusData.title.trim();
    data.url = await axiosFunctions.fetchSchemeOrSyllabusFileUrl(postData);
    return data;
  } catch (error) {
    console.error('error while preparing Filedata', error);
    prepareFiledata(schemeSyllabusData, previousPostData);
  }
};

const prepareSchemeSyllabusData = async (postData) => {
  try {
    const schemeSyllabusDataList =
      await cheerioFunctions.prepareSchemeOrSyllabusData(postData);

    if (schemeSyllabusDataList.length === 0) {
      // log if scheme Syllabus List length is zero
      console.log('Syllabus data list is empty');
    }
    const preparedFiledata = [];

    for (const [
      index,
      schemeSyllabusData,
    ] of schemeSyllabusDataList.entries()) {
      preparedFiledata.push(
        await prepareFiledata(schemeSyllabusData, postData),
      );
    }

    return preparedFiledata;
  } catch (error) {
    console.error('error while preparing schemeSyllabusData', error);
    prepareSchemeSyllabusData(postData);
  }
};

const prepareProgramData = async (
  program,
  schemeSyllabusSchemeList,
  stateData,
  type,
) => {
  try {
    const programData = {};

    programData.name = program.name;
    programData.id = program.id;
    programData.syllabus = [];

    for (const [index, scheme] of schemeSyllabusSchemeList.entries()) {
      const schemeData = {};

      schemeData.name = scheme.name;
      schemeData.id = scheme.id;
      schemeData.pdfs = [];

      const postData = {
        state: stateData,
        program: program.id,
        schemeORsyllabus: type.id,
        pattern: scheme.id,
      };
      schemeData.pdfs = await prepareSchemeSyllabusData(postData);
      programData.syllabus.push(schemeData);
    }

    return programData;
  } catch (error) {
    console.error('error while preparing ProgramData', error);
    prepareProgramData(program, schemeSyllabusSchemeList, stateData, type);
  }
};

const schemeSyllabusDataList = async () => {
  try {
    // make axios get call
    const schemeSyllabusListResponse =
      await cheerioFunctions.prepareSchemeOrSyllabusList();

    const schemeSyllabusProgramList = schemeSyllabusListResponse.programList;

    const schemeSyllabusTypeList = schemeSyllabusListResponse.programTypeList;

    const schemeSyllabusSchemeList = schemeSyllabusListResponse.systemTypeList;

    const stateData = schemeSyllabusListResponse.stateData;

    if (schemeSyllabusProgramList.length === 0) {
      // log if program list length is zero
      console.log('program list array is empty');
      return;
    }

    if (schemeSyllabusTypeList.length === 0) {
      // log if type list length is zero
      console.log('type list array is empty');
      return;
    }

    if (schemeSyllabusSchemeList.length === 0) {
      // log if scheme list length is zero
      console.log('scheme list array is empty');
      return;
    }

    if (!stateData) {
      // log if stateData is null or empty
      console.log('stateData is null or empty');
      return;
    }

    const schemeSyllabusFinalList = [];

    const type = { name: 'Syllabus', id: 2 };

    const schemeSyllabusTypeData = {};
    schemeSyllabusTypeData.type = type.name; // scheme h ya syllabus
    schemeSyllabusTypeData.id = type.id;
    schemeSyllabusTypeData.programs = [];

    for (const [index, program] of schemeSyllabusProgramList.entries()) {
      schemeSyllabusTypeData.programs.push(
        await prepareProgramData(
          program,
          schemeSyllabusSchemeList,
          stateData,
          type,
        ),
      );
    }

    schemeSyllabusFinalList.push(schemeSyllabusTypeData);

    return schemeSyllabusFinalList;
  } catch (error) {
    console.error(
      'some error occurred while getting schemeSyllabusDataList',
      error,
    );
    schemeSyllabusDataList();
  }
};

const write_data = async (schemeSyllabusFinalData) => {
  try {
    fs.writeFile(
      'dist/syllabus.json',
      JSON.stringify(schemeSyllabusFinalData),
      (err) => {
        if (err) {
          console.error('error while writing file', err);
          write_data(schemeSyllabusFinalData);
          return;
        }
        //file written successfully
      },
    );
  } catch (error) {
    console.error('some error occurred with schemeSyllabusFinalData', error);
    write_data(schemeSyllabusFinalData);
  }
};

const main_data = async () => {
  try {
    const schemeSyllabusFinalData = await schemeSyllabusDataList();

    write_data(schemeSyllabusFinalData[0].programs);
  } catch (error) {
    console.error('some error occurred with schemeSyllabusFinalData', error);
    main_data();
  }
};

main_data();
