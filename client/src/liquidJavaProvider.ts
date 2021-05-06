import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeLiquidJava } from './treeLiquidJava';


let tree: { [key: string]: string[] }  = {
	'positive_grade_1 == 55':
		['Variable: positive_grade_1', 'Created in: int positive grade = 55', 'File: Grade.java:22, 29'],
	'bonus_2 == op1':
		['Variable: bonus_2', 'Created in: 10 + 5','File: Grade.java:24, 29'],
	'op1 == ( 10 + 5 )':[
		'Variable: op1','Created in: 10 + 5.0',	'File: Grade.java:24, 29.']
};

export class LiquidJavaProvider implements vscode.TreeDataProvider<Dependency> {
	n:number = 0;
	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
	private vcs:TreeLiquidJava;

	constructor(private workspaceRoot: string, context: vscode.ExtensionContext) {
		//Already have string for workspace
		this.vcs = new TreeLiquidJava(context, tree);
	}

	start(): void {
		this._onDidChangeTreeData.fire();
		tree["new_"+this.n] = ["new_child_"+this.n];
		this.n++;
		this.vcs.showNewTree(tree);
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}

		vscode.window.showInformationMessage('Root Path:'+this.workspaceRoot);
		let r = [new Dependency("Failed to check refinement at:"), 
			new Dependency("addBonus(positive_grade, (10 + 50)):"), 
			new Dependency("Type Expected:"), 
			new Dependency("(Percentage(#bonus_2) && (#bonus_2 < #positive_grade_1))")
		]
		return Promise.resolve(r);

		// if (element) {
		// 	return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
		// } else {
		// 	const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
		// 	if (this.pathExists(packageJsonPath)) {
		// 		return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
		// 	} else {
		// 		vscode.window.showInformationMessage('Workspace has no package.json');
		// 		return Promise.resolve([]);
		// 	}
		// }

	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	// private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
	// 	if (this.pathExists(packageJsonPath)) {
	// 		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

	// 		const toDep = (moduleName: string, version: string): Dependency => {
	// 			if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
	// 				return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
	// 			} else {
	// 				return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
	// 					command: 'extension.openPackageOnNpm',
	// 					title: '',
	// 					arguments: [moduleName]
	// 				});
	// 			}
	// 		};

	// 		const deps = packageJson.dependencies
	// 			? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
	// 			: [];
	// 		const devDeps = packageJson.devDependencies
	// 			? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
	// 			: [];
	// 		return deps.concat(devDeps);
	// 	} else {
	// 		return [];
	// 	}
	// }

	// private pathExists(p: string): boolean {
	// 	try {
	// 		fs.accessSync(p);
	// 	} catch (err) {
	// 		return false;
	// 	}

	// 	return true;
	// }
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
		private readonly version?: string,
		public readonly command?: vscode.Command
	) {
		super(label, undefined);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}
