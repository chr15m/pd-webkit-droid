#!/bin/sh

#emulator -avd test_avd -sdcard example-sdcard.img &
emulator -avd phone &
adb logcat &
