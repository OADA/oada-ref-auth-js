#!/bin/bash
#
NPM=$(which npm)
ROOTPATH=$(pwd)
$NPM install
echo "Cloning test.."
git clone -b authentication https://github.com/OADA/oada-compliance.git 
cd oada-compliance/
$NPM install

cd $ROOTPATH
echo "Starting instrumented server.."
export PORT=8443
istanbul cover index.js & 
PID=$!
echo "PID " $PID
sleep 10
# Run the test here
echo "Running testcases.."
cd oada-compliance
ECODE=0
#node nodetest.js
./test
if (( $? > 0 )); then
	echo "Test failed! Log below"
	ECODE=1
fi
sudo kill $PID
exit $ECODE
