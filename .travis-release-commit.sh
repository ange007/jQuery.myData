#!/bin/bash
# encoding: utf-8

VERS=$(cat package.json | jq --raw-output '.version');
TARGET_BRANCH="release";
DIST_PATH="${TRAVIS_BUILD_DIR}/actual-release";

# переходим в директорию и копируем в неё репозиторий
cd ${TRAVIS_BUILD_DIR} && git clone ${REPO_URL} "actual-${TARGET_BRANCH}";

# переходим в скопированный директорию репозитория, переключаемся в нужную ветку и чистим файлы
echo "Считывание версии из репозитория и очистка директории...";
cd ${DIST_PATH};
git checkout ${TARGET_BRANCH} || git checkout --orphan ${TARGET_BRANCH};
git rm *;

# перемещаем файлы
echo "Копирование нужных файлов...";
cp -rp ${TRAVIS_BUILD_DIR}/build/* ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/docs/ ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/package.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/composer.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/bower.json ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/README.md ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/CHANGELOG.md ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/LICENSE ${DIST_PATH};

# переходим в директорию добавляе коммит
echo "Переход в директорию и коммит...";
cd ${DIST_PATH};
git add -A && git commit -a -m "Auto-build (${TRAVIS_BUILD_NUMBER})";

# создаём тег и отправляем коммит
echo "Отправка коммита...";
if [ "$TRAVIS_BRANCH" == "master" ] 
then 
	git tag -a "v${VERS}" -m "Release version ${VERS}"; 
	git push ${REPO_URL} ${TARGET_BRANCH} --tags;
# или просто отправляем коммит
else
	git push ${REPO_URL} ${TARGET_BRANCH};
fi

# удаляем директорию
rm -rf ${DIST_PATH};