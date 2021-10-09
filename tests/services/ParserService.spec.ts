import { ParserService } from '../../src/services/ParserService';
import * as path from 'path';
import { StatementRow } from '../../src/interfaces/StatementInterfaces';
import * as moment from 'moment';

describe('ParserService', () => {
    const parser = new ParserService();
    const generateFilePath = (filePath: string): string => path.resolve(__dirname, filePath);

    describe('.readStatement', () => {
        let parsedData: Map<string, StatementRow>;

        describe('for any given statements', () => {
            describe('when the input rows contain duplicate ids', () => {
                it('should record the last duplicate as the final parsed data', async () => {
                    parsedData = await parser.readStatement(generateFilePath('../dummyData/source-5.csv'));
                    const rows = Array.from(parsedData.values());
                    expect(Array.from(parsedData.values()).length).toEqual(1);
                    expect(rows[0].amount).toEqual(12);
                    expect(rows[0].description).toEqual('F');
                });
            });
        });

        describe('for source statements', () => {
            describe('when the input contains only headers and 1 row of simple data', () => {
                beforeEach(async () => {
                    parsedData = await parser.readStatement(generateFilePath('../dummyData/source-1.csv'));
                });

                it('should be able to parse a statement and return a Map', () => {
                    expect(parsedData instanceof Map).toEqual(true);
                });

                it('should return instances of the same class as values', () => {
                    expect(Array.from(parsedData.values()).every((element) => element instanceof StatementRow)).toEqual(
                        true,
                    );
                });

                it('should return the mapped statements in the correct form', () => {
                    const [firstRow] = Array.from(parsedData.values());
                    expect(typeof firstRow.id === 'string').toEqual(true);
                    expect(typeof firstRow.amount === 'number').toEqual(true);
                    expect(typeof firstRow.description === 'string').toEqual(true);
                    expect(firstRow.date).toEqual('2021-06-30');
                });
            });

            describe('when a date range is defined', () => {
                beforeEach(async () => {
                    parsedData = await parser.readStatement(generateFilePath('../dummyData/source-9.csv'), {
                        date: ['2021-07-01', '2021-07-31'],
                    });
                });

                it('should only return the entries within the date range', () => {
                    const data = Array.from(parsedData.values());
                    expect(data.length).toEqual(1);
                    expect(moment(data[0].date).isBetween(moment('2021-07-01'), moment('2021-07-31')));
                });
            });

            describe('when the file does not exist', () => {
                it('should return an error message stating so', () => {
                    return expect(parser.readStatement('banana')).rejects.toThrow('no such file or directory');
                });
            });
        });

        describe('for proxy statements', () => {
            describe('where the input contains only headers and 1 row of simple data', () => {
                beforeEach(async () => {
                    parsedData = await parser.readStatement(generateFilePath('../dummyData/proxy-1.csv'));
                });

                it('should still return the same form of data as source statements', () => {
                    const [firstRow] = Array.from(parsedData.values());
                    expect(typeof firstRow.id === 'string').toEqual(true);
                    expect(typeof firstRow.amount === 'number').toEqual(true);
                    expect(typeof firstRow.description === 'string').toEqual(true);
                    expect(firstRow.date).toEqual('2021-06-30');
                });
            });
        });
    });
});
