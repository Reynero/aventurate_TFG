#!/bin/bash
set -e

# Download Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb


# Install Chrome
dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -f

echo "Chrome installation completed."