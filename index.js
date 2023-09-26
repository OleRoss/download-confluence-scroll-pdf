const core = require('@actions/core');
const github = require('@actions/github');
const os = require('os');
const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main(serverUrl, pageId, scope, templateId) {
  try {
    const bearerAutorization = process.env['SCROLL_PDF_BEARER'];
    // Starting export
    console.log(`Starting to export page ${pageId} with scope ${scope} and template ${templateId} on ${serverUrl}!`);
    const startExportResponse = await fetch(`${serverUrl}/api/public/1/exports`, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerAutorization}`
    },
      body: JSON.stringify({
        pageId: pageId,
        scope: scope,
        templateId: templateId
      })
    });
    if (startExportResponse.status !== 200) { throw new Error(`Starting export failed with status ${startExportResponse.status}`); }
    const startExportData = await startExportResponse.json();
    const jobId = startExportData.jobId;
    console.log(`Started export resulted in: ${JSON.stringify(startExportData)}`)

    let isFinishedPollData;
    while(true) {
      const isFinishedPollResponse = await fetch(`${serverUrl}/api/public/1/exports/${jobId}/status`, {
        headers: {'Authorization': `Bearer ${bearerAutorization}`}
      });
      if (isFinishedPollResponse.status !== 200) { throw new Error(`Polling for finish failed with status ${isFinishedPollResponse.status}`); }
      isFinishedPollData = await isFinishedPollResponse.json();
      if (isFinishedPollData.status !== "complete") {
        console.log(`Generating at step ${isFinishedPollData.step}: ${isFinishedPollData.stepProgress}%`);
        await delay(500);
        continue;
      }
      break;
    }
    console.log(`Generation succeeded for ${JSON.stringify(isFinishedPollData)}`);

    const filePath = `${os.tmpdir()}/${jobId}.pdf`;
    const stream = fs.createWriteStream(filePath);
    const { body } = await fetch(isFinishedPollData.downloadUrl);
    const readableStream = Readable.fromWeb(body);
    await finished(readableStream.pipe(stream));
    console.log(`Finished downloading. File available at ${filePath}`);

    core.setOutput("path", filePath);
  } catch (error) {
    console.log(error.message);
    core.setFailed(error.message);
  }
}

(async () => {
  const serverUrl = core.getInput('server-url');
  const pageId = core.getInput('page');
  const scope = core.getInput('scope');
  const templateId = core.getInput('template');
  await main(serverUrl, pageId, scope, templateId);
})();
