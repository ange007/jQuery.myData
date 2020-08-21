#!/bin/bash
# encoding: utf-8

DIST_PATH=${TRAVIS_BUILD_DIR}/actual-gh-pages

# go to the directory
cd ${TRAVIS_BUILD_DIR};
# copy the repository into it
git clone ${REPO_URL} actual-gh-pages;
# go to the copied repository directory, switch to the desired branch and clean the files
cd ${DIST_PATH} && git checkout gh-pages && rm -rf *;
# moving files
cp -rp ${TRAVIS_BUILD_DIR}/docs/* ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/build/ ${DIST_PATH};
# replace paths to scripts / css in sources
sed -i -e "s/\.\.\//\.\//g" ${DIST_PATH}/index.html
# go to the directory add a commit
cd ${DIST_PATH} && git add -A && git commit -am "Auto Build (${TRAVIS_BUILD_NUMBER})";
# send commit
git push ${REPO_URL} gh-pages;