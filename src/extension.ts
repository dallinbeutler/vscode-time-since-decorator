import * as vscode from 'vscode';

let activeEditor: vscode.TextEditor | undefined;
let updateTimer: NodeJS.Timeout | undefined;
let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 1em',
            textDecoration: 'none'
        }
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    function triggerUpdateDecorations() {
        if (updateTimer) {
            clearTimeout(updateTimer);
        }
        updateTimer = setTimeout(updateDecorations, 0);
    }

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        let document = activeEditor.document;
        let text = document.getText();

        let timestampRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))/g;
        let decorations: vscode.DecorationOptions[] = [];

        let match;
        while ((match = timestampRegex.exec(text))) {
            let startPos = document.positionAt(match.index + match[0].length);
            let endPos = document.lineAt(startPos.line).range.end;
            let range = new vscode.Range(startPos, endPos);

            let timestamp = new Date(match[0]);
            let currentTime = new Date();
            let elapsedMs = currentTime.getTime() - timestamp.getTime();
            let elapsedHours = Math.floor(elapsedMs / 3600000);
            let elapsedMinutes = Math.floor((elapsedMs % 3600000) / 60000);
            let elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

            let elapsedTimeString = '';
            if (elapsedHours > 0) {
                elapsedTimeString += `${elapsedHours}h `;
            }
            if (elapsedMinutes > 0) {
                elapsedTimeString += `${elapsedMinutes}m `;
            }
            elapsedTimeString += `${elapsedSeconds}s`;

            let decoration: vscode.DecorationOptions = {
                range: range,
                renderOptions: {
                    after: {
                        contentText: ` (${elapsedTimeString})`,
                        color: new vscode.ThemeColor('editorLineNumber.foreground'),
                        fontStyle: 'italic'
                    }
                }
            };
            decorations.push(decoration);
        }

        // Clear previous decorations
        activeEditor.setDecorations(decorationType, []);

        // Set new decorations
        activeEditor.setDecorations(decorationType, decorations);

        updateTimer = setTimeout(updateDecorations, 30000);
    }
}