import runAgentLoop from "./agent/loop";

import { program } from 'commander';

program
.name('slab')
.description('A command line tool for interacting with the Slab agent')
.version('0.1.0')
.argument('[input]', 'Input string to process')
.action(async (input: string) => {
    try {
        await runAgentLoop(input);
    }catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }   
})

program.parse();

