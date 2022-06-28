export interface SDIData {}

export interface TSCustomer {
  ragSociale: string;
  partitaIva: string;
  indirizzo: string;
  civico: string;
  comune: string;
  provincia: string;
  paese: string;
  cap: string;
  codiceUnivoco: string;
  pec: string;
}

export interface TSPrestatore extends TSCustomer {
  codiceFiscale: string;
  regimeFiscale: string;
  reaUfficio: string;
  reaNum: number;
  reaStatoLiquidazione: string;
}

export interface TSDocument {
  active: boolean;
  canBeSentToFaw: boolean;
  isAcknowledged: boolean;
  isRead: boolean;
  isSimplified: boolean;
  trashed: boolean;

  stampDutyAmount: number;
  paymentAmount: number;

  number: string;
  documentType: 'TD01' | 'TD04';
  recipientName: string;
  totalAmount: number;
  documentTypeDescription: string;
  id: string;

  activeInvoiceDeliveredToRecipientDate: string;
  activeInvoiceMadeAvailableToRecipientDate: string;
  activeInvoiceReceivedBySdiDate: string;
  activeInvoiceSentToSdiDate: string;
  date: string;
  flowType: string;
  name: string;
  passiveInvoiceReceivedDate: string;
  recipientCode: string;
  recipientFiscalCode: string;
  recipientId: string;
  recipientTin: string;
  sdiId: string;
  senderFiscalCode: string;
  senderId: string;
  senderName: string;
  senderTin: string;
  sentBy: string;
  sourceApp: string;

  // status: { type: 'SDI_ISSUED'; name: 'EMESSA'; description: 'RECAPITATA AL DESTINATARIO' };
  // cctStatus: { type: 'SEND_OK'; name: 'INVIABILE'; description: 'Il file può essere conservato' };
  // events: [
  //   { title: 'Fattura presa in gestione da TS Digital Invoice'; date: '2021-04-08T14:48:02.481Z' },
  // ];
}

// active: true
// activeInvoiceDeliveredToRecipientDate: "2021-04-08T20:25:51.000Z"
// activeInvoiceMadeAvailableToRecipientDate: null
// activeInvoiceReceivedBySdiDate: "2021-04-08T15:15:15.000Z"
// activeInvoiceSentToSdiDate: "2021-04-08T15:15:21.167Z"
// canBeSentToFaw: true
// cctStatus: {type: "SEND_OK", name: "INVIABILE", description: "Il file può essere conservato"}
// date: "2021-03-31"
// documentType: "TD01"
// documentTypeDescription: "Fattura"
// events: [{title: "Fattura presa in gestione da TS Digital Invoice", date: "2021-04-08T14:48:02.481Z"},…]
// flowType: "SDIPR"
// id: "dd8f95b3-68b3-45a0-82e0-6ef5c48925d4"
// isAcknowledged: true
// isRead: true
// isSimplified: false
// name: "IT01641790702_xjbdq.xml"
// number: "7"
// passiveInvoiceReceivedDate: "2021-04-08T15:15:15.000Z"
// paymentAmount: 726
// recipientCode: "SUBM70N"
// recipientFiscalCode: "05654840825"
// recipientId: "05654840825"
// recipientName: "GIGLIO.COM S.R.L."
// recipientTin: "05654840825"
// sdiId: "4851640020"
// senderFiscalCode: "BNCPTR88B04G273V"
// senderId: "BNCPTR88B04G273V"
// senderName: "BONACCORSO PIETRO"
// senderTin: "06774820820"
// sentBy: "f.scalia@tiscali.it"
// sourceApp: "ts-console.smartInvoice"
// stampDutyAmount: 2
// status: {type: "SDI_ISSUED", name: "EMESSA", description: "RECAPITATA AL DESTINATARIO"}
// totalAmount: 726
// transmitterId: "BNCPTR88B04G273V"
// trashed: false
