#!/bin/bash
#
# Copyright 2014 Open Ag Data Alliance
#
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an 'AS IS' BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
function check_success {
  if (( $? > 0 )); then echo "Unable to prepare test environment.." && exit 1; fi
}
NPM=npm
ROOTPATH=$(pwd)
$NPM run clean
check_success
$NPM install
echo "Cloning test.."
git clone -b authentication https://github.com/OADA/oada-compliance.git
check_success
cd oada-compliance && $NPM install
cd $ROOTPATH
echo "Starting instrumented server.."
istanbul cover --include-all-sources index.js -- ./test_config.js &
PID=$!
echo "PID " $PID
sleep 10
# Run the test here
echo "Running testcases.."
cd oada-compliance
ECODE=0
./test
if (( $? > 0 )); then
  echo "Test failed! Log below"
	ECODE=1
fi
kill $PID
exit $ECODE