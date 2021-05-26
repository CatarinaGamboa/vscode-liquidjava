# vscode-liquidjava

The vscode extension to validate java programs with refinement types.

Depends on: Language support for Java ™ for Visual Studio Code https://github.com/redhat-developer/vscode-java


Client: Run on VSCode, instructions on README in client folder.

Server: Run on Eclipse. Create Runnable Jar in folder client/server.

#### User Mode
1. Client on Visual Studio Code:
* Open client folder on VSCode. 
* Go to Run-> Run Extension (or press F5). A new vscode appears to use the extension.

#### Developer Mode
Server and Client connect through sockets and run in different environments
1. Run Server on Eclipse:
* Importing the Maven project (in server folder). 
* Run App with a port as argument.
2. Client on Visual Studio Code:
* Open client folder on VSCode
* Copy all the code on file `extension-network.ts` to `extension.ts`.
* Go to Run-> Run Extension (or press F5). A new vscode appears to use the extension.

