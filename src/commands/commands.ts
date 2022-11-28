import _, { forEach, groupBy, isNull, mapKeys, mapValues } from 'lodash';
import ora from 'ora';
import * as inquirer from 'inquirer';
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
  statusService,
  db,
  syncService,
  teamSystem,
} from '../singletons';

// tslint:disable-next-line: no-console
const log = console.log;

const print = (msg: string, color: 'red' | 'green' | 'yellow' = 'green') => {
  log(chalk[color](msg));
};

const loading = async (
  callback,
  msg: { loading?: string; success?: string; fail?: string } = {},
  onFail = (err) => undefined,
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
};

export const syncCommand = async (args, opt) => {
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

export const statusCommand = async (args, opt) => {
  await bootstrap();

  await loading(
    async () => {
      const aggregate = await statusService.execute(2022);
      log(aggregate)
    },
    {
      loading: 'Caricamento delle fatture dell\'anno',
      // success: 'Sincronizzazione effettuata',
    },
  );

};

export const contactListCommand = async (args, opt) => {
  await bootstrap();
};

export const testCommand = async (args, opt) => {
  await bootstrap();
  const fatture = await teamSystem.getFatture();

  // console.log(fatture[0].id);

  // const d = await ageDocumentService.parseDocument('dd8f95b3-68b3-45a0-82e0-6ef5c48925d4');
  // console.log(d.FatturaElettronicaHeader.CessionarioCommittente);

  // const d = await ageDocumentService.getCurrentNumeration();
  // console.log(d);
};

export const createFatturaCommand = async (args, opt) => {
  await bootstrap();

  const committente = await selectCustomerForm(
    await docCreatorHelperService.getTeamSystemCustomers(),
  );
  const nuovaNumerazione = await docCreatorHelperService
    .getCurrentNumeration()
    .then((n) => n.fattura + 1);

  const modelloFattura = await docCreatorHelperService.getFatturaModel();
  const ultimaFatturaCliente = await docCreatorHelperService.getLastDocumentByCustomer(committente);

  const xml = await compileFatturaForm(
    nuovaNumerazione,
    committente,
    modelloFattura,
    ultimaFatturaCliente,
  );

  log('---------------------------------------------');
  log('---------------------------------------------');
  log('\n\n');
  log(xml);
  log('\n\n');
  log('---------------------------------------------');
  log('---------------------------------------------');
  log("Verifica questo xml all'indirizzo https://fex-app.com/servizi/inizia");

  const doc = ageDocumentService.parseDocumentFromXml(xml);
  const filename = ageDocumentService.resolveDocumentFSName(doc) + '.xml';

  const conferma = await inquirer.createPromptModule()([
    {
      type: 'confirm',
      name: 'confirm',
      default: false,
      message: 'Adesso verrà inviato il documento al Sistema di Interscambio SDI. Procedo?',
    },
  ]);

  if (conferma.confirm) {
    await loading(
      async () => {
        await teamSystem.uploadDocument(doc, xml, filename);
      },
      {
        loading: 'Upload del documento in corso',
        success: 'Caricamento documento effettuato con successo',
      },
    );
  }

  log('Addios!');
};
