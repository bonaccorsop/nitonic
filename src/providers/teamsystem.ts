import { AxiosResponse, default as axios } from 'axios';
import moment from 'moment';
import { Filesystem } from '../filesystem/filesystem';
import { SDIData, TSCustomer, TSDocument, TSPrestatore } from '../interfaces/teamsystem.interface';
import { CredentialsService } from '../services/credentials.service';
import * as xmlParser from 'fast-xml-parser';
import * as he from 'he';
import { inspect } from 'util';
import * as crypto from 'crypto';

export class TeamSystem {
  private baseUrl: string = 'https://ts-console-api.agyo.io';

  constructor(private credentialsService: CredentialsService) {}

  private resolveHeaders(): Record<string, unknown> {
    return {
      authorization: `Bearer ${this.credentialsService.getBearer()}`,

      authority: 'ts-console-api.agyo.io',
      pragma: 'no-cache',

      accept: 'application/json, text/plain, */*',
      referer: 'https://apps.agyo.io/',
      origin: 'https://apps.agyo.io',

      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
      'cache-control': 'no-cache',
      'accept-language': 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7',

      'sec-ch-ua': '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
      'x-app-version': '1.99.3-HOT',
      'x-app-name': 'ts-console.invoices',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',

      'sec-ch-ua-mobile': '?0',
    };
  }

  public async fetchContent(docId: string, format: 'xml' | 'pdf'): Promise<AxiosResponse> {
    return axios.get(`${this.baseUrl}/invoices/active/${docId}/content`, {
      params: format === 'xml' ? { format } : { format, type: 'ade' },
      headers: {
        ...this.resolveHeaders(),
      },
    });
  }

  public async fetchContentXML(docId: string): Promise<string> {
    return this.fetchContent(docId, 'xml').then((res) => res.data);
  }

  public async fetchContentPDF(docId: string): Promise<string> {
    return this.fetchContent(docId, 'pdf').then((res) => res.data);
  }

  public async fetchSDIContentData(docId: string): Promise<SDIData> {
    const xmlData = await this.fetchContentXML(docId);

    const options = {
      attributeNamePrefix: '@_',
      attrNodeName: 'attr', // default is 'false'
      textNodeName: '#text',
      ignoreAttributes: true,
      ignoreNameSpace: false,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: false,
      trimValues: true,
      cdataTagName: '__cdata', // default is 'false'
      cdataPositionChar: '\\c',
      parseTrueNumberOnly: false,
      arrayMode: false, // "strict"
      attrValueProcessor: (val, attrName) => he.decode(val, { isAttributeValue: true }), // default is a=>a
      tagValueProcessor: (val, tagName) => he.decode(val), // default is a=>a
      stopNodes: ['parse-me-as-string'],
    };

    return xmlParser.convertToJson(xmlParser.getTraversalObj(xmlData, options), options)[
      'ns3:FatturaElettronica'
    ];
  }

  public async fetchCustomerData(docId: string): Promise<TSCustomer> {
    const data = (await this.fetchSDIContentData(docId)) as any;

    // console.log(inspect(data, true, null, true));

    const customer = data.FatturaElettronicaHeader.CessionarioCommittente;
    const trasmissione = data.FatturaElettronicaHeader.DatiTrasmissione;

    return {
      ragSociale: customer.DatiAnagrafici.Anagrafica.Denominazione,
      partitaIva: customer.DatiAnagrafici.IdFiscaleIVA.IdCodice,
      provincia: customer.Sede.Provincia,
      civico: customer.Sede.NumeroCivico,
      indirizzo: customer.Sede.Indirizzo,
      comune: customer.Sede.Comune,
      paese: customer.Sede.Nazione,
      cap: customer.Sede.CAP,
      codiceUnivoco: trasmissione.CodiceDestinatario,
      pec: trasmissione.PECDestinatario,
    };
  }

  public async fetchSenderData(docId: string): Promise<TSPrestatore> {
    const data = (await this.fetchSDIContentData(docId)) as any;

    const prestatore = data.FatturaElettronicaHeader.CedentePrestatore;

    return {
      ragSociale: prestatore.DatiAnagrafici.Anagrafica.Denominazione,
      partitaIva: prestatore.DatiAnagrafici.IdFiscaleIVA.IdCodice,
      provincia: prestatore.Sede.Provincia,
      civico: prestatore.Sede.NumeroCivico,
      indirizzo: prestatore.Sede.Indirizzo,
      comune: prestatore.Sede.Comune,
      paese: prestatore.Sede.Nazione,
      cap: prestatore.Sede.CAP,

      codiceFiscale: prestatore.DatiAnagrafici.CodiceFiscale,
      regimeFiscale: prestatore.DatiAnagrafici.RegimeFiscale,

      reaNum: prestatore.IscrizioneREA.NumeroREA,
      reaStatoLiquidazione: prestatore.IscrizioneREA.StatoLiquidazione,
      reaUfficio: prestatore.IscrizioneREA.Ufficio,
      codiceUnivoco: null,
      pec: null,
    };
  }

  public async getDocument(docId: string): Promise<TSDocument> {
    return axios
      .get(`${this.baseUrl}/invoices/active/${docId}`, {
        headers: {
          ...this.resolveHeaders(),
        },
      })
      .then((res) => res.data);
  }

  public async getDocuments(pageLen = 200, filterDate: boolean = true): Promise<TSDocument[]> {
    const timeRange = `${moment().startOf('year').format('YYYY-MM-DD')}/${moment().format(
      'YYYY-MM-DD',
    )}`;

    return axios
      .get(`${this.baseUrl}/invoices/active`, {
        headers: this.resolveHeaders(),
        params: {
          senderId: this.credentialsService.getCodiceFiscale(),
          trashed: false,
          ...(filterDate ? { date: timeRange } : {}),
          first: pageLen,
          'flowTypes%5B0%5D': 'AUTOINVIO',
          'flowTypes%5B1%5D': 'SDI',
          'flowTypes%5B2%5D': 'SDIPA',
          'flowTypes%5B3%5D': 'SDIPR',
          'flowTypes%5B4%5D': 'SELFINV',
          'flowTypes%5B5%5D': 'SELFSEND',
          'flowTypes%5B6%5D': 'STORE',
        },
      })
      .then((resp) => resp.data._embedded.invoices);
  }

  public async resolveBearer(): Promise<any> {
    const userId = this.credentialsService.getUserId();
    const userSecret = this.credentialsService.getUserSecret();

    const portalHeader = {
      authority: 'ts-portale-api.agyo.io',
      authorization: 'Bearer',
      accept: 'application/json, text/plain, */*',
      origin: 'https://app.teamsystemdigital.com',
      referer: 'https://app.teamsystemdigital.com/',
      'accept-language': 'it-IT',
      'x-correlation-id': '6c1a85bd-315f-4ee5-8b5b-c44705a73f9d',
      'x-request-id': 'cknvjkshk000w3161ud67tpzd',
      'x-app-version': '1.0',
      'x-app-name': 'PORTALE',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
    };

    return axios
      .get(`https://ts-portale-api.agyo.io/login/agyo/nonce?userId=${userId}`, {
        headers: portalHeader,
      })
      .then((res) =>
        axios.post(
          'https://ts-portale-api.agyo.io/login/agyo',
          {
            id: userId,
            digest: SHA256(LowerCase(SHA256(LowerCase(userId) + userSecret)) + res.data.nonce),
          },
          {
            headers: portalHeader,
          },
        ),
      )
      .then((res) => res.data.token);
  }

  public async testBearer(): Promise<boolean> {
    try {
      await this.getDocuments();
    } catch {
      return false;
    }
    return true;
  }

  public async getFatture(): Promise<TSDocument[]> {
    return this.getDocuments().then((docs) => docs.filter((d) => d.documentType === 'TD01'));
  }

  public getNoteCredito(): Promise<TSDocument[]> {
    return this.getDocuments().then((docs) => docs.filter((d) => d.documentType === 'TD04'));
  }
}

function SHA256(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function LowerCase(str: string) {
  return str.toLowerCase();
}
