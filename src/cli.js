#!/usr/bin/env node
const LazyDB = require('./core/db');
const SQLParser = require('./utils/sqlParser');
const chalk = require('chalk');
const readline = require('readline');

const db = new LazyDB();
const args = process.argv.slice(2);

if (args.includes('--interactive')) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.cyan('Welcome to LazyDB Interactive Mode!'));
  const prompt = () => {
    rl.question(chalk.yellow('Enter query (or "exit" to quit): '), (query) => {
      if (query.toLowerCase() === 'exit') {
        rl.close();
        console.log(chalk.cyan('Goodbye!'));
        return;
      }
      try {
        const results = SQLParser.parse(query, db);
        console.log(chalk.green(JSON.stringify(results, null, 2)));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      prompt();
    });
  };
  prompt();
} else if (args[0]) {
  try {
    const results = SQLParser.parse(args[0], db);
    console.log(chalk.green(JSON.stringify(results, null, 2)));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
} else {
  console.log(chalk.yellow('Usage: npx lazydb "SELECT * FROM users" or npx lazydb --interactive'));
}