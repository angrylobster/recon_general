import * as fs from 'fs';
import * as CsvParser from 'csv-parser';
import { plainToClass } from 'class-transformer';
import { StatementProperty, StatementRow } from '../interfaces/StatementInterfaces';
import { ParserOptions } from '../interfaces/ParserInterfaces';
import * as moment from 'moment';
import { ReconciliationData } from '../interfaces/ReportInterfaces';

export class ParserService {
    private readonly RECON_REPORT_HEADERS = 'Amt,Descr,Date,ID,Remarks\n';
    private readonly PROXY_SOURCE_HEADER_MAP = {
        amt: 'amount',
        descr: 'description',
    };
    private readonly CSV_PARSER_OPTIONS = {
        mapHeaders: ({ header }) => {
            const formattedHeader = header.toLowerCase();
            const mappedHeader = this.PROXY_SOURCE_HEADER_MAP[formattedHeader];
            return mappedHeader || formattedHeader;
        },
    } as CsvParser.Options;

    async readStatement(filePath: string, options?: ParserOptions): Promise<Map<string, StatementRow>> {
        const payload = new Map<string, StatementRow>();
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .on('error', (err) => reject(err))
                .pipe(CsvParser(this.CSV_PARSER_OPTIONS))
                .on('data', (data) => this.buildPayload(data, payload, options))
                .on('end', () => resolve(payload));
        });
    }

    async writeReconReport(data: StatementRow[], filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath).on('error', (err) => reject(err));
            writeStream.write(this.RECON_REPORT_HEADERS);
            data.forEach((row) => writeStream.write(row.toString()));
            resolve(writeStream.end());
        });
    }

    async writeSummaryReport(data: ReconciliationData, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath).on('error', (err) => reject(err));
            writeStream.write(`Date range: ${data.dateRange.min} to ${data.dateRange.max}\n`);
            writeStream.write(`Source records processed: ${data.sourceRowsProcessed}\n`);
            writeStream.write(`Discrepancy count: ${data.discrepancies.length}\n`);
            writeStream.write(`Missing records: ${data.discrepancyDetails.missingRecords}\n`);
            writeStream.write(`Mismatched records: ${data.discrepancyDetails.mismatchedRecords}\n`);
            resolve(writeStream.end());
        });
    }

    private buildPayload(
        rawData: Record<StatementProperty, string>,
        payload: Map<string, StatementRow>,
        options?: ParserOptions,
    ): void {
        const transformedData = plainToClass(StatementRow, rawData, { excludeExtraneousValues: true });
        if (options?.date) {
            const [minDate, maxDate] = options.date;
            if (moment(transformedData.date).isBetween(moment(minDate), moment(maxDate))) {
                payload.set(transformedData.id, transformedData);
            }
        } else {
            payload.set(transformedData.id, transformedData);
        }
    }
}
