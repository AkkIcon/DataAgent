import { Router, Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import { dirname } from 'path'
import { OssClient } from '../../utils/oss.js'
import archiver from 'archiver';


const codeRouter = Router()

const ossClient = new OssClient()

codeRouter.post(
    '/download',
    async (req: Request, res: Response, next: NextFunction) => {
        const filePath = req.body.path;

        if (!filePath) {
            return res.status(400).send('File path is required');
        }

        try {
            // Download file from OSS
            const fileBuffer = await ossClient.downloadFile(filePath);
            
            // Extract the full directory structure from the file path
            const fullName = path.basename(filePath);
            const dirPath = path.dirname(filePath);
            
            const tempDir = path.join(process.env['ROOT_DIR'] ?? '/opt/mindflow/', '/temp/');
            const ipynbFilePath = path.join(tempDir, dirPath, fullName + '.ipynb');
            const dir = path.dirname(ipynbFilePath);
            
            // Create necessary directories
            await fsPromises.mkdir(dir, { recursive: true });
            
            // Write the downloaded file to the specified path
            await fsPromises.writeFile(ipynbFilePath, fileBuffer);
    
            // Create a zip file
            const zipFileName = path.basename(dirPath) + '.zip';
            const zipFilePath = path.join(tempDir, zipFileName);
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            archive.pipe(output);
            
            // Append the file to the archive with its full directory structure
            archive.file(ipynbFilePath, { name: path.join(dirPath, fullName + '.ipynb') });
            
            await archive.finalize();
    
            // Send the zip file as a response
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
            const zipStream = fs.createReadStream(zipFilePath);
            zipStream.pipe(res);
    
            zipStream.on('end', () => {
                // Cleanup temporary files
                fs.unlinkSync(ipynbFilePath);
                fs.unlinkSync(zipFilePath);
            });
        } catch (error) {
            console.error('Error downloading or processing file:', error);
            res.status(500).send('Error processing the file');
        }
    });
    


export default codeRouter
