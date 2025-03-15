declare module 'lazydb' {
    interface Schema {
      [key: string]: 'string' | 'number' | 'boolean';
    }
  
    class LazyDB {
      constructor(filePath?: string);
      createTable(table: string, schema: Schema): void;
      insert(table: string, record: object): number;
      select(table: string): QueryBuilder;
      update(table: string, id: number, updates: object): void;
      delete(table: string, id: number): void;
      transaction(): Transaction;
      on(event: 'insert' | 'update' | 'delete', listener: (table: string, record: any) => void): this;
    }
  
    class QueryBuilder {
      join(joinTable: string, leftKey: string, rightKey: string): this;
      where(field: string, op: '>' | '<' | '=' | '>=' | '<=', value: any): this;
      orderBy(field: string): this;
      limit(num: number): this;
      aggregate(field: string, type: 'count' | 'sum' | 'avg' | 'min' | 'max'): number;
      search(field: string, query: string): this;
      execute(): any[];
    }
  
    class Transaction {
      insert(table: string, record: object): this;
      commit(): void;
      rollback(): void;
    }
  
    export = LazyDB;
  }