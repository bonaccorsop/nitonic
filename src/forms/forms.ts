import * as inquirer from 'inquirer';
import { AGEDocument, CessionarioCommittente } from '../interfaces/age.interface';
import { Credentials } from '../services/credentials.service';
import { inspect } from 'util';
import moment from 'moment';

export const setCodiceFiscaleForm = (): Promise<Credentials> => {
  const prompt = inquirer.createPromptModule();

  return prompt([
    {
      type: 'input',
      name: 'codiceFiscale',
      message: 'Inserisci il tuo codice fiscale',
      validate: (val: string) => new RegExp(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i).test(val),
      transformer: (v: string) => v.toUpperCase(),
    },
  ]);
};

export const setUserIdForm = (): Promise<Credentials> => {
  const prompt = inquirer.createPromptModule();

  return prompt([
    {
      type: 'input',
      name: 'userId',
      message: 'Inserisci il tuo userId (email usata per TeamSystem)',
      // validate: (val: string) => new RegExp(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i).test(val),
    },
  ]);
};

export const setUserSecretForm = (): Promise<Credentials> => {
  const prompt = inquirer.createPromptModule();

  return prompt([
    {
      type: 'password',
      name: 'userSecret',
      message: 'Inserisci la tua password TeamSystem',
    },
  ]);
};

export const setBearerForm = (codFiscale): Promise<Credentials> => {
  const tsUrl = `https://app.teamsystemdigital.com/portale/#/login?redirectTo=/${codFiscale}/apps/fatturazione`;

  const prompt = inquirer.createPromptModule();

  return prompt([
    {
      type: 'input',
      name: 'bearer',
      validate: (val: string) =>
        new RegExp(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/).test(val),
      message: `Inserisci il bearer generato da Team System (${tsUrl})`,
    },
  ]);
};

export const createContactForm = (): Promise<inquirer.PromptModule> => {
  const prompt = inquirer.createPromptModule();
  return prompt([
    {
      type: 'input',
      name: 'ragSociale',
      message: `Ragione Sociale`,
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'indirizzo',
      message: `Indirizzo (senza civico)`,
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'civico',
      message: `Numero Civico`,
    },
    {
      type: 'input',
      name: 'cap',
      message: `CAP`,
    },
    {
      type: 'input',
      name: 'comune',
      message: `Comune`,
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'provincia',
      message: `Provincia (2 lettere, es: PA)`,
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'paese',
      message: `Paese (2 lettere, es: IT)`,
      transformer: (v: string) => v.toUpperCase(),
    },
  ]);
};

export const selectCustomerForm = (
  customers: CessionarioCommittente[],
): Promise<CessionarioCommittente> => {
  const prompt = inquirer.createPromptModule();

  let options: any[] = [];

  options = customers.map((c) => ({
    key: c.DatiAnagrafici.IdFiscaleIVA.IdCodice,
    value: c,
    name: c.DatiAnagrafici.Anagrafica.Denominazione,
  }));

  return prompt([
    {
      type: 'list',
      name: 'customer',
      message: `Seleziona il contatto a cui inviare fattura`,
      choices: options,
    },
  ]).then((a) => a.customer);
};

export const compileFatturaForm = (
  ultimoModelloFattura: AGEDocument,
  numerazione: number,
): Promise<any> => {
  const prompt = inquirer.createPromptModule();

  let options: any[] = [];

  return prompt([
    {
      type: 'list',
      name: 'NA',
      message: `Tipo compilazione`,
      choices: [
        {
          key: 'fattura-nitonic',
          value: 'nitonic',
          name: 'Prestazione forfettaria NiTonic',
          checked: true,
        },
        {
          key: 'more',
          value: 'more',
          name: 'More coming...',
        },
      ],
    },
    {
      type: 'number',
      name: 'numerazione',
      message: `Numero Fattura`,
      // TODO: validazione numero
      default: numerazione,
    },
    {
      type: 'input',
      name: 'data',
      message: `Data (Modello YYYY-MM-DD)`,
      default: moment().format('YYYY-MM-DD'),
    },
    {
      type: 'input',
      name: 'prestazione',
      message: `Causale Prestazione: => ${ultimoModelloFattura.FatturaElettronicaBody.DatiBeniServizi.DettaglioLinee.Descrizione}\n`,
    },
    // {
    //   type: 'editor',
    //   name: 'prestazione',
    //   message: `Causale Prestazione: (${ultimoModelloFattura.FatturaElettronicaBody.DatiBeniServizi.DettaglioLinee.Descrizione})`,
    // },
  ]).then((a) => a.customer);
};
