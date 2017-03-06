rm -r dist
mkdir dist

yarn install
node_modules/.bin/webpack --optimize-minimize
mv index.bundle.js dist

cp manifest.json dist
cp -r css icons images dist

rm dist/icons/gitphy.sketch
rm dist/images/button_background.gif
rm dist/images/gh_interface.png
rm dist/images/giphy_mark.png
rm dist/images/github_mark.png
