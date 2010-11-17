#!/bin/bash

echo "$1"
if [ "$1" == "" ]
then
	device="phone"
else
	device="$1"
fi

#emulator -avd test_avd -sdcard example-sdcard.img &
emulator -avd $device &
if [ "`pidof adb`" == "" ]
then
	killall adb
fi
adb logcat &
