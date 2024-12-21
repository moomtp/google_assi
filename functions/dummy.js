// const queryResult = await homegraph.devices.query({
//   requestBody: {
//     agentUserId: USER_ID,
//     inputs: [{intent: 'action.devices.QUERY', payload: {devices: [{id: context.params.deviceId}]}}]
//   }
// });
// console.log(queryResult);


const { google } = require('googleapis');

async function initializeHomegraph() {
  const auth = new google.auth.GoogleAuth({
    // keyFile: './google_home_graph_certification.json', // 確保這個檔案的路徑正確
    scopes: ['https://www.googleapis.com/auth/homegraph'],
  });

  const client = await auth.getClient();

  const homegraph = google.homegraph({
    version: 'v1',
    auth: client,
  });

  return homegraph;
}

(async () => {
  try {
    const homegraph = await initializeHomegraph();

    // 接下來你可以使用 homegraph 來進行操作
    console.log('Homegraph API initialized successfully');
  } catch (error) {
    console.error('Error initializing Homegraph API:', error.message);
  }
})();