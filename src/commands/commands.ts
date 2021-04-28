import { forEach, groupBy, isNull, mapKeys, mapValues } from 'lodash';
import ora from 'ora';
import chalk from 'chalk';
import { Filesystem as FS } from '../filesystem/filesystem';
import {
  compileFatturaForm,
  createContactForm,
  selectCustomerForm,
  setCodiceFiscaleForm,
  setUserIdForm,
  setUserSecretForm,
} from '../forms/forms';
import {
  ageDocumentService,
  docCreatorHelperService,
  credentialsService,
  db,
  syncService,
  teamSystem,
} from '../singletons';
import { TSCustomer, TSDocument } from '../interfaces/teamsystem.interface';
import { CessionarioCommittente } from '../interfaces/age.interface';

const log = console.log;

const print = (msg: string, color: 'red' | 'green' | 'yellow' = 'green') => {
  log(chalk[color](msg));
};

const loading = async (
  callback,
  msg: { loading?: string; success?: string; fail?: string } = {},
  onFail = (err) => {},
) => {
  const spinner = ora(msg.loading || 'Caricamento').start();

  try {
    await callback();
  } catch (err) {
    spinner.stop();
    print(msg.fail ? msg.fail : err, 'red');
    await onFail(err);
    process.exit(0);
  }

  spinner.stop();
  if (msg.success) {
    print(msg.success, 'green');
  }
};

export const bootstrap = async () => {
  const credentials = credentialsService.getCredentials();

  // check credentials
  if (isNull(credentials.codiceFiscale)) {
    await setCodiceFiscaleForm().then((data) => {
      credentialsService.setCodiceFiscale(data.codiceFiscale);
    });
  }

  if (isNull(credentials.userId)) {
    await setUserIdForm().then((data) => {
      credentialsService.setUserId(data.userId);
    });
  }

  if (isNull(credentials.userSecret)) {
    await setUserSecretForm().then((data) => {
      credentialsService.setUserSecret(data.userSecret);
    });
  }

  await loading(
    async () => {
      const bearer = await teamSystem.resolveBearer();
      credentialsService.setBearer(bearer);
    },
    {
      loading: 'Login @ Teamsystem...',
      fail: 'Login Fallito, reinserire le credenziali',
      success: 'Login Effettuato',
    },
    async () => {
      credentialsService.deleteCredentials();
    },
  );

  // Init and migrate db
  await db.init(FS.resolveFilePath('nitonic.db'));
  await db.migrate();
};

export const syncCommand = async (args, opt, log) => {
  await bootstrap();

  await loading(
    async () => {
      await syncService.execute();
    },
    {
      loading: 'Sincronizzazione dei contatti in rubrica',
      success: 'Sincronizzazione effettuata',
    },
  );
};

export const contactCreateCommand = async (args, opt, log) => {
  await bootstrap();

  const data: TSCustomer = (await createContactForm()) as any;
  await loading(
    async () => {
      await docCreatorHelperService.create(data);
    },
    {
      success: 'Contatto Salvato con successo',
    },
  );
};

export const contactListCommand = async (args, opt, log) => {
  await bootstrap();
};

export const testCommand = async (args, opt, log) => {
  await bootstrap();
  const fatture = await teamSystem.getFatture();

  // console.log(fatture[0].id);

  // const d = await ageDocumentService.parseDocument('dd8f95b3-68b3-45a0-82e0-6ef5c48925d4');
  // console.log(d.FatturaElettronicaHeader.CessionarioCommittente);

  // const d = await ageDocumentService.getCurrentNumeration();
  // console.log(d);
};

export const createFatturaCommand = async (args, opt, log) => {
  await bootstrap();

  const committente = await selectCustomerForm(
    await docCreatorHelperService.getTeamSystemCustomers(),
  );

  const prestatore = await docCreatorHelperService.getPrestatore();
  const ultimoModelloFattura = await docCreatorHelperService.getLastDocumentByCustomer(committente);
  const nuovaNumerazione = await docCreatorHelperService
    .getCurrentNumeration()
    .then((n) => n.fattura + 1);

  compileFatturaForm(ultimoModelloFattura, nuovaNumerazione);

  // console.log(ultimaFattura.FatturaElettronicaBody.DatiBeniServizi.DettaglioLinee.Descrizione);

  //
};
