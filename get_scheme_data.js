const axios = require('axios');
const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');

/**
 * Prepares file data for a given scheme or syllabus entry.
 *
 * @param {object} schemeSyllabusData - Data for a scheme or syllabus entry.
 * @param {object} previousPostData - Previous post data.
 * @returns {Promise<object>} - Prepared file data.
 */
const prepareFileData = async (schemeSyllabusData, previousPostData) => {
  try {
    const postData = {
      state: previousPostData.state,
      program: previousPostData.program,
      schemeORsyllabus: previousPostData.schemeORsyllabus,
      pattern: previousPostData.pattern,
      triggerBy: schemeSyllabusData.btn,
    };

    const data = {
      semester: schemeSyllabusData.semester.trim(),
      title: schemeSyllabusData.title.trim(),
      url: await axiosFunctions.fetchSchemeOrSyllabusFileUrl(postData),
    };

    return data;
  } catch (error) {
    console.error('Error while preparing file data', error);
    return null;
  }
};

/**
 * Prepares scheme or syllabus data for a given post data.
 *
 * @param {object} postData - Post data.
 * @returns {Promise<Array>} - List of prepared file data.
 */
const prepareSchemeSyllabusData = async (postData) => {
  try {
    const schemeSyllabusDataList =
      await cheerioFunctions.prepareSchemeOrSyllabusData(postData);

    if (schemeSyllabusDataList.length === 0) {
      console.log('Scheme data list is empty');
    }

    const preparedFiledata = [];

    for (const schemeSyllabusData of schemeSyllabusDataList) {
      const fileData = await prepareFileData(schemeSyllabusData, postData);
      if (fileData) {
        preparedFiledata.push(fileData);
      }
    }

    return preparedFiledata;
  } catch (error) {
    console.error('Error while preparing schemeSyllabusData', error);
    return [];
  }
};

/**
 * Prepares program data for a given program, scheme list, state data, and type.
 *
 * @param {object} program - Program data.
 * @param {Array} schemeSyllabusSchemeList - List of scheme data.
 * @param {object} stateData - State data.
 * @param {object} type - Type data.
 * @returns {Promise<object>} - Prepared program data.
 */
const prepareProgramData = async (
  program,
  schemeSyllabusSchemeList,
  stateData,
  type,
) => {
  try {
    const programData = {
      name: program.name,
      id: program.id,
      schemes: [],
    };

    for (const scheme of schemeSyllabusSchemeList) {
      const postData = {
        state: stateData,
        program: program.id,
        schemeORsyllabus: type.id,
        pattern: scheme.id,
      };

      const schemeData = {
        name: scheme.name,
        id: scheme.id,
        pdfs: await prepareSchemeSyllabusData(postData),
      };

      programData.schemes.push(schemeData);
    }

    return programData;
  } catch (error) {
    console.error('Error while preparing programData', error);
    return null;
  }
};

/**
 * Retrieves scheme or syllabus data list.
 *
 * @returns {Promise<Array>} - List of scheme or syllabus data.
 */
const schemeSyllabusDataList = async () => {
  try {
    const schemeSyllabusListResponse =
      await cheerioFunctions.prepareSchemeOrSyllabusList();
    const schemeSyllabusProgramList = schemeSyllabusListResponse.programList;
    const schemeSyllabusTypeList = schemeSyllabusListResponse.programTypeList;
    const schemeSyllabusSchemeList = schemeSyllabusListResponse.systemTypeList;
    const stateData = schemeSyllabusListResponse.stateData;

    if (
      schemeSyllabusProgramList.length === 0 ||
      schemeSyllabusTypeList.length === 0 ||
      schemeSyllabusSchemeList.length === 0 ||
      !stateData
    ) {
      console.log('Some data arrays are empty or stateData is null or empty');
      return [];
    }

    const schemeSyllabusFinalList = [];
    const type = { name: 'Scheme', id: 1 };

    const schemeSyllabusTypeData = {
      type: type.name,
      id: type.id,
      programs: [],
    };

    for (const program of schemeSyllabusProgramList) {
      const programData = await prepareProgramData(
        program,
        schemeSyllabusSchemeList,
        stateData,
        type,
      );
      if (programData) {
        schemeSyllabusTypeData.programs.push(programData);
      }
    }

    schemeSyllabusFinalList.push(schemeSyllabusTypeData);
    return schemeSyllabusFinalList;
  } catch (error) {
    console.error('Error while getting schemeSyllabusDataList', error);
    return [];
  }
};

/**
 * Writes data to a JSON file.
 *
 * @param {object} schemeSyllabusFinalData - Final scheme or syllabus data.
 */
const writeData = (schemeSyllabusFinalData) => {
  try {
    fs.writeFile(
      'dist/scheme.json',
      JSON.stringify(schemeSyllabusFinalData),
      (err) => {
        if (err) {
          console.error('Error while writing file', err);
        } else {
          console.log('File written successfully');
        }
      },
    );
  } catch (error) {
    console.error('Error with schemeSyllabusFinalData', error);
  }
};

/**
 * Main function to orchestrate the process.
 */
const mainData = async () => {
  try {
    const schemeSyllabusFinalData = await schemeSyllabusDataList();
    if (schemeSyllabusFinalData.length > 0) {
      writeData(schemeSyllabusFinalData[0].programs);
    }
  } catch (error) {
    console.error('Error with schemeSyllabusFinalData', error);
  }
};

mainData();
