#!/bin/bash
VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

vsce package
code --install-extension liquid-java-$VERSION.vsix