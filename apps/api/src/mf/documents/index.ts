import { Router } from 'express';
import { authMiddleware } from '../chat/middleware/middleware.js'
import { NotebookConverter } from '../../utils/notebook-converter.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { prisma } from '@briefer/database'
import { logger } from '../../logger.js'
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router({ mergeParams: true });

// 预览文档
router.get('/:documentId/preview', authMiddleware, async (req, res) => {
    const { documentId } = req.params;
    const userId = req.session!.user.id; // authenticationMiddleware 确保 session 存在

    // 创建临时文件路径
    const tempDir = os.tmpdir();
    // 使用固定的测试文件，与 index.ts 同级目录下的 testfile/test.ipynb
    const inputPath = path.join(__dirname, 'testfile', 'analysis-dianwang.ipynb');
    const outputPath = path.join(tempDir, `test-${documentId}.pdf`);

    logger().info(`Converting notebook from ${inputPath} to ${outputPath}`);

    try {
        logger().info(`User ${userId} requesting preview for document ${documentId}`);

        // 参数校验
        if (!documentId) {
            logger().error('Document ID is required');
            return res.status(400).json({ error: 'Document ID is required' });
        }

        // 获取文档信息，同时检查用户权限
        const document = await prisma().document.findFirst({
            where: {
                id: documentId,
                workspace: {
                    ownerId: '21a83ff9-2e2d-4d0f-84f9-a4539d5fe1ab'
                }
            }
        });

        if (!document) {
            logger().error(`Document ${documentId} not found or access denied`);
            return res.status(404).json({ error: 'Document not found or access denied' });
        }

        // 转换文档
        const converter = new NotebookConverter();
        await converter.convertFile(inputPath, outputPath);

        // 读取生成的PDF文件
        const pdfBuffer = await fs.readFile(outputPath);

        // 清理临时文件
        await Promise.all([
            fs.unlink(outputPath)
        ]).catch(err => {
            logger().error('Error cleaning up temporary files:', err instanceof Error ? err.stack : err);
        });

        // 设置响应头并发送PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="test.pdf"`);
        return res.send(pdfBuffer);

    } catch (error) {
        // 详细记录错误信息
        logger().error('Error previewing document:', {
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error,
            document: {
                id: documentId,
                path: inputPath
            }
        });

        throw error;
    }
});

export default router;