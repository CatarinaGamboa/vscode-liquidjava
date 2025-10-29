#!/bin/bash
version="0.0.23"
vsce package
code --install-extension liquid-java-$version.vsix