import * as inquirer from 'inquirer';
import { AGEDocument, CessionarioCommittente } from '../interfaces/age.interface';
import { Credentials } from '../services/credentials.service';
import { inspect } from 'util';
import moment from 'moment';
import { isEmpty } from 'lodash';
import { renderAgeXML } from '../templates/fattura-forfettaria';
import { formatMoney, generaProgressivoInvio, isNumeric, normalizzaVAT } from '../functions';

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
      validate: (v) => !isEmpty(v),
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'piva',
      validate: (v) => !isEmpty(v),
      message: `Partita Iva (Codice fiscale nel caso di privati)`,
    },
    {
      type: 'input',
      name: 'sdiCode',
      validate: (v) => !isEmpty(v),
      message: `Codice univoco SDI (o pec)`,
    },
    {
      type: 'input',
      name: 'indirizzo',
      message: `Indirizzo`,
      validate: (v) => !isEmpty(v),
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'civico',
      message: `Numero Civico (opzionale se già inserito in indirizzo)`,
    },
    {
      type: 'input',
      name: 'cap',
      validate: (v) => !isEmpty(v),
      message: `CAP`,
    },
    {
      type: 'input',
      name: 'comune',
      message: `Comune (per esteso. Es: PALERMO)`,
      validate: (v) => !isEmpty(v),
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'provincia',
      message: `Provincia (2 lettere, es: PA)`,
      validate: (v) => !isEmpty(v),
      transformer: (v: string) => v.toUpperCase(),
    },
    {
      type: 'input',
      name: 'paese',
      message: `Paese (2 lettere, es: IT)`,
      validate: (v) => !isEmpty(v),
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
    value: c,
    name: c.DatiAnagrafici.Anagrafica.Denominazione,
  }));

  options.push({
    value: false,
    name: '-> [Inserisci nuovo cliente]',
  });

  return prompt([
    {
      type: 'list',
      name: 'customer',
      message: `Seleziona il contatto a cui inviare fattura`,
      choices: options,
    },
  ]).then((res) => {
    if (res.customer !== false) {
      return res.customer;
    }

    // flusso creazione nuovo cliente
    return createContactForm().then((prompt) => {
      const c: any = prompt;
      return {
        __Nitonic__NewSDICode: c.sdiCode.toUpperCase(),
        Sede: {
          CAP: c.cap,
          Comune: c.comune.toUpperCase(),
          Indirizzo: c.indirizzo.toUpperCase(),
          Nazione: c.paese.toUpperCase(),
          NumeroCivico: c.civico.toUpperCase(),
          Provincia: c.provincia.toUpperCase(),
        },
        DatiAnagrafici: {
          Anagrafica: {
            Denominazione: c.ragSociale.toUpperCase(),
          },
          CodiceFiscale: c.piva.toUpperCase(),
          IdFiscaleIVA: {
            IdPaese: c.paese.toUpperCase(),
            IdCodice: c.piva.toUpperCase(),
          },
        },
      } as CessionarioCommittente;
    });
  });
};

export const compileFatturaForm = async (
  numerazione: number,
  committente: CessionarioCommittente,
  modelloFattura: AGEDocument,
  ultimaFatturaCliente: AGEDocument = null,
): Promise<any> => {
  const ultimaCausale = ultimaFatturaCliente
    ? ultimaFatturaCliente.FatturaElettronicaBody.DatiBeniServizi.DettaglioLinee.Descrizione
    : '';

  const vatCommittente = normalizzaVAT(committente.DatiAnagrafici.IdFiscaleIVA.IdCodice);
  const vatPrestatore = normalizzaVAT(
    modelloFattura.FatturaElettronicaHeader.CedentePrestatore.DatiAnagrafici.IdFiscaleIVA.IdCodice,
  );

  const fatturaBase = await inquirer.createPromptModule()([
    {
      type: 'input',
      name: 'numerazione',
      message: `Numero Fattura`,
      default: numerazione,
      validate: (v) => isNumeric(v),
    },
    {
      type: 'list',
      name: 'dataDocumento',
      message: `Data Documento`,
      choices: [
        {
          name: `Oggi (${moment().format('YYYY-MM-DD')})`,
          value: moment().format('YYYY-MM-DD'),
          checked: true,
        },
        {
          name: `Ieri (${moment().subtract(1, 'day').format('YYYY-MM-DD')})`,
          value: moment().subtract(1, 'day').format('YYYY-MM-DD'),
          checked: true,
        },
        {
          name: `2 Giorni fa (${moment().subtract(2, 'day').format('YYYY-MM-DD')})`,
          value: moment().subtract(2, 'day').format('YYYY-MM-DD'),
          checked: true,
        },
      ],
    },
  ]);

  // const scegliTipoPrestazione = await inquirer.createPromptModule()([
  //   {
  //     type: 'list',
  //     name: 'tipoPrestazione',
  //     message: `Tipo Prestazione`,
  //     choices: [
  //       {
  //         name: `Compila manualmente`,
  //         value: 'libera',
  //         checked: true,
  //       },
  //       {
  //         name: `Giornaliera !! COMING SOON...`,
  //         value: 'giornaliera',
  //       },
  //       {
  //         name: `Oraria !! COMING SOON...`,
  //         value: 'oraria',
  //       },
  //     ],
  //   },
  // ]);

  const prestazioneLibera = await inquirer.createPromptModule()([
    {
      type: 'input',
      name: 'importo',
      validate: (v) => isNumeric(v),
      message: `Importo prestazione (Es: 3000.00)`,
    },
    {
      type: 'input',
      name: 'prestazione',
      validate: (v) => !isEmpty(v),
      // transformer: (v) => (v as string).toUpperCase(),
      message: `Causale Prestazione:\n${ultimaCausale}\n\n`,
    },
  ]);

  const importo = prestazioneLibera.importo;

  const bollo = await inquirer.createPromptModule()([
    {
      type: 'list',
      name: 'bollo',
      message: `Bollo Virtuale (€ 2.00 per importi totali superiori a € 77,47)`,
      default: importo >= 77.47,
      choices: [
        {
          name: 'Si',
          value: true,
        },
        {
          name: 'No',
          value: false,
        },
      ],
    },
  ]);

  const dataPagamento = await inquirer.createPromptModule()([
    {
      type: 'list',
      name: 'dataPagamento',
      message: `Data termini pagamento da parte del committente`,
      default: moment().add(15, 'day').format('YYYY-MM-DD'),
      choices: [
        {
          name: `5 Giorni`,
          value: moment().add(5, 'day').format('YYYY-MM-DD'),
        },
        {
          name: `10 Giorni`,
          value: moment().add(10, 'day').format('YYYY-MM-DD'),
        },
        {
          name: `15 Giorni`,
          value: moment().add(15, 'day').format('YYYY-MM-DD'),
        },
        {
          name: `30 Giorni`,
          value: moment().add(30, 'day').format('YYYY-MM-DD'),
        },
      ],
    },
  ]);

  const sdiCode =
    committente.__Nitonic__NewSDICode ||
    ultimaFatturaCliente.FatturaElettronicaHeader.DatiTrasmissione.CodiceDestinatario;

  const formattedImporto = formatMoney(importo, 2, '.', '');
  const progressivoInvio = generaProgressivoInvio(10);

  const xml = renderAgeXML({
    FatturaElettronicaHeader: {
      DatiTrasmissione: {
        // Override
        ...modelloFattura.FatturaElettronicaHeader.DatiTrasmissione,
        CodiceDestinatario: sdiCode,
        ProgressivoInvio: progressivoInvio,
      },
      CedentePrestatore: {
        ...modelloFattura.FatturaElettronicaHeader.CedentePrestatore,
        DatiAnagrafici: {
          ...modelloFattura.FatturaElettronicaHeader.CedentePrestatore.DatiAnagrafici,
          IdFiscaleIVA: {
            ...modelloFattura.FatturaElettronicaHeader.CedentePrestatore.DatiAnagrafici
              .IdFiscaleIVA,
            IdCodice: vatPrestatore,
          },
        },
      },
      CessionarioCommittente: {
        ...committente,
        DatiAnagrafici: {
          ...committente.DatiAnagrafici,
          IdFiscaleIVA: {
            ...committente.DatiAnagrafici.IdFiscaleIVA,
            IdCodice: vatCommittente,
          },
        },
      },
    },
    FatturaElettronicaBody: {
      DatiGenerali: {
        DatiGeneraliDocumento: {
          ...modelloFattura.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento,
          Data: fatturaBase.dataDocumento,
          Numero: fatturaBase.numerazione,
          DatiBollo: {
            BolloVirtuale: bollo.bollo ? 'SI' : 'NO',
            ImportoBollo: bollo.bollo ? '2.00' : '0.00',
          },
          ImportoTotaleDocumento: formattedImporto,
        },
      },
      DatiBeniServizi: {
        DettaglioLinee: {
          ...modelloFattura.FatturaElettronicaBody.DatiBeniServizi.DettaglioLinee,
          AliquotaIva: '0.00',
          Quantita: '1.00',
          Descrizione: (prestazioneLibera.prestazione as string).toUpperCase(),
          PrezzoUnitario: formattedImporto,
          PrezzoTotale: formattedImporto,
        },
        DatiRiepilogo: {
          ...modelloFattura.FatturaElettronicaBody.DatiBeniServizi.DatiRiepilogo,
          AliquotaIva: '0.00',
          Imposta: '0.00',
          Arrotondamento: '0.00',
          ImponibileImporto: formattedImporto,
        },
      },
      DatiPagamento: {
        ...modelloFattura.FatturaElettronicaBody.DatiPagamento,
        DettaglioPagamento: {
          ...modelloFattura.FatturaElettronicaBody.DatiPagamento.DettaglioPagamento,
          DataRiferimentoTerminiPagamento: dataPagamento.dataPagamento,
          ImportoPagamento: formattedImporto,
        },
      },
    },
  });

  return xml;
};
