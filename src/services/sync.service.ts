import { Db } from '../database/db';
import { TeamSystem } from '../providers/teamsystem';
import { groupBy, forEach } from 'lodash';
import { AgeDocumentService } from './agedocuments.service';
import { Filesystem as FS } from '../filesystem/filesystem';

function inArray(neddle: string, haystack: any[]): boolean {
  return haystack.indexOf(neddle) > -1;
}

export class SyncService {
  constructor(
    private teamSistemProvider: TeamSystem,
    private db: Db,
    private ageDocumentService: AgeDocumentService,
  ) {}

  async execute(): Promise<void> {
    const currentCustomers = await this.db.getAll('clienti');
    const currentPIVAs = currentCustomers.map((c) => c.partitaIva);

    const docs = await this.teamSistemProvider.getDocuments(99999, false);

    const promises: Promise<any>[] = [];

    // insert contatti
    const docsCustomersNotset = docs.filter((d) => !inArray(d.recipientId, currentPIVAs));
    forEach(
      groupBy(docsCustomersNotset, (v) => v.recipientId),
      (a) => {
        // console.log(a[0].id);
        const prom = this.teamSistemProvider.fetchCustomerData(a[0].id).then((c) => {
          const query = `INSERT INTO clienti (ragioneSociale, partitaIva, indirizzo, civico, cap, comune, provincia, paese ) VALUES ("${c.ragSociale}", "${c.partitaIva}" ,"${c.indirizzo}" ,"${c.civico}" ,"${c.cap}" ,"${c.comune}" ,"${c.provincia}", "${c.paese}")`;
          // console.log(query);
          this.db.exec(query);
        });

        promises.push(prom);
      },
    );

    // load xml
    // fa-2021-00001-giglio.xml

    docs.forEach((d) => {
      promises.push(
        this.teamSistemProvider.fetchContentXML(d.id).then((xmlContent) => {
          const data = this.ageDocumentService.parseDocumentFromXml(xmlContent);
          const fileName = this.ageDocumentService.resolveDocumentFSName(data);
          FS.writeFile(`documents/${fileName}.xml`, xmlContent);
          // this.teamSistemProvider.fetchContentPDF(d.id).then((pdfContent) => {
          //   FS.writeFile(`documents/${fileName}.xml`, xmlContent);
          //   // FS.writeFile(`documents/${fileName}.pdf`, pdfContent, true);
          // });
        }),
      );
    });

    Promise.all(promises);
  }
}
