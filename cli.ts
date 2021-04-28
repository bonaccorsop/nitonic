#!/usr/bin/env node

import { Command } from 'commander';
import { Filesystem as FS } from './src/filesystem/filesystem';
import {
  contactCreateCommand,
  contactListCommand,
  createFatturaCommand,
  syncCommand,
  testCommand,
} from './src/commands/commands';

const program = new Command();

program.version('1.0.0');

program
  .command('sync')
  .description('Sincronizza il tuo account TeamSystem col db')
  .action(syncCommand);

program
  .command('contact:create')
  .description('Crea un nuovo contatto in rubrica')
  .action(contactCreateCommand);

// program
//   .command('contact:list')
//   .description('Mostra i contatti in rubrica')
//   .action(contactListCommand);

program.command('fattura:create').description('Crea una fattura').action(createFatturaCommand);

program
  .command('test')
  // dev
  .description('For dev purpouse...')
  .action(testCommand);

program.parse(process.argv);

// Denominazione: MANDALA' ADRIANO
// PARTITA IVA:  IT06823180820
// Indirizzo: VIA GIUSEPPE ZARBO
// 8
// Cap: 90135 Nazione: IT
// Codice fiscale: MNDDRN88L07G273F
// Comune: PALERMO Provincia: PA
// Codice univoco : M5UXCR1
