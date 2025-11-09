#!/usr/bin/env node
/**
 * AIRIS Code CLI
 * Terminal-first autonomous coding runner
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCodeCommand } from './commands/code.js';
import { createConfigCommand } from './commands/config.js';
import { createSessionCommand } from './commands/session.js';

const program = new Command();

program
  .name('airis')
  .description('AIRIS Code - Terminal-first autonomous coding runner')
  .version('0.1.0');

// Add commands
program.addCommand(createCodeCommand());
program.addCommand(createConfigCommand());
program.addCommand(createSessionCommand());

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\nUncaught Exception:'));
  console.error(chalk.red(error.message));
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\nUnhandled Rejection:'));
  console.error(chalk.red(String(reason)));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
