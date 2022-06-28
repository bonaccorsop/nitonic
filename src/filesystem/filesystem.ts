import { existsSync, mkdirSync, readFileSync, accessSync, writeFileSync, unlinkSync } from 'fs';
import { truncate } from 'lodash';
import { homedir } from 'os';

export class Filesystem {
  private static homeDir: string;

  static fileExists(filePath: string = ''): boolean {
    try {
      accessSync(Filesystem.resolveFilePath(filePath));
      return true;
    } catch (err) {
      return false;
    }
  }

  static init(homeDirName): void {
    Filesystem.homeDir = `${homedir()}/${homeDirName}`;
  }

  static provisionFileSystem(): void {
    if (!Filesystem.fileExists()) {
      mkdirSync(Filesystem.homeDir);
    }

    const p = Filesystem.homeDir + '/documents';
    if (!existsSync(p)) {
      mkdirSync(p);
    }
  }

  static resolveFilePath(filePath: string): string {
    return `${Filesystem.homeDir}/${filePath}`;
  }

  public static readRawFile(filePath: string): Buffer {
    return readFileSync(Filesystem.resolveFilePath(filePath));
  }

  static readFile(filePath: string): string {
    return Filesystem.readRawFile(filePath).toString('utf-8');
  }

  static deleteFile(filePath: string): void {
    const file = Filesystem.resolveFilePath(filePath);
    unlinkSync(file);
  }

  static readJson<T>(filePath: string): T {
    return JSON.parse(Filesystem.readFile(filePath));
  }

  static writeFile(filePath: string, data: string, binary = false): void {
    return writeFileSync(Filesystem.resolveFilePath(filePath), data, binary ? 'binary' : null);
  }

  static writeJson(filePath: string, data: Record<string, unknown>): void {
    return Filesystem.writeFile(filePath, JSON.stringify(data));
  }
}
