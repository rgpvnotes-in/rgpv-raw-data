const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');
const axiosFunctions = require('./services/axios/index');

const write_timetable_data = async () => {
  try {
    const ttProgramListResponse =
      await cheerioFunctions.stateDataProgramListForTimeTable();

    const ttProgramList = ttProgramListResponse.programList;
    const stateData = ttProgramListResponse.stateData;

    const timeTableDataList = [];

    if (ttProgramList.length === 0) {
      // log if program list length is zero
      console.error('program list array is empty');
    }

    for (const [index, program] of ttProgramList.entries()) {
      const timeTableData = {};

      timeTableData.programName = program.name;
      timeTableData.programId = program.id;
      timeTableData.programDataList = [];

      const postData = {
        state: stateData,
        program: program.id,
      };

      const ttListData = await cheerioFunctions.prepareTimeTableData(postData);

      if (ttListData.length === 0) {
        // log if fileButton list length is zero
        console.error('TT list with data is empty');
      }

      for (const [index, timeTable] of ttListData.entries()) {
        const programData = {};

        programData.title = timeTable.title.trim();
        programData.semester = timeTable.semester.trim();

        const postData = {
          state: stateData,
          program: program.id,
          triggerBy: timeTable.btn,
        };

        const fileUrl = await axiosFunctions.fetchTimeTableFileUrl(postData);

        if (!fileUrl) {
          // log if fileButton list length is zero
          console.error('error while extracting PDF url');
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
          console.error('error while writing file');
          return;
        }
        //file written successfully
      },
    );
  } catch (error) {
    console.error('some error occurred');
    write_timetable_data();
  }
};
write_timetable_data();
