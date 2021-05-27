# vscode-liquidjava

The vscode extension to validate java programs with refinement types.

#### Developer Mode
1. Run **Client on Visual Studio Code**:
* Open client folder on Visual Studio Code.
* Make sure you have the redhat extension for [Language support for Java ™](https://github.com/redhat-developer/vscode-java) installed and enabled.
* The code in `extension.ts` must be the same as the code in `extension_test.ts`
* Go to `Run-> Run Extension` (or press `F5`). A new window appears with the liquidjava extension enabled.
* Open a Java project. If the project contains the `liquid-java-api.jar` then the liquidjava verification will start in a few seconds. 

#### Debugging Mode
Server and Client connect through sockets and run in different environments that allow a better debugging
1. Run **Server** on **Eclipse**:
* Open Eclipse.
* Import the Maven project that is in the server folder. 
* Run `App.java` with a port as argument.

2. Run **Client** on **Visual Studio Code**:
* Open client folder on VSCode
* Copy all the code on file `extension-network.ts` to `extension.ts`.
* Go to Run-> Run Extension (or press F5). A new vscode appears to use the extension.

##### Create Server Jar
When the server is ready to be exported, export the jar. In Eclipse follow the steps:
1. Inside eclipse make `File > Export > Runnable JAR file`. 
2. In lauch configuration choose `main - vscode-liquid-java-server`. 
3. In the output path choose the `client/server` folder of this extension. It should look like: `$USER$\vscode-liquidjava\client\server\language-server-liquidjava.jar`
4. The name of the jar must be `language-server-liquidjava.jar` for the client to be able to call it on Developer Mode.

### Project 
**Server** - implements an [LSP](https://microsoft.github.io/language-server-protocol/) in Java for the LiquidJava language, using the library [LSP4J](https://github.com/eclipse/lsp4j). 

**Client** - implements the vscode client for the LiquidJava Server.
The client depends on [Language support for Java ™ for Visual Studio Code](https://github.com/redhat-developer/vscode-java) to enable all the Java errors outside the scope of LiquidJava.
