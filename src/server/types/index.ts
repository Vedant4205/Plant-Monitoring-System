export interface SensorData {
    id: string;
    temperature: number;
    humidity: number;
    timestamp: Date;
}

export interface GoogleSheetResponse {
    range: string;
    majorDimension: string;
    values: string[][];
}