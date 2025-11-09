/**
 * Session command - Manage sessions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager } from '../session/session-manager.js';
import type { SessionCommandOptions } from '../types.js';

export function createSessionCommand(): Command {
  const cmd = new Command('session');

  cmd
    .description('Manage coding sessions')
    .option('-l, --list', 'List all sessions')
    .option('--show <id>', 'Show session details')
    .option('--resume <id>', 'Resume session')
    .option('--delete <id>', 'Delete session')
    .option('--clean', 'Clean old completed sessions (30+ days)')
    .action(async (options: SessionCommandOptions) => {
      await executeSessionCommand(options);
    });

  return cmd;
}

async function executeSessionCommand(options: SessionCommandOptions): Promise<void> {
  const sessionManager = new SessionManager();

  try {
    if (options.list) {
      // List all sessions
      const sessions = sessionManager.listSessions();

      if (sessions.length === 0) {
        console.log(chalk.yellow('No sessions found.'));
        return;
      }

      console.log(chalk.bold(`Found ${sessions.length} session(s):\n`));

      for (const session of sessions) {
        const statusColor = {
          active: chalk.green,
          completed: chalk.blue,
          failed: chalk.red,
          paused: chalk.yellow,
        }[session.status];

        console.log(chalk.bold(`  ${session.id}`));
        if (session.name) {
          console.log(chalk.gray(`    Name: ${session.name}`));
        }
        console.log(chalk.gray(`    Status: ${statusColor(session.status)}`));
        console.log(chalk.gray(`    Driver: ${session.driver}`));
        console.log(chalk.gray(`    Adapter: ${session.adapter}`));
        console.log(chalk.gray(`    Tasks: ${session.taskCount}`));
        console.log(chalk.gray(`    Created: ${session.createdAt.toLocaleString()}`));
        console.log(chalk.gray(`    Last active: ${session.lastActiveAt.toLocaleString()}`));
        console.log();
      }
      return;
    }

    if (options.show) {
      // Show session details
      const session = sessionManager.loadSession(options.show);

      if (!session) {
        console.error(chalk.red(`Session not found: ${options.show}`));
        process.exit(1);
      }

      console.log(chalk.bold('Session Details:\n'));
      console.log(JSON.stringify(session, null, 2));
      return;
    }

    if (options.resume) {
      // Resume session
      const session = sessionManager.loadSession(options.resume);

      if (!session) {
        console.error(chalk.red(`Session not found: ${options.resume}`));
        process.exit(1);
      }

      console.log(chalk.green(` Session loaded: ${session.id}`));
      console.log(chalk.gray(`  Working directory: ${session.workingDir}`));
      console.log(chalk.gray(`  Driver: ${session.driver}`));
      console.log(chalk.gray(`  Adapter: ${session.adapter}`));
      console.log(chalk.yellow('\nUse "airis code <task>" to continue working in this session.'));
      return;
    }

    if (options.delete) {
      // Delete session
      const success = sessionManager.deleteSession(options.delete);

      if (!success) {
        console.error(chalk.red(`Failed to delete session: ${options.delete}`));
        process.exit(1);
      }

      console.log(chalk.green(` Session deleted: ${options.delete}`));
      return;
    }

    if (options.clean) {
      // Clean old sessions
      const deletedCount = sessionManager.cleanOldSessions(30);
      console.log(chalk.green(` Cleaned ${deletedCount} old session(s)`));
      return;
    }

    // No options provided
    console.log(chalk.yellow('No options provided. Use --help for usage information.'));

  } catch (error) {
    console.error(chalk.red('Session command failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
