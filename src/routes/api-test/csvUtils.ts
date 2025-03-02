// src/routes/api-test/csvUtils.ts
export interface CSVPreview {
  headers: string[];
  rows: string[][];
}

enum ParserState {
  FIELD_START,
  UNQUOTED_FIELD,
  QUOTED_FIELD,
  QUOTE_IN_QUOTED_FIELD
}

interface ParseResult {
  fields: string[];
  remainingText: string;
}

function parseCSVContent(content: string): string[][] {
  const results: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let state = ParserState.FIELD_START;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    switch (state) {
      case ParserState.FIELD_START:
        if (char === '"') {
          state = ParserState.QUOTED_FIELD;
        } else if (char === ',') {
          currentRow.push('');
        } else if (char === '\n' || char === '\r') {
          if (char === '\r' && content[i + 1] === '\n') {
            i++; // Skip the following \n
          }
          if (field || currentRow.length > 0) {
            currentRow.push(field);
            results.push(currentRow);
            currentRow = [];
            field = '';
          }
        } else {
          field += char;
          state = ParserState.UNQUOTED_FIELD;
        }
        break;

      case ParserState.UNQUOTED_FIELD:
        if (char === ',') {
          currentRow.push(field.trim());
          field = '';
          state = ParserState.FIELD_START;
        } else if (char === '\n' || char === '\r') {
          if (char === '\r' && content[i + 1] === '\n') {
            i++; // Skip the following \n
          }
          currentRow.push(field.trim());
          results.push(currentRow);
          currentRow = [];
          field = '';
          state = ParserState.FIELD_START;
        } else {
          field += char;
        }
        break;

      case ParserState.QUOTED_FIELD:
        if (char === '"') {
          state = ParserState.QUOTE_IN_QUOTED_FIELD;
        } else {
          field += char;
        }
        break;

      case ParserState.QUOTE_IN_QUOTED_FIELD:
        if (char === '"') {
          field += char;
          state = ParserState.QUOTED_FIELD;
        } else if (char === ',') {
          currentRow.push(field);
          field = '';
          state = ParserState.FIELD_START;
        } else if (char === '\n' || char === '\r') {
          if (char === '\r' && content[i + 1] === '\n') {
            i++; // Skip the following \n
          }
          currentRow.push(field);
          results.push(currentRow);
          currentRow = [];
          field = '';
          state = ParserState.FIELD_START;
        } else {
          // Invalid format - quote not followed by quote, comma, or newline
          // For lenient parsing, we'll include the quote and continue
          field += '"' + char;
          state = ParserState.UNQUOTED_FIELD;
        }
        break;
    }
    i++;
  }

  // Handle the last field and row
  if (field || currentRow.length > 0) {
    currentRow.push(field);
    results.push(currentRow);
  }

  return results;
}

export function parseCSV(file: File): Promise<CSVPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const allRows = parseCSVContent(text);
        
        if (allRows.length === 0) {
          throw new Error('CSV 파일이 비어있습니다.');
        }

        const headers = allRows[0];
        const rows = allRows.slice(1, 6); // Get first 5 rows for preview

        resolve({ headers, rows });
      } catch (error) {
        reject(new Error('CSV 파일 파싱 중 오류가 발생했습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}

export function readEntireCSV(
  file: File, 
  questionColumnIndex: number,
  categoryColumnIndex: number = -1
): Promise<Array<{ text: string; category: string }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const allRows = parseCSVContent(text);
        const questions = allRows
          .slice(1) // Skip header
          .map(row => ({
            text: row[questionColumnIndex] || '',
            category: categoryColumnIndex >= 0 ? row[categoryColumnIndex] || '분류 없음' : '분류 없음'
          }))
          .filter(q => q.text.length > 0); // Filter out empty questions
        resolve(questions);
      } catch (error) {
        reject(new Error('CSV 파일 파싱 중 오류가 발생했습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}

export function convertToCSV(headers: string[], rows: string[][]): string {
  const formatField = (field: string) => {
    // If field contains quotes, commas, or newlines, wrap in quotes and escape quotes
    if (/[",\n\r]/.test(field)) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvRows = [
    headers.map(formatField).join(','),
    ...rows.map(row => row.map(formatField).join(','))
  ];

  return csvRows.join('\n');
}

export function downloadParsedCSV(headers: string[], rows: string[][], filename: string = 'parsed_data.csv') {
  const csvContent = convertToCSV(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 