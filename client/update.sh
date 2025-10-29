#!/bin/bash
VERSION=$1
vsce package
code --install-extension liquid-java-$VERSION.vsix