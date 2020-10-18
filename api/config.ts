/**
 * Google Analytics query configurations
 *
 * ! If you are deploying this with your own account
 * ! , then you will need to change this config file.
 * ! Don't put your privateKey inside this file directly!
 */
export default {
  viewId: process.env.VIEW_ID,
  auth: {
    projectId: 'red-presence-289317',
    privateKey: process.env.PRIVATE_KEY,
    clientEmail: 'bot-301@red-presence-289317.iam.gserviceaccount.com',
  },
  allFilter: ['/'],
  defaultStartDate: '2010-01-01',
}
