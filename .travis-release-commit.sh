#!/bin/bash
# encoding: utf-8

DIST_PATH=${TRAVIS_BUILD_DIR}/actual-release
VERS=$(cat package.json | jq --raw-output '.version')

# go to the directory
cd ${TRAVIS_BUILD_DIR};
# copy the repository into it
git clone ${REPO_URL} actual-release;
# go to the copied repository directory, switch to the desired branch and clean the files
cd ${DIST_PATH} && git checkout release && rm -rf *;
# moving files
cp -rp ${TRAVIS_BUILD_DIR}/build/* ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/docs/ ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/package.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/composer.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/bower.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/README.md ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/CHANGELOG.md ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/LICENSE ${DIST_PATH};
# go to the directory add a commit
cd ${DIST_PATH} && git add -A && git commit -am "Auto Build (${TRAVIS_BUILD_NUMBER})";
# create a tag and send a commit
git tag -a "v${VERS}" -m "Version ${VERS} Release"; 
git push ${REPO_URL} release --tags;