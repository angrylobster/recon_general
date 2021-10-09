import { ReportService } from '../../src/services/ReportService';
import * as path from 'path';
import { StatementRow } from '../../src/interfaces/StatementInterfaces';
import { ReconciliationData } from '../../src/interfaces/ReportInterfaces';

describe('ReportService', () => {
    const service = new ReportService();
    const generateFilePath = (filePath: string): string => path.resolve(__dirname, filePath);

    describe('.generateIrreconciliableStatements', () => {
        let discrepancies: StatementRow[];
        describe('where 1 of the two files is invalid', () => {
            it('should throw some error', () => {
                return expect(
                    service.generateReconciliationData('banana', generateFilePath('../dummyData/source-1.csv')),
                ).rejects.toThrow();
            });

            it('should throw an error message about file path', () => {
                return expect(
                    service.generateReconciliationData('banana', generateFilePath('../dummyData/source-1.csv')),
                ).rejects.toThrow('no such file or directory');
            });
        });

        describe('where the two files are valid', () => {
            describe('and the data is perfectly reconciled', () => {
                beforeEach(async () => {
                    discrepancies = (
                        await service.generateReconciliationData(
                            generateFilePath('../dummyData/proxy-1.csv'),
                            generateFilePath('../dummyData/source-1.csv'),
                        )
                    ).discrepancies;
                });

                it('should return an empty report', () => {
                    expect(discrepancies.length).toEqual(0);
                });
            });

            describe('and the data is present in the proxy but not in the source', () => {
                beforeEach(async () => {
                    discrepancies = (
                        await service.generateReconciliationData(
                            generateFilePath('../dummyData/proxy-1.csv'),
                            generateFilePath('../dummyData/source-6.csv'),
                        )
                    ).discrepancies;
                });

                it('should return a report with 1 row', async () => {
                    expect(discrepancies).toHaveLength(1);
                });

                it('should return a report with the correct keys and values', () => {
                    const firstRow = discrepancies[0];
                    expect(firstRow.remarks[0]).toEqual('Does not exist in source record');
                    expect(firstRow.amount).toEqual(24);
                    expect(firstRow.description).toEqual('A');
                    expect(firstRow.id).toEqual('zoUr');
                    expect(firstRow.date).toContain('2021-06-30');
                });
            });

            describe('and the data is present in the source but not in the proxy', () => {
                beforeEach(async () => {
                    discrepancies = (
                        await service.generateReconciliationData(
                            generateFilePath('../dummyData/proxy-2.csv'),
                            generateFilePath('../dummyData/source-7.csv'),
                        )
                    ).discrepancies;
                });

                it('should return a report with 1 row', async () => {
                    expect(discrepancies).toHaveLength(1);
                });

                it('should return a report with the correct keys and values', () => {
                    const firstRow = discrepancies[0];
                    expect(firstRow.remarks[0]).toEqual('Does not exist in proxy record');
                    expect(firstRow.amount).toEqual(24);
                    expect(firstRow.description).toEqual('B');
                    expect(firstRow.id).toEqual('zoUr');
                    expect(firstRow.date).toContain('2021-06-30');
                });
            });

            describe('and there is a mismatch in data', () => {
                describe('and the mismatch is description', () => {
                    beforeEach(async () => {
                        discrepancies = (
                            await service.generateReconciliationData(
                                generateFilePath('../dummyData/proxy-1.csv'),
                                generateFilePath('../dummyData/source-4.csv'),
                            )
                        ).discrepancies;
                    });

                    it('should return a report with 1 row', () => {
                        expect(discrepancies.length).toEqual(1);
                    });

                    it('should return remarks which contains information about mismatching description', () => {
                        expect(discrepancies[0].remarks).toEqual(
                            expect.arrayContaining(["description is 'A' in proxy but 'B' in source"]),
                        );
                    });
                });

                describe('and the mismatch is amount or date', () => {
                    beforeEach(async () => {
                        discrepancies = (
                            await service.generateReconciliationData(
                                generateFilePath('../dummyData/proxy-1.csv'),
                                generateFilePath('../dummyData/source-8.csv'),
                            )
                        ).discrepancies;
                    });

                    it('should return a report with 1 row', () => {
                        expect(discrepancies.length).toEqual(1);
                    });

                    it('should return remarks which contains information about mismatching amount', () => {
                        expect(discrepancies[0].remarks).toEqual(
                            expect.arrayContaining(["amount is '24' in proxy but '25' in source"]),
                        );
                    });

                    it('should return remarks which contains information about mismatching date', () => {
                        expect(discrepancies[0].remarks).toEqual(
                            expect.arrayContaining(["date is '2021-06-30' in proxy but '2021-06-29' in source"]),
                        );
                    });
                });
            });
        });
    });

    describe('.generateReconReport', () => {
        let data: ReconciliationData;

        describe('where there is no irreconciliable data', () => {
            beforeEach(async () => {
                data = await service.generateReconciliationReport(
                    generateFilePath('../dummyData/proxy-2.csv'),
                    generateFilePath('../dummyData/source-6.csv'),
                );
            });

            it('should return no date range', () => {
                const { min: minDate, max: maxDate } = data.dateRange;
                expect(minDate).toEqual('');
                expect(maxDate).toEqual('');
            });
        });

        describe('where there is 1 row of irreconciliable data', () => {
            beforeEach(async () => {
                data = await service.generateReconciliationReport(
                    generateFilePath('../dummyData/proxy-1.csv'),
                    generateFilePath('../dummyData/source-6.csv'),
                );
            });

            it('should return 1 date range', () => {
                const { min: minDate, max: maxDate } = data.dateRange;
                expect(minDate).toEqual('2021-06-30');
                expect(maxDate).toEqual('2021-06-30');
            });
        });

        describe('where there is more than 1 row of irreconciliable data', () => {
            beforeEach(async () => {
                data = await service.generateReconciliationReport(
                    generateFilePath('../dummyData/proxy-3.csv'),
                    generateFilePath('../dummyData/source-6.csv'),
                );
            });

            it('should return the correct date range', () => {
                const { min: minDate, max: maxDate } = data.dateRange;
                expect(minDate).toEqual('2021-05-30');
                expect(maxDate).toEqual('2021-12-30');
            });

            it('should return the number of discrepancies', () => {
                expect(data.discrepancies.length).toEqual(3);
            });
        });

        describe('when there are 2 sources rows processed', () => {
            beforeEach(async () => {
                data = await service.generateReconciliationReport(
                    generateFilePath('../dummyData/proxy-2.csv'),
                    generateFilePath('../dummyData/source-9.csv'),
                );
            });

            it('should return the correct number of source rows processed', () => {
                expect(data.sourceRowsProcessed).toEqual(2);
            });
        });
    });
});
