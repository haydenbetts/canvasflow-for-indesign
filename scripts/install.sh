#!/bin/bash
sudo su
cd "/Applications/Adobe InDesign CC 2019/Scripts/startup scripts"

# Try to remove existing installation if exist
rm -f Canvasflow.jsx

# Download new version of the plugin
curl https://github.com/Canvasflow/canvasflow-for-indesign/releases/download/v0.14.3/Canvasflow.jsx -o Canvasflow.jsx

# Create plugin installation folder
cd ~
mkdir -p cf-indesign
cd cf-indesign

# Create resize command
touch canvasflow_resize.command
chmod +x canvasflow_resize.command

# Create resize command
touch canvasflow_convert.command
chmod +x canvasflow_convert.command