export interface CessionarioCommittente {
  DatiAnagrafici: {
    CodiceFiscale: string;
    RegimeFiscale: string;
    IdFiscaleIVA: {
      IdPaese: string;
      IdCodice: string;
    };
    Anagrafica: {
      Denominazione: string;
    };
  };
  Sede: {
    Indirizzo: string;
    NumeroCivico: string;
    CAP: string;
    Comune: string;
    Provincia: string;
    Nazione: string;
  };
}

export interface CedentePrestatore extends CessionarioCommittente {
  IscrizioneREA: {
    Ufficio: string;
    NumeroREA: string;
    StatoLiquidazione: string;
  };
}

export interface AGEDocument {
  FatturaElettronicaHeader: {
    DatiTrasmissione: {
      ProgressivoInvio: string;
      FormatoTrasmissione: string;
      CodiceDestinatario: string;
      IdTrasmittente: {
        IdPaese: string;
        IdCodice: string;
      };
      ContattiTrasmittente: {
        Telefono: string;
      };
    };
    CedentePrestatore: CedentePrestatore;
    CessionarioCommittente: CessionarioCommittente;
  };

  FatturaElettronicaBody: {
    DatiGenerali: {
      DatiGeneraliDocumento: {
        TipoDocumento: 'TD01' | 'TD04';
        Divisa: 'EUR';
        Data: string;
        Numero: string;
        ImportoTotaleDocumento: string;
        Causale: string; // DITTA IN REGIME CONTABILE FORFETTARIO L. 190/2014 - ART. 1 C. 54/89
        DatiBollo: {
          BolloVirtuale: 'SI' | 'NO';
          ImportoBollo?: string;
        };
      };
    };
    DatiBeniServizi: {
      DettaglioLinee: {
        NumeroLinea: string;
        Descrizione: string;
        Quantita: string;
        PrezzoUnitario: string;
        PrezzoTotale: string;
        AliquotaIva: string;
        Natura: string; // N2.2
      };
      DatiRiepilogo: {
        AliquotaIva: string; // 0.00
        Natura: string; // N2.2
        Arrotondamento: string; // 0.00
        ImponibileImporto: string; // 3910.00
        Imposta: string; // 0.00
      };
    };
    DatiPagamento: {
      CondizioniPagamento: 'TP02';
      DettaglioPagamento: {
        Beneficiario: string;
        ModalitaPagamento: 'MP05';
        DataRiferimentoTerminiPagamento: string;
        ImportoPagamento: string; // 3910.00
        IstitutoFinanziario: string; // BANCA INTESA SAN PAOLO
        IBAN: string; // IT84O0306904632100000000120
        ABI: string; // 03069
        CAB: string; // 04632
      };
    };
  };
}
