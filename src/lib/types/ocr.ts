export interface OcrRequest {
    images: {
        format: string;
        name: string;
        data: string | null;
        url?: string;
    }[];
    lang: string;
    requestId: string;
    resultType: string;
    timestamp: number;
    version: string;
}

export interface OcrResponse {
    version: string;
    requestId: string;
    timestamp: number;
    images: {
        uid: string;
        name: string;
        inferResult: string;
        message: string;
        fields: {
            inferText: string;
            inferConfidence: number;
        }[];
        validationResult: {
            result: string;
        };
    }[];
} 