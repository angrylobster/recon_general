import { ReportService } from './services/ReportService';
import * as path from 'path';

const reportService = new ReportService();
const generateFilePath = (filePath: string): string => path.resolve(__dirname, filePath);

reportService.generateSummaryAndReconReports(
    generateFilePath('../files/input/proxy.csv'),
    generateFilePath('../files/input/source.csv'),
    generateFilePath('../files/output'),
);
