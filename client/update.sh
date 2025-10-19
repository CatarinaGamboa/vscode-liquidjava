#!/bin/bash
version="0.0.15"
vsce package
code --install-extension liquid-java-$version.vsix