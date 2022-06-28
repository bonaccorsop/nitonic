import { TeamSystem } from '../providers/teamsystem';

import * as xmlParser from 'fast-xml-parser';
import * as he from 'he';
import { AGEDocument } from '../interfaces/age.interface';
import moment from 'moment';
import slugify from 'slugify';
import { isEmpty } from 'lodash';

export class AgeDocumentService {
  constructor(private teamSystem: TeamSystem) {}

  parseDocumentFromXml(xml: string): AGEDocument {
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

    const out = xmlParser.convertToJson(xmlParser.getTraversalObj(xml, options), options)[
      'ns3:FatturaElettronica'
    ] as AGEDocument;

    // patch denominazione per persone fisiche
    if (
      isEmpty(
        out.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Denominazione,
      )
    ) {
      out.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Denominazione = `${out.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Nome} ${out.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Cognome}`;
    }

    return out;
  }

  async getAgeDocument(docId: string): Promise<AGEDocument> {
    return this.teamSystem.fetchContentXML(docId).then((xml) => this.parseDocumentFromXml(xml));
  }

  resolveDocumentFSName(d: AGEDocument): string {
    const dati = d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento;

    const prefix = dati.TipoDocumento === 'TD01' ? 'fatt' : 'ncre';
    const year = moment(dati.Data).format('YYYY');
    const num = ('00000' + dati.Numero).slice(-5);
    const dest = d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica
      .Denominazione
      ? slugify(
          d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Denominazione,
        )
      : `${slugify(
          d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Nome,
        )} ${slugify(
          d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Cognome,
        )}`;

    return `${prefix}-${year}-${num}-${dest}`;
  }

  resolveDocumentDisplayName(d: AGEDocument): string {
    const dati = d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento;

    const num = ('00' + dati.Numero).slice(-5);
    const dest = slugify(
      d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.Anagrafica.Denominazione,
    );
    const amount = d.FatturaElettronicaBody.DatiPagamento.DettaglioPagamento.ImportoPagamento;

    return `${num} - ${dest} - € ${amount}`;
  }
}
