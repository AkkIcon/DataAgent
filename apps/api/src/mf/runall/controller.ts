import { Request, Response } from 'express'
import { CONFIG } from './constants.js'
import { fetchWithTimeout } from '../chat/utils/fetch.js'
import { sendResponse, success, fail, handleError } from '../../utils/response.js'
import { ErrorCode } from '../../constants/errorcode.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { NotebookConverter } from '../../utils/notebook-converter.js'
import AdmZip from 'adm-zip'
import os from 'os'
import { mkdir, mkdtemp } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

      // // 使用本地zip文件
      // const testZipPath = path.join(__dirname, '../../test-files/test.zip')
      // if (!fs.existsSync(testZipPath)) {
      //   return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '测试文件不存在'))
      // }

      // // 读取zip文件并创建流
      // const zipFileStream = fs.createReadStream(testZipPath)
      // const fileStreamRes = {
      //   ok: true,
      //   headers: new Map([['content-disposition', `attachment; filename="test-${id}.zip"`]]),
      //   body: new ReadableStream({
      //     start(controller) {
      //       zipFileStream.on('data', (chunk) => {
      //         controller.enqueue(chunk)
      //       })
      //       zipFileStream.on('end', () => {
      //         controller.close()
      //       })
      //       zipFileStream.on('error', (error) => {
      //         controller.error(error)
      //       })
      //     }
      //   })
      // }

      // 检查文件是否成功获取
      if (!fileStreamRes.ok) {
        return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件获取失败'))
      }

      // 检查响应体是否存在
      if (!fileStreamRes.body) {
        return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件内容为空'))
      }

      // 创建临时zip文件
      const testZipPath = path.join(os.tmpdir(), `download-${id}-${Date.now()}.zip`)
      const writeStream = fs.createWriteStream(testZipPath)
      
      // 将响应流写入临时文件
      const streamReader = fileStreamRes.body.getReader()
      try {
        while (true) {
          const { done, value } = await streamReader.read()
          if (done) break
          writeStream.write(Buffer.from(value))
        }
        writeStream.end()
        
        // 等待写入完成
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })
      } catch (error) {
        console.error('Error saving stream to file:', error)
        fs.unlinkSync(testZipPath)
        return res.status(500).json(fail(ErrorCode.SERVER_ERROR, '文件保存失败'))
      }

      // 创建临时目录用于处理文件
      const tempDir = await mkdtemp(path.join(os.tmpdir(), 'notebook-conversion-'))
      const extractDir = path.join(tempDir, 'extracted')
      const pdfDir = path.join(tempDir, 'pdf')

      try {
        // 创建必要的目录
        await mkdir(extractDir, { recursive: true })
        await mkdir(pdfDir, { recursive: true })
        console.log('Created directories:', { extractDir, pdfDir })

        // 解压原始zip文件，跳过 __MACOSX，并记录原始路径
        const zip = new AdmZip(testZipPath)
        const entries = zip.getEntries()
        const notebookPaths = new Map<string, string>() // 记录notebook的原始路径

        entries.forEach(entry => {
          if (!entry.entryName.startsWith('__MACOSX/') && entry.entryName.endsWith('.ipynb')) {
            // 保存原始路径信息
            const extractPath = path.join(extractDir, entry.entryName)
            notebookPaths.set(extractPath, entry.entryName)
            // 确保目标目录存在
            fs.mkdirSync(path.dirname(extractPath), { recursive: true })
            // 解压文件
            zip.extractEntryTo(entry, path.dirname(extractPath), false, true)
          }
        })

        // 递归查找所有ipynb文件
        function findIpynbFiles(dir: string): string[] {
          const files: string[] = []
          const entries = fs.readdirSync(dir, { withFileTypes: true })

          for (const entry of entries) {
            if (entry.name === '__MACOSX') {
              console.log('Skipping __MACOSX directory:', path.join(dir, entry.name))
              continue
            }

            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              files.push(...findIpynbFiles(fullPath))
            } else if (entry.isFile() && entry.name.endsWith('.ipynb')) {
              console.log('Found notebook file:', fullPath)
              files.push(fullPath)
            }
          }

          return files
        }

        // 转换所有ipynb文件
        const converter = new NotebookConverter()
        const ipynbFiles = findIpynbFiles(extractDir)
        console.log('Found ipynb files:', ipynbFiles)

        for (const inputPath of ipynbFiles) {
          // 获取原始路径，并基于此创建PDF路径
          const originalPath = notebookPaths.get(inputPath) || path.relative(extractDir, inputPath)
          const pdfPath = originalPath.replace('.ipynb', '.pdf')
          const outputPath = path.join(pdfDir, pdfPath)

          // 确保输出目录存在
          await mkdir(path.dirname(outputPath), { recursive: true })

          console.log('Converting file:', {
            inputPath,
            outputPath,
            originalPath,
            pdfPath
          })
          await converter.convertFile(inputPath, outputPath)
          console.log('Conversion completed for:', originalPath)
        }

        // 创建新的zip文件包含所有PDF
        const outputZip = new AdmZip()

        // 递归添加PDF文件，保持目录结构
        function addPdfFiles(dir: string, baseDir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              addPdfFiles(fullPath, baseDir)
            } else if (entry.isFile() && entry.name.endsWith('.pdf')) {
              // 使用相对于基础目录的路径作为zip中的路径
              const relativePath = path.relative(baseDir, fullPath)
              console.log('Adding to zip:', {
                file: fullPath,
                relativePath,
                size: fs.statSync(fullPath).size
              })
              outputZip.addLocalFile(fullPath, path.dirname(relativePath))
            }
          }
        }

        addPdfFiles(pdfDir, pdfDir)

        // 将zip写入临时文件
        const tempZipPath = path.join(tempDir, 'output.zip')
        outputZip.writeZip(tempZipPath)
        console.log('Created output zip:', tempZipPath, 'Size:', fs.statSync(tempZipPath).size)

        // 创建新的响应对象
        const convertedZipStream = fs.createReadStream(tempZipPath)
        const responseBody = new ReadableStream({
          start(controller) {
            convertedZipStream.on('data', (chunk) => {
              controller.enqueue(chunk)
            })
            convertedZipStream.on('end', () => {
              controller.close()
              // 清理临时文件
              fs.rm(tempDir, { recursive: true, force: true }, (err) => {
                if (err) console.error('Error cleaning up temp files:', err)
              })
              fs.unlink(testZipPath, (err) => {
                if (err) console.error('Error cleaning up temp zip file:', err)
              })
            })
            convertedZipStream.on('error', (error) => {
              controller.error(error)
              // 清理临时文件
              fs.rm(tempDir, { recursive: true, force: true }, (err) => {
                if (err) console.error('Error cleaning up temp files:', err)
              })
              fs.unlink(testZipPath, (err) => {
                if (err) console.error('Error cleaning up temp zip file:', err)
              })
            })
          }
        })

        // 创建新的响应头
        const responseHeaders = new Map(fileStreamRes.headers)
        responseHeaders.set('content-disposition', `attachment; filename="converted-${id}.zip"`)

        // 将文件流传递给响应对象
        const fileStream = responseBody

        // 将文件流传递给响应对象
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
        // 清理临时文件
        fs.rm(tempDir, { recursive: true, force: true }, (err) => {
          if (err) console.error('Error cleaning up temp files:', err)
        })
        throw error
      }

    } catch (error) {
      console.error('Error handling download:', error)
      res.status(500).json(fail(ErrorCode.SERVER_ERROR, '下载处理失败'))
    }
  }

}

export const runAllController = new RunAllController()
