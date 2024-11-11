const { spawn } = require('child_process');
const path = require('path');

class PDFExtractor {
    constructor() {
        this.pythonScript = path.join(__dirname, 'pdf_extractor.py');
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

module.exports = PDFExtractor; 