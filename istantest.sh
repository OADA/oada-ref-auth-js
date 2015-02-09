#!/bin/bash
#
NPM=$(which npm)
ROOTPATH=$(pwd)
TESTBED='testland'
TESTBEDPATH=$(echo $ROOTPATH/$TESTBED)
sudo rm -rf $TESTBED
echo "Instrumenting.."
istanbul instrument . -o $TESTBED

CPLIST=$(find . -type f ! -name "*.js" | egrep -v '\./\..*|node_modules|testland')
for arg in $CPLIST
do
	src=${arg:2}

	cd $TESTBEDPATH
	IFS=/
	src_arr=($src)
	(( last_index = ${#src_arr[@]} - 1 ))
	i=0
	for comp in ${src_arr[*]}
	do
		if (( last_index == i )); then
			continue
		else
			mkdir $comp 2> /dev/null
			cd $comp 
			(( i = i + 1 ))
		fi
	done
	IFS=' '
	
	cd $ROOTPATH 
	echo Copying $src ..
	cp $src $TESTBED/$src 2> /dev/null
done

cd $TESTBEDPATH
$NPM install
echo "Cloning test.."
git clone -b authentication https://github.com/OADA/oada-compliance.git 
cd oada-compliance/
$NPM install
cd $TESTBEDPATH
echo "Starting instrumented server.."
export PORT=8443
istanbul cover index.js & 
PID=$!
echo "PID " $PID
sleep 10
# Run the test here
echo "Running testcases.."
cd oada-compliance/authorization/
ECODE=0
node nodetest.js
if (( $? > 0 )); then
	echo "Test failed! Log below"
	cat log.txt
	ECODE=1
fi
sudo kill $PID
exit $ECODE
