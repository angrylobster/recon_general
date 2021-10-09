import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';

export class StatementRow {
    @Expose()
    @Type(() => String)
    date: string;

    @Expose()
    @Type(() => String)
    id: string;

    @Expose()
    @Type(() => Number)
    amount: number;

    @Expose()
    @Type(() => String)
    description: string;

    remarks?: string[];

    addRemark(input: string): void {
        if (!this.remarks) this.remarks = [];
        this.remarks.push(input);
    }

    equals(otherStatement: StatementRow): boolean {
        return (
            this.id === otherStatement.id &&
            this.amount === otherStatement.amount &&
            this.description === otherStatement.description &&
            this.date === otherStatement.date
        );
    }

    toString(): string {
        return `${this.amount},${this.description},${this.date},${this.id},${this.remarks.join(';')}\n`;
    }
}

export type StatementProperty = keyof StatementRow;
