// src/lib/utils/fileManager.js
import { mkdir, rm, readdir, stat } from 'fs/promises';
import path from 'path';

export class FileManager {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'tmp');
    }

    async ensureTempDir() {
        try {
            await mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async cleanupTempFiles(olderThanHours = 1) {
        try {
            const files = await readdir(this.tempDir);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await stat(filePath);
                const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60); // 시간 단위
                
                if (fileAge > olderThanHours) {
                    await rm(filePath);
                }
            }
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
} 