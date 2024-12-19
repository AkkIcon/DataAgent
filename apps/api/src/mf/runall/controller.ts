import { Request, Response } from 'express'
import { CONFIG } from './constants.js'
import { fetchWithTimeout } from '../chat/utils/fetch.js'
import { sendResponse, success, fail, handleError } from '../../utils/response.js'
import { ErrorCode } from '../../constants/errorcode.js'

export class RunAllController {

  async getRunAllList(req: Request, res: Response) {
    if (CONFIG.IS_MOCK) {
      return sendResponse(
        res,
        success({
          list: [
            {
              id: 1,
              name: '能源统计月度分析报告20241020164408',
              documentId: 'string',
              jobId: 'string',
              runStatus: 1,
              approveStatus: 4,
              startTime: '2024/10/28 18:49:09',
              duration: 'string',
              des: 'string',
              version: 'string',
              reason: 'string',
            },
            // ,
            // {
            //   id: 2,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 3,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 4,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 5,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 6,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
          ],
        })
      )
    }
    const reqJson = req.body
    try {
      const jobsRes = await fetchWithTimeout(
        `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.LIST}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mf-nodejs-user-id': req.session.user.id,
          },
          body: JSON.stringify({
            identity: reqJson.chatId,
            page: reqJson.pageNum,
            pageSize: reqJson.pageSize,
            sValue: reqJson.keyword,
          }),
        },
        5000
      )
      const result: any = await jobsRes.json()
      if (result && result.code === 0) {
        sendResponse(
          res,
          success({
            list: result.data.rows,
          })
        )
      } else {
        sendResponse(res, fail(result ? result.code : -1, result ? result.msg : ''))
      }
    } catch (e) {
      sendResponse(res, handleError(500, '获取全量运行列表失败'))
    }
  }

  async createRunAll(req: Request, res: Response) {
    const reqJson = req.body
    try {
      const jobsRes = await fetchWithTimeout(
        `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.RUN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mf-nodejs-user-id': req.session.user.id,
          },
          body: JSON.stringify({
            experimentId: reqJson.chatId,
            versionName: reqJson.name,
          }),
        },
        5000
      )
      const result = await jobsRes.json()
      //转换成Ipynb

      sendResponse(res, success({ result }))
    } catch (e) {
      sendResponse(res, handleError(500, '创建全量运行记录失败'))
    }
  }

  async queryStatus(req: Request, res: Response) {
    if (CONFIG.IS_MOCK) {
      return sendResponse(
        res,
        success({
          list: [
            {
              id: 1,
              name: '能源统计月度分析报告20241020164408',
              documentId: 'string',
              jobId: 'string',
              runStatus: 1,
              approveStatus: 4,
              startTime: '2024/10/28 18:49:09',
              endTime: '2024/10/28 18:49:09',
              duration: 'string',
              des: 'string',
              version: 'string',
              reason: 'string',
            },
            // ,
            // {
            //   id: 2,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   endTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 3,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   endTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 4,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   endTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 5,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   endTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
            // {
            //   id: 6,
            //   name: '能源统计月度分析报告20241020164408',
            //   documentId: 'string',
            //   jobId: 'string',
            //   runStatus: Math.floor(Math.random() * 6) + 1,
            //   approveStatus: Math.floor(Math.random() * 5) + 1,
            //   startTime: '2024/10/28 18:49:09',
            //   endTime: '2024/10/28 18:49:09',
            //   duration: 'string',
            //   des: 'string',
            //   version: 'string',
            //   reason: 'string',
            // },
          ],
        })
      )
    }
    const reqJson = req.body
    try {
      const jobsRes = await fetchWithTimeout(
        `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.STATUS}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mf-nodejs-user-id': req.session.user.id,
          },
          body: JSON.stringify({
            ids: reqJson.ids,
          }),
        },
        5000
      )
      const result: any = await jobsRes.json()
      if (result && result.code === 0) {
        sendResponse(
          res,
          success({
            list: result.data.list,
          })
        )
      } else {
        sendResponse(res, fail(result ? result.code : -1, result ? result.msg : ''))
      }
    } catch (e) {
      sendResponse(res, handleError(500, '获取全量运行记录状态失败'))
    }
  }

  async approve(req: Request, res: Response) {
    const reqJson = req.body
    try {
      const jobsRes = await fetchWithTimeout(
        `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.APPROVE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mf-nodejs-user-id': req.session.user.id,
          },
          body: JSON.stringify({
            id: reqJson.id,
          }),
        },
        5000
      )
      const result = await jobsRes.json()
      sendResponse(res, success({ result }))
    } catch (e) {
      sendResponse(res, handleError(500, '申请下载失败'))
    }
  }
  
  async stop(req: Request, res: Response) { }

  async download(req: Request, res: Response) {
    try {
      const { id } = req.query
      if (!id) {
        return res.status(400).json(fail(ErrorCode.PARAM_ERROR, '参数不正确，缺少下载全量记录的id'))
      }
      const idNum = Number(id)
      if (isNaN(idNum)) {
        return res.status(400).json(fail(ErrorCode.PARAM_ERROR, '参数不正确，缺少下载全量记录的id'))
      }
      // 获取文件的 URL
      const fileStreamRes = await fetch(
        `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.DOWNLOAD}?id=${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/octet-stream',
            'mf-nodejs-user-id': req.session.user.id,
          },
        }
      )

      // 检查文件是否成功获取
      if (!fileStreamRes.ok) {
        return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件获取失败'))
      }

      // 将文件流传递给响应对象
      const fileStream = fileStreamRes.body
      if (!fileStream) {
        return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件流获取失败'))
      }
      // 设置响应头告知浏览器文件下载
      res.setHeader('Content-Disposition', fileStreamRes.headers.get('content-disposition') || '')
      res.setHeader('Content-Type', 'application/octet-stream')
      // 创建一个可写流，将文件内容写入响应对象
      const reader = fileStream.getReader()
      const stream = new ReadableStream({
        start(controller) {
          // 每次读取文件流
          function push() {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  controller.close() // 完成时关闭流
                  res.end() // 结束响应
                  return
                }
                controller.enqueue(value) // 将块写入可写流
                push() // 继续读取
              })
              .catch((err) => {
                console.error('Error reading file stream:', err)
                res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件流读取失败'))
              })
          }
          push()
        },
      })

      // 通过 Web Streams API 将内容写入响应
      await stream.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk)
          },
          close() {
            res.end()
          },
        })
      )
    } catch (error) {
      console.error('Error handling download:', error)
      res.status(500).json(fail(ErrorCode.SERVER_ERROR, '下载处理失败'))
    }
  }
  
}

export const runAllController = new RunAllController()
