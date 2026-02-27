@echo off
chcp 65001
cd /d d:\SLIIT\Projects\JobLoom\JobLoom-BE
set NODE_OPTIONS=--experimental-vm-modules
npx jest tests/unit/job.service.test.js --verbose --no-coverage --forceExit > test-output.txt 2>&1
echo Exit code: %errorlevel%
type test-output.txt
