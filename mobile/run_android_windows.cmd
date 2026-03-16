@echo off
setlocal EnableDelayedExpansion
cd /d C:\codetings\capstone\mobile
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\Artil\AppData\Local\Android\Sdk"
set "PATH=!PATH!;!ANDROID_HOME!\platform-tools;!JAVA_HOME!\bin"
set "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000"
echo ANDROID_HOME=!ANDROID_HOME!
where adb
npm.cmd run android
