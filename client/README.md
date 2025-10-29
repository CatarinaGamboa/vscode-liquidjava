# LiquidJava Visual Studio Code Client


## Install extension on Visual Studio Code
1. Open the client folder (current folder) in terminal
2. `code --install-extension liquid-java-0.0.1.vsix`
3. Open Visual Studio Code and open a Java project (with src folder inside). If the project contains the `liquidjava-api.jar` then the extension will be activated, otherwise the LiquidJava verification is not applied. 

The `liquidjava-api.jar` can be found in this project in the path`vscode-liquidjava\server\lib`

## Run Client in Developer/Debugging Mode
Explained in detail in outer README

## Create vsix extension
To create the vsix make sure the client code contains all the necessary files (e.g. server jar)
1. Open this folder on the terminal
2. `npm install -g vsce`
3. `vsce package`
4. The vsix package appears in the client folder
