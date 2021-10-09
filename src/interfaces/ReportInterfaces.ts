import { StatementRow } from './StatementInterfaces';

export class ReconciliationData {
    dateRange = {
        min: '',
        max: '',
    };
    sourceRowsProcessed = 0;
    discrepancies = [] as StatementRow[];
    discrepancyDetails = {
        missingRecords: 0,
        mismatchedRecords: 0,
    };
}
