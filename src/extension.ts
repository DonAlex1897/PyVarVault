import * as vscode from 'vscode';
import * as childProcess from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    console.log('python-variable-vault is now active!');

    // Initialize the variable cache
    const varCache = new VariableCache();

    // Example command to add or update a variable in the cache
    // In a real scenario, you'd extract variable names and values from Python execution contexts
    let cacheVarCmd = vscode.commands.registerCommand('python-variable-vault.visualizeArray', () => {
        // For demonstration, we're manually setting a variable. This would be dynamic in practice.
        varCache.setVariable('exampleVar', 'exampleValue');
        vscode.window.showInformationMessage('Variable cached!');
    });

    // Command to list cached variables
    let showVarsCmd = vscode.commands.registerCommand('python-variable-vault.showVariables', () => {
        const vars = varCache.listVariables();
        vscode.window.showQuickPick(vars.map(([name, value]) => `${name}: ${value}`), {
            placeHolder: 'Cached Variables',
        });
    });
	
	let disposable = vscode.commands.registerCommand('python-variable-vault.runAndCaptureVariables', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active Python file.");
            return;
        }

        console.log('resourceLangId', editor.document.languageId);

        const filePath = editor.document.fileName;

        // Assuming Python is in PATH
        const command = `python "${filePath}"`;

        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error running script: ${stderr}`);
                return;
            }
            // Parse stdout to find variables and their values
            // This requires the script to print variables in a specific format
            parseAndDisplayVariables(stdout);
        });
    });

    context.subscriptions.push(cacheVarCmd, showVarsCmd, disposable);
}

function parseAndDisplayVariables(output: string) {
    // Implement parsing logic here based on expected output format
    console.log(output);
    // Example: Display output in a message box (or process as needed)
    vscode.window.showInformationMessage(output);
}

function attachToSession(session: vscode.DebugSession) {
    // Here, you would attach listeners for session events, like stopping, and extract variables
	console.log('Attaching to Python debug session');
}

class VariableCache {
    private cache: Map<string, any>;

    constructor() {
        this.cache = new Map<string, any>();
    }

    setVariable(name: string, value: any) {
        this.cache.set(name, value);
    }

    getVariable(name: string): any {
        return this.cache.get(name);
    }

    listVariables(): [string, any][] {
        return Array.from(this.cache.entries());
    }

    clear() {
        this.cache.clear();
    }
}

export function deactivate() {}
