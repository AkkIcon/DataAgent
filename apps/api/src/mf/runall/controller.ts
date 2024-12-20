import { Request, Response } from 'express'
import { CONFIG } from './constants.js'
import { fetchWithTimeout } from '../chat/utils/fetch.js'
import { sendResponse, success, fail, handleError } from '../../utils/response.js'
import { sessionFromCookies } from '../../auth/token.js'
import { prisma, YjsDocument } from '@briefer/database'
import { getYDocForUpdate, WSSharedDocV2 } from '../../yjs/v2/index.js'
import path, { join } from 'path'
import fs from 'fs'
import { IOServer } from '../../websocket/index.js'
import { DocumentPersistor } from '../../yjs/v2/persistors.js'
import { convertYjsDocumentToNotebook, saveNotebookToOSS } from '../../yjs/v2/executors/convertToNotebook.js'
import axios from 'axios'
export class RunAllController {
  private socketServer: IOServer
  constructor(socketServer: IOServer) {
    this.socketServer = socketServer
  }
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
      const result: any = await jobsRes.json()
      if (result && result.code === 0) {
        // 在查询到 yDoc 后开启一个线程进行处理
        const yDoc = await this.getYDoc(reqJson.chatId, req);

        // 在后台启动异步上传任务
        (async () => {
          await this.uploadCode(yDoc, reqJson.chatId, req.session.user.id, result.data.jobId);  // 确保 yDoc 是获取到的文档对象
        })();

      }
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
        return res.status(400).json({ message: '参数不正确，缺少下载全量记录的id' })
      }
      const idNum = Number(id)
      if (isNaN(idNum)) {
        return res.status(400).json({ message: '参数不正确，缺少下载全量记录的id' })
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
        res.status(500)
        return
      }

      // 将文件流传递给响应对象
      const fileStream = fileStreamRes.body
      if (!fileStream) {
        res.status(500)
        return
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
                res.status(500).json({ message: 'Error streaming the file' })
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
      res.status(500).json({ message: 'Internal Server Error' })
    }
  }

  async getYDoc(chatId: string, req: Request): Promise<WSSharedDocV2> {
    const userId = req.session!.user.id
    const session = await sessionFromCookies(req.cookies)

    const chatDocumentRelation = await prisma().chatDocumentRelation.findFirst({
      where: { chatId: chatId }
    })
    if (!chatDocumentRelation) {
      throw new Error('未查询到对话关联报告文档!')
    }
    const documentId = chatDocumentRelation.documentId
    const yjsDoc = await prisma().yjsDocument.findUnique({
      where: { documentId: documentId },
    })
    if (!yjsDoc) {
      throw new Error('未查询到指定文档!')
    }

    const { yDoc } = await getYDocForUpdate(
      [documentId, 'null'].join('-'),
      this.socketServer,
      documentId,
      session?.userWorkspaces[0]?.workspaceId || '',
      (doc: WSSharedDocV2) => ({
        yDoc: doc,
      }),
      new DocumentPersistor(documentId)
    )
    return yDoc

  }



  async uploadCode(yDoc: WSSharedDocV2, chatId: string, userId: string, jobId: string) {

    const notebook = convertYjsDocumentToNotebook(yDoc.blocks, yDoc.layout)
    const ossPath = join('chat/', chatId, '/', chatId)
    const result = await saveNotebookToOSS(notebook, ossPath)
    if (result) {
      try {
        const jobsRes = await fetchWithTimeout(
          `${CONFIG.MANAGER_URL}${CONFIG.ENDPOINTS.PUSH_SUCCESS}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'mf-nodejs-user-id': userId,
            },
            body: JSON.stringify({
              jobId: jobId,
              notebookPath: ossPath,
            }),
          },
          5000
        )
      } catch (e) {
        console.log('创建全量运行记录失败')
      }
    }

  }



  // async download(req: Request, res: Response) {
  // try {
  //   // 文件路径（可根据需求动态生成）
  //   const { id } = req.query
  //   if (!id) {
  //     return res.status(400).json({ message: '参数不正确，缺少下载全量记录的id' });
  //   }
  //   const idNum = Number(id)
  //   if (isNaN(idNum)) {
  //     return res.status(400).json({ message: '参数不正确，缺少下载全量记录的id' });
  //   }

  //   const filePath = path.resolve('/Users/jianchuanli/Downloads/数据交易沙箱18302.mp4') // 替换为实际文件路径
  //   const fileName = 'example.mp4' // 自定义的下载文件名

  //   // 检查文件是否存在
  //   if (!fs.existsSync(filePath)) {
  //     return res.status(404).json({ message: 'File not found' })
  //   }

  //   // 设置响应头
  //   res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  //   res.setHeader('Content-Type', 'application/octet-stream')
  //   const stats = fs.statSync(filePath)
  //   console.log('File size:', stats.size)
  //   // 创建文件读取流并管道到响应
  //   const fileStream = fs.createReadStream(filePath)
  //   fileStream.pipe(res)

  //   // 监听文件流完成事件，确保响应正常结束
  //   fileStream.on('end', () => {
  //     console.log('File sent successfully')
  //     res.status(200)
  //   })

  //   // 捕获文件流错误
  //   fileStream.on('error', (error) => {
  //     console.error('File stream error:', error)
  //     res.status(500).json({ message: 'Error reading file' })
  //   })
  // } catch (error) {
  //   console.error('Error handling download:', error)
  //   res.status(500).json({ message: 'Internal Server Error' })
  // }
  // }
}

