#!/usr/bin/env node

import { Command } from 'commander';
import { createFatturaCommand, syncCommand, testCommand } from './src/commands/commands';

const program = new Command();

program.version('1.0.0');

program.command('sync').description('Scarica tutte le fatture').action(syncCommand);

program.command('fattura:create').description('Crea una fattura').action(createFatturaCommand);

program.parse(process.argv);

// Denominazione: MANDALA' ADRIANO
// PARTITA IVA:  IT06823180820
// Indirizzo: VIA GIUSEPPE ZARBO
// 8
// Cap: 90135 Nazione: IT
// Codice fiscale: MNDDRN88L07G273F
// Comune: PALERMO Provincia: PA
// Codice univoco : M5UXCR1
