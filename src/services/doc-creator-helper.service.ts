import { Db } from '../database/db';
import { TeamSystem } from '../providers/teamsystem';
import { db } from '../singletons';
import { groupBy, forEach, sortBy, isEmpty, maxBy } from 'lodash';
import { TSCustomer, TSDocument } from '../interfaces/teamsystem.interface';
import {
  AGEDocument,
  CedentePrestatore,
  CessionarioCommittente,
} from '../interfaces/age.interface';
import { AgeDocumentService } from './agedocuments.service';

export class DocumentCreatorHelperService {
  private cachedDocuments: AGEDocument[] = [];

  constructor(
    private db: Db,
    private teamSystem: TeamSystem,
    private ageDocumentService: AgeDocumentService,
  ) {}

  async create(c: TSCustomer): Promise<void> {
    const query = `INSERT INTO clienti (ragioneSociale, partitaIva, indirizzo, civico, cap, comune, provincia, paese ) VALUES ("${c.ragSociale}", "${c.partitaIva}" ,"${c.indirizzo}" ,"${c.civico}" ,"${c.cap}" ,"${c.comune}" ,"${c.provincia}", "${c.paese}")`;
    await db.exec(query);
  }

  async getDocuments(): Promise<AGEDocument[]> {
    if (!isEmpty(this.cachedDocuments)) {
      return this.cachedDocuments;
    }
    return this.teamSystem
      .getDocuments(9999, false)
      .then((docs) => {
        const uniques: TSDocument[] = [];
        forEach(
          groupBy(docs, (d) => d.recipientId),
          (g) => {
            uniques.push(g[0]);
          },
        );
        return Promise.all(uniques.map((f) => this.ageDocumentService.getAgeDocument(f.id)));
      })
      .then((docs) => {
        return sortBy(
          docs,
          (doc) => doc.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Data,
        ).reverse();
      })
      .then((docs) => {
        this.cachedDocuments = docs;
        return docs;
      });
  }

  async getPrestatore(): Promise<CedentePrestatore> {
    return this.getDocuments().then((docs) => docs[0].FatturaElettronicaHeader.CedentePrestatore);
  }

  async getTeamSystemCustomers(): Promise<CessionarioCommittente[]> {
    return this.getDocuments().then((docs) =>
      docs.map((d) => d.FatturaElettronicaHeader.CessionarioCommittente),
    );
  }

  async getLastDocumentByCustomer(customer: CessionarioCommittente): Promise<AGEDocument> {
    return this.getDocuments().then((docs) => {
      return docs.find(
        (d) =>
          d.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA.IdCodice ===
          customer.DatiAnagrafici.IdFiscaleIVA.IdCodice,
      );
    });
  }

  async getCurrentNumeration(): Promise<{ fattura: number; notaCredito: number }> {
    let docs = await this.getDocuments();

    docs = docs.map(
      (d) =>
        ({
          ...d,
          number: parseInt(d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Numero, 10),
        } as any),
    );

    const fattura = maxBy(
      docs.filter(
        (d) => d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.TipoDocumento === 'TD01',
      ),
      (d) => d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Numero,
    ).FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Numero;

    const notaCredito = maxBy(
      docs.filter(
        (d) => d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.TipoDocumento === 'TD04',
      ),
      (d) => d.FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Numero,
    ).FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Numero;

    return {
      fattura: parseInt(fattura, 10),
      notaCredito: parseInt(notaCredito, 10),
    };
  }
}
