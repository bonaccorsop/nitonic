--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------


CREATE TABLE clienti (
  id INTEGER PRIMARY KEY,
  ragioneSociale TEXT NOT NULL,
  partitaIva TEXT NOT NULL,
  indirizzo TEXT NOT NULL,
  civico TEXT NOT NULL,
  cap TEXT NOT NULL,
  comune TEXT NOT NULL,
  provincia TEXT NOT NULL,
  paese TEXT DEFAULT "IT",
  emailReferente TEXT
);

CREATE INDEX clienti_idx_ragioneSociale ON clienti (ragioneSociale);
CREATE INDEX clienti_idx_partitaIva ON clienti (partitaIva);


--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP INDEX clienti_idx_ragioneSociale;
DROP INDEX clienti_idx_partitaIva;
DROP TABLE clienti;