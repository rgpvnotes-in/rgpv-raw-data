const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');

const write_info_parameter_data = async () => {
  try {
    const informationData = await cheerioFunctions.ProgramAndSystemList();

    fs.writeFile('dist/info.json', JSON.stringify(informationData), (err) => {
      if (err) {
        console.error('error while writing file');
        return;
      }
      //file written successfully
    });
  } catch (error) {
    console.error('some error occurred');
    write_info_parameter_data();
  }
};
write_info_parameter_data();
