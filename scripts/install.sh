#!/bin/bash
cd "/Applications/Adobe InDesign CC 2019/Scripts/startup scripts"

# Try to remove existing installation if exist
sudo rm -f Canvasflow.jsx

# Download new version of the plugin
sudo curl -L https://github.com/Canvasflow/canvasflow-for-indesign/releases/download/v0.14.4/Canvasflow.jsx -o Canvasflow.jsx

# Create plugin installation folder
cd ~
mkdir -p cf-indesign
cd cf-indesign

# Create resize command
touch canvasflow_resize.command && chmod +x canvasflow_resize.command

# Create resize command
touch canvasflow_convert.command && chmod +x canvasflow_convert.command

# Create Update Script
rm -f Update.command
echo '#!/bin/bash' >> Update.command
echo '' >> Update.command
echo 'curl https://raw.githubusercontent.com/Canvasflow/canvasflow-for-indesign/master/scripts/install.sh | bash' >> Update.command
chmod +x Update.command

chmod -R 777 .

clear
echo "Installation Complete 🙌"