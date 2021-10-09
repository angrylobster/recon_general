import * as moment from 'moment';
import { ReconciliationData } from '../interfaces/ReportInterfaces';
import { StatementProperty, StatementRow } from '../interfaces/StatementInterfaces';
import { ParserService } from './ParserService';

export class ReportService {
    constructor(private readonly parser = new ParserService()) {}

    async generateSummaryAndReconReports(proxyPath: string, sourcePath: string, writePath: string): Promise<void> {
        await this.generateReconciliationReport(proxyPath, sourcePath, writePath);
    }

    async generateReconciliationReport(
        proxyPath: string,
        sourcePath: string,
        writePath?: string,
    ): Promise<ReconciliationData> {
        const reconData = await this.generateReconciliationData(proxyPath, sourcePath);
        if (writePath) {
            await Promise.all([
                this.parser.writeReconReport(reconData.discrepancies, `${writePath}/recon.csv`),
                this.parser.writeSummaryReport(reconData, `${writePath}/summary.csv`),
            ]);
        }
        return reconData;
    }

    async generateReconciliationData(proxyPath: string, sourcePath: string): Promise<ReconciliationData> {
        const reconciliationData = new ReconciliationData();
        const [proxyMap, sourceMap] = await Promise.all([
            this.parser.readStatement(proxyPath),
            this.parser.readStatement(sourcePath),
        ]);
        reconciliationData.sourceRowsProcessed = sourceMap.size;
        Array.from(proxyMap.values()).forEach((statement) => {
            this.updateDateRange(statement, reconciliationData);
            let discrepancy: StatementRow;
            if (!sourceMap.has(statement.id)) {
                reconciliationData.discrepancyDetails.missingRecords++;
                discrepancy = this.buildMissingRecordStatement('source', statement);
            } else if (!statement.equals(sourceMap.get(statement.id))) {
                reconciliationData.discrepancyDetails.mismatchedRecords++;
                discrepancy = this.buildMismatchRecordStatement(statement, sourceMap.get(statement.id));
            }
            if (discrepancy) {
                reconciliationData.discrepancies.push(discrepancy);
            }
        });
        Array.from(sourceMap.values()).forEach((statement) => {
            if (!proxyMap.has(statement.id)) {
                reconciliationData.discrepancyDetails.missingRecords++;
                reconciliationData.discrepancies.push(this.buildMissingRecordStatement('proxy', statement));
                this.updateDateRange(statement, reconciliationData);
            }
        });
        return reconciliationData;
    }

    private buildMissingRecordStatement(referenceMapName: 'proxy' | 'source', statement: StatementRow): StatementRow {
        const data = Object.assign(new StatementRow(), statement);
        data.addRemark(`Does not exist in ${referenceMapName} record`);
        return data;
    }

    private buildMismatchRecordStatement(baseStatement: StatementRow, referenceStatement: StatementRow): StatementRow {
        const duplicateBaseStatement = Object.assign(new StatementRow(), baseStatement);

        (['description', 'amount', 'date'] as StatementProperty[]).forEach((property) => {
            if (baseStatement[property] !== referenceStatement[property]) {
                duplicateBaseStatement.addRemark(
                    `${property} is '${duplicateBaseStatement[property]}' in proxy but '${referenceStatement[property]}' in source`,
                );
            }
        });

        return duplicateBaseStatement;
    }

    private updateDateRange(data: StatementRow, reconciliationData: ReconciliationData): void {
        if (!reconciliationData.dateRange.min || moment(data.date).isBefore(moment(reconciliationData.dateRange.min))) {
            reconciliationData.dateRange.min = data.date;
        }
        if (!reconciliationData.dateRange.max || moment(data.date).isAfter(moment(reconciliationData.dateRange.max))) {
            reconciliationData.dateRange.max = data.date;
        }
    }
}
