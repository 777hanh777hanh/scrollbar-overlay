newVersion=$1
GITBRANCH=$(git rev-parse --abbrev-ref HEAD);
DIR_PATH=$(dirname "$0")

node $DIR_PATH/prepare.js
git add CHANGELOG.md package.zero.json package.json version.js;

echo $GITBRANCH;
git commit -m "Release $newVersion on branch $GITBRANCH"
