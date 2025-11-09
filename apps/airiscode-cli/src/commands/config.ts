/**
 * Config command - Manage AIRIS Code configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import type { ConfigCommandOptions } from '../types.js';

export function createConfigCommand(): Command {
  const cmd = new Command('config');

  cmd
    .description('Manage AIRIS Code configuration')
    .option('-g, --get <key>', 'Get configuration value')
    .option('-s, --set <key=value>', 'Set configuration value')
    .option('-l, --list', 'List all configuration')
    .option('-r, --reset', 'Reset to default configuration')
    .action(async (options: ConfigCommandOptions) => {
      await executeConfigCommand(options);
    });

  return cmd;
}

async function executeConfigCommand(options: ConfigCommandOptions): Promise<void> {
  try {
    if (options.list) {
      // List all configuration
      const allConfig = config.getAll();
      console.log(chalk.bold('Current Configuration:\n'));
      console.log(JSON.stringify(allConfig, null, 2));
      console.log(chalk.gray(`\nConfig file: ${config.getPath()}`));
      return;
    }

    if (options.get) {
      // Get specific value
      const value = config.get(options.get as any);
      if (value === undefined) {
        console.error(chalk.red(`Unknown config key: ${options.get}`));
        process.exit(1);
      }
      console.log(JSON.stringify(value, null, 2));
      return;
    }

    if (options.set) {
      // Set value
      const [key, ...valueParts] = options.set.split('=');
      const value = valueParts.join('=');

      if (!key || !value) {
        console.error(chalk.red('Invalid format. Use: --set key=value'));
        process.exit(1);
      }

      // Parse value (JSON or string)
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      config.set(key as any, parsedValue);
      console.log(chalk.green(` Set ${key} = ${JSON.stringify(parsedValue)}`));
      return;
    }

    if (options.reset) {
      // Reset to defaults
      config.reset();
      console.log(chalk.green(' Configuration reset to defaults'));
      return;
    }

    // No options provided, show help
    console.log(chalk.yellow('No options provided. Use --help for usage information.'));

  } catch (error) {
    console.error(chalk.red('Config command failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
