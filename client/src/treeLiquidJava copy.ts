import * as vscode from 'vscode';


export class TreeLiquidJava {

	constructor(context: vscode.ExtensionContext) {
		const view = vscode.window.createTreeView('liquidJavaVCS', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
		context.subscriptions.push(view);
		vscode.commands.registerCommand('liquidJavaVCS.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});
		// vscode.commands.registerCommand('testView.changeTitle', async () => {
		// 	const title = await vscode.window.showInputBox({ prompt: 'Type the new title for the Test View', placeHolder: view.title });
		// 	if (title) {
		// 		view.title = title;
		// 	}
		// });
	}
}



const tree: { [key: string]: string[] }  = {
	'positive_grade_1 == 55':
		['Variable: positive_grade_1', 'Created in: int positive grade = 55', 'File: Grade.java:22, 29']
	,
	'bonus_2 == op1':
		['Variable: bonus_2',
		'Created in: 10 + 5',
		'File: Grade.java:24, 29'],
	'op1 == ( 10 + 5 )':[
		'Variable: op1',
		'Created in: 10 + 5',
		'File: Grade.java:24, 28']
	// 'a': {
	// 	'aa': {
	// 		'aaa': {
	// 			'aaaa': {
	// 				'aaaaa': {
	// 					'aaaaaa': {

	// 					}
	// 				}
	// 			}
	// 		}
	// 	},
	// 	'ab': {}
	// },
	// 'b': {
	// 	'ba': {},
	// 	'bb': {}
	// }
};
const nodes = {};

function aNodeWithIdTreeDataProvider(): vscode.TreeDataProvider<{ key: string }> {
	return {
		getChildren: (element: { key: string }): { key: string }[] => {
			return getChildren(element ? element.key : undefined).map(key => getNode(key));
		},
		getTreeItem: (element: { key: string }): vscode.TreeItem => {
			const treeItem = getTreeItem(element.key);
			treeItem.id = element.key;
			return treeItem;
		},
		getParent: ({ key }: { key: string }): { key: string } => {
			const parentKey = key.substring(0, key.length - 1);
			return parentKey ? new Key(parentKey) : void 0;
		}
	};
}

function getChildren(key: string): string[] {
	if (!key) {
		return Object.keys(tree);
	}
	const treeElement = getTreeElement(key);
	if (treeElement) {
		return treeElement;
		// return Object.keys(treeElement);
	}
	return [];
}

function getTreeItem(key: string): vscode.TreeItem {
	const treeElement = getTreeElement(key);
	// An example of how to use codicons in a MarkdownString in a tree item tooltip.
	const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${key}`, true);
	return {
		label: key,
		//  label: /**vscode.TreeItemLabel**/<any>{ label: key, highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0 },
		//  tooltip,
		collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
	};
}

function getTreeElement(element): string[] {
	const parent = tree;
	if(element in parent)
		return parent[element];
	return null;
	// for (let i = 0; i < element.length; i++) {
	// 	let c = element.substring(0, i + 1);
	// 	parent = parent[element.substring(0, i + 1)];
	// 	if (!parent) {
	// 		return null;
	// 	}
	// }
	// return parent;
}

function getNode(key: string): { key: string } {
	if (!nodes[key]) {
		nodes[key] = new Key(key);
	}
	return nodes[key];
}

class Key {
	constructor(readonly key: string) { }
}