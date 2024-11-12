// src/lib/utils/ServerPDFExtractor.js
import { spawn } from 'child_process';
import path from 'path';

export class PDFExtractor {
    constructor() {
        this.pythonScript = path.join(process.cwd(), 'src', 'lib', 'python', 'pdf_extractor.py');
    }

    async extractPDF(pdfPath, outputPath, extractType = 'text') {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                this.pythonScript,
                pdfPath,
                outputPath,
                extractType
            ]);

            let result = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Error: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Process exited with code ${code}`));
                    return;
                }

                try {
                    const jsonResult = JSON.parse(result);
                    if (jsonResult.success) {
                        resolve(jsonResult);
                    } else {
                        reject(new Error(jsonResult.message));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse Python script output'));
                }
            });
        });
    }
} 