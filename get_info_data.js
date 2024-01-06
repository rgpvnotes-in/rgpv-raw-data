const fs = require('fs');
const cheerioFunctions = require('./services/cheerio/index');

/**
 * Writes information data to a JSON file.
 * @async
 */
const writeInformationDataToFile = async () => {
  try {
    // Fetch information data using Cheerio
    const informationData = await cheerioFunctions.ProgramAndSystemList();

    // Write the data to a JSON file
    fs.writeFile('dist/info.json', JSON.stringify(informationData), (err) => {
      if (err) {
        console.error('Error while writing file:', err);
        return;
      }
      console.log('File written successfully.');
    });
  } catch (error) {
    console.error('Some error occurred:', error);
    // Retry the function in case of an error
    writeInformationDataToFile();
  }
};

// Start the process
writeInformationDataToFile();
