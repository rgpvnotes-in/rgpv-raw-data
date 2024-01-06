const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');

/**
 * Writes timetable data to a JSON file.
 */
const writeTimetableData = async () => {
  try {
    const ttProgramListResponse =
      await cheerioFunctions.stateDataProgramListForTimeTable();

    const ttProgramList = ttProgramListResponse.programList;
    const stateData = ttProgramListResponse.stateData;

    const timeTableDataList = [];

    if (ttProgramList.length === 0) {
      console.error('Program list array is empty');
      return;
    }

    for (const program of ttProgramList) {
      const timeTableData = {
        programName: program.name,
        programId: program.id,
        programDataList: [],
      };

      const postData = {
        state: stateData,
        program: program.id,
      };

      const ttListData = await cheerioFunctions.prepareTimeTableData(postData);

      if (ttListData.length === 0) {
        console.error('TT list with data is empty for program:', program.name);
        continue;
      }

      for (const timeTable of ttListData) {
        const programData = {
          title: timeTable.title.trim(),
          semester: timeTable.semester.trim(),
        };

        const postData = {
          state: stateData,
          program: program.id,
          triggerBy: timeTable.btn,
        };

        const fileUrl = await axiosFunctions.fetchTimeTableFileUrl(postData);

        if (!fileUrl) {
          console.error(
            'Error while extracting PDF URL for program:',
            program.name,
          );
          continue;
        }

        programData.url = fileUrl;
        timeTableData.programDataList.push(programData);
      }

      timeTableDataList.push(timeTableData);
    }

    fs.writeFile(
      'dist/timetable.json',
      JSON.stringify(timeTableDataList),
      (err) => {
        if (err) {
          console.error('Error while writing file', err);
          return;
        }
        console.log('File written successfully');
      },
    );
  } catch (error) {
    console.error('Some error occurred', error);
  }
};

writeTimetableData();
