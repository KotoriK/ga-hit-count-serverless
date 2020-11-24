import { NowRequest, NowResponse } from '@vercel/node'
import { google } from 'googleapis'
import config from './config'

/**
 * Blog hit count. Served by Google Analytics
 */
export default async (req: NowRequest, resp: NowResponse) => {
  // API query page parameter
  const { page = '', from = '' } = req.query
  const _from: string = (from instanceof Array && from.join('')) || (from as string)
  const startDate = from === '' ? config.defaultStartDate : new Date(_from).toISOString().replace(/T\S+$/, '')
  // page path filter
  const filter =
    page === ''
      ? { dimensionName: 'ga:pagePath', operator: 'BEGINS_WITH', expressions: config.allFilter }
      : {
        dimensionName: 'ga:pagePath',
        operator: 'EXACT',
        expressions: [page] as string[],
      }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: config.auth.privateKey,
      client_email: config.auth.clientEmail,
    },
    projectId: config.auth.projectId,
    scopes: 'https://www.googleapis.com/auth/analytics.readonly',
  })
  const client = await auth.getClient()
  const analyticsreporting = google.analyticsreporting({
    version: 'v4',
    auth: client,
  })

  const gaReport = await analyticsreporting.reports.batchGet({
    requestBody: {
      reportRequests: [
        {
          viewId: config.viewId,
          dateRanges: [
            {
              startDate,
              endDate: 'today',
            },
          ],
          metrics: [
            {
              expression: 'ga:uniquePageviews',
            }, {
              expression: "ga:avgTimeOnPage"
            },
          ],
          dimensions: [
            {
              name: 'ga:pagePath',
            },
          ],
          dimensionFilterClauses: [
            {
              filters: [filter],
            },
          ],
          orderBys: [
            {
              fieldName: 'ga:pageviews',
              sortOrder: 'DESCENDING',
            },
          ],
        },
      ],
    },
  })
  const report = gaReport.data.reports[0].data

  let res = []
  if (report.totals[0].values[0] === '0') {
    res = [{ page: page, hit: '0' }]
  } else {
    report.rows.forEach(r => {
      // Remove all pages with querys
      if (!r.dimensions[0].includes('?')) {
        res.push({ page: r.dimensions[0], hit: r.metrics[0].values[0], avgTOP: r.metrics[0].values[1] })
      }
    })
  }
  resp.setHeader('Cache-Control', `s-maxage=${config.maxAge}, public, stale-while-revalidate`)
  resp.setHeader('Access-Control-Allow-Origin', '*')
  resp.status(200).send(res)
}
