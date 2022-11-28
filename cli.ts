#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { createFatturaCommand, syncCommand, testCommand, statusCommand } from './src/commands/commands';

const program = new Command();
const pack = JSON.parse(readFileSync(__dirname + '/package.json', 'utf-8'));

program.version(pack.version);

program.command('sync').description('Scarica tutte le fatture').action(syncCommand);

program.command('fattura:create').description('Crea una fattura').action(createFatturaCommand);

program.command('status').description('Da lo stato contabile di un anno specificato').action(statusCommand);

program.parse(process.argv);

// Denominazione: MANDALA' ADRIANO
// PARTITA IVA:  IT06823180820
// Indirizzo: VIA GIUSEPPE ZARBO 8
// Cap: 90135 Nazione: IT
// Codice fiscale: MNDDRN88L07G273F
// Comune: PALERMO Provincia: PA
// Codice univoco : M5UXCR1
