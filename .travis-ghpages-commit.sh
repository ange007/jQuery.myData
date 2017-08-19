#!/bin/bash
# encoding: utf-8

if [ "$TRAVIS_BRANCH" != "master" ] 
then 
	exit 0;
fi

TARGET_BRANCH="gh-pages";
DIST_PATH="${TRAVIS_BUILD_DIR}/actual-${TARGET_BRANCH}";

# переходим в директорию и копируем в неё репозиторий
cd ${TRAVIS_BUILD_DIR};
git clone ${REPO_URL} "actual-${TARGET_BRANCH}";

# переходим в скопированный директорию репозитория, переключаемся в нужную ветку и чистим файлы
echo "Считывание версии из репозитория и очистка директории...";
cd ${DIST_PATH};
git checkout ${TARGET_BRANCH} || git checkout --orphan ${TARGET_BRANCH};
git rm --cached;

# удаление файлов из директории
find . -type f ! -name '.git' -delete;
# rm -rf out/**/* || exit 0;

# перемещаем файлы
echo "Копирование нужных файлов...";
cp -rp ${TRAVIS_BUILD_DIR}/docs/* ${DIST_PATH};
cp -rp ${TRAVIS_BUILD_DIR}/build/ ${DIST_PATH};

# заменяем пути к скриптам/css в исходниках
sed -i -e "s/\.\.\//\.\//g" ${DIST_PATH}/index.html

# переходим в директорию добавляе коммит
echo "Коммит...";
git add -A && git commit -am "Auto-build (${TRAVIS_BUILD_NUMBER})";

# отправляем коммит
echo "Отправка коммита...";
git push ${REPO_URL} ${TARGET_BRANCH};

# удаляем директорию
rm -rf ${DIST_PATH}