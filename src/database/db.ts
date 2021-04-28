import { Database, OPEN_READWRITE } from 'sqlite3';
import { open } from 'sqlite';
import { accessSync, writeFileSync } from 'fs';

export class Db {
  private static db: Db;
  private connection;

  static getInstance(): Db {
    return Db.db;
  }

  async init(dbPath: string): Promise<Db> {
    try {
      accessSync(dbPath);
    } catch {
      writeFileSync(dbPath, '');
    }

    this.connection = await open({
      filename: dbPath,
      driver: Database,
      mode: OPEN_READWRITE,
    });

    return this;
  }

  async migrate(): Promise<any> {
    return this.connection.migrate({
      /**
       * If true, will force the migration API to rollback and re-apply the latest migration over
       * again each time when Node.js app launches.
       */
      force: true,
      /**
       * Migrations table name. Default is 'migrations'
       */
      table: 'migrations',
      /**
       * Path to the migrations folder. Default is `path.join(process.cwd(), 'migrations')`
       */
      migrationsPath: __dirname + '/migrations/',
    });
  }

  async getAll(table: string, whereCondition: string = ''): Promise<any[]> {
    const where = 'WHERE 1 = 1' + whereCondition ? `AND ${whereCondition}` : '';
    return await this.connection.all(`SELECT * FROM ${table} ${whereCondition};`);
  }

  async exec(stm): Promise<void> {
    return this.connection.exec(stm);
  }
}
