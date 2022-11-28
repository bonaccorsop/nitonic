import { Filesystem as FS } from './filesystem/filesystem';

FS.init('.nitonic');
FS.provisionFileSystem();

// services
import { TeamSystem } from './providers/teamsystem';
import { AgeDocumentService } from './services/agedocuments.service';
import { DocumentCreatorHelperService } from './services/doc-creator-helper.service';
import { CredentialsService as CS } from './services/credentials.service';
import { SyncService } from './services/sync.service';
import { StatusService } from './services/status.service';

export const credentialsService = new CS();
export const db = 'test';

export const teamSystem = new TeamSystem(credentialsService);
export const ageDocumentService = new AgeDocumentService(teamSystem);
export const syncService = new SyncService(teamSystem, db, ageDocumentService);
export const statusService = new StatusService(teamSystem, db, ageDocumentService);
export const docCreatorHelperService = new DocumentCreatorHelperService(
  db,
  teamSystem,
  ageDocumentService,
);
