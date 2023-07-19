import { TeamSystem } from '../providers/teamsystem';
import { groupBy, forEach, get, filter, sumBy } from 'lodash';
import { AgeDocumentService } from './agedocuments.service';
import { Filesystem as FS } from '../filesystem/filesystem';
import { TSDocument } from '../interfaces/teamsystem.interface';

function inArray(neddle: string, haystack: any[]): boolean {
  return haystack.indexOf(neddle) > -1;
}

export class StatusService {
  constructor(
    private teamSistemProvider: TeamSystem,
    private db: string,
    private ageDocumentService: AgeDocumentService,
  ) {}

  async execute(anno: number): Promise<any> {
    const docs = await this.teamSistemProvider.getDocuments(99999, false);
    const promises: Promise<any>[] = [];


    docs.forEach((d) => {
      promises.push(
        this.teamSistemProvider.fetchContentXML(d.id).then((xmlContent) => {
          // const data = this.ageDocumentService.parseDocumentFromXml(xmlContent);
          return this.ageDocumentService.parseDocumentFromXml(xmlContent);
        }),
      );
    });


    const documenti = await Promise.all(promises);

    const data = []

    documenti.forEach((d) => {
      data.push({
        tipoDocumento: get(d, 'FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.TipoDocumento'),
        importo: get(d, 'FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.ImportoTotaleDocumento'),
        dataFattura: get(d, 'FatturaElettronicaBody.DatiGenerali.DatiGeneraliDocumento.Data'),
        dataPagamento: get(d, 'FatturaElettronicaBody.DatiPagamento.DettaglioPagamento.DataRiferimentoTerminiPagamento')
      })
    })

    // console.log(data)

    const noteCredito = filter(data, f => f.tipoDocumento === 'TD04' && (f.dataFattura || '').indexOf(`${anno}-`) > -1);
    const fatture = filter(data, f => f.tipoDocumento === 'TD01' && (f.dataPagamento || '').indexOf(`${anno}-`) > -1);

    const totFatture = sumBy(fatture, f => f.importo)
    const totNC = sumBy(noteCredito, f => f.importo)

    return {
      numFatture: fatture.length,
      numNoteCredito: noteCredito.length,
      importoFatture: totFatture,
      importoNoteCredito: totNC,
    }
  }
}
