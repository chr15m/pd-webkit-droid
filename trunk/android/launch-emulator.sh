#!/bin/sh

emulator -avd test_avd &
adb logcat &
