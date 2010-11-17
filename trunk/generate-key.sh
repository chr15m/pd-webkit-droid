#!/bin/bash

keytool -genkey -v -keystore PdWebKit.keystore -alias PdWebKit -keyalg RSA -keysize 2048 -validity 10000
