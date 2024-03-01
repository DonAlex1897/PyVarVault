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

    const variableDataProvider = new VariableDataProvider();
    vscode.window.createTreeView('variableList', { treeDataProvider: variableDataProvider });
    let treeView = vscode.commands.registerCommand('python-variable-vault.showVariable', (varObj) => {
        const panel = vscode.window.createWebviewPanel(
            'arrayVisualization', // Identifies the type of the webview. Used internally
            'Array Visualization', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {} // Webview options. More details can be found in the documentation
        );

        // Set the HTML content of the webview panel
        panel.webview.html = getWebviewContent(varObj);
        vscode.window.showInformationMessage('Visualizing Array...');
    });

    context.subscriptions.push(cacheVarCmd, showVarsCmd, disposable, treeView);
}

function getWebviewContent(variable: any) {
    // Initialize the HTML for the array items
    let arrayItemsHTML = `<p>${variable.value !== undefined ? variable.value : 'Undefined or null value'}</p>`;

    // Return the full HTML content, incorporating the arrayItemsHTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Array Visualization</title>
</head>
<body>
    <h1>Array Visualization</h1>
    ${arrayItemsHTML} <!-- Inject the array items HTML here -->
</body>
</html>`;
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

class VariableTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

class VariableDataProvider implements vscode.TreeDataProvider<VariableTreeItem> {
    // Dummy data for the example
    private variables = [
        { name: 'var1', value: 'value1' },
        { name: 'var2', value: 'value2' }
    ];

    getTreeItem(element: VariableTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: VariableTreeItem): Thenable<VariableTreeItem[]> {
        if (element) {
            // If we had child variables, we would return them here
            return Promise.resolve([]);
        } else {
            // Return the top-level variables here
            return Promise.resolve(this.variables.map(varObj => {
                return new VariableTreeItem(
                    varObj.name,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'python-variable-vault.showVariable', // Command to execute on double-click
                        title: '',
                        arguments: [varObj] // Pass the variable object to the command
                    }
                );
            }));
        }
    }
}

export function deactivate() {}
